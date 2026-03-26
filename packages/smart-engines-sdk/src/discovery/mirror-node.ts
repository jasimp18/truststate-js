/**
 * Hedera Mirror Node Client
 *
 * Lightweight client for querying Hedera mirror node REST API.
 * Used for validator discovery by reading HCS topic messages.
 */

/**
 * Mirror node configuration
 */
export interface MirrorNodeConfig {
  /** Mirror node base URL (e.g., https://testnet.mirrornode.hedera.com) */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Allow HTTP (insecure) connections - default false */
  allowInsecure?: boolean;
}

/**
 * Validate and sanitize a URL
 * Prevents SSRF and ensures HTTPS for security
 */
function validateUrl(url: string, allowInsecure = false): URL {
  try {
    const parsed = new URL(url);

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Invalid protocol: ${parsed.protocol}`);
    }

    // Enforce HTTPS unless explicitly allowed
    if (!allowInsecure && parsed.protocol !== 'https:') {
      throw new Error(
        'HTTPS is required for secure connections. Set allowInsecure=true to override.'
      );
    }

    // Block private/internal IP ranges to prevent SSRF
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fe80:/i,
      /^fc00:/i,
      /^fd00:/i,
    ];

    // Allow localhost only in development with explicit flag
    const isPrivate = blockedPatterns.some((pattern) => pattern.test(hostname));
    if (isPrivate && !allowInsecure) {
      throw new Error(
        'Private/internal URLs are blocked. Set allowInsecure=true for local development.'
      );
    }

    return parsed;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid URL')) {
      throw new MirrorNodeError(`Invalid URL format: ${url}`, 400);
    }
    throw error;
  }
}

/**
 * Validate Hedera topic ID format
 */
function validateTopicId(topicId: string): void {
  // Format: shard.realm.num (e.g., 0.0.123456)
  if (!/^\d+\.\d+\.\d+$/.test(topicId)) {
    throw new MirrorNodeError(
      `Invalid topic ID format: ${topicId}. Expected format: 0.0.123456`,
      400
    );
  }
}

/**
 * HCS topic message from mirror node API
 */
export interface TopicMessage {
  /** Consensus timestamp */
  consensus_timestamp: string;
  /** Message content (base64 encoded) */
  message: string;
  /** Payer account ID */
  payer_account_id: string;
  /** Running hash */
  running_hash: string;
  /** Running hash version */
  running_hash_version: number;
  /** Sequence number */
  sequence_number: number;
  /** Topic ID */
  topic_id: string;
}

/**
 * Mirror node API response for topic messages
 */
export interface TopicMessagesResponse {
  messages: TopicMessage[];
  links: {
    next?: string;
  };
}

/**
 * Default mirror node URLs by network
 */
export const MIRROR_NODE_URLS: Record<string, string> = {
  mainnet: 'https://mainnet-public.mirrornode.hedera.com',
  testnet: 'https://testnet.mirrornode.hedera.com',
  previewnet: 'https://previewnet.mirrornode.hedera.com',
};

/**
 * Hedera Mirror Node Client
 *
 * Query HCS topic messages via REST API for validator discovery.
 */
export class MirrorNodeClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly allowInsecure: boolean;

  constructor(config: MirrorNodeConfig) {
    this.allowInsecure = config.allowInsecure ?? false;

    // Validate the base URL
    const validatedUrl = validateUrl(config.baseUrl, this.allowInsecure);
    this.baseUrl = validatedUrl.origin;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Create client for a specific network
   */
  static forNetwork(network: 'mainnet' | 'testnet' | 'previewnet'): MirrorNodeClient {
    const baseUrl = MIRROR_NODE_URLS[network];
    if (!baseUrl) {
      throw new Error(`Unknown network: ${network}`);
    }
    return new MirrorNodeClient({ baseUrl });
  }

  /**
   * Get topic messages from mirror node
   *
   * @param topicId - HCS topic ID (e.g., '0.0.123456')
   * @param options - Query options
   * @returns Topic messages
   */
  async getTopicMessages(
    topicId: string,
    options?: {
      /** Limit number of messages */
      limit?: number;
      /** Order (asc or desc) */
      order?: 'asc' | 'desc';
      /** Timestamp to start from */
      timestampStart?: string;
      /** Timestamp to end at */
      timestampEnd?: string;
      /** Sequence number to start from */
      sequenceNumberStart?: number;
    }
  ): Promise<TopicMessage[]> {
    // Validate topic ID format to prevent injection
    validateTopicId(topicId);

    const params = new URLSearchParams();

    if (options?.limit) {
      params.set('limit', options.limit.toString());
    }
    if (options?.order) {
      params.set('order', options.order);
    }
    if (options?.timestampStart) {
      params.set('timestamp', `gte:${options.timestampStart}`);
    }
    if (options?.timestampEnd) {
      params.set('timestamp', `lte:${options.timestampEnd}`);
    }
    if (options?.sequenceNumberStart) {
      params.set('sequencenumber', `gte:${options.sequenceNumberStart}`);
    }

    const url = `${this.baseUrl}/api/v1/topics/${topicId}/messages?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new MirrorNodeError(
          `Mirror node error: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = (await response.json()) as TopicMessagesResponse;
      return data.messages;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof MirrorNodeError) {
        throw error;
      }
      const err = error as Error;
      if (err.name === 'AbortError') {
        throw new MirrorNodeError('Mirror node request timeout', 408);
      }
      throw new MirrorNodeError(`Mirror node network error: ${err.message}`, 0);
    }
  }

  /**
   * Get all topic messages with pagination
   *
   * @param topicId - HCS topic ID
   * @param maxMessages - Maximum messages to fetch (default: 1000)
   * @returns All topic messages
   */
  async getAllTopicMessages(topicId: string, maxMessages: number = 1000): Promise<TopicMessage[]> {
    // Validate topic ID format
    validateTopicId(topicId);

    // Enforce reasonable limits to prevent DoS
    const safeMaxMessages = Math.min(maxMessages, 10000);

    const allMessages: TopicMessage[] = [];
    let nextPath: string | undefined = `/api/v1/topics/${topicId}/messages?limit=100&order=desc`;

    while (nextPath && allMessages.length < safeMaxMessages) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        // Construct full URL safely - only use path from pagination
        const fullUrl = `${this.baseUrl}${nextPath}`;

        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new MirrorNodeError(
            `Mirror node error: ${response.status} ${response.statusText}`,
            response.status
          );
        }

        const data = (await response.json()) as TopicMessagesResponse;
        allMessages.push(...data.messages);

        // Validate and sanitize pagination link
        // Only accept relative paths starting with /api/v1/
        if (data.links.next) {
          const nextLink = data.links.next;
          if (nextLink.startsWith('/api/v1/topics/')) {
            nextPath = nextLink;
          } else {
            // Invalid pagination link - stop pagination
            nextPath = undefined;
          }
        } else {
          nextPath = undefined;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof MirrorNodeError) {
          throw error;
        }
        const err = error as Error;
        throw new MirrorNodeError(`Mirror node error: ${err.message}`, 0);
      }
    }

    return allMessages.slice(0, safeMaxMessages);
  }

  /**
   * Decode base64 message content
   */
  static decodeMessage(base64Message: string): string {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64Message, 'base64').toString('utf-8');
    }
    // Browser environment
    return atob(base64Message);
  }
}

/**
 * Mirror node error
 */
export class MirrorNodeError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'MirrorNodeError';
  }
}
