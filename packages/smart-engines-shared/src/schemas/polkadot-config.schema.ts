import { z } from 'zod';

/**
 * Polkadot Configuration Schema
 */
export const PolkadotConfigSchema = z.object({
  chain: z.literal('polkadot'),
  network: z.enum(['mainnet', 'testnet', 'westend', 'rococo', 'local']),
  endpoint: z.string().url().default('wss://rpc.polkadot.io'),
  mnemonic: z.string().optional(),
  seed: z.string().optional(),
  timeout: z.number().optional(),
});

export type PolkadotConfig = z.infer<typeof PolkadotConfigSchema>;
