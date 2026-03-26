import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import {
  SmartEngineService,
  SmartEngineServiceConfig,
  SMART_ENGINE_CONFIG,
} from './smart-engine.service';

/**
 * Options for async module configuration
 */
export interface SmartEngineModuleAsyncOptions {
  /** Imports required for the factory */
  imports?: any[];
  /** Factory function to create configuration */
  useFactory?: (...args: any[]) => Promise<SmartEngineServiceConfig> | SmartEngineServiceConfig;
  /** Dependencies to inject into the factory */
  inject?: any[];
  /** Class to use for configuration */
  useClass?: Type<SmartEngineOptionsFactory>;
  /** Existing provider to use for configuration */
  useExisting?: Type<SmartEngineOptionsFactory>;
  /** Make the module global */
  isGlobal?: boolean;
}

/**
 * Factory interface for creating SmartEngine configuration
 */
export interface SmartEngineOptionsFactory {
  createSmartEngineOptions(): Promise<SmartEngineServiceConfig> | SmartEngineServiceConfig;
}

/**
 * SmartEngineModule - NestJS module for Smart Engines SDK integration
 *
 * Provides dependency injection for SmartEngineService with support for
 * both synchronous and asynchronous configuration.
 *
 * @example Synchronous configuration with forRoot
 * ```typescript
 * import { Module } from '@nestjs/common';
 * import { SmartEngineModule } from '@hsuite/smart-engines-sdk/nestjs';
 *
 * @Module({
 *   imports: [
 *     SmartEngineModule.forRoot({
 *       baseUrl: 'https://validator.example.com',
 *       apiKey: 'your-api-key',
 *       testConnection: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example Async configuration with forRootAsync
 * ```typescript
 * import { Module } from '@nestjs/common';
 * import { ConfigService, ConfigModule } from '@nestjs/config';
 * import { SmartEngineModule } from '@hsuite/smart-engines-sdk/nestjs';
 *
 * @Module({
 *   imports: [
 *     SmartEngineModule.forRootAsync({
 *       imports: [ConfigModule],
 *       useFactory: (configService: ConfigService) => ({
 *         baseUrl: configService.get('SMART_ENGINE_URL'),
 *         apiKey: configService.get('SMART_ENGINE_API_KEY'),
 *         testConnection: true,
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example Using a configuration class
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { SmartEngineModule, SmartEngineOptionsFactory } from '@hsuite/smart-engines-sdk/nestjs';
 *
 * @Injectable()
 * class SmartEngineConfigService implements SmartEngineOptionsFactory {
 *   createSmartEngineOptions() {
 *     return {
 *       baseUrl: process.env.SMART_ENGINE_URL,
 *       apiKey: process.env.SMART_ENGINE_API_KEY,
 *     };
 *   }
 * }
 *
 * @Module({
 *   imports: [
 *     SmartEngineModule.forRootAsync({
 *       useClass: SmartEngineConfigService,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class SmartEngineModule {
  /**
   * Configure the module with static configuration
   *
   * @param config - SmartEngine service configuration
   * @param isGlobal - Whether to make the module global (default: true)
   */
  static forRoot(config: SmartEngineServiceConfig, isGlobal = true): DynamicModule {
    return {
      module: SmartEngineModule,
      global: isGlobal,
      providers: [
        {
          provide: SMART_ENGINE_CONFIG,
          useValue: config,
        },
        SmartEngineService,
      ],
      exports: [SmartEngineService],
    };
  }

  /**
   * Configure the module with async configuration
   *
   * Supports factory functions, configuration classes, and existing providers.
   *
   * @param options - Async configuration options
   */
  static forRootAsync(options: SmartEngineModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: SmartEngineModule,
      global: options.isGlobal ?? true,
      imports: options.imports || [],
      providers: [...asyncProviders, SmartEngineService],
      exports: [SmartEngineService],
    };
  }

  /**
   * Create async providers based on configuration options
   */
  private static createAsyncProviders(options: SmartEngineModuleAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: SMART_ENGINE_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    if (options.useClass) {
      return [
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
        {
          provide: SMART_ENGINE_CONFIG,
          useFactory: async (optionsFactory: SmartEngineOptionsFactory) =>
            optionsFactory.createSmartEngineOptions(),
          inject: [options.useClass],
        },
      ];
    }

    if (options.useExisting) {
      return [
        {
          provide: SMART_ENGINE_CONFIG,
          useFactory: async (optionsFactory: SmartEngineOptionsFactory) =>
            optionsFactory.createSmartEngineOptions(),
          inject: [options.useExisting],
        },
      ];
    }

    throw new Error(
      'Invalid SmartEngineModuleAsyncOptions: must provide useFactory, useClass, or useExisting'
    );
  }
}
