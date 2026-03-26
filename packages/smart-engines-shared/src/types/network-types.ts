/**
 * Network Membership Types
 *
 * Defines types for multi-network membership in the Smart Engines ecosystem.
 * Supports three network types: validators, hosts, and gateways.
 *
 * @packageDocumentation
 */
import { z } from 'zod';
import type { ChainType } from '../schemas/chain.schema';

/**
 * Alias for backward compatibility with multi-chain-core
 */
export type SupportedChain = ChainType;

// =============================================================================
// Network Type Definition
// =============================================================================

/**
 * Network membership type - determines the role of a node in the network
 *
 * - validator: Full validator nodes that participate in TSS signing and consensus
 * - host: Infrastructure hosts that run smart engines for decentralized applications
 * - gateway: API gateway nodes that provide external access to the network
 */
export type NetworkMembershipType = 'validator' | 'host' | 'gateway';

/**
 * Zod schema for NetworkMembershipType validation
 */
export const NetworkMembershipTypeSchema = z.enum(['validator', 'host', 'gateway']);

// =============================================================================
// Membership NFT Metadata
// =============================================================================

/**
 * Membership status for NFT metadata
 */
export type MembershipStatus = 'pending' | 'active' | 'exiting' | 'exited' | 'banned';

/**
 * Zod schema for MembershipStatus validation
 */
export const MembershipStatusSchema = z.enum(['pending', 'active', 'exiting', 'exited', 'banned']);

/**
 * Membership NFT Metadata
 *
 * Metadata structure for membership NFTs that represent network participation.
 * This metadata is stored on-chain and used to verify membership.
 */
export interface MembershipNftMetadata {
  /** Unique identifier for the node */
  nodeId: string;
  /** Type of network membership */
  networkType: NetworkMembershipType;
  /** Blockchain chain where membership was established */
  chain: SupportedChain;
  /** Node's endpoint URL for network communication */
  endpoint: string;
  /** Node's public key for cryptographic verification */
  publicKey: string;
  /** ISO 8601 timestamp when the node joined the network */
  joinedAt: string;
  /** Transaction ID of the deposit that activated membership */
  depositTxId: string;
  /** Current membership status */
  status: MembershipStatus;
  /** Network-specific configuration (optional) */
  networkConfig?: NetworkSpecificConfig;
}

/**
 * Zod schema for MembershipNftMetadata validation
 */
export const MembershipNftMetadataSchema = z.object({
  nodeId: z.string().min(1),
  networkType: NetworkMembershipTypeSchema,
  chain: z.enum(['hedera', 'xrpl', 'polkadot', 'solana']),
  endpoint: z.string().url(),
  publicKey: z.string().min(1),
  joinedAt: z.string().datetime(),
  depositTxId: z.string().min(1),
  status: MembershipStatusSchema,
  networkConfig: z.record(z.unknown()).optional(),
});

// =============================================================================
// Network-Specific Configuration
// =============================================================================

/**
 * Network-specific configuration that can be attached to membership metadata
 */
export type NetworkSpecificConfig = Record<string, unknown>;

/**
 * Validator-specific configuration
 */
export interface ValidatorNetworkConfig {
  /** TSS participation threshold */
  tssThreshold?: number;
  /** Supported chains for validation */
  supportedChains?: SupportedChain[];
  /** Validator capabilities */
  capabilities?: string[];
}

/**
 * Host-specific configuration
 */
export interface HostNetworkConfig {
  /** Maximum number of smart engines this host can run */
  maxEngines?: number;
  /** Supported engine types */
  supportedEngineTypes?: string[];
  /** Host region for geographic distribution */
  region?: string;
}

/**
 * Gateway-specific configuration
 */
export interface GatewayNetworkConfig {
  /** Rate limiting configuration */
  rateLimits?: {
    requestsPerSecond: number;
    burstLimit: number;
  };
  /** Supported API versions */
  supportedApiVersions?: string[];
  /** Geographic region */
  region?: string;
}

// =============================================================================
// Network Deposit Configuration
// =============================================================================

/**
 * Deposit configuration for a specific network type
 */
export interface NetworkDepositRequirements {
  /** Required deposit amount in smallest unit (e.g., tinybars for HBAR) */
  depositAmount: string;
  /** Lock duration in days */
  lockDurationDays: number;
  /** Minimum renewal window in days before expiry */
  renewalWindowDays?: number;
}

/**
 * Complete deposit configuration for all network types
 */
export interface NetworkDepositConfig {
  validator: NetworkDepositRequirements;
  host: NetworkDepositRequirements;
  gateway: NetworkDepositRequirements;
}

/**
 * Zod schema for NetworkDepositRequirements validation
 */
export const NetworkDepositRequirementsSchema = z.object({
  depositAmount: z.string().min(1),
  lockDurationDays: z.number().int().positive(),
  renewalWindowDays: z.number().int().positive().optional(),
});

/**
 * Zod schema for NetworkDepositConfig validation
 */
export const NetworkDepositConfigSchema = z.object({
  validator: NetworkDepositRequirementsSchema,
  host: NetworkDepositRequirementsSchema,
  gateway: NetworkDepositRequirementsSchema,
});

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if a value is a valid NetworkMembershipType
 */
export function isNetworkMembershipType(value: unknown): value is NetworkMembershipType {
  return value === 'validator' || value === 'host' || value === 'gateway';
}

/**
 * Type guard to check if a value is a valid MembershipStatus
 */
export function isMembershipStatus(value: unknown): value is MembershipStatus {
  return (
    value === 'pending' ||
    value === 'active' ||
    value === 'exiting' ||
    value === 'exited' ||
    value === 'banned'
  );
}

/**
 * Type guard to check if metadata matches MembershipNftMetadata structure
 */
export function isMembershipNftMetadata(value: unknown): value is MembershipNftMetadata {
  const result = MembershipNftMetadataSchema.safeParse(value);
  return result.success;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get human-readable label for network membership type
 */
export function getNetworkTypeLabel(type: NetworkMembershipType): string {
  const labels: Record<NetworkMembershipType, string> = {
    validator: 'Validator Node',
    host: 'Host Node',
    gateway: 'Gateway Node',
  };
  return labels[type];
}

/**
 * Get human-readable description for network membership type
 */
export function getNetworkTypeDescription(type: NetworkMembershipType): string {
  const descriptions: Record<NetworkMembershipType, string> = {
    validator:
      'Full validator nodes that participate in TSS signing and consensus operations across multiple chains.',
    host: 'Infrastructure hosts that run smart engines for decentralized applications and services.',
    gateway:
      'API gateway nodes that provide external access to the network and handle rate limiting.',
  };
  return descriptions[type];
}

/**
 * Check if a network type requires TSS participation
 */
export function requiresTssParticipation(type: NetworkMembershipType): boolean {
  return type === 'validator';
}

/**
 * Get the default deposit configuration for a network type
 */
export function getDefaultDepositConfig(): NetworkDepositConfig {
  return {
    validator: {
      depositAmount: '10000000',
      lockDurationDays: 365,
      renewalWindowDays: 30,
    },
    host: {
      depositAmount: '5000000',
      lockDurationDays: 365,
      renewalWindowDays: 30,
    },
    gateway: {
      depositAmount: '2000000',
      lockDurationDays: 365,
      renewalWindowDays: 30,
    },
  };
}
