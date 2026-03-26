import mongoose, { Schema, Document } from 'mongoose';
import { AgentOperationType } from '../../interfaces/validators.interface';
import { SupportedChain } from '../../types/network-types';

/**
 * Agent Event Document Interface
 *
 * Represents an auditable event in a smart agent's lifecycle.
 * Used for event sourcing and audit trail.
 */
export interface AgentEventDocument extends Document {
  /** Agent this event belongs to */
  agentId: string;
  /** Operation that was performed */
  action: AgentOperationType;
  /** Wallet that initiated the action */
  callerWallet: string;
  /** Chain the action occurred on (if chain-specific) */
  chain?: SupportedChain;
  /** Outcome of the action */
  status: 'success' | 'rejected' | 'pending_approval';
  /** Reason for rejection or additional context */
  reason?: string;
  /** Action-specific data (amounts, pairs, etc.) */
  metadata?: Record<string, unknown>;
  /** Rules version hash at time of action */
  rulesHash?: string;
  /** HCS topic message sequence number (if on-chain audit enabled) */
  hcsSequenceNumber?: number;
  /** Auto-managed timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** Valid agent operation types */
const AGENT_OPERATIONS: AgentOperationType[] = [
  'register',
  'fund',
  'trade',
  'withdraw',
  'pause',
  'resume',
  'revoke',
  'modify_rules',
  'approve',
  'reject',
];

/** Valid supported chain values */
const SUPPORTED_CHAINS: SupportedChain[] = [
  'hedera',
  'xrpl',
  'solana',
  'polkadot',
  'ethereum',
  'polygon',
  'bitcoin',
];

/** Valid event status values */
const EVENT_STATUSES = ['success', 'rejected', 'pending_approval'] as const;

/**
 * Agent Event MongoDB Schema
 */
export const AgentEventSchema = new Schema<AgentEventDocument>(
  {
    agentId: { type: String, required: true, index: true },
    action: { type: String, required: true, enum: AGENT_OPERATIONS, index: true },
    callerWallet: { type: String, required: true },
    chain: { type: String, enum: SUPPORTED_CHAINS },
    status: { type: String, required: true, enum: EVENT_STATUSES },
    reason: { type: String },
    metadata: { type: Schema.Types.Mixed },
    rulesHash: { type: String },
    hcsSequenceNumber: { type: Number },
  },
  {
    timestamps: true,
    collection: 'agent_events',
  }
);

// Compound indexes for common queries
AgentEventSchema.index({ agentId: 1, createdAt: -1 });
AgentEventSchema.index({ agentId: 1, action: 1 });

export const AgentEventModel = mongoose.model<AgentEventDocument>('AgentEvent', AgentEventSchema);
