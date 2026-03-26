import mongoose, { Schema, Document } from 'mongoose';

/**
 * Account Cache Document Interface
 */
export interface AccountCacheDocument extends Document {
  accountId: string;
  chain: string;
  network: string;
  balance: string;
  publicKey?: string;
  metadata?: Record<string, any>;
  lastSyncedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Account Cache MongoDB Schema
 */
export const AccountCacheSchema = new Schema<AccountCacheDocument>(
  {
    accountId: { type: String, required: true, index: true },
    chain: { type: String, required: true, index: true },
    network: { type: String, required: true },
    balance: { type: String, required: true },
    publicKey: { type: String },
    metadata: { type: Schema.Types.Mixed },
    lastSyncedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'account_cache',
  }
);

// Compound unique index
AccountCacheSchema.index({ chain: 1, accountId: 1 }, { unique: true });

// TTL index for automatic expiration
AccountCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AccountCacheModel = mongoose.model<AccountCacheDocument>(
  'AccountCache',
  AccountCacheSchema
);
