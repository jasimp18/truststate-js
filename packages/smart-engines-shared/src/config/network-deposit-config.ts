/**
 * Network Deposit Configuration
 *
 * Configuration for deposit requirements across different network membership types.
 * These values determine the staking requirements for validators, hosts, and gateways.
 *
 * @packageDocumentation
 */
import { z } from 'zod';
import {
  NetworkMembershipType,
  NetworkDepositConfig,
  NetworkDepositRequirements,
  getDefaultDepositConfig,
} from '../types/network-types';

// =============================================================================
// Environment-Aware Configuration
// =============================================================================

/**
 * Get deposit configuration from environment variables or use defaults
 *
 * Environment variables:
 * - VALIDATOR_DEPOSIT_AMOUNT: Required deposit for validators (default: 10000000)
 * - HOST_DEPOSIT_AMOUNT: Required deposit for hosts (default: 5000000)
 * - GATEWAY_DEPOSIT_AMOUNT: Required deposit for gateways (default: 2000000)
 * - MEMBERSHIP_LOCK_DURATION_DAYS: Lock duration in days (default: 365)
 * - MEMBERSHIP_RENEWAL_WINDOW_DAYS: Renewal window in days (default: 30)
 */
export function getNetworkDepositConfig(): NetworkDepositConfig {
  const lockDurationDays = parseInt(process.env.MEMBERSHIP_LOCK_DURATION_DAYS || '365', 10);
  const renewalWindowDays = parseInt(process.env.MEMBERSHIP_RENEWAL_WINDOW_DAYS || '30', 10);

  return {
    validator: {
      depositAmount: process.env.VALIDATOR_DEPOSIT_AMOUNT || '10000000',
      lockDurationDays,
      renewalWindowDays,
    },
    host: {
      depositAmount: process.env.HOST_DEPOSIT_AMOUNT || '5000000',
      lockDurationDays,
      renewalWindowDays,
    },
    gateway: {
      depositAmount: process.env.GATEWAY_DEPOSIT_AMOUNT || '2000000',
      lockDurationDays,
      renewalWindowDays,
    },
  };
}

/**
 * Get deposit requirements for a specific network type
 *
 * @param networkType - The network membership type
 * @returns Deposit requirements for the specified network type
 */
export function getDepositRequirements(
  networkType: NetworkMembershipType
): NetworkDepositRequirements {
  const config = getNetworkDepositConfig();
  return config[networkType];
}

/**
 * Get the deposit amount for a specific network type
 *
 * @param networkType - The network membership type
 * @returns Deposit amount as a string (in smallest unit)
 */
export function getDepositAmount(networkType: NetworkMembershipType): string {
  return getDepositRequirements(networkType).depositAmount;
}

/**
 * Get the lock duration for a specific network type
 *
 * @param networkType - The network membership type
 * @returns Lock duration in days
 */
export function getLockDurationDays(networkType: NetworkMembershipType): number {
  return getDepositRequirements(networkType).lockDurationDays;
}

/**
 * Get the lock duration in milliseconds for a specific network type
 *
 * @param networkType - The network membership type
 * @returns Lock duration in milliseconds
 */
export function getLockDurationMs(networkType: NetworkMembershipType): number {
  const days = getLockDurationDays(networkType);
  return days * 24 * 60 * 60 * 1000;
}

// =============================================================================
// Configuration Validation
// =============================================================================

/**
 * Zod schema for validating the complete network deposit configuration
 */
export const NetworkDepositConfigEnvSchema = z.object({
  VALIDATOR_DEPOSIT_AMOUNT: z.string().optional().default('10000000'),
  HOST_DEPOSIT_AMOUNT: z.string().optional().default('5000000'),
  GATEWAY_DEPOSIT_AMOUNT: z.string().optional().default('2000000'),
  MEMBERSHIP_LOCK_DURATION_DAYS: z
    .string()
    .optional()
    .default('365')
    .transform((val) => parseInt(val, 10)),
  MEMBERSHIP_RENEWAL_WINDOW_DAYS: z
    .string()
    .optional()
    .default('30')
    .transform((val) => parseInt(val, 10)),
});

/**
 * Validate deposit configuration from environment
 *
 * @returns Validated configuration or throws on validation error
 */
export function validateDepositConfigEnv(): z.infer<typeof NetworkDepositConfigEnvSchema> {
  return NetworkDepositConfigEnvSchema.parse(process.env);
}

// =============================================================================
// Configuration Constants
// =============================================================================

/**
 * Default deposit configuration (exported for reference)
 */
export const DEFAULT_NETWORK_DEPOSIT_CONFIG: NetworkDepositConfig = getDefaultDepositConfig();

/**
 * Deposit amount tiers for display purposes
 */
export const DEPOSIT_TIERS = {
  validator: {
    label: 'Validator',
    amount: '10,000,000 HSUITE',
    description: 'Full network participation with TSS signing capabilities',
  },
  host: {
    label: 'Host',
    amount: '5,000,000 HSUITE',
    description: 'Infrastructure provider for smart engine hosting',
  },
  gateway: {
    label: 'Gateway',
    amount: '2,000,000 HSUITE',
    description: 'API gateway for external network access',
  },
} as const;

/**
 * Get a formatted deposit amount for display
 *
 * @param networkType - The network membership type
 * @returns Formatted deposit amount string
 */
export function getFormattedDepositAmount(networkType: NetworkMembershipType): string {
  const amount = getDepositAmount(networkType);
  const numAmount = BigInt(amount);
  return numAmount.toLocaleString();
}

/**
 * Compare deposit requirements between network types
 *
 * @param typeA - First network type
 * @param typeB - Second network type
 * @returns Positive if typeA requires more, negative if typeB requires more, 0 if equal
 */
export function compareDepositRequirements(
  typeA: NetworkMembershipType,
  typeB: NetworkMembershipType
): number {
  const amountA = BigInt(getDepositAmount(typeA));
  const amountB = BigInt(getDepositAmount(typeB));

  if (amountA > amountB) return 1;
  if (amountA < amountB) return -1;
  return 0;
}
