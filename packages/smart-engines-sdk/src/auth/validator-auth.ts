/**
 * Validator Authentication Client
 *
 * Web3-style authentication for connecting to smart-engine validators.
 * Supports challenge-response authentication with Hedera or XRPL wallets.
 */

/**
 * Supported blockchain types for authentication
 */
export type AuthChain = 'hedera' | 'xrpl';

/**
 * Security configuration for auth client
 */
export interface SecurityConfig {
  /** Allow HTTP (insecure) connections - default false, use only for local development */
  allowInsecure?: boolean;
}

/**
 * Validate and sanitize a validator URL
 */
function validateValidatorUrl(url: string, allowInsecure = false): string {
  try {
    const parsed = new URL(url);

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new ValidatorAuthError(`Invalid protocol: ${parsed.protocol}`, 400);
    }

    // Enforce HTTPS unless explicitly allowed for development
    if (!allowInsecure && parsed.protocol !== 'https:') {
      throw new ValidatorAuthError(
        'HTTPS is required for validator connections. Set allowInsecure=true for local development.',
        400
      );
    }

    // Block private IP ranges in production to prevent SSRF
    const hostname = parsed.hostname.toLowerCase();
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

    if (isLocalhost && !allowInsecure) {
      throw new ValidatorAuthError(
        'Localhost connections blocked in secure mode. Set allowInsecure=true for local development.',
        400
      );
    }

    return parsed.origin;
  } catch (error) {
    if (error instanceof ValidatorAuthError) {
      throw error;
    }
    throw new ValidatorAuthError(`Invalid validator URL: ${url}`, 400);
  }
}

/**
 * Sanitize input to prevent injection attacks
 */
function sanitizeInput(input: string, fieldName: string, maxLength = 256): string {
  if (typeof input !== 'string') {
    throw new ValidatorAuthError(`${fieldName} must be a string`, 400);
  }

  if (input.length > maxLength) {
    throw new ValidatorAuthError(`${fieldName} exceeds maximum length of ${maxLength}`, 400);
  }

  // Remove any control characters
  return input.replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Challenge response from validator
 */
export interface ChallengeResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Challenge string to sign */
  challenge: string;
  /** Informational message */
  message: string;
  /** Challenge expiration time */
  expiresIn: string;
}

/**
 * Authentication request payload
 */
export interface AuthenticateRequest {
  /** Blockchain type */
  chain: AuthChain;
  /** Wallet address (account ID for Hedera, address for XRPL) */
  address: string;
  /** Public key (hex encoded) */
  publicKey: string;
  /** Signed challenge (hex encoded signature) */
  signature: string;
  /** Original challenge string */
  challenge: string;
  /** Optional metadata */
  metadata?: {
    nodeId?: string;
    endpoint?: string;
    capabilities?: string[];
    appId?: string;
    appName?: string;
  };
}

/**
 * Authentication response with session token
 */
export interface AuthenticateResponse {
  /** JWT session token */
  token: string;
  /** Session ID */
  sessionId: string;
  /** Assigned validator ID */
  validatorId: string;
  /** Token expiration timestamp */
  expiresAt: string;
  /** Informational message */
  message: string;
}

/**
 * Session information
 */
export interface SessionInfo {
  /** Session ID */
  sessionId: string;
  /** Validator ID */
  validatorId: string;
  /** Wallet address */
  address: string;
  /** Blockchain type */
  chain: AuthChain;
  /** Session creation time */
  createdAt: string;
  /** Session expiration time */
  expiresAt: string;
  /** Whether session is valid */
  isValid: boolean;
}

/**
 * Validator auth configuration
 */
export interface ValidatorAuthConfig {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Security configuration */
  security?: SecurityConfig;
}

/**
 * Validator Authentication Client
 *
 * Implements Web3-style challenge-response authentication:
 * 1. Request challenge from validator
 * 2. Sign challenge with wallet private key
 * 3. Authenticate with signed challenge to get session token
 *
 * @example
 * ```typescript
 * const auth = new ValidatorAuthClient();
 *
 * // Request challenge
 * const challenge = await auth.requestChallenge(
 *   'https://validator.example.com',
 *   'hedera',
 *   '0.0.123456'
 * );
 *
 * // Sign challenge (using @hashgraph/sdk)
 * const signature = auth.signChallengeHedera(challenge.challenge, privateKey);
 *
 * // Authenticate
 * const session = await auth.authenticate('https://validator.example.com', {
 *   chain: 'hedera',
 *   address: '0.0.123456',
 *   publicKey: publicKeyHex,
 *   signature,
 *   challenge: challenge.challenge,
 * });
 *
 * console.log('Token:', session.token);
 * ```
 */
export class ValidatorAuthClient {
  private readonly timeout: number;
  private readonly allowInsecure: boolean;

  constructor(config?: ValidatorAuthConfig) {
    this.timeout = config?.timeout ?? 30000;
    this.allowInsecure = config?.security?.allowInsecure ?? false;
  }

  /**
   * Request authentication challenge from validator
   *
   * @param validatorUrl - Validator API base URL
   * @param chain - Blockchain type
   * @param address - Wallet address
   * @returns Challenge to sign
   */
  async requestChallenge(
    validatorUrl: string,
    chain: AuthChain,
    address: string
  ): Promise<ChallengeResponse> {
    // Validate and sanitize inputs
    const safeUrl = validateValidatorUrl(validatorUrl, this.allowInsecure);
    const safeAddress = sanitizeInput(address, 'address', 128);

    // Validate chain type
    if (!['hedera', 'xrpl'].includes(chain)) {
      throw new ValidatorAuthError(`Invalid chain type: ${chain}`, 400);
    }

    const url = `${safeUrl}/auth/validator/challenge`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chain, address: safeAddress }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ValidatorAuthError(
          `Challenge request failed: ${response.status} ${response.statusText}`,
          response.status,
          error
        );
      }

      return (await response.json()) as ChallengeResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ValidatorAuthError) {
        throw error;
      }
      const err = error as Error;
      if (err.name === 'AbortError') {
        throw new ValidatorAuthError('Challenge request timeout', 408);
      }
      throw new ValidatorAuthError(`Challenge request failed: ${err.message}`, 0);
    }
  }

  /**
   * Authenticate with signed challenge
   *
   * @param validatorUrl - Validator API base URL
   * @param request - Authentication request with signature
   * @returns Session token and info
   */
  async authenticate(
    validatorUrl: string,
    request: AuthenticateRequest
  ): Promise<AuthenticateResponse> {
    // Validate URL
    const safeUrl = validateValidatorUrl(validatorUrl, this.allowInsecure);

    // Validate and sanitize request fields
    const sanitizedRequest: AuthenticateRequest = {
      chain: request.chain,
      address: sanitizeInput(request.address, 'address', 128),
      publicKey: sanitizeInput(request.publicKey, 'publicKey', 512),
      signature: sanitizeInput(request.signature, 'signature', 1024),
      challenge: sanitizeInput(request.challenge, 'challenge', 512),
      metadata: request.metadata
        ? {
            nodeId: request.metadata.nodeId
              ? sanitizeInput(request.metadata.nodeId, 'nodeId', 64)
              : undefined,
            endpoint: request.metadata.endpoint
              ? sanitizeInput(request.metadata.endpoint, 'endpoint', 256)
              : undefined,
            capabilities: request.metadata.capabilities,
            appId: request.metadata.appId
              ? sanitizeInput(request.metadata.appId, 'appId', 64)
              : undefined,
            appName: request.metadata.appName
              ? sanitizeInput(request.metadata.appName, 'appName', 128)
              : undefined,
          }
        : undefined,
    };

    // Validate chain type
    if (!['hedera', 'xrpl'].includes(sanitizedRequest.chain)) {
      throw new ValidatorAuthError(`Invalid chain type: ${sanitizedRequest.chain}`, 400);
    }

    // Validate signature is hex
    if (!/^[0-9a-fA-F]+$/.test(sanitizedRequest.signature.replace(/_.*$/, ''))) {
      throw new ValidatorAuthError('Invalid signature format: must be hex encoded', 400);
    }

    const url = `${safeUrl}/auth/validator/authenticate`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ValidatorAuthError(
          `Authentication failed: ${response.status} ${response.statusText}`,
          response.status,
          error
        );
      }

      return (await response.json()) as AuthenticateResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ValidatorAuthError) {
        throw error;
      }
      const err = error as Error;
      if (err.name === 'AbortError') {
        throw new ValidatorAuthError('Authentication request timeout', 408);
      }
      throw new ValidatorAuthError(`Authentication failed: ${err.message}`, 0);
    }
  }

  /**
   * Get current session info
   *
   * @param validatorUrl - Validator API base URL
   * @param token - Session token
   * @returns Session information
   */
  async getSession(validatorUrl: string, token: string): Promise<SessionInfo> {
    // Validate URL and token
    const safeUrl = validateValidatorUrl(validatorUrl, this.allowInsecure);
    const safeToken = sanitizeInput(token, 'token', 2048);

    const url = `${safeUrl}/auth/validator/session`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${safeToken}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ValidatorAuthError(
          `Session request failed: ${response.status} ${response.statusText}`,
          response.status,
          error
        );
      }

      return (await response.json()) as SessionInfo;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ValidatorAuthError) {
        throw error;
      }
      const err = error as Error;
      if (err.name === 'AbortError') {
        throw new ValidatorAuthError('Session request timeout', 408);
      }
      throw new ValidatorAuthError(`Session request failed: ${err.message}`, 0);
    }
  }

  /**
   * Sign challenge with Hedera private key
   *
   * @param challenge - Challenge string from validator
   * @param privateKey - Hedera PrivateKey instance from @hashgraph/sdk
   * @returns Hex-encoded signature
   */
  signChallengeHedera(challenge: string, privateKey: any): string {
    // privateKey should be a PrivateKey from @hashgraph/sdk
    const messageBytes = Buffer.from(challenge, 'utf-8');
    const signature = privateKey.sign(messageBytes);
    return Buffer.from(signature).toString('hex');
  }

  /**
   * Sign challenge with XRPL wallet
   *
   * @param challenge - Challenge string from validator
   * @param wallet - XRPL Wallet instance from xrpl library
   * @returns Hex-encoded signature
   */
  signChallengeXRPL(challenge: string, wallet: any): string {
    // wallet should be a Wallet from xrpl library
    // XRPL uses sign() method which returns base58 or hex
    const signature = wallet.sign(challenge);
    // If it's already hex, return as-is, otherwise convert
    if (typeof signature === 'string' && /^[0-9A-Fa-f]+$/.test(signature)) {
      return signature;
    }
    return Buffer.from(signature).toString('hex');
  }

  /**
   * Complete authentication flow in one call
   *
   * @param validatorUrl - Validator API base URL
   * @param chain - Blockchain type
   * @param address - Wallet address
   * @param publicKey - Public key (hex)
   * @param signFn - Function to sign the challenge
   * @param metadata - Optional metadata
   * @returns Session token and info
   */
  async authenticateWithSigner(
    validatorUrl: string,
    chain: AuthChain,
    address: string,
    publicKey: string,
    signFn: (challenge: string) => string | Promise<string>,
    metadata?: AuthenticateRequest['metadata']
  ): Promise<AuthenticateResponse> {
    // Step 1: Request challenge
    const challengeResponse = await this.requestChallenge(validatorUrl, chain, address);

    // Step 2: Sign challenge
    const signature = await signFn(challengeResponse.challenge);

    // Step 3: Authenticate
    return this.authenticate(validatorUrl, {
      chain,
      address,
      publicKey,
      signature,
      challenge: challengeResponse.challenge,
      metadata,
    });
  }
}

/**
 * Authentication error
 */
export class ValidatorAuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidatorAuthError';
  }
}
