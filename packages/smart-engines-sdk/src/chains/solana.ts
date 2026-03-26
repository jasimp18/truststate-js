/**
 * Solana Chain Helpers
 *
 * Utility functions for working with Solana.
 */

/**
 * Lamports per SOL (10^9)
 */
const LAMPORTS_PER_SOL = 1_000_000_000n;

/**
 * Base58 characters used in Solana addresses
 */
const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Validate a Solana public key / address.
 *
 * Solana addresses are base58-encoded 32-byte public keys,
 * resulting in 32-44 character strings.
 *
 * @param publicKey - The public key to validate
 * @returns True if the public key appears to be valid
 *
 * @example
 * ```typescript
 * validateSolanaPublicKey('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
 * // true
 * ```
 */
export function validateSolanaPublicKey(publicKey: string): boolean {
  if (!publicKey || typeof publicKey !== 'string') {
    return false;
  }

  // Solana public keys are 32-44 characters in base58
  if (publicKey.length < 32 || publicKey.length > 44) {
    return false;
  }

  // Check that all characters are valid base58
  for (const char of publicKey) {
    if (!BASE58_CHARS.includes(char)) {
      return false;
    }
  }

  return true;
}

/**
 * Format a Solana address (truncate for display).
 *
 * @param address - Full Solana address
 * @param prefixLength - Number of characters to show at start (default 4)
 * @param suffixLength - Number of characters to show at end (default 4)
 * @returns Truncated address like "9WzD...AWWM"
 *
 * @example
 * ```typescript
 * formatSolanaAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');
 * // '9WzD...AWWM'
 * ```
 */
export function formatSolanaAddress(address: string, prefixLength = 4, suffixLength = 4): string {
  if (!address || address.length <= prefixLength + suffixLength) {
    return address;
  }

  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Convert SOL to Lamports (smallest unit).
 *
 * @param sol - Amount in SOL
 * @returns Amount in Lamports (bigint)
 *
 * @example
 * ```typescript
 * solToLamports(1.5);
 * // 1500000000n (1.5 billion lamports)
 * ```
 */
export function solToLamports(sol: number): bigint {
  if (sol < 0) {
    throw new Error('SOL amount cannot be negative');
  }

  // Handle decimal precision (9 decimals for SOL)
  const [whole, decimal = ''] = sol.toString().split('.');
  const paddedDecimal = decimal.padEnd(9, '0').slice(0, 9);

  return BigInt(whole) * LAMPORTS_PER_SOL + BigInt(paddedDecimal);
}

/**
 * Convert Lamports to SOL.
 *
 * @param lamports - Amount in Lamports
 * @returns Amount in SOL as a number
 *
 * @example
 * ```typescript
 * lamportsToSol(1500000000n);
 * // 1.5
 * ```
 */
export function lamportsToSol(lamports: bigint): number {
  if (lamports < 0n) {
    throw new Error('Lamports amount cannot be negative');
  }

  const whole = lamports / LAMPORTS_PER_SOL;
  const remainder = lamports % LAMPORTS_PER_SOL;

  // Convert to number with decimal
  return Number(whole) + Number(remainder) / Number(LAMPORTS_PER_SOL);
}

/**
 * Format Lamports amount as SOL string with specified decimals.
 *
 * @param lamports - Amount in Lamports
 * @param decimals - Number of decimal places to show (default 4)
 * @returns Formatted SOL string
 *
 * @example
 * ```typescript
 * formatSol(1500000000n, 2);
 * // '1.50 SOL'
 * ```
 */
export function formatSol(lamports: bigint, decimals = 4): string {
  const sol = lamportsToSol(lamports);
  return `${sol.toFixed(decimals)} SOL`;
}

/**
 * Parse a SOL amount string to Lamports.
 *
 * @param solString - Amount as string (e.g., "1.5" or "1.5 SOL")
 * @returns Amount in Lamports
 *
 * @example
 * ```typescript
 * parseSolString('1.5 SOL');
 * // 1500000000n
 * ```
 */
export function parseSolString(solString: string): bigint {
  // Remove 'SOL' suffix and whitespace
  const cleaned = solString.replace(/\s*SOL\s*$/i, '').trim();
  const sol = parseFloat(cleaned);

  if (isNaN(sol)) {
    throw new Error(`Invalid SOL amount: ${solString}`);
  }

  return solToLamports(sol);
}

/**
 * Check if a string looks like a Solana transaction signature.
 *
 * Solana transaction signatures are 88 characters in base58.
 *
 * @param signature - The signature to validate
 * @returns True if it appears to be a valid transaction signature
 *
 * @example
 * ```typescript
 * isTransactionSignature('5UfDuX7yXY...');
 * // true
 * ```
 */
export function isTransactionSignature(signature: string): boolean {
  if (!signature || typeof signature !== 'string') {
    return false;
  }

  // Transaction signatures are typically 87-88 characters
  if (signature.length < 87 || signature.length > 88) {
    return false;
  }

  // Check that all characters are valid base58
  for (const char of signature) {
    if (!BASE58_CHARS.includes(char)) {
      return false;
    }
  }

  return true;
}
