/**
 * Polkadot Chain Helpers
 *
 * Utility functions for working with Polkadot/Substrate chains.
 */

/**
 * Planck per DOT (10^10)
 */
const PLANCK_PER_DOT = 10_000_000_000n;

/**
 * Validate a Polkadot SS58 address format.
 *
 * @param address - The address to validate
 * @returns True if the address appears to be a valid SS58 format
 *
 * @example
 * ```typescript
 * validatePolkadotAddress('1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg');
 * // true
 * ```
 */
export function validatePolkadotAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Basic SS58 format check
  // - Starts with 1-9 or a-z (case insensitive)
  // - Contains only alphanumeric characters (base58)
  // - Length is typically 47-48 characters for Polkadot
  const ss58Regex = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/;

  return ss58Regex.test(address);
}

/**
 * Format a Polkadot address (truncate for display).
 *
 * @param address - Full SS58 address
 * @param prefixLength - Number of characters to show at start (default 6)
 * @param suffixLength - Number of characters to show at end (default 6)
 * @returns Truncated address like "1FRMM8...V24fg"
 *
 * @example
 * ```typescript
 * formatPolkadotAddress('1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg');
 * // '1FRMM8...V24fg'
 * ```
 */
export function formatPolkadotAddress(address: string, prefixLength = 6, suffixLength = 5): string {
  if (!address || address.length <= prefixLength + suffixLength) {
    return address;
  }

  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Convert DOT to Planck (smallest unit).
 *
 * @param dot - Amount in DOT
 * @returns Amount in Planck (bigint)
 *
 * @example
 * ```typescript
 * dotToPlanck(1.5);
 * // 15000000000n (15 billion planck)
 * ```
 */
export function dotToPlanck(dot: number): bigint {
  if (dot < 0) {
    throw new Error('DOT amount cannot be negative');
  }

  // Handle decimal precision
  const [whole, decimal = ''] = dot.toString().split('.');
  const paddedDecimal = decimal.padEnd(10, '0').slice(0, 10);

  return BigInt(whole) * PLANCK_PER_DOT + BigInt(paddedDecimal);
}

/**
 * Convert Planck to DOT.
 *
 * @param planck - Amount in Planck
 * @returns Amount in DOT as a number
 *
 * @example
 * ```typescript
 * planckToDot(15000000000n);
 * // 1.5
 * ```
 */
export function planckToDot(planck: bigint): number {
  if (planck < 0n) {
    throw new Error('Planck amount cannot be negative');
  }

  const whole = planck / PLANCK_PER_DOT;
  const remainder = planck % PLANCK_PER_DOT;

  // Convert to number with decimal
  return Number(whole) + Number(remainder) / Number(PLANCK_PER_DOT);
}

/**
 * Format Planck amount as DOT string with specified decimals.
 *
 * @param planck - Amount in Planck
 * @param decimals - Number of decimal places to show (default 4)
 * @returns Formatted DOT string
 *
 * @example
 * ```typescript
 * formatDot(15000000000n, 2);
 * // '1.50 DOT'
 * ```
 */
export function formatDot(planck: bigint, decimals = 4): string {
  const dot = planckToDot(planck);
  return `${dot.toFixed(decimals)} DOT`;
}

/**
 * Parse a DOT amount string to Planck.
 *
 * @param dotString - Amount as string (e.g., "1.5" or "1.5 DOT")
 * @returns Amount in Planck
 *
 * @example
 * ```typescript
 * parseDotString('1.5 DOT');
 * // 15000000000n
 * ```
 */
export function parseDotString(dotString: string): bigint {
  // Remove 'DOT' suffix and whitespace
  const cleaned = dotString.replace(/\s*DOT\s*$/i, '').trim();
  const dot = parseFloat(cleaned);

  if (isNaN(dot)) {
    throw new Error(`Invalid DOT amount: ${dotString}`);
  }

  return dotToPlanck(dot);
}
