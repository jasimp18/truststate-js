/**
 * @hsuite/smart-engines-sdk
 *
 * Simplified, type-safe client SDK for Smart Engines multi-chain infrastructure.
 *
 * This is the PUBLIC SDK for smart-app developers.
 * For validator-internal operations (TSS, Genesis, Membership), use @hsuite/smart-engines-validator-sdk.
 *
 * Features:
 * - Direct validator connection
 * - Auto-discovery via HCS registry
 * - Web3-style authentication
 * - Multi-chain support (Hedera, XRPL, Solana, Polkadot)
 * - Account, token, and transaction operations
 * - V3 Validator management
 * - Subscription management
 * - Backend-as-a-Service (BaaS) integration
 *
 * @example Basic usage
 * ```typescript
 * import { SmartEngineClient } from '@hsuite/smart-engines-sdk';
 *
 * const client = new SmartEngineClient({
 *   baseUrl: 'https://validator.example.com',
 * });
 *
 * const health = await client.getHealth();
 * ```
 *
 * @example Auto-discovery with authentication
 * ```typescript
 * import { SmartEngineClient } from '@hsuite/smart-engines-sdk';
 * import { PrivateKey } from '@hashgraph/sdk';
 *
 * const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
 *
 * const { client, validator, session } = await SmartEngineClient.connectToNetwork({
 *   network: 'testnet',
 *   registryTopicId: process.env.REGISTRY_TOPIC_ID,
 *   chain: 'hedera',
 *   address: process.env.HEDERA_ACCOUNT_ID,
 *   publicKey: privateKey.publicKey.toStringRaw(),
 *   signFn: (challenge) => {
 *     const sig = privateKey.sign(Buffer.from(challenge));
 *     return Buffer.from(sig).toString('hex');
 *   },
 * });
 * ```
 *
 * @example Using sub-clients for app features
 * ```typescript
 * // Validator management
 * const templates = await client.validators.listTemplates();
 *
 * // Subscriptions
 * const status = await client.subscription.getStatus('my-app-subscription');
 * ```
 */

// Core client
export * from './client';

// Discovery module - validator discovery via HCS
export * as discovery from './discovery';
export {
  ValidatorDiscoveryClient,
  ValidatorInfo,
  ValidatorNetworkEndpoints,
  ValidatorMetadata,
  MirrorNodeClient,
  MirrorNodeError,
  MIRROR_NODE_URLS,
} from './discovery';

// Auth module - Web3-style validator authentication
export * as auth from './auth';
export {
  ValidatorAuthClient,
  ValidatorAuthError,
  AuthChain,
  ChallengeResponse,
  AuthenticateRequest,
  AuthenticateResponse,
  SessionInfo,
} from './auth';

// License module - Decentralized license management
export * as license from './license';
export {
  LicenseClient,
  generateLicenseKeyPair,
  validateLicenseSecretKey,
  type KyberPublicKey,
  type LicenseKeyPair,
  type DecentralizedLicenseEnvelope,
  type ValidatorLicense,
  type DecryptedLicense,
  type LicenseDecryptionResult,
  type NFTLicenseMetadata,
} from './license';

// Chain helpers
export * as chains from './chains';

// Validators sub-client - V3 HCS Validator management (public)
export * as validators from './validators';
export { ValidatorsClient } from './validators';
export type {
  ValidatorType,
  ControllerType,
  SecurityLevel,
  CreateProposalResponse,
  ValidatorReadResponse,
  ValidatorHealthResponse,
  ValidatorInfoResponse,
  TemplateListResponse,
  ValidatorTemplate,
  RegistryFilters,
  RegistryListResponse,
  RegistrySearchResponse,
  RegistryStatsResponse,
  // V3 Validator Rules types
  BaseValidatorRules,
  OperationConfig,
  KeyConfig,
  GovernanceConfig,
  TokenValidatorRules,
  AccountValidatorRules,
  TopicValidatorRules,
} from './validators';

// Subscription sub-client - Application subscriptions (public)
export * as subscription from './subscription';
export { SubscriptionClient } from './subscription';
export type {
  SubscriptionRequest,
  SubscriptionResponse,
  SubscriptionStatus,
  SubscriptionStatusResponse,
  SubscriptionConfig,
  SubscriptionListResponse,
  SubscriptionRenewalRequest,
  SubscriptionRenewalResponse,
  MintNftResponse,
  BalanceResponse,
} from './subscription';

// BaaS sub-client - Backend-as-a-Service (public)
export * as baas from './baas';
export { BaasClient, BaasError } from './baas';
export type {
  // Common types
  BaasSupportedChain,
  BaasClientConfig,
  BaasEndpoints,
  DeployedAppInfo,
  // Authentication types
  BaasChallengeRequest,
  BaasChallengeResponse,
  BaasVerifyRequest,
  BaasAuthResult,
  BaasSessionInfo,
  BaasRegisterRequest,
  BaasRegisterResponse,
  AuthenticateOptions,
  // Database types
  BaasDocument,
  BaasStateTransition,
  BaasMerkleProof,
  BaasInsertResult,
  BaasUpdateResult,
  BaasDeleteResult,
  BaasQueryOptions,
  BaasFindResult,
  // Storage types
  BaasFileMetadata,
  BaasUploadResult,
  BaasFileInfo,
  BaasStorageUsage,
  // Functions types
  BaasFunctionRuntime,
  BaasTriggerType,
  BaasFunctionResources,
  BaasFunctionDeployRequest,
  BaasFunctionDeployResult,
  BaasFunctionResult,
  BaasFunctionInfo,
  BaasFunctionLog,
  BaasFunctionLogOptions,
  // Messaging types
  BaasMessage,
  BaasChannelConfig,
  BaasPresenceMember,
  BaasPresenceInfo,
  BaasHistoryOptions,
  BaasPublishResult,
  // Deployment types
  BaasDeployRequest,
  BaasDeployResult,
  BaasAppListResponse,
  // Error types
  BaasErrorDetails,
} from './baas';

// NestJS integration
export * as nestjs from './nestjs';
export { SmartEngineModule, SmartEngineService, SMART_ENGINE_CONFIG } from './nestjs';
export type {
  SmartEngineModuleAsyncOptions,
  SmartEngineOptionsFactory,
  SmartEngineServiceConfig,
  BaasClient as NestJsBaasClient,
} from './nestjs';

// Re-export commonly used types from shared
export type {
  ChainType,
  NetworkType,
  CreateAccountRequest,
  CreateAccountResponse,
  TransferRequest,
  TransferResponse,
  AccountInfo,
  AccountBalance,
  Transaction,
  Token,
  TokenInfo,
  TokenActionRequest,
  BurnTokenRequest,
  ActionResult,
  TokenCapabilities,
} from '@hsuite/smart-engines-shared';

// Re-export error classes from shared for single-package consumer experience
export {
  SmartEngineError,
  ErrorCode,
  UnsupportedCapabilityError,
  CapabilityValidationError,
  CapabilityNotEnabledError,
} from '@hsuite/smart-engines-shared';
