import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TransactionHistoryDocument,
  TRANSACTION_HISTORY_MODEL_NAME,
} from '../schemas/transaction-history.schema';
import { TransactionHistoryEntity } from '../base.entity';

/**
 * Transaction History Repository (MongoDB)
 *
 * Handles database operations for transaction history
 * Uses NestJS MongooseModule injection for proper connection management
 *
 * PRODUCTION REQUIREMENT: MongoDB connection MUST be available.
 * This service will fail fast if database is not configured.
 */
@Injectable()
export class TransactionHistoryRepository {
  private readonly logger = new Logger(TransactionHistoryRepository.name);

  constructor(
    @InjectModel(TRANSACTION_HISTORY_MODEL_NAME)
    private readonly model: Model<TransactionHistoryDocument>
  ) {
    this.logger.log('TransactionHistoryRepository initialized with MongoDB model');
  }

  /**
   * Save transaction to history
   */
  async save(
    tx: Omit<TransactionHistoryEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TransactionHistoryEntity> {
    // Upsert based on chain + transactionId
    const doc = await this.model.findOneAndUpdate(
      { chain: tx.chain, transactionId: tx.transactionId },
      { $set: tx },
      { upsert: true, new: true }
    );

    return this.toEntity(doc);
  }

  /**
   * Find transaction by chain and transaction ID
   */
  async findByTransactionId(
    chain: string,
    transactionId: string
  ): Promise<TransactionHistoryEntity | null> {
    const doc = await this.model.findOne({
      chain,
      transactionId,
      deletedAt: { $exists: false },
    });
    return doc ? this.toEntity(doc) : null;
  }

  /**
   * Find transactions by account
   */
  async findByAccount(
    accountId: string,
    options?: { limit?: number; offset?: number; chain?: string }
  ): Promise<TransactionHistoryEntity[]> {
    const query: any = {
      $or: [{ from: accountId }, { to: accountId }],
      deletedAt: { $exists: false },
    };

    if (options?.chain) {
      query.chain = options.chain;
    }

    const docs = await this.model
      .find(query)
      .sort({ timestamp: -1 })
      .limit(options?.limit || 50)
      .skip(options?.offset || 0);

    return docs.map((doc: TransactionHistoryDocument) => this.toEntity(doc));
  }

  /**
   * Find failed transactions for retry
   */
  async findFailedTransactions(maxRetries: number = 3): Promise<TransactionHistoryEntity[]> {
    const docs = await this.model
      .find({
        status: 'failed',
        retryCount: { $lt: maxRetries },
        deletedAt: { $exists: false },
      })
      .sort({ createdAt: -1 })
      .limit(100);

    return docs.map((doc: TransactionHistoryDocument) => this.toEntity(doc));
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    chain: string,
    transactionId: string,
    status: 'pending' | 'success' | 'failed',
    error?: string
  ): Promise<void> {
    await this.model.updateOne(
      { chain, transactionId },
      {
        $set: {
          status,
          lastError: error,
          updatedAt: new Date(),
        },
      }
    );
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(chain: string, transactionId: string): Promise<void> {
    await this.model.updateOne(
      { chain, transactionId },
      {
        $inc: { retryCount: 1 },
        $set: { updatedAt: new Date() },
      }
    );
  }

  /**
   * Get transaction statistics
   */
  async getStats(chain?: string): Promise<{
    total: number;
    success: number;
    failed: number;
    pending: number;
    byChain: Record<string, number>;
  }> {
    const matchQuery: any = { deletedAt: { $exists: false } };
    if (chain) {
      matchQuery.chain = chain;
    }

    const [totalResult, byStatus, byChainResult] = await Promise.all([
      this.model.countDocuments(matchQuery),
      this.model.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.model.aggregate([
        { $match: { deletedAt: { $exists: false } } },
        { $group: { _id: '$chain', count: { $sum: 1 } } },
      ]),
    ]);

    const stats: any = {
      total: totalResult,
      success: 0,
      failed: 0,
      pending: 0,
      byChain: {},
    };

    byStatus.forEach((item: any) => {
      stats[item._id] = item.count;
    });

    byChainResult.forEach((item: any) => {
      stats.byChain[item._id] = item.count;
    });

    return stats;
  }

  /**
   * Convert MongoDB document to entity
   */
  private toEntity(doc: TransactionHistoryDocument): TransactionHistoryEntity {
    return {
      id: (doc._id as any).toString(),
      transactionId: doc.transactionId,
      chain: doc.chain,
      network: doc.network,
      type: doc.type,
      status: doc.status,
      from: doc.from,
      to: doc.to,
      amount: doc.amount,
      fee: doc.fee,
      blockNumber: doc.blockNumber,
      blockHash: doc.blockHash,
      timestamp: doc.timestamp,
      metadata: doc.metadata,
      retryCount: doc.retryCount,
      lastError: doc.lastError,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      deletedAt: doc.deletedAt,
    };
  }
}
