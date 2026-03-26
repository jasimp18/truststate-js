/**
 * Genesis Sub-Client
 *
 * Manages genesis bootstrap and validator governance.
 */

/**
 * Supported chains for genesis
 */
export type SupportedChain = 'hedera' | 'xrpl' | 'solana' | 'polkadot';

/**
 * Genesis overall status
 */
export type GenesisOverallStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Genesis status response
 */
export type GenesisStatusResponse = {
  bootstrap: {
    status: GenesisOverallStatus;
    phase?: string;
    error?: string;
  };
  quorum: {
    reached: boolean;
    current: number;
    required: number;
  };
  multiChain: {
    overall: GenesisOverallStatus;
    implementedChains: {
      completed: number;
      failed: number;
      pending: number;
    };
    skippedChains: string[];
    queueSummary: Record<string, unknown>;
    initiatedAt?: string;
    completedAt?: string;
  };
  genesisConfig: {
    version: string;
    network: string;
    genesisEntityId: string;
    topics: Record<string, string>;
    membershipNft: {
      tokenId: string;
      validatorCount: number;
    };
    validatorCount: number;
    createdAt: string;
  } | null;
};

/**
 * Multi-chain status response
 */
export type MultiChainStatusResponse = {
  overall: GenesisOverallStatus;
  config: Record<string, unknown>;
  chains: Record<string, unknown>;
  summary: {
    completed: number;
    failed: number;
    pending: number;
  };
  skippedChains: string[];
  timestamps: {
    initiatedAt?: string;
    completedAt?: string;
  };
};

/**
 * Chain status response
 */
export type ChainStatusResponse = {
  chain: string;
  state: {
    chain: string;
    status: string;
    retryCount: number;
    maxRetries: number;
    progress: number;
    error?: string;
  };
};

/**
 * Retry response
 */
export type RetryResponse = {
  success: boolean;
  message: string;
  chain: string;
};

/**
 * Quorum status response
 */
export type QuorumStatusResponse = {
  reached: boolean;
  current: number;
  required: number;
  validators: string[];
};

/**
 * Bootstrap request
 */
export type BootstrapRequest = {
  force?: boolean;
  skipChains?: SupportedChain[];
};

/**
 * Bootstrap response
 */
export type BootstrapResponse = {
  success: boolean;
  message: string;
  phase?: string;
  error?: string;
};

/**
 * Validator registry response
 */
export type ValidatorRegistryResponse = {
  validators: Array<{
    nodeId: string;
    accountId: string;
    status: string;
    endpoint?: string;
    publicKey?: string;
    metadata?: Record<string, unknown>;
  }>;
  counts: {
    total: number;
    active: number;
    pending: number;
    banned: number;
  };
  threshold: number;
  activeCeremonyId?: string;
  isGenesisComplete: boolean;
};

/**
 * Active validators response
 */
export type ActiveValidatorsResponse = {
  validators: Array<{
    nodeId: string;
    accountId: string;
    status: string;
  }>;
  count: number;
};

/**
 * Validator join request
 */
export type ValidatorJoinRequest = {
  nodeId: string;
  accountId: string;
  publicKey: string;
  endpoint: string;
  chainAccounts?: Record<string, string>;
  capabilities?: string[];
};

/**
 * Validator leave request
 */
export type ValidatorLeaveRequest = {
  validatorId: string;
  reason?: string;
};

/**
 * Validator ban request
 */
export type ValidatorBanRequest = {
  validatorId: string;
  reason: string;
  evidence?: string;
};

/**
 * Proposal response
 */
export type ProposalResponse = {
  success: boolean;
  proposalId: string;
  type: string;
  threshold: number;
  expiresAt: string;
  message: string;
};

/**
 * Genesis config response
 */
export type GenesisConfigResponse = {
  complete: boolean;
  multiChain: boolean;
  config?: unknown;
  message?: string;
};

/**
 * Multi-sig upgrade request
 */
export type MultiSigUpgradeRequest = {
  tokenId?: string;
  threshold?: number;
  validatorKeys?: Array<{ nodeId: string; publicKey: string }>;
};

/**
 * Multi-sig upgrade response
 */
export type MultiSigUpgradeResponse = {
  success: boolean;
  message: string;
  threshold: number;
  validatorCount: number;
  validators: string[];
  results: Array<{
    tokenId: string;
    success: boolean;
    txId?: string;
    error?: string;
  }>;
};

/**
 * Multi-sig status response
 */
export type HederaMultiSigStatusResponse = {
  genesisComplete: boolean;
  validatorsWithKeys: number;
  validatorsTotal: number;
  validators: Array<{
    nodeId: string;
    hasHederaKey: boolean;
  }>;
  tokens: {
    membershipNft: string | null;
    subscriptionNft: string | null;
  };
  canUpgrade: boolean;
  note?: string;
};

/**
 * HTTP client interface for making requests
 */
type HttpClient = {
  post<T>(path: string, body: unknown): Promise<T>;
  get<T>(path: string): Promise<T>;
};

/**
 * Genesis Sub-Client
 *
 * Manages genesis bootstrap and validator governance including:
 * - Genesis status monitoring
 * - Multi-chain genesis orchestration
 * - Validator registry and governance
 * - Multi-sig key upgrades
 */
export class GenesisClient {
  constructor(private readonly http: HttpClient) {}

  // ========== Genesis Status ==========

  /**
   * Get genesis status (single-chain and multi-chain)
   */
  async getStatus(): Promise<GenesisStatusResponse> {
    return this.http.get('/genesis/status');
  }

  /**
   * Get detailed multi-chain genesis status
   */
  async getMultiChainStatus(): Promise<MultiChainStatusResponse> {
    return this.http.get('/genesis/multichain/status');
  }

  /**
   * Get specific chain genesis status
   */
  async getChainStatus(chain: SupportedChain): Promise<ChainStatusResponse> {
    return this.http.get(`/genesis/multichain/chain/${encodeURIComponent(chain)}`);
  }

  /**
   * Retry genesis for a specific chain
   */
  async retryChainGenesis(chain: SupportedChain): Promise<RetryResponse> {
    return this.http.post(`/genesis/multichain/chain/${encodeURIComponent(chain)}/retry`, {});
  }

  /**
   * Get quorum status
   */
  async getQuorumStatus(): Promise<QuorumStatusResponse> {
    return this.http.get('/genesis/quorum');
  }

  // ========== Genesis Bootstrap ==========

  /**
   * Trigger genesis bootstrap (manual)
   */
  async triggerBootstrap(request?: BootstrapRequest): Promise<BootstrapResponse> {
    return this.http.post('/genesis/bootstrap', request || {});
  }

  // ========== Validator Registry ==========

  /**
   * Get validator registry
   */
  async getValidators(): Promise<ValidatorRegistryResponse> {
    return this.http.get('/genesis/validators');
  }

  /**
   * Get active validators only
   */
  async getActiveValidators(): Promise<ActiveValidatorsResponse> {
    return this.http.get('/genesis/validators/active');
  }

  // ========== Validator Governance ==========

  /**
   * Propose new validator to join
   */
  async proposeValidatorJoin(request: ValidatorJoinRequest): Promise<ProposalResponse> {
    return this.http.post('/genesis/governance/propose-join', request);
  }

  /**
   * Propose validator leave
   */
  async proposeValidatorLeave(request: ValidatorLeaveRequest): Promise<ProposalResponse> {
    return this.http.post('/genesis/governance/propose-leave', request);
  }

  /**
   * Propose to ban validator
   */
  async proposeValidatorBan(request: ValidatorBanRequest): Promise<ProposalResponse> {
    return this.http.post('/genesis/governance/propose-ban', request);
  }

  // ========== Genesis Configuration ==========

  /**
   * Get full genesis configuration
   */
  async getConfig(): Promise<GenesisConfigResponse> {
    return this.http.get('/genesis/config');
  }

  /**
   * Get multi-chain genesis configuration
   */
  async getMultiChainConfig(): Promise<GenesisConfigResponse> {
    return this.http.get('/genesis/multichain/config');
  }

  // ========== Multi-Sig Upgrade ==========

  /**
   * Upgrade Hedera NFT tokens to multi-sig KeyList control
   */
  async upgradeHederaToMultiSig(
    request?: MultiSigUpgradeRequest
  ): Promise<MultiSigUpgradeResponse> {
    return this.http.post('/genesis/hedera/upgrade-multisig', request || {});
  }

  /**
   * Check multi-sig status for Hedera tokens
   */
  async getHederaMultiSigStatus(): Promise<HederaMultiSigStatusResponse> {
    return this.http.get('/genesis/hedera/multisig-status');
  }
}
