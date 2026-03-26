/**
 * Validator Interfaces
 *
 * Smart Engines Multichain Validator Schema (v3.0)
 *
 * Key Features:
 * - Type-safe operations (TokenOperationType, AccountOperationType, etc.)
 * - Granular per-key security configuration
 * - Operation-specific limits (per-tx, daily, weekly, monthly, total)
 * - Fee structures (fixed, fractional, royalty)
 * - DAO governance integration
 * - Token gating support
 *
 * Usage:
 * ```typescript
 * const tokenRules: TokenValidatorRules = {
 *   version: '3.0',
 *   type: 'token',
 *   created: new Date().toISOString(),
 *   smartNodeSecurity: 'partial',
 *   operations: {
 *     mint: { enabled: true, controller: 'dao', limits: { maxPerTransaction: '100000' } },
 *     transfer: { enabled: true, requiresKyc: true }
 *   },
 *   keys: { supply: { enabled: true, security: 'partial', controller: 'dao' } }
 * };
 * ```
 */

// =============================================================================
// Security & Control Types
// =============================================================================

/**
 * Smart Node Security Levels
 *
 * Determines who controls the cryptographic keys for an entity:
 * - 'none': Keys fully controlled by owner (no smart node involvement)
 * - 'partial': 50/50 multisig between owner and smart nodes
 * - 'full': Keys fully controlled by smart nodes (owner cannot act unilaterally)
 */
export type SmartNodeSecurity = 'none' | 'partial' | 'full';

/**
 * Controller types for operations
 * - 'owner': Entity owner has direct control
 * - 'dao': Requires DAO proposal approval via HCS
 */
export type OperationController = 'owner' | 'dao';

// =============================================================================
// Type-Safe Operation Types
// =============================================================================

/**
 * Token Operations - Type-safe operation identifiers
 */
export type TokenOperationType =
  | 'create'
  | 'mint'
  | 'burn'
  | 'transfer'
  | 'update'
  | 'pause'
  | 'unpause'
  | 'freeze'
  | 'unfreeze'
  | 'wipe'
  | 'associate'
  | 'dissociate'
  | 'grant_kyc'
  | 'revoke_kyc';

/**
 * Account Operations - Type-safe operation identifiers
 */
export type AccountOperationType =
  | 'create'
  | 'update'
  | 'delete'
  | 'transfer'
  | 'approve_allowance'
  | 'delete_allowance'
  | 'stake'
  | 'unstake';

/**
 * Consensus/Topic Operations - Type-safe operation identifiers
 */
export type ConsensusOperationType = 'create' | 'update' | 'delete' | 'submit' | 'subscribe';

// =============================================================================
// Numerical Limits
// =============================================================================

/**
 * Limit types for numerical constraints
 */
export type LimitType = 'per_transaction' | 'daily' | 'weekly' | 'monthly' | 'total';

/**
 * Numerical Limit Configuration
 */
export interface NumericalLimit {
  /** Type of limit */
  type: LimitType;
  /** Maximum value (as string for precision with large numbers) */
  value: string;
  /** Cooldown period in seconds (optional) */
  cooldownSeconds?: number;
}

/**
 * Operation Limits - Configures limits for a specific operation
 */
export interface OperationLimits {
  /** Maximum amount per transaction */
  maxPerTransaction?: string;
  /** Daily limit */
  dailyLimit?: string;
  /** Weekly limit */
  weeklyLimit?: string;
  /** Monthly limit */
  monthlyLimit?: string;
  /** Total lifetime limit */
  totalLimit?: string;
  /** Cooldown between operations in seconds */
  cooldownSeconds?: number;
  /** Minimum amount per transaction */
  minPerTransaction?: string;
}

// =============================================================================
// Key Conditions (Granular per-key configuration)
// =============================================================================

/**
 * Individual Key Configuration
 *
 * All fields are optional - when omitted, inherits from top-level defaults:
 * - enabled: defaults to true
 * - security: inherits from defaultSecurity
 * - controller: inherits from defaultController
 *
 * Empty object {} means "use all defaults"
 */
export interface KeyCondition {
  /** Whether this key is enabled on the entity (default: true) */
  enabled?: boolean;
  /** Security level for this specific key (inherits from defaultSecurity if omitted) */
  security?: SmartNodeSecurity;
  /** Who controls updates to this key (inherits from defaultController if omitted) */
  controller?: OperationController;
  /** Whether DAO approval is required for key changes */
  requiresApproval?: boolean;
  /** Threshold for multisig (if applicable) */
  threshold?: number;
}

/**
 * Token Key Conditions - Granular key configuration for tokens
 */
export interface TokenKeyConditions {
  admin?: KeyCondition;
  supply?: KeyCondition;
  freeze?: KeyCondition;
  pause?: KeyCondition;
  wipe?: KeyCondition;
  kyc?: KeyCondition;
  feeSchedule?: KeyCondition;
}

/**
 * Account Key Conditions - Granular key configuration for accounts
 */
export interface AccountKeyConditions {
  admin?: KeyCondition;
  /** Key that can be used for signing transactions */
  signing?: KeyCondition;
}

/**
 * Topic Key Conditions - Granular key configuration for topics
 */
export interface TopicKeyConditions {
  admin?: KeyCondition;
  submit?: KeyCondition;
}

// =============================================================================
// Fee Conditions
// =============================================================================

/**
 * Fixed Fee Configuration
 */
export interface FixedFeeCondition {
  /** Whether fixed fees are enabled */
  enabled: boolean;
  /** Fee amount (as string for precision) */
  amount: string;
  /** Token ID for fee (HBAR if not specified) */
  feeTokenId?: string;
  /** Account to receive fees */
  feeCollectorAccountId: string;
  /** Whether all fees go to collector (vs. split) */
  allCollectorsAreExempt?: boolean;
}

/**
 * Fractional Fee Configuration
 */
export interface FractionalFeeCondition {
  /** Whether fractional fees are enabled */
  enabled: boolean;
  /** Numerator for fee calculation */
  numerator: number;
  /** Denominator for fee calculation */
  denominator: number;
  /** Minimum fee amount */
  minimumAmount?: string;
  /** Maximum fee amount */
  maximumAmount?: string;
  /** Account to receive fees */
  feeCollectorAccountId: string;
  /** Whether to net fee from transfer amount */
  netOfTransfers?: boolean;
}

/**
 * Royalty Fee Configuration (for NFTs)
 */
export interface RoyaltyFeeCondition {
  /** Whether royalty fees are enabled */
  enabled: boolean;
  /** Numerator for royalty calculation */
  numerator: number;
  /** Denominator for royalty calculation */
  denominator: number;
  /** Fallback fixed fee if no value exchanged */
  fallbackFee?: FixedFeeCondition;
  /** Account to receive royalties */
  feeCollectorAccountId: string;
}

/**
 * Complete Fee Conditions for a token
 */
export interface FeeConditions {
  fixed?: FixedFeeCondition[];
  fractional?: FractionalFeeCondition[];
  royalty?: RoyaltyFeeCondition[];
}

// =============================================================================
// Operation-Specific Configurations
// =============================================================================

/**
 * Base operation configuration
 */
export interface BaseOperationConfig {
  /** Whether this operation is enabled */
  enabled: boolean;
  /** Who controls this operation */
  controller?: OperationController;
  /** Whether DAO/multisig approval is required */
  requiresApproval?: boolean;
  /** Numerical limits for this operation */
  limits?: OperationLimits;
}

/**
 * Mint Operation Configuration
 *
 * Note: If limits are specified, minting is limited. If no limits,
 * minting is unlimited (up to maxSupply if set on token).
 */
export interface MintOperationConfig extends BaseOperationConfig {
  // Inherits enabled, controller, requiresApproval, limits from BaseOperationConfig
  // No additional fields needed - unlimitedMinting was redundant
}

/**
 * Burn Operation Configuration
 */
export interface BurnOperationConfig extends BaseOperationConfig {
  /** Whether any holder can burn their own tokens */
  allowHolderBurn?: boolean;
}

/**
 * Transfer Operation Configuration
 */
export interface TransferOperationConfig extends BaseOperationConfig {
  /** Whether blacklisting is enabled */
  blacklistEnabled?: boolean;
  /** Whether KYC is required for transfers */
  requiresKyc?: boolean;
  /** Whitelisted accounts (if empty, all allowed) */
  whitelist?: string[];
  /** Blacklisted accounts */
  blacklist?: string[];
}

/**
 * Freeze Operation Configuration
 */
export interface FreezeOperationConfig extends BaseOperationConfig {
  /** Whether multisig is required for freeze */
  requiresMultisig?: boolean;
}

/**
 * Pause Operation Configuration
 */
export interface PauseOperationConfig extends BaseOperationConfig {
  /** Whether this is emergency-only */
  emergencyOnly?: boolean;
}

/**
 * Update Operation Configuration
 * Controls what fields can be updated on an entity
 */
export interface UpdateOperationConfig extends BaseOperationConfig {
  /**
   * Fields that can be updated (empty = no fields allowed, undefined = all allowed)
   * Common values: "memo", "keys", "autoRenewPeriod", "expirationTime"
   * For tokens: "feeSchedule", "freezeDefault", "metadata"
   * For topics: "memo", "adminKey", "submitKey", "autoRenewPeriod"
   */
  allowedFields?: string[];
}

/**
 * Submit Operation Configuration (for Topics)
 * Controls message submission to HCS topics
 */
export interface SubmitOperationConfig extends BaseOperationConfig {
  /** Maximum message size in bytes (optional) */
  maxMessageSize?: number;
  /** Rate limit - max messages per time period */
  rateLimit?: {
    maxMessages: number;
    periodSeconds: number;
  };
}

/**
 * Token Operations Configuration - Complete token operation rules
 */
export interface TokenOperationsConfig {
  mint?: MintOperationConfig;
  burn?: BurnOperationConfig;
  transfer?: TransferOperationConfig;
  freeze?: FreezeOperationConfig;
  pause?: PauseOperationConfig;
  wipe?: BaseOperationConfig;
  update?: UpdateOperationConfig;
  associate?: BaseOperationConfig;
  dissociate?: BaseOperationConfig;
  grantKyc?: BaseOperationConfig;
  revokeKyc?: BaseOperationConfig;
}

/**
 * Account Operations Configuration
 */
export interface AccountOperationsConfig {
  transfer?: TransferOperationConfig;
  update?: UpdateOperationConfig;
  delete?: BaseOperationConfig;
  approveAllowance?: BaseOperationConfig;
  deleteAllowance?: BaseOperationConfig;
  stake?: BaseOperationConfig;
  unstake?: BaseOperationConfig;
}

/**
 * Topic Operations Configuration
 */
export interface TopicOperationsConfig {
  submit?: SubmitOperationConfig;
  update?: UpdateOperationConfig;
  delete?: BaseOperationConfig;
}

// =============================================================================
// Governance Configuration
// =============================================================================

/**
 * Governance Configuration
 */
export interface GovernanceConfig {
  /** DAO token ID for voting */
  daoTokenId?: string;
  /** Minimum tokens required to propose */
  proposalThreshold?: string;
  /** Minimum tokens required to vote */
  votingThreshold?: string;
  /** Voting period in seconds */
  votingPeriodSeconds?: number;
  /** Execution delay after vote passes (timelock) */
  timelockSeconds?: number;
  /** Quorum percentage (0-100) */
  quorumPercentage?: number;
}

// =============================================================================
// Token Gating
// =============================================================================

/**
 * Time Range for Token Gating
 * Used both globally and per-token
 */
export interface TimeRange {
  /** Start time - Unix timestamp (0 = no start restriction) or ISO 8601 string */
  start: number | string;
  /** End time - Unix timestamp (0 = no end restriction) or ISO 8601 string */
  end: number | string;
}

/**
 * Token Gate Configuration for Fungible Tokens
 */
export interface FungibleTokenGate {
  /** Token ID */
  tokenId: string;
  /** Minimum balance required (as string for precision) */
  minBalance: string;
  /** Per-token time range restriction (optional, overrides global) */
  timeRange?: TimeRange;
}

/**
 * Token Gate Configuration for Non-Fungible Tokens
 */
export interface NonFungibleTokenGate {
  /** Token ID */
  tokenId: string;
  /** Specific serial numbers required (empty = any serial) */
  serialNumbers?: string[];
  /** Per-token time range restriction (optional, overrides global) */
  timeRange?: TimeRange;
}

/**
 * Token Gate Configuration
 * Defines token ownership requirements for operations
 */
export interface TokenGateConditions {
  fungibles: {
    tokens: FungibleTokenGate[];
  };
  nonFungibles: {
    tokens: NonFungibleTokenGate[];
  };
  timeRange: TimeRange | null;
}

// =============================================================================
// Swap & Custom Interface
// =============================================================================

/**
 * Swap Price Configuration
 */
export interface SwapPrice {
  /** Token ID */
  tokenId: string;
  /** Exchange rate */
  rate: string;
}

/**
 * Swap Conditions
 * Defines rules for token swap operations
 */
export interface SwapConditions {
  prices: SwapPrice[];
}

/**
 * Property types for custom interface schema validation
 * Matches V2 compatibility: "string", "number", "boolean", "array", "object"
 */
export type PropertyType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/**
 * Schema property definition - can be a type string or nested object
 * Examples:
 *   "title": "string"
 *   "votes": "number"
 *   "options": "array"
 *   "socials": { "discord": "string", "twitter": "string" }
 */
export type SchemaProperty = PropertyType | { [key: string]: SchemaProperty };

/**
 * Custom Interface Definition
 * Allows for custom validation rules and message schema enforcement
 *
 * Used for DAO proposals, metadata, and other structured HCS messages.
 * The schema is validated when messages are submitted to the topic.
 *
 * @example
 * ```json
 * {
 *   "interfaceName": "Proposal",
 *   "properties": {
 *     "title": "string",
 *     "description": "string",
 *     "options": "array",
 *     "votes": "number",
 *     "snapshot": "object",
 *     "socials": {
 *       "discord": "string",
 *       "twitter": "string"
 *     }
 *   }
 * }
 * ```
 */
export interface CustomInterface {
  /** Interface name/identifier (e.g., "Proposal", "daoMetadata", "dao") */
  interfaceName: string;
  /** Schema definition with typed properties */
  properties?: Record<string, SchemaProperty>;
}

// =============================================================================
// Validator Metadata
// =============================================================================

/**
 * Validator Metadata
 * Additional information about a validator for versioning and discovery
 */
export interface ValidatorMetadata {
  /** Semantic version (e.g., "1.0.0") */
  version: string;

  /** Previous validator version (consensus timestamp) for upgrade chains */
  previousVersion?: string;

  /** When this validator was deprecated (if applicable) */
  deprecatedAt?: string;

  /** Auto-expiration date (ISO 8601) */
  expiresAt?: string;

  /** Human-readable description */
  description?: string;

  /** Creator account ID */
  author?: string;

  /** Searchable tags */
  tags?: string[];

  /** External documentation URL */
  documentationUrl?: string;
}

// =============================================================================
// VALIDATOR RULES - Main Interfaces
// =============================================================================

/**
 * Validator entity types
 */
export type ValidatorEntityType = 'token' | 'account' | 'topic';

/**
 * Token Validator Rules
 *
 * Complete validation rules for token entities on Hedera.
 *
 * Design principles:
 * - Use defaults to reduce redundancy (defaultSecurity, defaultController)
 * - Only specify overrides where needed
 * - Empty {} in keys/operations means "use defaults"
 */
export interface TokenValidatorRules {
  /** Schema version - always "3.0" */
  version: '3.0';

  /** Entity type - always "token" */
  type: 'token';

  /** Creation timestamp (ISO 8601) */
  created: string;

  /** Default security level for all keys (unless overridden per-key) */
  defaultSecurity?: SmartNodeSecurity;

  /** Default controller for all operations (unless overridden per-operation) */
  defaultController?: OperationController;

  /** Operation-specific configurations with limits */
  operations: TokenOperationsConfig;

  /** Granular key configurations */
  keys?: TokenKeyConditions;

  /** Fee configurations */
  fees?: FeeConditions;

  /** Token gating requirements */
  tokenGates?: TokenGateConditions;

  /** Time range restrictions */
  timeRange?: TimeRange | null;

  /** Governance configuration for DAO-controlled tokens */
  governance?: GovernanceConfig;

  /** Swap conditions for DEX integration */
  swapConditions?: SwapConditions;

  /** Custom interface for extensibility */
  customInterface?: CustomInterface;

  /** Metadata for versioning and discovery */
  metadata?: ValidatorMetadata;
}

/**
 * Account Validator Rules
 *
 * Complete validation rules for account entities on Hedera.
 */
export interface AccountValidatorRules {
  /** Schema version - always "3.0" */
  version: '3.0';

  /** Entity type - always "account" */
  type: 'account';

  /** Creation timestamp (ISO 8601) */
  created: string;

  /** Default security level for all keys (unless overridden per-key) */
  defaultSecurity?: SmartNodeSecurity;

  /** Default controller for all operations (unless overridden per-operation) */
  defaultController?: OperationController;

  /** Operation-specific configurations with limits */
  operations: AccountOperationsConfig;

  /** Granular key configurations */
  keys?: AccountKeyConditions;

  /** Token gating requirements */
  tokenGates?: TokenGateConditions;

  /** Time range restrictions */
  timeRange?: TimeRange | null;

  /** Governance configuration for DAO-controlled accounts */
  governance?: GovernanceConfig;

  /** Swap conditions for escrow accounts */
  swapConditions?: SwapConditions;

  /** Metadata for versioning and discovery */
  metadata?: ValidatorMetadata;
}

/**
 * Topic Validator Rules
 *
 * Complete validation rules for consensus topic entities on Hedera.
 */
export interface TopicValidatorRules {
  /** Schema version - always "3.0" */
  version: '3.0';

  /** Entity type - always "topic" */
  type: 'topic';

  /** Creation timestamp (ISO 8601) */
  created: string;

  /** Default security level for all keys (unless overridden per-key) */
  defaultSecurity?: SmartNodeSecurity;

  /** Default controller for all operations (unless overridden per-operation) */
  defaultController?: OperationController;

  /** Operation-specific configurations */
  operations: TopicOperationsConfig;

  /** Granular key configurations */
  keys?: TopicKeyConditions;

  /** Token gating requirements for submit access */
  tokenGates?: TokenGateConditions;

  /** Time range restrictions */
  timeRange?: TimeRange | null;

  /** Governance configuration for DAO-controlled topics */
  governance?: GovernanceConfig;

  /** Custom interface for extensibility */
  customInterface?: CustomInterface;

  /** Metadata for versioning and discovery */
  metadata?: ValidatorMetadata;
}

/**
 * Union type for all validator rules
 */
export type ValidatorRules = TokenValidatorRules | AccountValidatorRules | TopicValidatorRules;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if rules are valid validator format
 */
export function isValidatorRules(rules: unknown): rules is ValidatorRules {
  return (
    typeof rules === 'object' &&
    rules !== null &&
    'version' in rules &&
    (rules as ValidatorRules).version === '3.0'
  );
}

/**
 * Type guard for Token Validator Rules
 */
export function isTokenValidatorRules(rules: unknown): rules is TokenValidatorRules {
  return isValidatorRules(rules) && (rules as ValidatorRules).type === 'token';
}

/**
 * Type guard for Account Validator Rules
 */
export function isAccountValidatorRules(rules: unknown): rules is AccountValidatorRules {
  return isValidatorRules(rules) && (rules as ValidatorRules).type === 'account';
}

/**
 * Type guard for Topic Validator Rules
 */
export function isTopicValidatorRules(rules: unknown): rules is TopicValidatorRules {
  return isValidatorRules(rules) && (rules as ValidatorRules).type === 'topic';
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Creates a base operation config with common defaults
 */
export function createOperationConfig(
  enabled: boolean,
  options?: Partial<BaseOperationConfig>
): BaseOperationConfig {
  return {
    enabled,
    ...options,
  };
}

/**
 * Creates a key condition with defaults
 */
export function createKeyCondition(
  enabled: boolean,
  security: SmartNodeSecurity = 'none',
  controller: OperationController = 'owner'
): KeyCondition {
  return {
    enabled,
    security,
    controller,
  };
}

// =============================================================================
// Response Types
// =============================================================================

/**
 * Validator route type (used in API endpoints)
 * Maps to validator types: consensus->topic, tokens->token, accounts->account
 */
export type ValidatorRouteType = 'consensus' | 'tokens' | 'accounts';

/**
 * Validator Response
 * Returned when creating a validator
 */
export interface ValidatorResponse {
  /** Consensus timestamp of the HCS message */
  consensusTimestamp: string;
  /** API route type where the validator was created */
  type: ValidatorRouteType;
  /** Topic ID where the validator was stored */
  topicId: string;
  /** Message describing the result */
  message: string;
}

/**
 * Validator Read Response
 * Returned when reading a validator
 */
export interface ValidatorReadResponse {
  /** Consensus timestamp */
  consensusTimestamp: string;
  /** API route type for the validator */
  type: ValidatorRouteType;
  /** Validation rules */
  validatorRules: ValidatorRules;
}

// =============================================================================
// Smart Agent Types
// =============================================================================

/** Smart Agent operation types */
export type AgentOperationType =
  | 'register'
  | 'fund'
  | 'trade'
  | 'withdraw'
  | 'pause'
  | 'resume'
  | 'revoke'
  | 'modify_rules'
  | 'approve'
  | 'reject';

/** Agent status lifecycle states */
export type AgentStatusType =
  | 'pending'
  | 'active'
  | 'paused'
  | 'stopped'
  | 'awaiting_approval'
  | 'revoked';

/** Agent type classification */
export type AgentType = 'trading' | 'monitoring' | 'analytics' | 'custom';
