/**
 * Base Entity
 *
 * Common fields for all database entities
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * Transaction History Entity
 */
export interface TransactionHistoryEntity extends BaseEntity {
  transactionId: string;
  chain: string;
  network: string;
  type: string;
  status: 'pending' | 'success' | 'failed';
  from: string;
  to: string;
  amount?: string;
  fee: string;
  blockNumber?: number;
  blockHash?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  retryCount?: number;
  lastError?: string;
}

/**
 * Account Cache Entity
 */
export interface AccountCacheEntity extends BaseEntity {
  accountId: string;
  chain: string;
  network: string;
  balance: string;
  publicKey?: string;
  metadata?: Record<string, any>;
  lastSyncedAt: Date;
  expiresAt: Date;
}

/**
 * Token Cache Entity
 */
export interface TokenCacheEntity extends BaseEntity {
  tokenId: string;
  chain: string;
  network: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  type: 'fungible' | 'nft';
  metadata?: Record<string, any>;
  lastSyncedAt: Date;
  expiresAt: Date;
}

/**
 * Event Log Entity (for event sourcing)
 */
export interface EventLogEntity extends BaseEntity {
  eventId: string;
  eventType: string;
  source: string;
  data: Record<string, any>;
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
}
