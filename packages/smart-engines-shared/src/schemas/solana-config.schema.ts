import { z } from 'zod';

/**
 * Solana Configuration Schema
 */
export const SolanaConfigSchema = z.object({
  chain: z.literal('solana'),
  network: z.enum(['mainnet', 'testnet', 'devnet', 'local']),
  endpoint: z.string().url().default('https://api.mainnet-beta.solana.com'),
  privateKey: z.string().nullish(), // Base58 encoded - allows undefined, null, or string
  commitment: z.enum(['processed', 'confirmed', 'finalized']).default('confirmed'),
  timeout: z.number().optional(),
});

export type SolanaConfig = z.infer<typeof SolanaConfigSchema>;
