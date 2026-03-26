import { z } from 'zod';
import { ChainTypeSchema } from './chain.schema';

/**
 * Account identifier schema - generic string that works across chains
 */
export const AccountIdSchema = z.string().min(1);

// Note: Export as AccountIdString to avoid collision with AccountId value object
export type AccountIdString = z.infer<typeof AccountIdSchema>;

/**
 * Account information schema
 */
export const AccountInfoSchema = z.object({
  accountId: AccountIdSchema,
  balance: z.string(), // String to handle large numbers and decimals
  chain: ChainTypeSchema,
  publicKey: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type AccountInfo = z.infer<typeof AccountInfoSchema>;

/**
 * Account balance schema with token details
 */
export const AccountBalanceSchema = z.object({
  accountId: AccountIdSchema,
  chain: ChainTypeSchema,
  nativeBalance: z.string(),
  tokens: z
    .array(
      z.object({
        tokenId: z.string(),
        balance: z.string(),
        decimals: z.number().int().min(0),
        symbol: z.string().optional(),
      })
    )
    .optional(),
  timestamp: z.date(),
});

export type AccountBalance = z.infer<typeof AccountBalanceSchema>;
