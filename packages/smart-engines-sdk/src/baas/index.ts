/**
 * BaaS Client Module
 *
 * Backend-as-a-Service client for Smart Networks SDK.
 * Provides authentication, database, storage, functions, and messaging services.
 *
 * @example
 * ```typescript
 * import { BaasClient } from '@hsuite/smart-engines-sdk';
 *
 * const baas = new BaasClient({
 *   hostUrl: 'https://host.smartengines.io',
 *   appId: 'my-app',
 * });
 *
 * await baas.authenticate({
 *   chain: 'hedera',
 *   walletAddress: '0.0.12345',
 *   publicKey: 'your-public-key',
 *   signFn: (msg) => wallet.sign(msg),
 * });
 *
 * await baas.dbInsert('users', { name: 'Alice' });
 * ```
 */

// Client
export { BaasClient, BaasError, type AuthenticateOptions } from './client';

// Types - export all
export * from './types';
