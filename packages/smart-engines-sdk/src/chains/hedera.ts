/**
 * Hedera-specific helper functions
 */

/**
 * Format Hedera account ID (0.0.xxxxx)
 */
export function formatHederaAccountId(id: string): string {
  // Validate format
  if (!/^\d+\.\d+\.\d+$/.test(id)) {
    throw new Error(`Invalid Hedera account ID format: ${id}`);
  }
  return id;
}

/**
 * Parse HBAR amount from string
 */
export function parseHbar(amount: string): number {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0) {
    throw new Error(`Invalid HBAR amount: ${amount}`);
  }
  return num;
}

/**
 * Convert HBAR to tinybars (1 HBAR = 100,000,000 tinybars)
 */
export function hbarToTinybars(hbar: string | number): string {
  const amount = typeof hbar === 'string' ? parseFloat(hbar) : hbar;
  return (amount * 100_000_000).toFixed(0);
}

/**
 * Convert tinybars to HBAR
 */
export function tinybarsToHbar(tinybars: string | number): string {
  const amount = typeof tinybars === 'string' ? parseInt(tinybars, 10) : tinybars;
  return (amount / 100_000_000).toString();
}

/**
 * Format Hedera token ID (0.0.xxxxx)
 */
export function formatHederaTokenId(id: string): string {
  if (!/^\d+\.\d+\.\d+$/.test(id)) {
    throw new Error(`Invalid Hedera token ID format: ${id}`);
  }
  return id;
}

/**
 * Format Hedera topic ID (0.0.xxxxx)
 */
export function formatHederaTopicId(id: string): string {
  if (!/^\d+\.\d+\.\d+$/.test(id)) {
    throw new Error(`Invalid Hedera topic ID format: ${id}`);
  }
  return id;
}
