/**
 * XRPL-specific helper functions
 */

/**
 * Validate XRPL address format
 */
export function validateXRPLAddress(address: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
}

/**
 * Format XRPL address
 */
export function formatXRPLAddress(address: string): string {
  if (!validateXRPLAddress(address)) {
    throw new Error(`Invalid XRPL address format: ${address}`);
  }
  return address;
}

/**
 * Convert XRP to drops (1 XRP = 1,000,000 drops)
 */
export function xrpToDrops(xrp: string | number): string {
  const amount = typeof xrp === 'string' ? parseFloat(xrp) : xrp;
  if (isNaN(amount) || amount < 0) {
    throw new Error(`Invalid XRP amount: ${xrp}`);
  }
  return (amount * 1_000_000).toFixed(0);
}

/**
 * Convert drops to XRP
 */
export function dropsToXrp(drops: string | number): string {
  const amount = typeof drops === 'string' ? parseInt(drops, 10) : drops;
  if (isNaN(amount) || amount < 0) {
    throw new Error(`Invalid drops amount: ${drops}`);
  }
  return (amount / 1_000_000).toString();
}

/**
 * Parse XRP amount from string
 */
export function parseXRP(amount: string): number {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0) {
    throw new Error(`Invalid XRP amount: ${amount}`);
  }
  return num;
}

/**
 * Validate XRPL currency code
 */
export function validateCurrencyCode(code: string): boolean {
  // Standard 3-character currency code or 40-character hex
  return /^[A-Z]{3}$/.test(code) || /^[0-9A-F]{40}$/i.test(code);
}
