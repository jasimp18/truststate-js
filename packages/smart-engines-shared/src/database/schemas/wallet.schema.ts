import mongoose, { Schema, Document } from 'mongoose';

/**
 * Wallet Document Interface
 */
export interface WalletDocument extends Document {
  accountId: string;
  chain: string;
  network: string;
  publicKey: string;
  encryptedPrivateKey: string;
  encryptedSeed?: string;
  iv: string;
  authTag: string;
  metadata?: Record<string, any>;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Wallet MongoDB Schema
 */
export const WalletSchema = new Schema<WalletDocument>(
  {
    accountId: { type: String, required: true, index: true },
    chain: { type: String, required: true, index: true },
    network: { type: String, required: true },
    publicKey: { type: String, required: true },
    encryptedPrivateKey: { type: String, required: true },
    encryptedSeed: { type: String },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    lastUsedAt: { type: Date },
    deletedAt: { type: Date, index: true },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'wallets',
  }
);

// Compound unique index
WalletSchema.index({ chain: 1, accountId: 1 }, { unique: true });

// Index for active wallets
WalletSchema.index({ deletedAt: 1 }, { sparse: true });

export const WalletModel = mongoose.model<WalletDocument>('Wallet', WalletSchema);
