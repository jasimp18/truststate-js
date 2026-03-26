import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  Optional,
} from '@nestjs/common';
import { SmartEngineClient, SmartEngineClientConfig, SmartEngineError } from '../client';

/**
 * Configuration for SmartEngineService
 */
export interface SmartEngineServiceConfig extends SmartEngineClientConfig {
  /** Enable automatic connection test on module init */
  testConnection?: boolean;
  /** Enable auto-reconnect on connection failure */
  autoReconnect?: boolean;
  /** Reconnection interval in milliseconds */
  reconnectInterval?: number;
  /** Maximum reconnection attempts (0 = infinite) */
  maxReconnectAttempts?: number;
}

/**
 * Configuration token for dependency injection
 */
export const SMART_ENGINE_CONFIG = 'SMART_ENGINE_CONFIG';

/**
 * BaaS (Blockchain-as-a-Service) client interface
 *
 * Provides simplified access to blockchain operations for BaaS scenarios
 * where applications need managed blockchain infrastructure without
 * direct validator management.
 */
export interface BaasClient {
  /** The underlying SmartEngineClient */
  readonly client: SmartEngineClient;
  /** Check if the client is connected and healthy */
  isHealthy(): Promise<boolean>;
  /** Get the validator base URL */
  getBaseUrl(): string;
}

/**
 * SmartEngineService - NestJS injectable service for Smart Engines SDK
 *
 * Provides lifecycle-managed access to SmartEngineClient with:
 * - Automatic connection testing on module init
 * - Graceful shutdown on module destroy
 * - BaaS client wrapper for simplified access
 * - Optional auto-reconnect functionality
 *
 * @example Module configuration with forRoot
 * ```typescript
 * import { Module } from '@nestjs/common';
 * import { SmartEngineModule } from '@hsuite/smart-engines-sdk/nestjs';
 *
 * @Module({
 *   imports: [
 *     SmartEngineModule.forRoot({
 *       baseUrl: 'https://validator.example.com',
 *       apiKey: process.env.SMART_ENGINE_API_KEY,
 *       testConnection: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example Direct service injection
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { SmartEngineService } from '@hsuite/smart-engines-sdk/nestjs';
 *
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly smartEngine: SmartEngineService) {}
 *
 *   async doSomething() {
 *     const client = this.smartEngine.getClient();
 *     const health = await client.getHealth();
 *   }
 * }
 * ```
 */
@Injectable()
export class SmartEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmartEngineService.name);
  private client: SmartEngineClient | null = null;
  private baasClient: BaasClient | null = null;
  private connected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;

  constructor(
    @Optional()
    @Inject(SMART_ENGINE_CONFIG)
    private readonly config?: SmartEngineServiceConfig
  ) {}

  /**
   * Initialize the service when the module starts
   */
  async onModuleInit(): Promise<void> {
    if (!this.config) {
      this.logger.warn(
        'SmartEngineService initialized without configuration. Call configure() before using.'
      );
      return;
    }

    await this.initialize(this.config);
  }

  /**
   * Clean up resources when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    await this.shutdown();
  }

  /**
   * Initialize the service with configuration
   *
   * Can be called manually if not using DI configuration
   */
  async initialize(config: SmartEngineServiceConfig): Promise<void> {
    this.logger.log(`Initializing SmartEngineService for ${config.baseUrl}`);

    try {
      this.client = new SmartEngineClient({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        authToken: config.authToken,
        timeout: config.timeout,
        allowInsecure: config.allowInsecure,
      });

      // Create BaaS client wrapper
      this.baasClient = this.createBaasClient(this.client);

      // Test connection if enabled
      if (config.testConnection !== false) {
        await this.testConnection();
      }

      this.connected = true;
      this.reconnectAttempts = 0;
      this.logger.log('SmartEngineService initialized successfully');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to initialize SmartEngineService: ${err.message}`);

      if (config.autoReconnect) {
        this.scheduleReconnect(config);
      } else {
        throw error;
      }
    }
  }

  /**
   * Gracefully shutdown the service
   */
  async shutdown(): Promise<void> {
    this.logger.log('Shutting down SmartEngineService');

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear client references
    this.client = null;
    this.baasClient = null;
    this.connected = false;

    this.logger.log('SmartEngineService shutdown complete');
  }

  /**
   * Get the SmartEngineClient instance
   *
   * @throws SmartEngineError if client is not initialized
   */
  getClient(): SmartEngineClient {
    if (!this.client) {
      throw new SmartEngineError(
        'SmartEngineClient not initialized. Ensure SmartEngineService is configured properly.',
        500
      );
    }
    return this.client;
  }

  /**
   * Get the BaaS client for simplified blockchain access
   *
   * The BaaS client provides a simplified interface for applications
   * that need managed blockchain infrastructure access.
   *
   * @throws SmartEngineError if client is not initialized
   */
  getBaasClient(): BaasClient {
    if (!this.baasClient) {
      throw new SmartEngineError(
        'BaasClient not initialized. Ensure SmartEngineService is configured properly.',
        500
      );
    }
    return this.baasClient;
  }

  /**
   * Check if the service is connected and healthy
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Test the connection to the validator
   */
  async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const health = await this.client.getHealth();
      this.connected = health.status === 'healthy' || health.status === 'ok';
      return this.connected;
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Connection test failed: ${err.message}`);
      this.connected = false;
      return false;
    }
  }

  /**
   * Get the current connection status
   */
  getStatus(): {
    connected: boolean;
    baseUrl: string | null;
    authenticated: boolean;
    reconnectAttempts: number;
  } {
    return {
      connected: this.connected,
      baseUrl: this.client?.getBaseUrl() ?? null,
      authenticated: this.client?.isAuthenticated() ?? false,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Create a BaaS client wrapper around the SmartEngineClient
   */
  private createBaasClient(client: SmartEngineClient): BaasClient {
    return {
      client,
      isHealthy: async () => {
        try {
          const health = await client.getHealth();
          return health.status === 'healthy' || health.status === 'ok';
        } catch {
          return false;
        }
      },
      getBaseUrl: () => client.getBaseUrl(),
    };
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(config: SmartEngineServiceConfig): void {
    const maxAttempts = config.maxReconnectAttempts ?? 0;
    const interval = config.reconnectInterval ?? 5000;

    if (maxAttempts > 0 && this.reconnectAttempts >= maxAttempts) {
      this.logger.error(`Max reconnection attempts (${maxAttempts}) reached. Giving up.`);
      return;
    }

    this.reconnectAttempts++;
    this.logger.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${interval}ms`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.initialize(config);
      } catch {
        // Error already logged in initialize
      }
    }, interval);
  }
}
