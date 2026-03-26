import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * Database Service (MongoDB)
 *
 * Provides MongoDB connection management
 * Uses NestJS MongooseModule for connection
 *
 * PRODUCTION REQUIREMENT: MongoDB connection MUST be available.
 * This service will fail fast if database is not configured.
 */
@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    // Set up connection event handlers
    this.connection.on('error', (error) => {
      this.logger.error('MongoDB connection error:', error.message);
    });

    this.connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
    });

    this.connection.on('reconnected', () => {
      this.logger.log('MongoDB reconnected');
    });

    // Log connection status
    if (this.isConnected()) {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_engines';
      this.logger.log(`Connected to MongoDB: ${uri.replace(/\/\/.*@/, '//***@')}`);
    } else {
      throw new Error('MongoDB connection required but not connected');
    }
  }

  /**
   * Get MongoDB connection
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.connection.readyState === 1;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ connected: boolean; latency?: number; error?: string }> {
    if (this.connection.readyState !== 1) {
      return { connected: false, error: 'Database not connected' };
    }

    try {
      const start = Date.now();
      await this.connection.db?.admin().ping();
      const latency = Date.now() - start;

      return { connected: true, latency };
    } catch (error) {
      const err = error as Error;
      return { connected: false, error: err.message };
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    try {
      const stats = await this.connection.db?.stats();
      return {
        connected: true,
        database: this.connection.db?.databaseName,
        collections: stats?.collections,
        dataSize: stats?.dataSize,
        storageSize: stats?.storageSize,
        indexes: stats?.indexes,
        indexSize: stats?.indexSize,
      };
    } catch (error) {
      const err = error as Error;
      return { connected: false, error: err.message };
    }
  }
}
