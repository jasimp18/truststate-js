import {
  CreateAccountRequestSchema,
  CreateAccountRequest,
  CreateAccountResponse,
  TransferRequestSchema,
  TransferRequest,
  TransferResponse,
  CreateTokenRequestSchema,
  CreateTokenRequest,
  CreateTokenResponse,
  MintTokenRequestSchema,
  MintTokenRequest,
  BurnTokenRequestSchema,
  BurnTokenRequest,
  TokenActionRequestSchema,
  TokenActionRequest,
  ActionResult,
  AccountBalance,
  AccountInfo,
  Transaction,
  TokenInfo,
  ChainType,
} from '@hsuite/smart-engines-shared';
import { ValidatorDiscoveryClient, ValidatorInfo } from './discovery';
import { ValidatorAuthClient, AuthChain, AuthenticateResponse } from './auth';

// Sub-client imports (public only)
import { ValidatorsClient } from './validators';
import { SubscriptionClient } from './subscription';

/**
 * Validate URL and enforce security requirements
 */
function validateClientUrl(url: string, allowInsecure = false): string {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new SmartEngineError(`Invalid protocol: ${parsed.protocol}`, 400);
    }

    // Enforce HTTPS in production
    if (!allowInsecure && parsed.protocol !== 'https:') {
      throw new SmartEngineError(
        'HTTPS is required for secure connections. Set allowInsecure=true for local development.',
        400
      );
    }

    return parsed.origin;
  } catch (error) {
    if (error instanceof SmartEngineError) {
      throw error;
    }
    throw new SmartEngineError(`Invalid URL: ${url}`, 400);
  }
}

/**
 * Encode path parameter to prevent injection
 */
function encodePathParam(param: string): string {
  // Remove any path traversal attempts and encode special characters
  return encodeURIComponent(param).replace(/%2F/gi, '');
}

/**
 * Smart Engine Client Configuration
 */
export interface SmartEngineClientConfig {
  /** Validator API base URL */
  baseUrl: string;
  /** API key for authenticated requests */
  apiKey?: string;
  /** Session token from validator auth */
  authToken?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Allow HTTP (insecure) connections - only for local development */
  allowInsecure?: boolean;
}

/**
 * Network connection configuration for auto-discovery
 */
export interface NetworkConnectionConfig {
  /** Hedera network (mainnet, testnet, previewnet) */
  network: 'mainnet' | 'testnet' | 'previewnet';
  /** HCS topic ID for validator registry */
  registryTopicId: string;
  /** Blockchain type for authentication */
  chain: AuthChain;
  /** Wallet address for authentication */
  address: string;
  /** Public key (hex encoded) */
  publicKey: string;
  /** Function to sign the challenge */
  signFn: (challenge: string) => string | Promise<string>;
  /** Optional metadata for authentication */
  metadata?: {
    appId?: string;
    appName?: string;
  };
  /** Custom mirror node URL */
  mirrorNodeUrl?: string;
  /** Allow HTTP (insecure) connections - only for local development */
  allowInsecure?: boolean;
}

/**
 * Connection result from connectToNetwork
 */
export interface NetworkConnectionResult {
  /** Configured client ready to use */
  client: SmartEngineClient;
  /** Validator that was connected to */
  validator: ValidatorInfo;
  /** Authentication session */
  session: AuthenticateResponse;
}

/**
 * Smart Engine Client
 *
 * Simplified, type-safe client for interacting with Smart Engines validator.
 * Supports direct connection or auto-discovery via HCS registry.
 *
 * This is the PUBLIC SDK for smart-app developers.
 * For validator-internal operations (TSS, Genesis, Membership), use @hsuite/smart-engines-validator-sdk.
 *
 * @example Direct connection
 * ```typescript
 * const client = new SmartEngineClient({
 *   baseUrl: 'https://validator.example.com',
 *   apiKey: 'your-api-key',
 * });
 * ```
 *
 * @example Auto-discovery with authentication
 * ```typescript
 * const { client, validator, session } = await SmartEngineClient.connectToNetwork({
 *   network: 'testnet',
 *   registryTopicId: '0.0.123456',
 *   chain: 'hedera',
 *   address: '0.0.789',
 *   publicKey: 'your-public-key-hex',
 *   signFn: (challenge) => privateKey.sign(Buffer.from(challenge)).toString('hex'),
 * });
 * ```
 */
export class SmartEngineClient {
  private baseUrl: string;
  private apiKey?: string;
  private authToken?: string;
  private timeout: number;
  private allowInsecure: boolean;

  // Sub-clients for public app features
  /** V3 Validator management (token, account, topic validators) */
  public readonly validators: ValidatorsClient;
  /** Application subscription management */
  public readonly subscription: SubscriptionClient;

  constructor(config: SmartEngineClientConfig) {
    this.allowInsecure = config.allowInsecure ?? false;
    this.baseUrl = validateClientUrl(config.baseUrl, this.allowInsecure);
    this.apiKey = config.apiKey;
    this.authToken = config.authToken;
    this.timeout = config.timeout || 30000;

    // Initialize sub-clients with HTTP helper access
    const httpClient = {
      post: <T>(path: string, body: unknown) => this.post<T>(path, body),
      get: <T>(path: string) => this.get<T>(path),
    };

    this.validators = new ValidatorsClient(httpClient);
    this.subscription = new SubscriptionClient(httpClient);
  }

  /**
   * Connect to the smart-engines network with auto-discovery and authentication
   *
   * This method:
   * 1. Discovers validators via HCS registry topic
   * 2. Selects a random validator with API endpoint
   * 3. Authenticates with Web3-style challenge-response
   * 4. Returns a configured client ready to use
   *
   * @param config - Network connection configuration
   * @returns Connected client, validator info, and session
   * @throws Error if no validators available or authentication fails
   */
  static async connectToNetwork(config: NetworkConnectionConfig): Promise<NetworkConnectionResult> {
    const allowInsecure = config.allowInsecure ?? false;

    // Step 1: Discover validators
    const discovery = new ValidatorDiscoveryClient({
      network: config.network,
      registryTopicId: config.registryTopicId,
      mirrorNodeUrl: config.mirrorNodeUrl,
    });

    const validator = await discovery.getRandomValidator();

    if (!validator || !validator.networkEndpoints?.apiEndpoint) {
      throw new SmartEngineError(
        'No validators available. Check registry topic and network configuration.',
        503
      );
    }

    const validatorUrl = validator.networkEndpoints.apiEndpoint;

    // Validate discovered URL
    validateClientUrl(validatorUrl, allowInsecure);

    // Step 2: Authenticate
    const auth = new ValidatorAuthClient({
      security: { allowInsecure },
    });
    const session = await auth.authenticateWithSigner(
      validatorUrl,
      config.chain,
      config.address,
      config.publicKey,
      config.signFn,
      config.metadata
    );

    // Step 3: Create client with auth token
    const client = new SmartEngineClient({
      baseUrl: validatorUrl,
      authToken: session.token,
      allowInsecure,
    });

    return { client, validator, session };
  }

  /**
   * Get the current validator URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Check if client has an auth token
   */
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  // ========== Health & Info ==========

  /**
   * Get health status of the validator
   */
  async getHealth(): Promise<{ status: string; timestamp: string; chains: any[] }> {
    return this.get('/health');
  }

  /**
   * Get list of supported chains
   */
  async getSupportedChains(): Promise<{ chains: string[] }> {
    return this.get('/chains');
  }

  // ========== Account Operations ==========

  /**
   * Create a new account on the specified chain
   */
  async createAccount(request: CreateAccountRequest): Promise<CreateAccountResponse> {
    const validated = CreateAccountRequestSchema.parse(request);
    return this.post('/accounts', validated);
  }

  /**
   * Get account information
   */
  async getAccountInfo(chain: string, accountId: string): Promise<AccountInfo> {
    return this.get(`/accounts/${encodePathParam(chain)}/${encodePathParam(accountId)}`);
  }

  /**
   * Get account balance
   */
  async getBalance(chain: string, accountId: string): Promise<AccountBalance> {
    return this.get(`/accounts/${encodePathParam(chain)}/${encodePathParam(accountId)}/balance`);
  }

  // ========== Transaction Operations ==========

  /**
   * Execute a transfer transaction
   */
  async transfer(request: TransferRequest): Promise<TransferResponse> {
    const validated = TransferRequestSchema.parse(request);
    return this.post('/transfer', validated);
  }

  /**
   * Get transaction details
   */
  async getTransaction(chain: string, txId: string): Promise<Transaction> {
    return this.get(`/transactions/${encodePathParam(chain)}/${encodePathParam(txId)}`);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(chain: string, txId: string): Promise<any> {
    return this.get(`/transactions/${encodePathParam(chain)}/${encodePathParam(txId)}/receipt`);
  }

  // ========== Token Operations ==========

  /**
   * Create a new token
   */
  async createToken(request: CreateTokenRequest): Promise<CreateTokenResponse> {
    const validated = CreateTokenRequestSchema.parse(request);
    return this.post('/tokens', validated);
  }

  /**
   * Mint tokens
   */
  async mintToken(request: MintTokenRequest): Promise<any> {
    const validated = MintTokenRequestSchema.parse(request);
    return this.post('/tokens/mint', validated);
  }

  /**
   * Get token information
   */
  async getTokenInfo(chain: string, tokenId: string): Promise<TokenInfo> {
    return this.get(`/tokens/${encodePathParam(chain)}/${encodePathParam(tokenId)}`);
  }

  /**
   * Burn tokens to reduce supply. Requires burnable capability.
   */
  async burnToken(request: BurnTokenRequest): Promise<ActionResult> {
    const validated = BurnTokenRequestSchema.parse(request);
    return this.post('/tokens/burn', validated);
  }

  /**
   * Pause all token operations globally. Requires pausable capability.
   */
  async pauseToken(request: TokenActionRequest): Promise<ActionResult> {
    const validated = TokenActionRequestSchema.parse(request);
    return this.post('/tokens/pause', validated);
  }

  /**
   * Unpause token operations. Requires pausable capability.
   */
  async unpauseToken(request: TokenActionRequest): Promise<ActionResult> {
    const validated = TokenActionRequestSchema.parse(request);
    return this.post('/tokens/unpause', validated);
  }

  /**
   * Freeze/restrict an account from transacting the token.
   * Requires restrictable capability.
   */
  async restrictAccount(request: TokenActionRequest): Promise<ActionResult> {
    const validated = TokenActionRequestSchema.parse(request);
    if (!validated.accountId) {
      throw new SmartEngineError('accountId is required for restrictAccount', 400);
    }
    return this.post('/tokens/restrict', validated);
  }

  /**
   * Unfreeze an account. Requires restrictable capability.
   */
  async unrestrictAccount(request: TokenActionRequest): Promise<ActionResult> {
    const validated = TokenActionRequestSchema.parse(request);
    if (!validated.accountId) {
      throw new SmartEngineError('accountId is required for unrestrictAccount', 400);
    }
    return this.post('/tokens/unrestrict', validated);
  }

  /**
   * Grant KYC/compliance approval to an account. Requires compliant capability.
   */
  async enableCompliance(request: TokenActionRequest): Promise<ActionResult> {
    const validated = TokenActionRequestSchema.parse(request);
    if (!validated.accountId) {
      throw new SmartEngineError('accountId is required for enableCompliance', 400);
    }
    return this.post('/tokens/compliance/enable', validated);
  }

  /**
   * Revoke KYC/compliance approval from an account. Requires compliant capability.
   */
  async disableCompliance(request: TokenActionRequest): Promise<ActionResult> {
    const validated = TokenActionRequestSchema.parse(request);
    if (!validated.accountId) {
      throw new SmartEngineError('accountId is required for disableCompliance', 400);
    }
    return this.post('/tokens/compliance/disable', validated);
  }

  /**
   * Force remove tokens from an account (compliance action).
   * Requires wipeable capability.
   */
  async wipeFromAccount(request: TokenActionRequest): Promise<ActionResult> {
    const validated = TokenActionRequestSchema.parse(request);
    if (!validated.accountId) {
      throw new SmartEngineError('accountId is required for wipeFromAccount', 400);
    }
    if (!validated.amount) {
      throw new SmartEngineError('amount is required for wipeFromAccount', 400);
    }
    return this.post('/tokens/wipe', validated);
  }

  // ========== Capabilities Discovery ==========

  /**
   * Get capability support matrix for all chains
   */
  async getAllCapabilities(): Promise<any> {
    return this.get('/capabilities');
  }

  /**
   * Get capability support for a specific chain
   */
  async getChainCapabilities(chain: ChainType): Promise<any> {
    return this.get(`/capabilities/${encodePathParam(chain)}`);
  }

  /**
   * Get comprehensive system status including all subsystems
   */
  async getSystemStatus(): Promise<any> {
    return this.get('/status');
  }

  // ========== Messaging Operations ==========

  /**
   * Submit a message to consensus
   */
  async submitMessage(chain: string, topicId: string, message: string): Promise<any> {
    // Validate message size to prevent DoS
    if (message.length > 1024 * 1024) {
      // 1MB max
      throw new SmartEngineError('Message too large (max 1MB)', 400);
    }
    return this.post(`/messages/${encodePathParam(chain)}/${encodePathParam(topicId)}`, {
      message,
    });
  }

  // ========== Cluster Operations ==========

  /**
   * Get cluster health status
   */
  async getClusterHealth(): Promise<{
    status: string;
    nodes: number;
    healthy: number;
    unhealthy: number;
  }> {
    return this.get('/cluster/health');
  }

  /**
   * Get cluster status including node details
   */
  async getClusterStatus(): Promise<{
    status: string;
    nodeId: string;
    nodes: Array<{
      nodeId: string;
      endpoint: string;
      status: string;
      lastSeen?: string;
    }>;
    quorum: {
      required: number;
      current: number;
      reached: boolean;
    };
  }> {
    return this.get('/cluster/status');
  }

  // ========== Metrics & Monitoring ==========

  /**
   * Get Prometheus-format metrics
   */
  async getMetrics(): Promise<string> {
    return this.get('/metrics');
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStats(): Promise<{
    queues: Record<
      string,
      {
        pending: number;
        processing: number;
        completed: number;
        failed: number;
      }
    >;
    timestamp: string;
  }> {
    return this.get('/monitoring/queue');
  }

  /**
   * Get circuit breaker status for all services
   */
  async getCircuitBreakerStatus(): Promise<{
    breakers: Record<
      string,
      {
        state: 'closed' | 'open' | 'half-open';
        failures: number;
        successes: number;
        lastFailure?: string;
        nextRetry?: string;
      }
    >;
    timestamp: string;
  }> {
    return this.get('/monitoring/circuit-breakers');
  }

  // ========== HTTP Helpers ==========

  /**
   * Build authentication headers based on configured auth method
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  private async post<T = any>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}/api/v3${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SmartEngineError(
          `API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof SmartEngineError) {
        throw error;
      }
      const err = error as Error;
      if (err.name === 'AbortError') {
        throw new SmartEngineError('Request timeout', 408);
      }
      throw new SmartEngineError(`Network error: ${err.message}`, 0, error);
    }
  }

  private async get<T = any>(path: string): Promise<T> {
    const url = `${this.baseUrl}/api/v3${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SmartEngineError(
          `API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof SmartEngineError) {
        throw error;
      }
      const err = error as Error;
      if (err.name === 'AbortError') {
        throw new SmartEngineError('Request timeout', 408);
      }
      throw new SmartEngineError(`Network error: ${err.message}`, 0, error);
    }
  }
}

/**
 * Custom error class for Smart Engine client
 */
export class SmartEngineError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'SmartEngineError';
  }
}
