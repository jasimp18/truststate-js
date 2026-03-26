import { z } from 'zod';
import { NetworkTypeSchema } from './chain.schema';

/**
 * Hedera chain configuration
 */
export const HederaConfigSchema = z.object({
  chain: z.literal('hedera'),
  network: NetworkTypeSchema,
  accountId: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid Hedera account ID format'),
  privateKey: z.string().min(64),
  publicKey: z.string().min(64).optional(),
  mirrorNode: z.string().url().optional(),
  maxQueryPayment: z.number().positive().optional(),
  maxTransactionFee: z.number().positive().optional(),
});

export type HederaConfig = z.infer<typeof HederaConfigSchema>;

/**
 * XRPL chain configuration
 */
export const XRPLConfigSchema = z.object({
  chain: z.literal('xrpl'),
  network: NetworkTypeSchema,
  address: z.string().startsWith('r', 'Invalid XRPL address format'),
  seed: z.string().min(29),
  endpoint: z.string().url(),
  timeout: z.number().positive().optional(),
  feeMultiplier: z.number().positive().optional(),
});

export type XRPLConfig = z.infer<typeof XRPLConfigSchema>;

/**
 * Polkadot chain configuration
 */
export const PolkadotConfigSchema = z.object({
  chain: z.literal('polkadot'),
  network: NetworkTypeSchema,
  endpoint: z.string().url().default('wss://rpc.polkadot.io'),
  mnemonic: z.string().optional(),
  seed: z.string().optional(),
  privateKey: z.string().optional(),
  timeout: z.number().positive().optional(),
});

export type PolkadotConfig = z.infer<typeof PolkadotConfigSchema>;

/**
 * Solana chain configuration
 *
 * Used by libs/chain-solana for SPL token operations.
 */
export const SolanaConfigSchema = z.object({
  chain: z.literal('solana'),
  network: NetworkTypeSchema,
  endpoint: z.string().url().default('https://api.mainnet-beta.solana.com'),
  privateKey: z.string(),
  commitment: z.enum(['processed', 'confirmed', 'finalized']).optional(),
});

export type SolanaConfig = z.infer<typeof SolanaConfigSchema>;

/**
 * Stellar chain configuration
 *
 * Used by libs/chain-stellar for Stellar asset and account operations.
 * Stellar uses Ed25519 keypairs and the Horizon API for queries.
 */
export const StellarConfigSchema = z.object({
  chain: z.literal('stellar'),
  network: NetworkTypeSchema,
  publicKey: z.string().regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar public key format'),
  secretKey: z.string().regex(/^S[A-Z2-7]{55}$/, 'Invalid Stellar secret key format'),
  horizonUrl: z.string().url().default('https://horizon-testnet.stellar.org'),
  networkPassphrase: z.string().optional(),
  timeout: z.number().positive().optional(),
});

export type StellarConfig = z.infer<typeof StellarConfigSchema>;

/**
 * Discriminated union for all chain configs
 */
export const ChainConfigSchema = z.discriminatedUnion('chain', [
  HederaConfigSchema,
  XRPLConfigSchema,
  PolkadotConfigSchema,
  SolanaConfigSchema,
  StellarConfigSchema,
]);

export type ChainConfig = z.infer<typeof ChainConfigSchema>;
