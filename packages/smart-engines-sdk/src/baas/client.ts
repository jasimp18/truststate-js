/**
 * BaaS Client
 *
 * SDK client for interacting with Smart Engines Backend-as-a-Service.
 *
 * Provides:
 * - Wallet-based authentication (challenge-response)
 * - App registration and management
 * - Trustless database operations with state transitions
 * - Pub/sub messaging
 *
 * @example Basic usage
 * ```typescript
 * import { BaasClient } from '@hsuite/smart-engines-sdk';
 *
 * const baas = new BaasClient({
 *   hostUrl: 'https://host.smartengines.io',
 *   appId: 'my-app',
 * });
 *
 * // Authenticate with wallet
 * await baas.authenticate({
 *   chain: 'hedera',
 *   walletAddress: '0.0.12345',
 *   publicKey: 'your-public-key',
 *   signFn: async (message) => wallet.sign(message),
 * });
 *
 * // Database operations
 * const result = await baas.dbInsert('users', { name: 'Alice' });
 * const users = await baas.dbFind('users', { name: 'Alice' });
 *
 * // Messaging
 * await baas.publish('events', { type: 'user.created', userId: result.document._id });
 * ```
 */

import type {
  BaasClientConfig,
  BaasSupportedChain,
  BaasChallengeResponse,
  BaasAuthResult,
  BaasSessionInfo,
  BaasRegisterRequest,
  BaasRegisterResponse,
  BaasInsertResult,
  BaasUpdateResult,
  BaasDeleteResult,
  BaasFindResult,
  BaasQueryOptions,
  BaasPublishResult,
  BaasErrorDetails,
} from './types';

/**
 * Authentication options for wallet-based auth
 */
export type AuthenticateOptions = {
  /** Blockchain chain */
  chain: BaasSupportedChain;
  /** Wallet address on the chain */
  walletAddress: string;
  /** Public key (hex encoded) */
  publicKey: string;
  /** Function to sign the challenge message */
  signFn: (message: string) => string | Promise<string>;
};

/**
 * Validate URL and enforce security requirements
 */
function validateUrl(url: string, allowInsecure = false): string {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new BaasError(`Invalid protocol: ${parsed.protocol}`, 400);
    }

    if (!allowInsecure && parsed.protocol !== 'https:') {
      throw new BaasError(
        'HTTPS is required for secure connections. Set allowInsecure=true for local development.',
        400
      );
    }

    return parsed.origin;
  } catch (error) {
    if (error instanceof BaasError) {
      throw error;
    }
    throw new BaasError(`Invalid URL: ${url}`, 400);
  }
}

/**
 * Encode path parameter to prevent injection
 */
function encodePathParam(param: string): string {
  return encodeURIComponent(param).replace(/%2F/gi, '');
}

/**
 * BaaS Client
 *
 * Client for Smart Engines Backend-as-a-Service platform.
 */
export class BaasClient {
  private readonly hostUrl: string;
  private appId: string | undefined;
  private readonly timeout: number;
  private readonly allowInsecure: boolean;
  private authToken: string | null = null;

  constructor(config: BaasClientConfig) {
    this.allowInsecure = config.allowInsecure ?? false;
    this.hostUrl = validateUrl(config.hostUrl, this.allowInsecure);
    this.appId = config.appId;
    this.timeout = config.timeout ?? 30000;
  }

  /**
   * Set the app ID (for newly registered apps)
   */
  setAppId(appId: string): void {
    this.appId = appId;
  }

  /**
   * Check if the client is authenticated
   */
  isAuthenticated(): boolean {
    return this.authToken !== null;
  }

  /**
   * Get the current app ID
   */
  getAppId(): string | undefined {
    return this.appId;
  }

  /**
   * Require appId to be set for operations that need it
   */
  private requireAppId(): string {
    if (!this.appId) {
      throw new BaasError(
        'App ID required. Either provide appId in config or call register() first.',
        400
      );
    }
    return this.appId;
  }

  // ========== Authentication ==========

  /**
   * Authenticate with the BaaS host using wallet challenge-response
   *
   * This method:
   * 1. Requests a challenge message from the host
   * 2. Signs the challenge with the provided signing function
   * 3. Submits the signature for verification
   * 4. Stores the JWT token for subsequent requests
   *
   * @param options - Authentication options including chain, wallet, and signing function
   * @returns Authentication result with token
   * @throws BaasError if authentication fails
   *
   * @example
   * ```typescript
   * await baas.authenticate({
   *   chain: 'hedera',
   *   walletAddress: '0.0.12345',
   *   publicKey: privateKey.publicKey.toStringRaw(),
   *   signFn: async (message) => {
   *     const sig = privateKey.sign(Buffer.from(message));
   *     return Buffer.from(sig).toString('hex');
   *   },
   * });
   * ```
   */
  async authenticate(options: AuthenticateOptions): Promise<BaasAuthResult> {
    const { chain, walletAddress, publicKey, signFn } = options;

    // Step 1: Request challenge
    const challenge = await this.post<BaasChallengeResponse>('/api/auth/challenge', {
      chain,
      walletAddress,
      appId: this.appId,
    });

    // Step 2: Sign the challenge
    const signature = await signFn(challenge.message);

    // Step 3: Verify and get token
    const result = await this.post<BaasAuthResult>('/api/auth/verify', {
      challengeId: challenge.challengeId,
      signature,
      publicKey,
    });

    // Store token for subsequent requests
    this.authToken = result.token;

    return result;
  }

  /**
   * Validate the current session
   *
   * @returns Session information if valid
   * @throws BaasError if session is invalid or expired
   */
  async validateSession(): Promise<BaasSessionInfo> {
    this.requireAuth();
    return this.get<BaasSessionInfo>('/api/auth/session');
  }

  /**
   * Clear the current authentication token
   */
  logout(): void {
    this.authToken = null;
  }

  // ========== App Registration ==========

  /**
   * Register a new app on the BaaS host
   *
   * Creates a new app deployment with the specified services.
   * Requires authentication.
   *
   * @param request - Registration request with app name and services
   * @returns Registration response with app details and endpoints
   * @throws BaasError if registration fails
   *
   * @example
   * ```typescript
   * const app = await baas.register({
   *   name: 'My App',
   *   services: ['auth', 'database', 'messaging'],
   * });
   * console.log('App ID:', app.appId);
   * console.log('Database endpoint:', app.endpoints.database);
   * ```
   */
  async register(request: BaasRegisterRequest): Promise<BaasRegisterResponse> {
    this.requireAuth();
    return this.post<BaasRegisterResponse>('/api/deployment/apps', request);
  }

  // ========== Database Operations ==========

  /**
   * Insert a document into a collection
   *
   * Creates a new document and returns a state transition with Merkle proof
   * for verification and optional blockchain anchoring.
   *
   * @param collection - Collection name
   * @param document - Document data to insert
   * @returns Insert result with document and state transition
   * @throws BaasError if insert fails
   *
   * @example
   * ```typescript
   * const result = await baas.dbInsert('users', {
   *   name: 'Alice',
   *   email: 'alice@example.com',
   *   createdAt: Date.now(),
   * });
   * console.log('Document ID:', result.document._id);
   * console.log('State root:', result.stateTransition.stateRoot);
   * ```
   */
  async dbInsert(collection: string, document: Record<string, unknown>): Promise<BaasInsertResult> {
    this.requireAuth();
    const appId = this.requireAppId();
    return this.post<BaasInsertResult>(
      `/api/db/${encodePathParam(appId)}/${encodePathParam(collection)}`,
      document
    );
  }

  /**
   * Find documents in a collection
   *
   * Query documents with optional filtering, pagination, and sorting.
   *
   * @param collection - Collection name
   * @param query - Query filter (optional)
   * @param options - Query options for pagination and sorting
   * @returns Find result with documents
   * @throws BaasError if query fails
   *
   * @example
   * ```typescript
   * // Find all users
   * const all = await baas.dbFind('users');
   *
   * // Find with filter
   * const active = await baas.dbFind('users', { status: 'active' });
   *
   * // Find with pagination and sorting
   * const page = await baas.dbFind('users', {}, {
   *   limit: 10,
   *   skip: 20,
   *   sort: '-createdAt',
   * });
   * ```
   */
  async dbFind(
    collection: string,
    query?: Record<string, unknown>,
    options?: BaasQueryOptions
  ): Promise<BaasFindResult> {
    this.requireAuth();

    const params = new URLSearchParams();
    if (query && Object.keys(query).length > 0) {
      params.set('query', JSON.stringify(query));
    }
    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit));
    }
    if (options?.skip !== undefined) {
      params.set('skip', String(options.skip));
    }
    if (options?.sort) {
      params.set('sort', options.sort);
    }

    const appId = this.requireAppId();
    const queryString = params.toString();
    const path = `/api/db/${encodePathParam(appId)}/${encodePathParam(collection)}${queryString ? `?${queryString}` : ''}`;

    return this.get<BaasFindResult>(path);
  }

  /**
   * Update a document in a collection
   *
   * Updates an existing document and returns a state transition with
   * previous and new hash for verification.
   *
   * @param collection - Collection name
   * @param documentId - Document ID to update
   * @param updates - Update data (merged with existing document)
   * @returns Update result with document and state transition
   * @throws BaasError if update fails or document not found
   *
   * @example
   * ```typescript
   * const result = await baas.dbUpdate('users', 'abc123', {
   *   status: 'verified',
   *   verifiedAt: Date.now(),
   * });
   * console.log('New version:', result.document.version);
   * ```
   */
  async dbUpdate(
    collection: string,
    documentId: string,
    updates: Record<string, unknown>
  ): Promise<BaasUpdateResult> {
    this.requireAuth();
    const appId = this.requireAppId();
    return this.put<BaasUpdateResult>(
      `/api/db/${encodePathParam(appId)}/${encodePathParam(collection)}/${encodePathParam(documentId)}`,
      updates
    );
  }

  /**
   * Delete a document from a collection
   *
   * Deletes a document and returns a state transition recording the deletion.
   *
   * @param collection - Collection name
   * @param documentId - Document ID to delete
   * @returns Delete result with state transition
   * @throws BaasError if delete fails or document not found
   *
   * @example
   * ```typescript
   * const result = await baas.dbDelete('users', 'abc123');
   * console.log('Deleted:', result.deleted);
   * ```
   */
  async dbDelete(collection: string, documentId: string): Promise<BaasDeleteResult> {
    this.requireAuth();
    const appId = this.requireAppId();
    return this.delete<BaasDeleteResult>(
      `/api/db/${encodePathParam(appId)}/${encodePathParam(collection)}/${encodePathParam(documentId)}`
    );
  }

  // ========== Messaging ==========

  /**
   * Publish a message to a channel
   *
   * Publishes a message that will be delivered to all subscribers
   * and stored in history if the channel is persistent.
   *
   * @param channel - Channel name
   * @param message - Message data
   * @param metadata - Optional message metadata
   * @returns Publish result with message ID
   * @throws BaasError if publish fails
   *
   * @example
   * ```typescript
   * const result = await baas.publish('events', {
   *   type: 'order.created',
   *   orderId: '12345',
   *   amount: 99.99,
   * });
   * console.log('Message ID:', result.messageId);
   * ```
   */
  async publish(
    channel: string,
    message: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<BaasPublishResult> {
    this.requireAuth();
    const appId = this.requireAppId();
    return this.post<BaasPublishResult>(
      `/api/messaging/${encodePathParam(appId)}/channels/${encodePathParam(channel)}/publish`,
      { data: message, metadata }
    );
  }

  // ========== HTTP Helpers ==========

  private requireAuth(): void {
    if (!this.authToken) {
      throw new BaasError('Authentication required. Call authenticate() first.', 401);
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  private async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  private async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.hostUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
        signal: controller.signal,
      };

      if (body !== undefined) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as BaasErrorDetails & {
          message?: string;
        };
        throw new BaasError(
          errorData.message || `API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof BaasError) {
        throw error;
      }

      const err = error as Error;
      if (err.name === 'AbortError') {
        throw new BaasError('Request timeout', 408);
      }

      throw new BaasError(`Network error: ${err.message}`, 0, { originalError: err.message });
    }
  }
}

/**
 * BaaS Error
 *
 * Custom error class for BaaS client errors.
 */
export class BaasError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: BaasErrorDetails
  ) {
    super(message);
    this.name = 'BaasError';
  }
}
