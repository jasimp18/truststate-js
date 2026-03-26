/**
 * Hedera TSS Sub-Client
 *
 * Hedera-specific TSS operations for accounts, topics, and tokens.
 */

/**
 * TSS Account creation request
 */
export type TSSAccountRequest = {
  /** Initial balance in HBAR */
  initialBalance?: string;
  /** Account memo */
  memo?: string;
  /** Metadata */
  metadata?: Record<string, unknown>;
};

/**
 * TSS Account creation response
 */
export type TSSAccountResponse = {
  success: boolean;
  accountId: string;
  entityId: string;
  publicKeys: string[];
  threshold: number;
  transactionId: string;
};

/**
 * Memo update request
 */
export type MemoUpdateRequest = {
  /** Account ID to update */
  accountId: string;
  /** Entity ID for TSS signing */
  entityId: string;
  /** New memo value */
  memo: string;
};

/**
 * Memo update response
 */
export type MemoResponse = {
  success: boolean;
  accountId: string;
  memo: string;
  transactionId: string;
};

/**
 * TSS Topic creation request
 */
export type TSSTopicRequest = {
  /** Topic memo */
  memo?: string;
  /** Submit key threshold */
  submitKeyThreshold?: number;
  /** Metadata */
  metadata?: Record<string, unknown>;
};

/**
 * TSS Topic creation response
 */
export type TSSTopicResponse = {
  success: boolean;
  topicId: string;
  entityId: string;
  publicKeys: string[];
  threshold: number;
  transactionId: string;
};

/**
 * TSS Message submission request
 */
export type TSSMessageRequest = {
  /** Topic ID */
  topicId: string;
  /** Entity ID for TSS signing */
  entityId: string;
  /** Message content */
  message: string;
};

/**
 * TSS Message submission response
 */
export type TSSMessageResponse = {
  success: boolean;
  topicId: string;
  sequenceNumber: number;
  transactionId: string;
};

/**
 * TSS Token creation request
 */
export type TSSTokenRequest = {
  /** Token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Decimals */
  decimals: number;
  /** Initial supply */
  initialSupply: string;
  /** Token type */
  type: 'fungible' | 'nft';
  /** Treasury account (optional) */
  treasury?: string;
  /** Token capabilities */
  capabilities?: {
    pausable?: boolean;
    restrictable?: boolean;
    compliant?: boolean;
    wipeable?: boolean;
    mintable?: boolean;
    burnable?: boolean;
  };
  /** Metadata */
  metadata?: Record<string, unknown>;
};

/**
 * TSS Token creation response
 */
export type TSSTokenResponse = {
  success: boolean;
  tokenId: string;
  entityId: string;
  publicKeys: string[];
  threshold: number;
  transactionId: string;
  enabledCapabilities: string[];
};

/**
 * TSS Token mint request
 */
export type TSSMintRequest = {
  /** Token ID */
  tokenId: string;
  /** Entity ID for TSS signing */
  entityId: string;
  /** Amount to mint */
  amount: string;
  /** Recipient account (optional) */
  recipient?: string;
};

/**
 * TSS Token mint response
 */
export type TSSMintResponse = {
  success: boolean;
  tokenId: string;
  amount: string;
  newSupply: string;
  transactionId: string;
};

/**
 * HTTP client interface for making requests
 */
type HttpClient = {
  post<T>(path: string, body: unknown): Promise<T>;
  get<T>(path: string): Promise<T>;
};

/**
 * Hedera TSS Sub-Client
 *
 * Hedera-specific TSS operations including:
 * - Creating TSS-controlled accounts
 * - Creating TSS-controlled topics
 * - Creating TSS-controlled tokens
 * - Submitting messages with TSS signatures
 * - Minting tokens with TSS validation
 */
export class HederaTSSClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a Hedera account with TSS control
   */
  async createAccount(request: TSSAccountRequest): Promise<TSSAccountResponse> {
    return this.http.post('/hedera/tss/create-account', request);
  }

  /**
   * Update account memo with TSS signature
   */
  async updateMemo(request: MemoUpdateRequest): Promise<MemoResponse> {
    return this.http.post('/hedera/tss/update-memo', request);
  }

  /**
   * Create an HCS topic with TSS control
   */
  async createTopic(request: TSSTopicRequest): Promise<TSSTopicResponse> {
    return this.http.post('/hedera/tss/create-topic', request);
  }

  /**
   * Submit message to HCS with TSS signature
   */
  async submitMessage(request: TSSMessageRequest): Promise<TSSMessageResponse> {
    return this.http.post('/hedera/tss/submit-message', request);
  }

  /**
   * Create a token with TSS-controlled keys
   */
  async createToken(request: TSSTokenRequest): Promise<TSSTokenResponse> {
    return this.http.post('/hedera/tss/create-token', request);
  }

  /**
   * Mint tokens with TSS validation
   */
  async mintToken(request: TSSMintRequest): Promise<TSSMintResponse> {
    return this.http.post('/hedera/tss/mint-token', request);
  }
}
