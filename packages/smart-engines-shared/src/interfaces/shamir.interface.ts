/**
 * Secret Share Interface
 *
 * Represents a single share in Shamir's Secret Sharing scheme (SSS).
 *
 * Shamir's Secret Sharing is a cryptographic method that divides a secret
 * into n parts (shares), where any k parts (threshold) can be used to
 * reconstruct the original secret, but fewer than k parts reveal nothing.
 *
 * ## Usage in Smart Engines
 * Secret shares are used for:
 * - Distributed Key Generation (DKG) ceremonies
 * - TSS/MPC threshold signatures
 * - Emergency key recovery procedures
 *
 * ## Security Note
 * Secret shares should NEVER be stored unencrypted. In production:
 * - Each validator stores only their own share
 * - Shares are encrypted before storage (AES-256-GCM)
 * - Reconstruction only happens ephemerally (<1 second in memory)
 *
 * @example
 * ```typescript
 * // A share for validator index 2
 * const share: SecretShare = {
 *   id: 2,
 *   value: BigInt('0x1234...abcd')
 * };
 * ```
 *
 * @see DKGInitializerService - Uses SecretShare for ceremony initialization
 * @see EmergencyRecoveryService - Uses SecretShare for key recovery
 */
export interface SecretShare {
  /**
   * The share identifier/index.
   * Must be unique among all shares for the same secret.
   * Typically corresponds to the validator's position in the participant list.
   */
  id: number;

  /**
   * The actual share value as a bigint.
   * This is a point on the polynomial used in Shamir's scheme.
   *
   * @security NEVER log or expose this value. Always encrypt before storage.
   */
  value: bigint;
}
