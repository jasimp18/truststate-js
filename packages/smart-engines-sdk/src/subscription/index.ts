/**
 * Subscription Sub-Client
 *
 * Manages application subscriptions for using the validator network.
 */

/**
 * Subscription tier names
 *
 * - free_testnet: Free tier limited to testnet/previewnet
 * - starter: Entry-level paid tier
 * - professional: Mid-tier with advanced features
 * - enterprise: Full-featured enterprise tier
 */
export type SubscriptionTierName = 'free_testnet' | 'starter' | 'professional' | 'enterprise';

/**
 * Subscription statuses
 */
export type SubscriptionStatus =
  | 'pending_deposit'
  | 'deposit_confirmed'
  | 'active'
  | 'expired'
  | 'cancelled';

/**
 * Deposit wallet statuses
 */
export type DepositWalletStatus = 'pending' | 'locked' | 'expired' | 'slashed' | 'released';

/**
 * Subscription tier information for API responses
 */
export type SubscriptionTierInfo = {
  /** Tier name identifier */
  name: SubscriptionTierName;
  /** Display name for UI */
  displayName: string;
  /** Tier description */
  description: string;
  /** Monthly price in USD */
  priceUsd: number;
  /** Deposit amount in HSUITE tokens */
  depositAmount: string;
  /** API calls per day limit */
  apiCallsPerDay: number;
  /** Supported networks for this tier */
  supportedNetworks: ('hedera' | 'xrpl')[];
  /** Additional features included in this tier */
  features: string[];
};

/**
 * Subscription request
 */
export type SubscriptionRequest = {
  /** Application ID */
  appId: string;
  /** Application name */
  appName: string;
  /** Developer's account ID on the chosen chain */
  developerAccountId: string;
  /** Chain for deposit */
  chain: 'hedera' | 'xrpl';
  /** Selected subscription tier */
  selectedTier: SubscriptionTierName;
  /** Selected networks to support */
  selectedNetworks: ('hedera' | 'xrpl')[];
  /** App logo URL (optional) */
  logoUrl?: string;
  /** App description (optional) */
  appDescription?: string;
  /** Additional metadata (optional) */
  metadata?: Record<string, unknown>;
};

/**
 * Subscription response
 */
export type SubscriptionResponse = {
  success: boolean;
  subscriptionId?: string;
  status?: SubscriptionStatus;
  depositInstructions?: {
    walletAddress: string;
    tokenId: string;
    amount: string;
    chain: string;
  };
  message: string;
};

/**
 * Subscription status response
 */
export type SubscriptionStatusResponse = {
  appId: string;
  hasSubscription: boolean;
  subscriptionId?: string;
  appName?: string;
  status: SubscriptionStatus | 'not_found';
  depositWallet?: {
    walletAddress: string;
    chain: string;
    depositAmount: string;
    actualDepositAmount?: string;
    status: DepositWalletStatus;
    lockedUntil?: string;
  };
  subscriptionNftSerial?: number;
  expiresAt?: string;
  remainingBalance?: string;
  createdAt?: string;
  /** Current subscription tier */
  tier?: SubscriptionTierName;
  /** Networks selected for this subscription */
  selectedNetworks?: string[];
  /** API calls made today */
  apiCallsToday?: number;
  /** Daily API call limit based on tier */
  apiCallsLimit?: number;
};

/**
 * Mint NFT response
 */
export type MintNftResponse = {
  success: boolean;
  subscriptionId?: string;
  appId?: string;
  expiresAt?: string;
  message: string;
};

/**
 * Subscription renewal request
 */
export type SubscriptionRenewalRequest = {
  appId: string;
  additionalDays?: number;
};

/**
 * Subscription renewal response
 */
export type SubscriptionRenewalResponse = {
  success: boolean;
  appId: string;
  status?: string;
  newExpiresAt?: string;
  message: string;
};

/**
 * Subscription configuration
 */
export type SubscriptionConfig = {
  subscriptionDepositAmount: string;
  lockDurationDays: number;
  renewalWindowDays: number;
  hsuiteTokenIds: Record<string, string>;
  /** Available subscription tiers */
  availableTiers: SubscriptionTierInfo[];
};

/**
 * Subscription list response
 */
export type SubscriptionListResponse = {
  count: number;
  subscriptions: Array<{
    subscriptionId: string;
    appId: string;
    appName: string;
    status: SubscriptionStatus;
    expiresAt?: string;
    createdAt: string;
  }>;
};

/**
 * Balance response
 */
export type BalanceResponse = {
  appId: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  remainingBalance: string;
  expiresAt?: string;
};

/**
 * HTTP client interface for making requests
 */
type HttpClient = {
  post<T>(path: string, body: unknown): Promise<T>;
  get<T>(path: string): Promise<T>;
};

/**
 * Subscription Sub-Client
 *
 * Manages application subscriptions including:
 * - Subscription requests with deposit wallets
 * - Deposit verification and NFT minting
 * - Subscription renewal
 * - Balance checking
 */
export class SubscriptionClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Request a new subscription.
   * Creates a deposit wallet and returns deposit instructions.
   */
  async request(request: SubscriptionRequest): Promise<SubscriptionResponse> {
    return this.http.post('/subscription/request', request);
  }

  /**
   * Get subscription status by app ID
   */
  async getStatus(appId: string): Promise<SubscriptionStatusResponse> {
    return this.http.get(`/subscription/status/${encodeURIComponent(appId)}`);
  }

  /**
   * Mint subscription NFT after deposit is confirmed
   */
  async mintNft(appId: string): Promise<MintNftResponse> {
    return this.http.post(`/subscription/mint/${encodeURIComponent(appId)}`, {});
  }

  /**
   * Renew subscription by extending period
   */
  async renew(request: SubscriptionRenewalRequest): Promise<SubscriptionRenewalResponse> {
    return this.http.post('/subscription/renew', request);
  }

  /**
   * Get subscription configuration
   */
  async getConfig(): Promise<SubscriptionConfig> {
    return this.http.get('/subscription/config');
  }

  /**
   * List all subscriptions
   */
  async list(): Promise<SubscriptionListResponse> {
    return this.http.get('/subscription/list');
  }

  /**
   * List subscriptions by status
   */
  async listByStatus(status: SubscriptionStatus): Promise<SubscriptionListResponse> {
    return this.http.get(`/subscription/list/status/${encodeURIComponent(status)}`);
  }

  /**
   * Get subscription balance
   */
  async getBalance(appId: string): Promise<BalanceResponse> {
    return this.http.get(`/subscription/balance/${encodeURIComponent(appId)}`);
  }

  /**
   * Subscription health check
   */
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.http.get('/subscription/health');
  }
}
