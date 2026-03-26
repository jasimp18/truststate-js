/**
 * Token Capabilities Schema
 *
 * Defines universal token capabilities that are chain-agnostic.
 * Each capability maps to chain-specific implementations.
 */
import { z } from 'zod';

/**
 * Token Capabilities Schema
 *
 * These capabilities define what operations a token supports.
 * The validator layer translates these to chain-specific implementations.
 */
export const TokenCapabilitiesSchema = z.object({
  /**
   * Pause all token operations globally
   * - Hedera: Adds pauseKey to token
   * - XRPL: Enables GlobalFreeze flag on issuer account
   */
  pausable: z.boolean().default(false),

  /**
   * Freeze/restrict specific accounts from transacting
   * - Hedera: Adds freezeKey to token
   * - XRPL: Enables trust line freeze capability
   */
  restrictable: z.boolean().default(false),

  /**
   * KYC/compliance controls for accounts
   * - Hedera: Adds kycKey to token
   * - XRPL: Requires authorized trust lines (RequireAuth)
   */
  compliant: z.boolean().default(false),

  /**
   * Force remove tokens from accounts (compliance wipe)
   * - Hedera: Adds wipeKey to token
   * - XRPL: Enables clawback (lsfAllowTrustLineClawback)
   */
  wipeable: z.boolean().default(false),

  /**
   * Mint additional supply after creation
   * - Hedera: Adds supplyKey to token
   * - XRPL: Issuer can always issue more via Payment
   */
  mintable: z.boolean().default(true),

  /**
   * Burn tokens (reduce supply)
   * - Hedera: Requires supplyKey
   * - XRPL: Send back to issuer (reduces supply)
   */
  burnable: z.boolean().default(true),

  /**
   * Allow transfers between accounts
   * - All chains: Generally always supported
   */
  transferable: z.boolean().default(true),
});

export type TokenCapabilities = z.infer<typeof TokenCapabilitiesSchema>;

/**
 * Capability names as a type
 */
export type CapabilityName = keyof TokenCapabilities;

/**
 * List of all capability names
 */
export const CAPABILITY_NAMES: CapabilityName[] = [
  'pausable',
  'restrictable',
  'compliant',
  'wipeable',
  'mintable',
  'burnable',
  'transferable',
];
