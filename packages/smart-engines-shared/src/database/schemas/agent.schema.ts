import mongoose, { Schema, Document } from 'mongoose';
import { AgentStatusType, AgentType } from '../../interfaces/validators.interface';
import { SupportedChain } from '../../types/network-types';

/**
 * Smart Agent Document Interface
 *
 * Represents a persisted smart agent entity with lifecycle state,
 * chain configuration, and rules binding.
 */
export interface SmartAgentDocument extends Document {
  /** Unique agent identifier (UUID) */
  agentId: string;
  /** Human-readable agent name */
  name: string;
  /** Agent type classification */
  type: AgentType;
  /** Current lifecycle state */
  status: AgentStatusType;
  /** Owner wallet address (human — full control) */
  ownerWallet: string;
  /** Agent wallet address (autonomous — constrained operations) */
  agentWallet: string;
  /** Treasury account identifier */
  treasuryAccount: string;
  /** Primary chain for this agent */
  primaryChain: SupportedChain;
  /** Additional chains this agent operates on */
  additionalChains: SupportedChain[];
  /** Host ID where agent is registered */
  hostId: string;
  /** Serialized organism rules configuration */
  rulesConfig: Record<string, unknown>;
  /** Hash of rules config for on-chain verification */
  rulesHash: string;
  /** Per-chain wallet state map */
  chainState: Record<string, unknown>;
  /** Last activity timestamp */
  lastActiveAt?: Date;
  /** When agent was permanently revoked */
  revokedAt?: Date;
  /** Auto-managed timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** Valid agent type values */
const AGENT_TYPES: AgentType[] = ['trading', 'monitoring', 'analytics', 'custom'];

/** Valid agent status values */
const AGENT_STATUSES: AgentStatusType[] = [
  'pending',
  'active',
  'paused',
  'stopped',
  'awaiting_approval',
  'revoked',
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

/**
 * Smart Agent MongoDB Schema
 */
export const SmartAgentSchema = new Schema<SmartAgentDocument>(
  {
    agentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: AGENT_TYPES },
    status: { type: String, required: true, enum: AGENT_STATUSES, default: 'pending', index: true },
    ownerWallet: { type: String, required: true, index: true },
    agentWallet: { type: String, required: true },
    treasuryAccount: { type: String, required: true },
    primaryChain: { type: String, required: true, enum: SUPPORTED_CHAINS },
    additionalChains: [{ type: String, enum: SUPPORTED_CHAINS }],
    hostId: { type: String, required: true, index: true },
    rulesConfig: { type: Schema.Types.Mixed, required: true },
    rulesHash: { type: String, required: true },
    chainState: { type: Schema.Types.Mixed, default: {} },
    lastActiveAt: { type: Date },
    revokedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'smart_agents',
  }
);

// Compound indexes
SmartAgentSchema.index({ ownerWallet: 1, status: 1 });
SmartAgentSchema.index({ hostId: 1, status: 1 });

export const SmartAgentModel = mongoose.model<SmartAgentDocument>('SmartAgent', SmartAgentSchema);
