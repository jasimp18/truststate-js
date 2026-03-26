/**
 * TSS (Threshold Signature Scheme) Types
 */

/**
 * Entity types supported by TSS
 */
export type EntityType = 'account' | 'token' | 'topic';

/**
 * Options for creating a multi-sig entity
 */
export type EntityCreationOptions = {
  /** Type of entity to create */
  entityType: EntityType;
  /** List of active validator node IDs */
  activeNodes: string[];
  /** Minimum signatures required (threshold) */
  threshold?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
};

/**
 * Response from entity creation
 */
export type EntityCreationResponse = {
  success: boolean;
  entityId: string;
  publicKeys: string[];
  signerIndices: number[];
  threshold: number;
  ceremonyIds: string[];
};

/**
 * Request to reshare keys when cluster membership changes
 */
export type ReshareRequest = {
  /** Single entity to reshare (optional) */
  entityId?: string;
  /** Multiple entities to reshare (optional) */
  entityIds?: string[];
  /** Old cluster participants */
  oldParticipants: string[];
  /** New cluster participants */
  newParticipants: string[];
};

/**
 * Response from reshare operation
 */
export type ReshareResponse = {
  success: boolean;
  message: string;
  oldParticipants: string[];
  newParticipants: string[];
  note: string;
};

/**
 * Entity details response
 */
export type EntityDetails = {
  success: boolean;
  payload?: unknown;
  signerIndices?: number[];
  validators?: string[];
  publicKeys?: string[];
  error?: string;
};

/**
 * MPC signing request for Hedera
 */
export type MPCSigningRequest = {
  /** Entity ID to use for signing */
  entityId: string;
  /** Hex-encoded transaction bytes */
  transactionBytes: string;
  /** Number of signers required */
  requiredSigners?: number;
};

/**
 * MPC signing response
 */
export type MPCSigningResponse = {
  success: boolean;
  signedTransactionBytes: string;
};

/**
 * Validator info response
 */
export type ValidatorListResponse = {
  success: boolean;
  count: number;
  validators: Record<string, string>;
};

/**
 * TSS statistics
 */
export type TSSStats = {
  success: boolean;
  totalClusters: number;
  clustersWithShares: number;
  averageThreshold: number;
  averageParticipants: number;
  activeSigningSessions: number;
  activeRecoveries: number;
  natsConnected: boolean;
};

/**
 * Entity list response
 */
export type EntityListResponse = {
  success: boolean;
  entities: string[];
  count: number;
};

/**
 * TSS health response
 */
export type TSSHealthResponse = {
  status: 'healthy' | 'unhealthy';
  tss?: string;
  clusters?: number;
  activeSessions?: number;
  error?: string;
};

/**
 * DKG ceremony list response
 */
export type CeremonyListResponse = {
  enabled: boolean;
  message?: string;
  activeCeremonies?: number;
  completedCeremonies?: number;
  failedCeremonies?: number;
};

/**
 * Multi-sig transaction status response
 */
export type MultiSigStatusResponse = {
  enabled: boolean;
  message?: string;
  status?: string;
  approvals?: number;
  threshold?: number;
  participants?: string[];
};
