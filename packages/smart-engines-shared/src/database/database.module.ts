import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';
import { WalletRepository } from './repositories/wallet.repository';
import { TransactionHistoryRepository } from './repositories/transaction-history.repository';
import {
  TransactionHistorySchema,
  TRANSACTION_HISTORY_MODEL_NAME,
} from './schemas/transaction-history.schema';

/**
 * Database Module (MongoDB)
 *
 * Provides MongoDB connection and repositories
 * Note: MongooseModule.forRoot() should be configured in the root app module
 */
@Global()
@Module({
  imports: [
    // Register TransactionHistory model with NestJS MongooseModule
    MongooseModule.forFeature([
      { name: TRANSACTION_HISTORY_MODEL_NAME, schema: TransactionHistorySchema },
    ]),
  ],
  providers: [DatabaseService, WalletRepository, TransactionHistoryRepository],
  exports: [DatabaseService, WalletRepository, TransactionHistoryRepository, MongooseModule],
})
export class DatabaseModule {}
