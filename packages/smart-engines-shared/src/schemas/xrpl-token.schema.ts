import { z } from 'zod';
import { AccountIdSchema } from './account.schema';

/**
 * XRPL Trust Line (Token Balance) Schema
 */
export const XRPLTrustLineSchema = z.object({
  currency: z.string(),
  issuer: z.string(),
  limit: z.string(),
  balance: z.string(),
  flags: z.number().optional(),
  quality_in: z.number().optional(),
  quality_out: z.number().optional(),
});

export type XRPLTrustLine = z.infer<typeof XRPLTrustLineSchema>;

/**
 * XRPL Set Trust Line Request Schema
 */
export const SetTrustLineRequestSchema = z.object({
  chain: z.literal('xrpl'),
  account: AccountIdSchema,
  currency: z.string().min(3).max(3),
  issuer: AccountIdSchema,
  limit: z.string(),
  flags: z.number().optional(),
});

export type SetTrustLineRequest = z.infer<typeof SetTrustLineRequestSchema>;

/**
 * XRPL Token Transfer Request Schema
 */
export const XRPLTokenTransferRequestSchema = z.object({
  chain: z.literal('xrpl'),
  from: AccountIdSchema,
  to: AccountIdSchema,
  currency: z.string(),
  issuer: AccountIdSchema,
  amount: z.string(),
  memo: z.string().optional(),
});

export type XRPLTokenTransferRequest = z.infer<typeof XRPLTokenTransferRequestSchema>;

/**
 * XRPL NFT Mint Request Schema
 */
export const XRPLNFTMintRequestSchema = z.object({
  chain: z.literal('xrpl'),
  account: AccountIdSchema,
  uri: z.string().optional(),
  taxon: z.number().int().min(0).default(0),
  transferFee: z.number().int().min(0).max(50000).optional(),
  flags: z.number().optional(),
});

export type XRPLNFTMintRequest = z.infer<typeof XRPLNFTMintRequestSchema>;

/**
 * XRPL NFT Transfer Request Schema
 */
export const XRPLNFTTransferRequestSchema = z.object({
  chain: z.literal('xrpl'),
  nftId: z.string(),
  from: AccountIdSchema,
  to: AccountIdSchema,
  amount: z.string().optional(), // For selling
});

export type XRPLNFTTransferRequest = z.infer<typeof XRPLNFTTransferRequestSchema>;

/**
 * XRPL NFT Burn Request Schema
 */
export const XRPLNFTBurnRequestSchema = z.object({
  chain: z.literal('xrpl'),
  nftId: z.string(),
  owner: AccountIdSchema,
});

export type XRPLNFTBurnRequest = z.infer<typeof XRPLNFTBurnRequestSchema>;

/**
 * XRPL Create Offer Request Schema
 */
export const XRPLCreateOfferRequestSchema = z.object({
  chain: z.literal('xrpl'),
  account: AccountIdSchema,
  takerPays: z.object({
    currency: z.string(),
    issuer: z.string().optional(),
    value: z.string(),
  }),
  takerGets: z.object({
    currency: z.string(),
    issuer: z.string().optional(),
    value: z.string(),
  }),
  expiration: z.number().optional(),
  offerSequence: z.number().optional(),
});

export type XRPLCreateOfferRequest = z.infer<typeof XRPLCreateOfferRequestSchema>;
