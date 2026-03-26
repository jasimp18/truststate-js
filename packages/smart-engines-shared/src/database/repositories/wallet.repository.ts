import { Injectable } from '@nestjs/common';
import { WalletModel, WalletDocument } from '../schemas/wallet.schema';

/**
 * Wallet Entity for API/Service layer
 */
export interface WalletEntity {
  id: string;
  accountId: string;
  chain: string;
  network: string;
  publicKey: string;
  encryptedPrivateKey: string;
  encryptedSeed?: string;
  iv: string;
  authTag: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

/**
 * Wallet Repository (MongoDB)
 *
 * Handles database operations for wallets
 */
@Injectable()
export class WalletRepository {
  /**
   * Save wallet to database
   */
  async save(wallet: Omit<WalletEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<WalletEntity> {
    const doc = new WalletModel(wallet);
    await doc.save();
    return this.toEntity(doc);
  }

  /**
   * Find wallet by ID
   */
  async findById(id: string): Promise<WalletEntity | null> {
    const doc = await WalletModel.findOne({ _id: id, deletedAt: { $exists: false } });
    return doc ? this.toEntity(doc) : null;
  }

  /**
   * Find wallet by chain and account ID
   */
  async findByAccount(chain: string, accountId: string): Promise<WalletEntity | null> {
    const doc = await WalletModel.findOne({
      chain,
      accountId,
      deletedAt: { $exists: false },
    });
    return doc ? this.toEntity(doc) : null;
  }

  /**
   * List all wallets for a chain
   */
  async findByChain(chain?: string): Promise<WalletEntity[]> {
    const query: any = { deletedAt: { $exists: false } };
    if (chain) {
      query.chain = chain;
    }

    const docs = await WalletModel.find(query).sort({ createdAt: -1 });
    return docs.map((doc: WalletDocument) => this.toEntity(doc));
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(id: string): Promise<void> {
    await WalletModel.updateOne(
      { _id: id },
      { $set: { lastUsedAt: new Date(), updatedAt: new Date() } }
    );
  }

  /**
   * Update wallet metadata
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<WalletEntity | null> {
    const doc = await WalletModel.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: false } },
      { $set: { metadata, updatedAt: new Date() } },
      { new: true }
    );
    return doc ? this.toEntity(doc) : null;
  }

  /**
   * Soft delete wallet
   */
  async delete(id: string): Promise<void> {
    await WalletModel.updateOne({ _id: id }, { $set: { deletedAt: new Date() } });
  }

  /**
   * Get wallet statistics
   */
  async getStats(): Promise<{
    totalWallets: number;
    walletsByChain: Record<string, number>;
  }> {
    const totalWallets = await WalletModel.countDocuments({ deletedAt: { $exists: false } });

    const byChain = await WalletModel.aggregate([
      { $match: { deletedAt: { $exists: false } } },
      { $group: { _id: '$chain', count: { $sum: 1 } } },
    ]);

    const walletsByChain: Record<string, number> = {};
    byChain.forEach((item: any) => {
      walletsByChain[item._id] = item.count;
    });

    return {
      totalWallets,
      walletsByChain,
    };
  }

  /**
   * Convert MongoDB document to entity
   */
  private toEntity(doc: WalletDocument): WalletEntity {
    return {
      id: (doc._id as any).toString(),
      accountId: doc.accountId,
      chain: doc.chain,
      network: doc.network,
      publicKey: doc.publicKey,
      encryptedPrivateKey: doc.encryptedPrivateKey,
      encryptedSeed: doc.encryptedSeed,
      iv: doc.iv,
      authTag: doc.authTag,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      lastUsedAt: doc.lastUsedAt,
    };
  }
}
