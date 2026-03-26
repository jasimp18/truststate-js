/**
 * NestJS integration for @hsuite/smart-engines-sdk
 *
 * Provides dependency injection and lifecycle management for SmartEngineClient.
 *
 * @example Basic usage
 * ```typescript
 * import { Module } from '@nestjs/common';
 * import { SmartEngineModule } from '@hsuite/smart-engines-sdk/nestjs';
 *
 * @Module({
 *   imports: [
 *     SmartEngineModule.forRoot({
 *       baseUrl: 'https://validator.example.com',
 *       apiKey: process.env.SMART_ENGINE_API_KEY,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @example Injecting the service
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { SmartEngineService } from '@hsuite/smart-engines-sdk/nestjs';
 *
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly smartEngine: SmartEngineService) {}
 *
 *   async getHealth() {
 *     const client = this.smartEngine.getClient();
 *     return client.getHealth();
 *   }
 *
 *   async useBaas() {
 *     const baas = this.smartEngine.getBaasClient();
 *     const isHealthy = await baas.isHealthy();
 *     return { healthy: isHealthy, url: baas.getBaseUrl() };
 *   }
 * }
 * ```
 */

// Module
export { SmartEngineModule } from './smart-engine.module';
export type {
  SmartEngineModuleAsyncOptions,
  SmartEngineOptionsFactory,
} from './smart-engine.module';

// Service
export { SmartEngineService, SMART_ENGINE_CONFIG } from './smart-engine.service';
export type { SmartEngineServiceConfig, BaasClient } from './smart-engine.service';
