import { Schema, Document } from 'mongoose';

/**
 * Transaction History Document Interface
 */
export interface TransactionHistoryDocument extends Document {
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
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Transaction History MongoDB Schema
 */
export const TransactionHistorySchema = new Schema<TransactionHistoryDocument>(
  {
    transactionId: { type: String, required: true, index: true },
    chain: { type: String, required: true, index: true },
    network: { type: String, required: true },
    type: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'success', 'failed'],
      index: true,
    },
    from: { type: String, index: true },
    to: { type: String, index: true },
    amount: { type: String },
    fee: { type: String },
    blockNumber: { type: Number },
    blockHash: { type: String },
    timestamp: { type: Date, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
    retryCount: { type: Number, default: 0 },
    lastError: { type: String },
    deletedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    collection: 'transaction_history',
  }
);

// Compound unique index
TransactionHistorySchema.index({ chain: 1, transactionId: 1 }, { unique: true });

// Index for failed transactions that need retry
TransactionHistorySchema.index(
  { status: 1, retryCount: 1 },
  {
    partialFilterExpression: { status: 'failed', deletedAt: { $exists: false } },
  }
);

/**
 * Model name for NestJS MongooseModule injection
 * Use @InjectModel(TRANSACTION_HISTORY_MODEL_NAME) in your service
 */
export const TRANSACTION_HISTORY_MODEL_NAME = 'TransactionHistory';
