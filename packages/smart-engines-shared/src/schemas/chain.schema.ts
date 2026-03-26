import { z } from 'zod';

/**
 * Supported blockchain types
 */
export const ChainTypeSchema = z.enum([
  'hedera',
  'xrpl',
  'polkadot',
  'solana',
  'stellar',
  'ethereum',
  'polygon',
  'bitcoin',
]);

export type ChainType = z.infer<typeof ChainTypeSchema>;

/**
 * Network environment types
 */
export const NetworkTypeSchema = z.enum(['mainnet', 'testnet', 'devnet', 'local']);

export type NetworkType = z.infer<typeof NetworkTypeSchema>;

/**
 * Chain metadata schema
 */
export const ChainMetadataSchema = z.object({
  chain: ChainTypeSchema,
  network: NetworkTypeSchema,
  nativeCurrency: z.object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number().int().min(0),
  }),
  blockTime: z.number().optional(),
  rpcEndpoint: z.string().url().optional(),
});

export type ChainMetadata = z.infer<typeof ChainMetadataSchema>;
