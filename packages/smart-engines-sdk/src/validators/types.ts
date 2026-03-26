/**
 * Validator Types
 *
 * Types for V3 HCS validators for decentralized governance
 */

/**
 * Validator type
 */
export type ValidatorType = 'token' | 'account' | 'topic';

/**
 * Controller type for operations
 */
export type ControllerType = 'owner' | 'dao';

/**
 * Security level for keys
 */
export type SecurityLevel = 'none' | 'partial' | 'full';

/**
 * Base validator rules shared across all types
 */
export type BaseValidatorRules = {
  version: '3.0';
  type: ValidatorType;
  created?: string;
  smartNodeSecurity: SecurityLevel;
  metadata?: {
    version?: string;
    description?: string;
    tags?: string[];
  };
};

/**
 * Operation configuration
 */
export type OperationConfig = {
  enabled: boolean;
  controller?: ControllerType;
  requiresApproval?: boolean;
  requiresMultisig?: boolean;
  limits?: {
    maxPerTransaction?: string;
    dailyLimit?: string;
    weeklyLimit?: string;
    monthlyLimit?: string;
    totalLimit?: string;
    cooldownSeconds?: number;
  };
};

/**
 * Key configuration
 */
export type KeyConfig = {
  enabled: boolean;
  security?: SecurityLevel;
  controller?: ControllerType;
  requiresApproval?: boolean;
  threshold?: number;
};

/**
 * Governance configuration
 */
export type GovernanceConfig = {
  proposalThreshold?: string;
  votingPeriodSeconds?: number;
  quorumPercentage?: number;
};

/**
 * Token validator rules (V3)
 */
export type TokenValidatorRules = BaseValidatorRules & {
  type: 'token';
  operations: {
    mint?: OperationConfig & { allowHolderBurn?: boolean };
    burn?: OperationConfig & { allowHolderBurn?: boolean };
    transfer?: OperationConfig & { requiresKyc?: boolean; blacklistEnabled?: boolean };
    freeze?: OperationConfig;
    pause?: OperationConfig & { emergencyOnly?: boolean };
    wipe?: OperationConfig;
    grantKyc?: OperationConfig;
    revokeKyc?: OperationConfig;
    associate?: OperationConfig;
    dissociate?: OperationConfig;
    update?: OperationConfig;
  };
  keys?: {
    admin?: KeyConfig;
    supply?: KeyConfig;
    freeze?: KeyConfig;
    pause?: KeyConfig;
    wipe?: KeyConfig;
    kyc?: KeyConfig;
    feeSchedule?: KeyConfig;
  };
  governance?: GovernanceConfig;
};

/**
 * Account validator rules (V3)
 */
export type AccountValidatorRules = BaseValidatorRules & {
  type: 'account';
  operations: {
    transfer?: OperationConfig;
    update?: OperationConfig;
    delete?: OperationConfig;
    approveAllowance?: OperationConfig;
    deleteAllowance?: OperationConfig;
    stake?: OperationConfig;
    unstake?: OperationConfig;
  };
  keys?: {
    admin?: KeyConfig;
    signing?: KeyConfig;
  };
  governance?: GovernanceConfig;
};

/**
 * Topic validator rules (V3)
 */
export type TopicValidatorRules = BaseValidatorRules & {
  type: 'topic';
  operations: {
    submit?: OperationConfig;
    update?: OperationConfig;
    delete?: OperationConfig;
  };
  keys?: {
    admin?: KeyConfig;
    submit?: KeyConfig;
  };
};

/**
 * Proposal response from validator creation
 */
export type CreateProposalResponse = {
  success: boolean;
  proposalId: string;
  ceremonyId?: string;
  threshold: number;
  expiresAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
};

/**
 * Validator read response
 */
export type ValidatorReadResponse = {
  found: boolean;
  consensusTimestamp?: string;
  topicId?: string;
  rules?: TokenValidatorRules | AccountValidatorRules | TopicValidatorRules;
  sequenceNumber?: number;
  error?: string;
};

/**
 * Validator health response
 */
export type ValidatorHealthResponse = {
  status: string;
  mode: string;
  storage: string;
  schemaVersion: string;
  timestamp: string;
};

/**
 * Validator info response
 */
export type ValidatorInfoResponse = {
  version: string;
  schemaVersion: string;
  mode: string;
  storage: {
    type: string;
    immutable: boolean;
    trustless: boolean;
  };
  supportedValidatorTypes: string[];
  v3Features: string[];
  controllerTypes: string[];
  securityLevels: string[];
  cache: Record<string, unknown>;
  registry: Record<string, unknown>;
};

/**
 * Template list response
 */
export type TemplateListResponse = {
  tokens: string[];
  accounts: string[];
  topics: string[];
};

/**
 * Registry filter options
 */
export type RegistryFilters = {
  type?: 'consensus' | 'tokens' | 'accounts';
  tags?: string[];
  author?: string;
};

/**
 * Registry list response
 */
export type RegistryListResponse = {
  count: number;
  schemaVersion: string;
  validators: Array<{
    consensusTimestamp: string;
    type: string;
    topicId: string;
    metadata?: Record<string, unknown>;
  }>;
};

/**
 * Registry search response
 */
export type RegistrySearchResponse = {
  query: string;
  count: number;
  schemaVersion: string;
  results: Array<{
    consensusTimestamp: string;
    type: string;
    topicId: string;
    score: number;
  }>;
};

/**
 * Registry stats response
 */
export type RegistryStatsResponse = {
  totalValidators: number;
  byType: Record<string, number>;
  schemaVersion: string;
};

/**
 * Validator template
 */
export type ValidatorTemplate = {
  name: string;
  description: string;
  type: ValidatorType;
  rules: TokenValidatorRules | AccountValidatorRules | TopicValidatorRules;
};
