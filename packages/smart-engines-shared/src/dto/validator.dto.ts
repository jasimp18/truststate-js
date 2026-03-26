/**
 * Validator DTOs and Zod Schemas
 *
 * Validation schemas for the new validator rules format (v3.0)
 * All schemas use .strict() to prevent prototype pollution attacks
 */
import { z } from 'zod';

// =============================================================================
// Base Schemas
// =============================================================================

/**
 * Smart Node Security Schema
 */
export const SmartNodeSecuritySchema = z.enum(['none', 'partial', 'full']);

/**
 * Operation Controller Schema
 * - owner: Owner has direct control
 * - dao: Requires DAO proposal approval via HCS
 */
export const OperationControllerSchema = z.enum(['owner', 'dao']);

// =============================================================================
// Operation Limits Schema
// =============================================================================

/**
 * Operation Limits Schema - numerical constraints for operations
 */
export const OperationLimitsSchema = z
  .object({
    maxPerTransaction: z.string().optional(),
    dailyLimit: z.string().optional(),
    weeklyLimit: z.string().optional(),
    monthlyLimit: z.string().optional(),
    totalLimit: z.string().optional(),
    cooldownSeconds: z.number().int().min(0).optional(),
    minPerTransaction: z.string().optional(),
  })
  .strict();

// =============================================================================
// Operation Config Schemas
// =============================================================================

/**
 * Base Operation Config Schema
 */
export const BaseOperationConfigSchema = z
  .object({
    enabled: z.boolean(),
    controller: OperationControllerSchema.optional(),
    requiresApproval: z.boolean().optional(),
    limits: OperationLimitsSchema.optional(),
  })
  .strict();

/**
 * Mint Operation Config Schema
 */
export const MintOperationConfigSchema = BaseOperationConfigSchema.extend({}).strict();

/**
 * Update Operation Config Schema
 * Controls what fields can be updated on an entity
 */
export const UpdateOperationConfigSchema = BaseOperationConfigSchema.extend({
  allowedFields: z.array(z.string()).optional(),
}).strict();

/**
 * Submit Operation Config Schema (for Topics)
 * Controls message submission to HCS topics
 */
export const SubmitOperationConfigSchema = BaseOperationConfigSchema.extend({
  maxMessageSize: z.number().int().min(0).optional(),
  rateLimit: z
    .object({
      maxMessages: z.number().int().min(1),
      periodSeconds: z.number().int().min(1),
    })
    .strict()
    .optional(),
}).strict();

/**
 * Burn Operation Config Schema
 */
export const BurnOperationConfigSchema = BaseOperationConfigSchema.extend({
  allowHolderBurn: z.boolean().optional(),
}).strict();

/**
 * Transfer Operation Config Schema
 */
export const TransferOperationConfigSchema = BaseOperationConfigSchema.extend({
  blacklistEnabled: z.boolean().optional(),
  requiresKyc: z.boolean().optional(),
  whitelist: z.array(z.string()).optional(),
  blacklist: z.array(z.string()).optional(),
}).strict();

/**
 * Freeze Operation Config Schema
 */
export const FreezeOperationConfigSchema = BaseOperationConfigSchema.extend({
  requiresMultisig: z.boolean().optional(),
}).strict();

/**
 * Pause Operation Config Schema
 */
export const PauseOperationConfigSchema = BaseOperationConfigSchema.extend({
  emergencyOnly: z.boolean().optional(),
}).strict();

/**
 * Token Operations Config Schema
 */
export const TokenOperationsConfigSchema = z
  .object({
    mint: MintOperationConfigSchema.optional(),
    burn: BurnOperationConfigSchema.optional(),
    transfer: TransferOperationConfigSchema.optional(),
    freeze: FreezeOperationConfigSchema.optional(),
    pause: PauseOperationConfigSchema.optional(),
    wipe: BaseOperationConfigSchema.optional(),
    update: UpdateOperationConfigSchema.optional(),
    associate: BaseOperationConfigSchema.optional(),
    dissociate: BaseOperationConfigSchema.optional(),
    grantKyc: BaseOperationConfigSchema.optional(),
    revokeKyc: BaseOperationConfigSchema.optional(),
  })
  .strict();

/**
 * Account Operations Config Schema
 */
export const AccountOperationsConfigSchema = z
  .object({
    transfer: TransferOperationConfigSchema.optional(),
    update: UpdateOperationConfigSchema.optional(),
    delete: BaseOperationConfigSchema.optional(),
    approveAllowance: BaseOperationConfigSchema.optional(),
    deleteAllowance: BaseOperationConfigSchema.optional(),
    stake: BaseOperationConfigSchema.optional(),
    unstake: BaseOperationConfigSchema.optional(),
  })
  .strict();

/**
 * Topic Operations Config Schema
 */
export const TopicOperationsConfigSchema = z
  .object({
    submit: SubmitOperationConfigSchema.optional(),
    update: UpdateOperationConfigSchema.optional(),
    delete: BaseOperationConfigSchema.optional(),
  })
  .strict();

// =============================================================================
// Key Condition Schemas
// =============================================================================

/**
 * Key Condition Schema
 * All fields are optional - they inherit from defaults if not specified
 */
export const KeyConditionSchema = z
  .object({
    enabled: z.boolean().optional(),
    security: SmartNodeSecuritySchema.optional(),
    controller: OperationControllerSchema.optional(),
    requiresApproval: z.boolean().optional(),
    threshold: z.number().int().min(1).optional(),
  })
  .strict();

/**
 * Token Key Conditions Schema
 */
export const TokenKeyConditionsSchema = z
  .object({
    admin: KeyConditionSchema.optional(),
    supply: KeyConditionSchema.optional(),
    freeze: KeyConditionSchema.optional(),
    pause: KeyConditionSchema.optional(),
    wipe: KeyConditionSchema.optional(),
    kyc: KeyConditionSchema.optional(),
    feeSchedule: KeyConditionSchema.optional(),
  })
  .strict();

/**
 * Account Key Conditions Schema
 */
export const AccountKeyConditionsSchema = z
  .object({
    admin: KeyConditionSchema.optional(),
    signing: KeyConditionSchema.optional(),
  })
  .strict();

/**
 * Topic Key Conditions Schema
 */
export const TopicKeyConditionsSchema = z
  .object({
    admin: KeyConditionSchema.optional(),
    submit: KeyConditionSchema.optional(),
  })
  .strict();

// =============================================================================
// Fee Condition Schemas
// =============================================================================

/**
 * Fixed Fee Condition Schema
 */
export const FixedFeeConditionSchema = z
  .object({
    enabled: z.boolean(),
    amount: z.string(),
    feeTokenId: z.string().optional(),
    feeCollectorAccountId: z.string(),
    allCollectorsAreExempt: z.boolean().optional(),
  })
  .strict();

/**
 * Fractional Fee Condition Schema
 */
export const FractionalFeeConditionSchema = z
  .object({
    enabled: z.boolean(),
    numerator: z.number().int(),
    denominator: z.number().int().min(1),
    minimumAmount: z.string().optional(),
    maximumAmount: z.string().optional(),
    feeCollectorAccountId: z.string(),
    netOfTransfers: z.boolean().optional(),
  })
  .strict();

/**
 * Royalty Fee Condition Schema
 */
export const RoyaltyFeeConditionSchema = z
  .object({
    enabled: z.boolean(),
    numerator: z.number().int(),
    denominator: z.number().int().min(1),
    fallbackFee: FixedFeeConditionSchema.optional(),
    feeCollectorAccountId: z.string(),
  })
  .strict();

/**
 * Fee Conditions Schema
 */
export const FeeConditionsSchema = z
  .object({
    fixed: z.array(FixedFeeConditionSchema).optional(),
    fractional: z.array(FractionalFeeConditionSchema).optional(),
    royalty: z.array(RoyaltyFeeConditionSchema).optional(),
  })
  .strict();

// =============================================================================
// Token Gating Schemas
// =============================================================================

/**
 * Time Range Schema
 * Supports both Unix timestamps (numbers) and ISO 8601 strings
 * Value of 0 means no restriction (V2 compatibility)
 */
export const TimeRangeSchema = z
  .object({
    start: z.union([z.number(), z.string()]),
    end: z.union([z.number(), z.string()]),
  })
  .strict();

/**
 * Fungible Token Gate Schema
 */
export const FungibleTokenGateSchema = z
  .object({
    tokenId: z.string(),
    minBalance: z.string(),
    timeRange: TimeRangeSchema.optional(),
  })
  .strict();

/**
 * Non-Fungible Token Gate Schema
 */
export const NonFungibleTokenGateSchema = z
  .object({
    tokenId: z.string(),
    serialNumbers: z.array(z.string()).optional(),
    timeRange: TimeRangeSchema.optional(),
  })
  .strict();

/**
 * Token Gate Conditions Schema
 */
export const TokenGateConditionsSchema = z
  .object({
    fungibles: z.object({
      tokens: z.array(FungibleTokenGateSchema),
    }),
    nonFungibles: z.object({
      tokens: z.array(NonFungibleTokenGateSchema),
    }),
    timeRange: TimeRangeSchema.nullable(),
  })
  .strict();

// =============================================================================
// Governance & Swap Schemas
// =============================================================================

/**
 * Governance Config Schema
 */
export const GovernanceConfigSchema = z
  .object({
    daoTokenId: z.string().optional(),
    proposalThreshold: z.string().optional(),
    votingThreshold: z.string().optional(),
    votingPeriodSeconds: z.number().int().min(0).optional(),
    timelockSeconds: z.number().int().min(0).optional(),
    quorumPercentage: z.number().min(0).max(100).optional(),
  })
  .strict();

/**
 * Swap Price Schema
 */
export const SwapPriceSchema = z
  .object({
    tokenId: z.string(),
    rate: z.string(),
  })
  .strict();

/**
 * Swap Conditions Schema
 */
export const SwapConditionsSchema = z
  .object({
    prices: z.array(SwapPriceSchema),
  })
  .strict();

/**
 * Custom Interface Schema
 */
export const CustomInterfaceSchema = z
  .object({
    interfaceName: z.string(),
    properties: z.record(z.unknown()).optional(),
  })
  .strict();

// =============================================================================
// Metadata Schema
// =============================================================================

/**
 * Validator Metadata Schema
 */
export const ValidatorMetadataSchema = z
  .object({
    version: z.string(),
    previousVersion: z.string().optional(),
    deprecatedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    description: z.string().max(500).optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    documentationUrl: z.string().url().optional(),
  })
  .strict();

// =============================================================================
// Main Validator Rules Schemas
// =============================================================================

/**
 * Token Validator Rules Schema
 *
 * SECURITY:
 * - version and type are required literals
 * - Either smartNodeSecurity (deprecated) or defaultSecurity must be provided
 * - operations is REQUIRED
 * - .strict() prevents prototype pollution
 */
/**
 * Module Entry Schema
 *
 * Defines a single rule module (organism) embedded in validator rules.
 * The `config` field is loosely typed here (Record<string, unknown>) because
 * the actual schema validation happens at the rules-engine level when the
 * module is instantiated. This separation allows the HCS schema to remain
 * stable while modules define their own strict schemas.
 *
 * SECURITY:
 * - Module type must be lowercase alphanumeric (prevents injection)
 * - Version must be semver (prevents version confusion attacks)
 * - Config is validated by the ModuleRegistry at runtime (fail-closed)
 * - Max 10 modules per validator (prevents resource exhaustion)
 */
export const ModuleEntrySchema = z.object({
  /** Module type identifier — must match a registered module in the validator */
  type: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9-]*$/, 'Module type must be lowercase alphanumeric with hyphens'),
  /** Schema version — must match registered module version */
  version: z
    .string()
    .min(1)
    .max(20)
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (e.g., 1.0.0)'),
  /** Module-specific configuration — validated by module's own Zod schema at runtime */
  config: z.record(z.unknown()),
});

export type ModuleEntry = z.infer<typeof ModuleEntrySchema>;

export const TokenValidatorRulesSchema = z
  .object({
    version: z.literal('3.0'),
    type: z.literal('token'),
    created: z.string(),
    smartNodeSecurity: SmartNodeSecuritySchema.optional(), // Deprecated, use defaultSecurity
    defaultSecurity: SmartNodeSecuritySchema.optional(), // New preferred field
    defaultController: OperationControllerSchema.optional(),
    operations: TokenOperationsConfigSchema,
    keys: TokenKeyConditionsSchema.optional(),
    fees: FeeConditionsSchema.optional(),
    tokenGates: TokenGateConditionsSchema.optional(),
    timeRange: TimeRangeSchema.nullable().optional(),
    governance: GovernanceConfigSchema.optional(),
    swapConditions: SwapConditionsSchema.optional(),
    customInterface: CustomInterfaceSchema.optional(),
    metadata: ValidatorMetadataSchema.optional(),

    /**
     * Rule modules — extensible organism-based rule evaluation.
     *
     * Each module references a registered organism type (launchpad, dex, dao, etc.)
     * and provides its configuration. Validators instantiate the organism and evaluate
     * it against every transaction before co-signing.
     *
     * SECURITY: Validators MUST reject rules containing unknown module types (fail-closed).
     * Module configs are validated against registered Zod schemas at runtime.
     */
    modules: z.array(ModuleEntrySchema).max(10).optional(),
  })
  .strict()
  .refine((data) => data.smartNodeSecurity || data.defaultSecurity, {
    message: 'Either smartNodeSecurity or defaultSecurity must be provided',
  });

/**
 * Account Validator Rules Schema
 */
export const AccountValidatorRulesSchema = z
  .object({
    version: z.literal('3.0'),
    type: z.literal('account'),
    created: z.string(),
    smartNodeSecurity: SmartNodeSecuritySchema.optional(), // Deprecated
    defaultSecurity: SmartNodeSecuritySchema.optional(),
    defaultController: OperationControllerSchema.optional(),
    operations: AccountOperationsConfigSchema,
    keys: AccountKeyConditionsSchema.optional(),
    tokenGates: TokenGateConditionsSchema.optional(),
    timeRange: TimeRangeSchema.nullable().optional(),
    governance: GovernanceConfigSchema.optional(),
    swapConditions: SwapConditionsSchema.optional(),
    metadata: ValidatorMetadataSchema.optional(),
    modules: z.array(ModuleEntrySchema).max(10).optional(),
  })
  .strict()
  .refine((data) => data.smartNodeSecurity || data.defaultSecurity, {
    message: 'Either smartNodeSecurity or defaultSecurity must be provided',
  });

/**
 * Topic Validator Rules Schema
 */
export const TopicValidatorRulesSchema = z
  .object({
    version: z.literal('3.0'),
    type: z.literal('topic'),
    created: z.string(),
    smartNodeSecurity: SmartNodeSecuritySchema.optional(), // Deprecated
    defaultSecurity: SmartNodeSecuritySchema.optional(),
    defaultController: OperationControllerSchema.optional(),
    operations: TopicOperationsConfigSchema,
    keys: TopicKeyConditionsSchema.optional(),
    tokenGates: TokenGateConditionsSchema.optional(),
    timeRange: TimeRangeSchema.nullable().optional(),
    governance: GovernanceConfigSchema.optional(),
    customInterface: CustomInterfaceSchema.optional(),
    metadata: ValidatorMetadataSchema.optional(),
    modules: z.array(ModuleEntrySchema).max(10).optional(),
  })
  .strict()
  .refine((data) => data.smartNodeSecurity || data.defaultSecurity, {
    message: 'Either smartNodeSecurity or defaultSecurity must be provided',
  });

/**
 * Union schema for any validator rules
 */
export const ValidatorRulesSchema = z.union([
  TokenValidatorRulesSchema,
  AccountValidatorRulesSchema,
  TopicValidatorRulesSchema,
]);

// =============================================================================
// TypeScript Types (inferred from Zod schemas)
// =============================================================================

export type SmartNodeSecurityDto = z.infer<typeof SmartNodeSecuritySchema>;
export type OperationControllerDto = z.infer<typeof OperationControllerSchema>;
export type OperationLimitsDto = z.infer<typeof OperationLimitsSchema>;
export type BaseOperationConfigDto = z.infer<typeof BaseOperationConfigSchema>;
export type UpdateOperationConfigDto = z.infer<typeof UpdateOperationConfigSchema>;
export type SubmitOperationConfigDto = z.infer<typeof SubmitOperationConfigSchema>;
export type TokenOperationsConfigDto = z.infer<typeof TokenOperationsConfigSchema>;
export type AccountOperationsConfigDto = z.infer<typeof AccountOperationsConfigSchema>;
export type TopicOperationsConfigDto = z.infer<typeof TopicOperationsConfigSchema>;
export type KeyConditionDto = z.infer<typeof KeyConditionSchema>;
export type TokenKeyConditionsDto = z.infer<typeof TokenKeyConditionsSchema>;
export type FeeConditionsDto = z.infer<typeof FeeConditionsSchema>;
export type TimeRangeDto = z.infer<typeof TimeRangeSchema>;
export type FungibleTokenGateDto = z.infer<typeof FungibleTokenGateSchema>;
export type NonFungibleTokenGateDto = z.infer<typeof NonFungibleTokenGateSchema>;
export type TokenGateConditionsDto = z.infer<typeof TokenGateConditionsSchema>;
export type GovernanceConfigDto = z.infer<typeof GovernanceConfigSchema>;
export type CustomInterfaceDto = z.infer<typeof CustomInterfaceSchema>;
export type ValidatorMetadataDto = z.infer<typeof ValidatorMetadataSchema>;
export type TokenValidatorRulesDto = z.infer<typeof TokenValidatorRulesSchema>;
export type AccountValidatorRulesDto = z.infer<typeof AccountValidatorRulesSchema>;
export type TopicValidatorRulesDto = z.infer<typeof TopicValidatorRulesSchema>;
export type ValidatorRulesDto = z.infer<typeof ValidatorRulesSchema>;
