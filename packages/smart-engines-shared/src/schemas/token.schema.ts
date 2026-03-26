import { z } from 'zod';
import { ChainTypeSchema } from './chain.schema';
import { AccountIdSchema } from './account.schema';

/**
 * Token type
 */
export const TokenTypeSchema = z.enum(['fungible', 'nft', 'semi_fungible']);

export type TokenType = z.infer<typeof TokenTypeSchema>;

/**
 * Token schema
 */
export const TokenSchema = z.object({
  tokenId: z.string(),
  chain: ChainTypeSchema,
  name: z.string(),
  symbol: z.string(),
  decimals: z.number().int().min(0),
  totalSupply: z.string(),
  type: TokenTypeSchema,
  creator: AccountIdSchema.optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date().optional(),
});

export type Token = z.infer<typeof TokenSchema>;

/**
 * NFT metadata schema
 */
export const NFTMetadataSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  attributes: z
    .array(
      z.object({
        trait_type: z.string(),
        value: z.union([z.string(), z.number(), z.boolean()]),
      })
    )
    .optional(),
  external_url: z.string().url().optional(),
});

export type NFTMetadata = z.infer<typeof NFTMetadataSchema>;

/**
 * Token info with holder details
 */
export const TokenInfoSchema = TokenSchema.extend({
  holders: z.number().optional(),
  transferCount: z.number().optional(),
  circulatingSupply: z.string().optional(),
});

export type TokenInfo = z.infer<typeof TokenInfoSchema>;
