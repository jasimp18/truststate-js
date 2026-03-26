/**
 * Common utility functions
 */

export * from './circuit-breaker';
export * from './type-guards';

/**
 * Converts a string amount to the smallest unit (e.g., XRP to drops, HBAR to tinybars)
 */
export function toSmallestUnit(amount: string, decimals: number): string {
  const num = parseFloat(amount);
  if (isNaN(num)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  return (num * Math.pow(10, decimals)).toFixed(0);
}

/**
 * Converts from smallest unit to main unit (e.g., drops to XRP, tinybars to HBAR)
 */
export function fromSmallestUnit(amount: string, decimals: number): string {
  const num = parseInt(amount, 10);
  if (isNaN(num)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  return (num / Math.pow(10, decimals)).toString();
}

/**
 * Validates if a string represents a valid positive number
 */
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry utility for async operations
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;

  let lastError: Error;
  let currentDelay = delay;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await sleep(currentDelay);
        currentDelay *= backoff;
      }
    }
  }

  throw lastError!;
}
