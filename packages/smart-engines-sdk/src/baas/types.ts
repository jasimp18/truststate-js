/**
 * BaaS Client Types
 *
 * Type definitions for Backend-as-a-Service client SDK.
 * These types are used for client-side interactions with BaaS services.
 */

// ============================================================================
// Service Types
// ============================================================================

/**
 * Available BaaS service types
 */
export type BaasService = 'auth' | 'database' | 'storage' | 'functions' | 'messaging';

/**
 * Supported blockchain networks for BaaS authentication
 */
export type BaasSupportedChain = 'hedera' | 'xrpl' | 'polkadot' | 'solana';

/**
 * BaaS service endpoints returned by the host
 */
export type BaasEndpoints = {
  /** Authentication service endpoint */
  auth: string;
  /** Database service endpoint */
  database: string;
  /** Storage service endpoint */
  storage: string;
  /** Functions service endpoint */
  functions: string;
  /** Messaging service endpoint */
  messaging: string;
};

// ============================================================================
// Deployed App Types
// ============================================================================

/**
 * Application deployment status
 */
export type DeployedAppStatus = 'pending' | 'deploying' | 'active' | 'suspended' | 'deleted';

/**
 * Resource limits for a deployed app
 */
export type DeployedAppLimits = {
  /** Storage quota (e.g., '1GB', '10GB') */
  storage: string;
  /** Maximum number of serverless functions */
  functions: number;
  /** Maximum number of messaging channels */
  channels: number;
};

/**
 * Current resource usage for a deployed app
 */
export type DeployedAppUsage = {
  /** Storage used in bytes */
  storage: number;
  /** Number of deployed functions */
  functions: number;
  /** Number of active channels */
  channels: number;
};

/**
 * Deployed application information
 */
export type DeployedApp = {
  /** Unique application identifier */
  appId: string;
  /** Application display name */
  name: string;
  /** Enabled BaaS services */
  services: BaasService[];
  /** Current deployment status */
  status: DeployedAppStatus;
  /** Owner wallet address */
  owner: string;
  /** Service endpoints */
  endpoints: BaasEndpoints;
  /** Environment variables (keys only, values are server-side) */
  environment?: Record<string, string>;
  /** Resource limits */
  limits: DeployedAppLimits;
  /** Current resource usage */
  usage: DeployedAppUsage;
  /** When the app was created (ISO string) */
  createdAt: string;
  /** When the app was last updated (ISO string) */
  updatedAt?: string;
};

/**
 * Simplified deployed application info for listings
 */
export type DeployedAppInfo = {
  appId: string;
  name: string;
  status: 'active' | 'inactive' | 'deploying' | 'error';
  services: string[];
  endpoints: BaasEndpoints;
  createdAt: string;
};

// ============================================================================
// Client Configuration Types
// ============================================================================

/**
 * BaaS authentication configuration
 */
export type BaasAuthConfig = {
  /** Blockchain to use for wallet authentication */
  chain: BaasSupportedChain;
  /** Wallet address for authentication */
  walletAddress: string;
  /** Public key (hex encoded) */
  publicKey: string;
  /** Function to sign challenge messages */
  signFn: (message: string) => string | Promise<string>;
};

/**
 * BaaS client configuration options
 */
export type BaasClientConfig = {
  /** Smart Host URL */
  hostUrl: string;
  /** Application ID (for existing apps) */
  appId?: string;
  /** Application name (for registration) */
  appName?: string;
  /** Authentication configuration (optional - can authenticate later) */
  auth?: BaasAuthConfig;
  /** Services to enable (defaults to all) */
  services?: BaasService[];
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Allow HTTP connections (for local development only) */
  allowInsecure?: boolean;
};

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * Request to create an authentication challenge
 */
export type BaasChallengeRequest = {
  chain: BaasSupportedChain;
  walletAddress: string;
  appId: string;
  metadata?: Record<string, unknown>;
};

/**
 * Authentication challenge response from the server
 */
export type BaasChallengeResponse = {
  challengeId: string;
  message: string;
  expiresAt: number;
  chain?: BaasSupportedChain;
  walletAddress?: string;
  appId?: string;
};

/**
 * Verify challenge request
 */
export type BaasVerifyRequest = {
  challengeId: string;
  signature: string;
  publicKey?: string;
};

/**
 * Authentication result after successful verification
 */
export type BaasAuthResult = {
  authenticated?: boolean;
  walletAddress: string;
  chain: BaasSupportedChain;
  appId: string;
  token: string;
  expiresAt: number;
};

/**
 * Session validation result
 */
export type BaasSessionInfo = {
  valid: boolean;
  walletAddress?: string;
  chain?: BaasSupportedChain;
  appId?: string;
  permissions?: string[];
  sessionId?: string;
  expiresAt?: number;
  error?: string;
};

/**
 * App registration request
 */
export type BaasRegisterRequest = {
  /** Application name */
  name: string;
  /** Services to enable */
  services: BaasService[];
  /** Optional environment configuration */
  environment?: Record<string, string>;
  /** Optional resource limits */
  limits?: {
    storage?: string;
    functions?: number;
    channels?: number;
  };
};

/**
 * App registration response
 */
export type BaasRegisterResponse = {
  appId: string;
  name: string;
  status: DeployedAppStatus;
  services: string[];
  endpoints: BaasEndpoints;
  createdAt: string;
};

// ============================================================================
// Database Types
// ============================================================================

/**
 * Database document structure
 */
export type BaasDocument = {
  /** Document ID */
  _id: string;
  /** Document data */
  data: Record<string, unknown>;
  /** Creation timestamp (Unix ms) */
  createdAt: number;
  /** Last update timestamp (Unix ms) */
  updatedAt: number;
  /** Document version */
  version: number;
};

/**
 * Generic document type with custom data shape
 */
export type DbDocument<T = Record<string, unknown>> = {
  /** Document ID */
  _id: string;
  /** Document data */
  data: T;
  /** Creation timestamp (Unix ms) */
  createdAt: number;
  /** Last update timestamp (Unix ms) */
  updatedAt: number;
  /** Document version */
  version: number;
};

/**
 * State transition record from database operations
 */
export type BaasStateTransition = {
  transitionId: string;
  operation: 'insert' | 'update' | 'delete';
  collection: string;
  documentId: string;
  previousHash: string;
  newHash: string;
  stateRoot: string;
  timestamp: number;
  proof: BaasMerkleProof;
};

/**
 * Merkle proof for verifying document inclusion
 */
export type BaasMerkleProof = {
  /** Merkle root hash */
  root: string;
  /** Document hash (leaf) */
  leaf: string;
  /** Sibling hashes for verification */
  siblings: string[];
  /** Path direction for each sibling */
  path: ('left' | 'right')[];
};

/**
 * Result of a database insert operation
 */
export type BaasInsertResult = {
  /** Inserted document */
  document: BaasDocument;
  /** State transition proof */
  stateTransition: BaasStateTransition;
};

/**
 * Result of a database update operation
 */
export type BaasUpdateResult = {
  /** Updated document */
  document: BaasDocument;
  /** State transition proof */
  stateTransition: BaasStateTransition;
};

/**
 * Result of a database delete operation
 */
export type BaasDeleteResult = {
  /** Whether the document was deleted */
  deleted: boolean;
  /** State transition proof */
  stateTransition: BaasStateTransition;
};

/**
 * Comparison operators for database queries
 */
export type DbComparisonOperator = {
  /** Equal to */
  $eq?: unknown;
  /** Not equal to */
  $ne?: unknown;
  /** Greater than */
  $gt?: number;
  /** Greater than or equal to */
  $gte?: number;
  /** Less than */
  $lt?: number;
  /** Less than or equal to */
  $lte?: number;
  /** In array */
  $in?: unknown[];
  /** Not in array */
  $nin?: unknown[];
  /** Field exists */
  $exists?: boolean;
  /** Regex match (string fields only) */
  $regex?: string;
};

/**
 * Database query filter
 */
export type DbQuery = Record<string, unknown | DbComparisonOperator>;

/**
 * Database query options
 */
export type BaasQueryOptions = {
  /** Maximum number of documents to return */
  limit?: number;
  /** Number of documents to skip (for pagination) */
  skip?: number;
  /** Sort field (prefix with - for descending) */
  sort?: string;
  /** Fields to include or exclude (MongoDB projection) */
  projection?: Record<string, 0 | 1>;
};

/**
 * Database find result
 */
export type BaasFindResult = {
  documents: BaasDocument[];
  count: number;
  limit: number;
  skip: number;
};

// ============================================================================
// Storage Types
// ============================================================================

/**
 * File metadata for storage operations
 */
export type BaasFileMetadata = {
  /** Original filename */
  filename?: string;
  /** MIME type */
  mimeType?: string;
  /** Custom tags for organization */
  tags?: Record<string, string>;
  /** Whether the file is client-side encrypted */
  encrypted?: boolean;
};

/**
 * Result of a storage upload operation
 */
export type BaasUploadResult = {
  /** Content identifier (IPFS CID) */
  cid: string;
  /** File size in bytes */
  size: number;
  /** Detected MIME type */
  mimeType: string;
  /** Upload timestamp (ISO string) */
  uploadedAt: string;
  /** Original filename if provided */
  filename?: string;
  /** Whether the file is encrypted */
  encrypted?: boolean;
};

/**
 * File information from storage
 */
export type BaasFileInfo = {
  /** Content identifier (IPFS CID) */
  cid: string;
  /** Original filename */
  filename?: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType?: string;
  /** Upload timestamp (ISO string) */
  uploadedAt: string;
  /** Last access timestamp (ISO string) */
  lastAccessedAt?: string;
  /** Custom tags */
  tags?: Record<string, string>;
};

/**
 * Storage usage statistics
 */
export type BaasStorageUsage = {
  totalSize: number;
  fileCount: number;
};

// ============================================================================
// Functions Types
// ============================================================================

/**
 * Supported serverless function runtimes
 */
export type BaasFunctionRuntime = 'nodejs20' | 'python3' | 'deno';

/**
 * Function trigger types
 */
export type BaasTriggerType = 'http' | 'schedule' | 'event' | 'webhook';

/**
 * Function resource limits
 */
export type BaasFunctionResources = {
  memory: string;
  timeout: number;
  maxConcurrency?: number;
};

/**
 * Function deployment request
 */
export type BaasFunctionDeployRequest = {
  name: string;
  description?: string;
  runtime: BaasFunctionRuntime;
  code: string;
  codeType: 'inline' | 'ipfs';
  entryPoint?: string;
  triggers?: Array<{
    type: BaasTriggerType;
    config: Record<string, unknown>;
  }>;
  resources?: Partial<BaasFunctionResources>;
  environment?: Record<string, string>;
};

/**
 * Function deployment result
 */
export type BaasFunctionDeployResult = {
  functionId: string;
  version: number;
  deployedAt: string;
  endpoints?: string[];
  status: 'active' | 'deploying' | 'failed';
  error?: string;
};

/**
 * Function invocation result
 */
export type BaasFunctionResult = {
  /** Request identifier for tracing */
  requestId: string;
  /** Function identifier */
  functionId: string;
  /** Execution status */
  status: 'success' | 'error' | 'timeout';
  /** Function return value */
  result?: unknown;
  /** Error message if failed */
  error?: string;
  /** Function logs (if enabled) */
  logs?: string[];
  /** Execution duration in milliseconds */
  duration: number;
  /** Memory used in bytes */
  memoryUsed?: number;
};

/**
 * Function information
 */
export type BaasFunctionInfo = {
  functionId: string;
  name: string;
  runtime: BaasFunctionRuntime;
  version: number;
  status: 'active' | 'inactive' | 'error';
  deployedAt: string;
  lastInvokedAt?: string;
  invocationCount: number;
};

/**
 * Function log entry
 */
export type BaasFunctionLog = {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Function log options
 */
export type BaasFunctionLogOptions = {
  startTime?: string;
  endTime?: string;
  limit?: number;
  level?: 'debug' | 'info' | 'warn' | 'error';
  requestId?: string;
};

// ============================================================================
// Messaging Types
// ============================================================================

/**
 * Message payload
 */
export type BaasMessage = {
  /** Message identifier */
  messageId: string;
  /** Channel name */
  channel: string;
  /** Message payload */
  data: Record<string, unknown>;
  /** Sender identifier (wallet address) */
  sender?: string;
  /** Message timestamp (ISO string) */
  timestamp: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
};

/**
 * Message handler callback type
 */
export type MessageHandler = (message: BaasMessage) => void | Promise<void>;

/**
 * Channel configuration
 */
export type BaasChannelConfig = {
  name: string;
  persistent?: boolean;
  maxHistoryLength?: number;
  presence?: boolean;
  authRequired?: boolean;
};

/**
 * Channel subscription information
 */
export type ChannelSubscription = {
  /** Subscription identifier */
  subscriptionId: string;
  /** Channel name */
  channel: string;
  /** Application ID */
  appId: string;
  /** Subscription creation timestamp (ISO string) */
  createdAt: string;
  /** Whether the subscription is active */
  active: boolean;
};

/**
 * Presence member information
 */
export type BaasPresenceMember = {
  /** Client identifier */
  clientId: string;
  /** Wallet address */
  walletAddress?: string;
  /** When the member joined (ISO string) */
  joinedAt: string;
  /** Last activity timestamp (ISO string) */
  lastSeenAt: string;
  /** Custom presence metadata */
  metadata?: Record<string, unknown>;
};

/**
 * Channel presence information
 */
export type BaasPresenceInfo = {
  /** Channel name */
  channel: string;
  /** Members currently in the channel */
  members: BaasPresenceMember[];
  /** Total member count */
  totalCount: number;
};

/**
 * Message history options
 */
export type BaasHistoryOptions = {
  limit?: number;
  before?: string;
  after?: string;
  startTime?: string;
  endTime?: string;
};

/**
 * Messaging publish result
 */
export type BaasPublishResult = {
  messageId: string;
  channel: string;
  timestamp: string;
};

// ============================================================================
// Deployment Types
// ============================================================================

/**
 * App deployment request
 */
export type BaasDeployRequest = {
  name: string;
  services: BaasService[];
  config?: Record<string, unknown>;
};

/**
 * App deployment result
 */
export type BaasDeployResult = {
  appId: string;
  name: string;
  status: 'active' | 'deploying' | 'error';
  services: string[];
  endpoints: BaasEndpoints;
  createdAt: string;
};

/**
 * App list response
 */
export type BaasAppListResponse = {
  apps: DeployedAppInfo[];
};

// ============================================================================
// Error Types
// ============================================================================

/**
 * BaaS error response structure
 */
export type BaasErrorResponse = {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Request ID for support/debugging */
  requestId?: string;
};

/**
 * BaaS error details
 */
export type BaasErrorDetails = {
  code?: string;
  details?: unknown;
  /** Original error message if available */
  originalError?: string;
};
