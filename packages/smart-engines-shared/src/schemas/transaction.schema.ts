import { z } from 'zod';
import { ChainTypeSchema } from './chain.schema';
import { AccountIdSchema } from './account.schema';

/**
 * Transaction status
 */
export const TransactionStatusSchema = z.enum(['pending', 'success', 'failed', 'expired']);

export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

/**
 * Transaction type
 */
export const TransactionTypeSchema = z.enum([
  'transfer',
  'token_transfer',
  'account_create',
  'token_create',
  'token_mint',
  'token_burn',
  'contract_call',
  'contract_create',
  'topic_message',
  'other',
]);

export type TransactionType = z.infer<typeof TransactionTypeSchema>;

/**
 * Base transaction schema
 */
export const TransactionSchema = z.object({
  id: z.string(),
  chain: ChainTypeSchema,
  type: TransactionTypeSchema,
  status: TransactionStatusSchema,
  timestamp: z.date(),
  from: AccountIdSchema,
  to: AccountIdSchema.optional(),
  amount: z.string().optional(),
  fee: z.string(),
  memo: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

/**
 * Transaction receipt schema
 */
export const TransactionReceiptSchema = z.object({
  transactionId: z.string(),
  chain: ChainTypeSchema,
  status: TransactionStatusSchema,
  blockNumber: z.number().optional(),
  blockHash: z.string().optional(),
  timestamp: z.date(),
  gasUsed: z.string().optional(),
  effectiveFee: z.string(),
  logs: z.array(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type TransactionReceipt = z.infer<typeof TransactionReceiptSchema>;
