import { z } from 'zod';
import { ChainTypeSchema } from './chain.schema';
import { AccountIdSchema } from './account.schema';
import { TokenCapabilitiesSchema } from './capabilities.schema';

/**
 * Create account request schema
 *
 * @important validatorTimestamp is REQUIRED - all entities must be bound to a validator.
 * The validator rules are stored on HCS and referenced by consensus timestamp.
 */
export const CreateAccountRequestSchema = z.object({
  chain: ChainTypeSchema,
  initialBalance: z.string(),
  publicKey: z.string().optional(),
  memo: z.string().optional(),
  /**
   * HCS consensus timestamp of the validator rules (REQUIRED).
   * Format: "1766490325.123456789"
   */
  validatorTimestamp: z.string().min(1, 'validatorTimestamp is required'),
  /**
   * HCS topic ID where validator rules are stored (REQUIRED).
   */
  validatorTopicId: z.string().min(1, 'validatorTopicId is required'),
  /**
   * Whether to remove admin key after creation (makes entity immutable).
   * Default: true for production-grade immutability.
   */
  immutable: z.boolean().default(true),
  /**
   * Smart node security mode for the account key structure.
   * - 'none': Owner-only key (no validator involvement)
   * - 'partial': threshold(2, [appOwnerKey, tssKeyList]) — co-control
   * - 'full': TSS KeyList only — full validator network control
   * Default: 'none' for basic account creation via SDK.
   */
  securityMode: z.enum(['none', 'partial', 'full']).default('none'),
  /**
   * App owner's public key (required for 'partial' security mode).
   * The owner key + TSS network key form a threshold-2 multi-sig.
   */
  appOwnerPublicKey: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateAccountRequest = z.infer<typeof CreateAccountRequestSchema>;

/**
 * Create account response schema
 */
export const CreateAccountResponseSchema = z.object({
  accountId: AccountIdSchema,
  publicKey: z.string().optional(),
  privateKey: z.string().optional(), // Only returned on creation, store securely!
  transactionId: z.string(),
  chain: ChainTypeSchema,
  timestamp: z.date().optional(),
});

export type CreateAccountResponse = z.infer<typeof CreateAccountResponseSchema>;

/**
 * Transfer request schema
 */
export const TransferRequestSchema = z.object({
  chain: ChainTypeSchema,
  from: AccountIdSchema,
  to: AccountIdSchema,
  amount: z.string(),
  tokenId: z.string().optional(), // undefined = native token
  memo: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type TransferRequest = z.infer<typeof TransferRequestSchema>;

/**
 * Transfer response schema
 */
export const TransferResponseSchema = z.object({
  transactionId: z.string(),
  status: z.enum(['pending', 'success', 'failed']),
  chain: ChainTypeSchema,
  fee: z.string().optional(),
  timestamp: z.date().optional(),
});

export type TransferResponse = z.infer<typeof TransferResponseSchema>;

/**
 * Query balance request schema
 */
export const QueryBalanceRequestSchema = z.object({
  chain: ChainTypeSchema,
  accountId: AccountIdSchema,
});

export type QueryBalanceRequest = z.infer<typeof QueryBalanceRequestSchema>;

/**
 * Query transaction request schema
 */
export const QueryTransactionRequestSchema = z.object({
  chain: ChainTypeSchema,
  transactionId: z.string(),
});

export type QueryTransactionRequest = z.infer<typeof QueryTransactionRequestSchema>;

/**
 * Create token request schema (v2 with capabilities)
 *
 * Supports universal token capabilities that are validated against chain support.
 * If a capability is requested but not supported on the target chain, an error is thrown.
 */
export const CreateTokenRequestSchema = z.object({
  chain: ChainTypeSchema,
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10),
  decimals: z.number().int().min(0).max(18),
  initialSupply: z.string(),
  type: z.enum(['fungible', 'nft']),
  treasury: AccountIdSchema.optional(),
  /**
   * Token capabilities define what operations the token supports.
   * These are validated against chain support and translated to native implementations.
   *
   * @example
   * ```typescript
   * capabilities: {
   *   pausable: true,      // Hedera: pauseKey, XRPL: GlobalFreeze
   *   restrictable: true,  // Hedera: freezeKey, XRPL: TrustLineFreeze
   *   compliant: true,     // Hedera: kycKey, XRPL: RequireAuth
   *   wipeable: true,      // Hedera: wipeKey, XRPL: Clawback
   *   mintable: true,      // Allow additional minting
   *   burnable: true,      // Allow burning
   * }
   * ```
   */
  capabilities: TokenCapabilitiesSchema.optional().default({
    pausable: false,
    restrictable: false,
    compliant: false,
    wipeable: false,
    mintable: true,
    burnable: true,
    transferable: true,
  }),
  /**
   * HCS consensus timestamp of the validator rules (REQUIRED).
   * Format: "1766490325.123456789"
   */
  validatorTimestamp: z.string().min(1, 'validatorTimestamp is required'),
  /**
   * HCS topic ID where validator rules are stored (REQUIRED).
   */
  validatorTopicId: z.string().min(1, 'validatorTopicId is required'),
  /**
   * Whether to remove admin key after creation (makes entity immutable).
   * Default: true for production-grade immutability.
   */
  immutable: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

export type CreateTokenRequest = z.infer<typeof CreateTokenRequestSchema>;

/**
 * Create token response schema
 */
export const CreateTokenResponseSchema = z.object({
  tokenId: z.string(),
  transactionId: z.string(),
  chain: ChainTypeSchema,
  timestamp: z.date().optional(),
});

export type CreateTokenResponse = z.infer<typeof CreateTokenResponseSchema>;

/**
 * Mint token request schema
 */
/**
 * Mint token request schema
 *
 * Supports both fungible and non-fungible token minting:
 * - Fungible: requires `amount` (e.g. "1000")
 * - NFT: requires `nftMetadata` (array of byte-encodable entries, one per NFT to mint)
 *
 * The chain adapter determines the appropriate native operation based on the token type.
 */
export const MintTokenRequestSchema = z.object({
  chain: ChainTypeSchema,
  tokenId: z.string(),

  /** Amount to mint (fungible tokens). Ignored for NFTs. */
  amount: z.string().optional(),

  /** Recipient account (fungible: transfer after mint; NFT: Hedera mints to treasury). */
  recipient: AccountIdSchema.optional(),

  /**
   * NFT metadata entries — one per NFT to mint.
   * Each entry becomes on-chain metadata (e.g. IPFS CID, encoded memo).
   * On Hedera: passed to TokenMintTransaction.setMetadata().
   * On XRPL: used as URI in NFTokenMint.
   */
  nftMetadata: z.array(z.string()).optional(),

  /** Additional chain-specific options. */
  metadata: z.record(z.any()).optional(),
});

export type MintTokenRequest = z.infer<typeof MintTokenRequestSchema>;

/**
 * Burn token request schema
 */
export const BurnTokenRequestSchema = z.object({
  chain: ChainTypeSchema,
  tokenId: z.string(),
  amount: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type BurnTokenRequest = z.infer<typeof BurnTokenRequestSchema>;

/**
 * Token action request schema (for pause, restrict, etc.)
 */
export const TokenActionRequestSchema = z.object({
  chain: ChainTypeSchema,
  tokenId: z.string(),
  accountId: AccountIdSchema.optional(), // Required for account-specific actions
  amount: z.string().optional(), // Required for wipe action
  metadata: z.record(z.any()).optional(),
});

export type TokenActionRequest = z.infer<typeof TokenActionRequestSchema>;

/**
 * Action result schema - unified response for all token actions
 */
export const ActionResultSchema = z.object({
  success: z.boolean(),
  transactionId: z.string(),
  chain: ChainTypeSchema,
  /** The native chain operation that was executed */
  chainOperation: z.string(),
  /** Additional context or notes about the operation */
  notes: z.array(z.string()).optional(),
  /** Timestamp of the operation */
  timestamp: z.date().optional(),
});

export type ActionResult = z.infer<typeof ActionResultSchema>;

/**
 * Create token result schema - extends ActionResult with token info
 */
export const CreateTokenResultSchema = ActionResultSchema.extend({
  tokenId: z.string(),
  /** The capabilities that were enabled for this token */
  enabledCapabilities: z.array(z.string()),
});

export type CreateTokenResult = z.infer<typeof CreateTokenResultSchema>;

// =============================================================================
// PREPARED TRANSACTION RESPONSE TYPES (v3 API - Transaction Sovereignty)
// =============================================================================

/**
 * Validator signature for a prepared transaction
 */
export const ValidatorSignatureSchema = z.object({
  /** Validator's node ID */
  validatorId: z.string(),
  /** Validator's public key (hex-encoded) */
  publicKey: z.string(),
  /** Signature over the transaction bytes (hex-encoded) */
  signature: z.string(),
  /** When this signature was created */
  signedAt: z.date(),
  /** Signature algorithm used */
  algorithm: z.enum(['ed25519', 'ecdsa-secp256k1', 'bls12-381']).optional(),
});

export type ValidatorSignature = z.infer<typeof ValidatorSignatureSchema>;

/**
 * Hedera-specific metadata for prepared transactions
 */
export const HederaPreparedMetadataSchema = z.object({
  /** Hedera node account IDs that will process this transaction */
  nodeAccountIds: z.array(z.string()).optional(),
  /** Maximum transaction fee in tinybars */
  maxTransactionFee: z.string().optional(),
  /** Transaction memo */
  memo: z.string().optional(),
  /** Schedule info if this is a scheduled transaction */
  scheduleInfo: z
    .object({
      scheduleId: z.string(),
      adminKey: z.string().optional(),
    })
    .optional(),
});

export type HederaPreparedMetadata = z.infer<typeof HederaPreparedMetadataSchema>;

/**
 * XRPL-specific metadata for prepared transactions
 */
export const XRPLPreparedMetadataSchema = z.object({
  /** Sequence number for this transaction */
  sequence: z.number().optional(),
  /** Last ledger sequence for expiration */
  lastLedgerSequence: z.number().optional(),
  /** Signer list info for multi-sig */
  signerList: z
    .array(
      z.object({
        account: z.string(),
        signerWeight: z.number(),
      })
    )
    .optional(),
  /** Quorum weight required */
  signerQuorum: z.number().optional(),
});

export type XRPLPreparedMetadata = z.infer<typeof XRPLPreparedMetadataSchema>;

/**
 * Solana-specific metadata for prepared transactions
 */
export const SolanaPreparedMetadataSchema = z.object({
  /** Recent blockhash for transaction validity */
  recentBlockhash: z.string().optional(),
  /** Fee payer account */
  feePayer: z.string().optional(),
  /** Program IDs involved */
  programIds: z.array(z.string()).optional(),
});

export type SolanaPreparedMetadata = z.infer<typeof SolanaPreparedMetadataSchema>;

/**
 * Polkadot-specific metadata for prepared transactions
 */
export const PolkadotPreparedMetadataSchema = z.object({
  /** Era for transaction mortality */
  era: z.string().optional(),
  /** Nonce for the sender */
  nonce: z.number().optional(),
  /** Tip for priority */
  tip: z.string().optional(),
  /** Spec version for runtime */
  specVersion: z.number().optional(),
});

export type PolkadotPreparedMetadata = z.infer<typeof PolkadotPreparedMetadataSchema>;

/**
 * Union of all chain-specific metadata types
 */
export const ChainPreparedMetadataSchema = z.union([
  HederaPreparedMetadataSchema,
  XRPLPreparedMetadataSchema,
  SolanaPreparedMetadataSchema,
  PolkadotPreparedMetadataSchema,
  z.record(z.any()), // Allow extension for future chains
]);

export type ChainPreparedMetadata = z.infer<typeof ChainPreparedMetadataSchema>;

/**
 * Prepared transaction response - the core type for v3 API
 *
 * IMPORTANT: This is the unified response type for all transaction operations.
 * The transaction is frozen/prepared but NOT submitted. The caller is responsible
 * for submitting the transaction to the network.
 *
 * SECURITY PRINCIPLES:
 * 1. Validators NEVER pay fees - caller provides payerAccountId
 * 2. Validators NEVER submit transactions - they return signed bytes
 * 3. All operations use multi-sig - no single-key fallbacks
 * 4. Transaction ID is pre-assigned for deterministic tracking
 */
export const PreparedTransactionResponseSchema = z.object({
  /** The blockchain this transaction is for */
  chain: ChainTypeSchema,
  /** Type of transaction (e.g., 'TokenCreate', 'Payment', 'NFTMint') */
  transactionType: z.string(),
  /** Pre-assigned transaction ID for tracking */
  transactionId: z.string(),
  /** Base64-encoded frozen transaction bytes ready for submission */
  transactionBytes: z.string(),
  /** When this prepared transaction expires */
  expiresAt: z.date(),
  /** Validator signatures collected for this transaction */
  validatorSignatures: z.array(ValidatorSignatureSchema),
  /** Required payer account ID (caller must fund this account) */
  payerAccountId: z.string().optional(),
  /** Estimated network fee */
  estimatedFee: z.string().optional(),
  /** Number of signatures required for submission */
  requiredSignatures: z.number().optional(),
  /** Whether the transaction has enough signatures to submit */
  readyToSubmit: z.boolean().default(false),
  /** Chain-specific metadata */
  metadata: ChainPreparedMetadataSchema.optional(),
});

export type PreparedTransactionResponse = z.infer<typeof PreparedTransactionResponseSchema>;

/**
 * Generic prepared transaction response with typed metadata
 */
export type PreparedTransactionResponseWithMetadata<T extends ChainPreparedMetadata> = Omit<
  PreparedTransactionResponse,
  'metadata'
> & {
  metadata?: T;
};

/**
 * Type-safe prepared transaction responses for each chain
 */
export type HederaPreparedTransaction =
  PreparedTransactionResponseWithMetadata<HederaPreparedMetadata>;
export type XRPLPreparedTransaction = PreparedTransactionResponseWithMetadata<XRPLPreparedMetadata>;
export type SolanaPreparedTransaction =
  PreparedTransactionResponseWithMetadata<SolanaPreparedMetadata>;
export type PolkadotPreparedTransaction =
  PreparedTransactionResponseWithMetadata<PolkadotPreparedMetadata>;

/**
 * Submission result after caller submits the prepared transaction
 */
export const TransactionSubmissionResultSchema = z.object({
  /** The original transaction ID */
  transactionId: z.string(),
  /** The blockchain */
  chain: ChainTypeSchema,
  /** Whether submission was successful */
  success: z.boolean(),
  /** Consensus timestamp (Hedera) or ledger/block info */
  consensusTimestamp: z.string().optional(),
  /** Block or ledger number */
  blockNumber: z.number().optional(),
  /** Actual fee paid */
  actualFee: z.string().optional(),
  /** Receipt or confirmation data */
  receipt: z.record(z.any()).optional(),
  /** Error message if submission failed */
  error: z.string().optional(),
});

export type TransactionSubmissionResult = z.infer<typeof TransactionSubmissionResultSchema>;
