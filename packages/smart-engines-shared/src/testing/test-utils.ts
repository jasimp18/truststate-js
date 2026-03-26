/**
 * Shared Test Utilities
 *
 * Common utilities and helpers for testing across all libraries
 */
import * as crypto from 'crypto';

/**
 * Generate a random wallet address for the specified chain
 */
export function generateWalletAddress(
  chain: 'hedera' | 'xrpl' | 'polkadot' | 'solana' | 'ethereum' = 'hedera'
): string {
  switch (chain) {
    case 'hedera':
      return `0.0.${Math.floor(Math.random() * 1000000)}`;
    case 'xrpl':
      return `r${crypto.randomBytes(20).toString('base64').slice(0, 24).replace(/[+/=]/g, 'X')}`;
    case 'polkadot':
      return `5${crypto.randomBytes(32).toString('base64').slice(0, 47).replace(/[+/=]/g, 'A')}`;
    case 'solana':
      return crypto.randomBytes(32).toString('base64').slice(0, 44);
    case 'ethereum':
      return `0x${crypto.randomBytes(20).toString('hex')}`;
    default:
      return `unknown-${crypto.randomUUID()}`;
  }
}

/**
 * Generate a random hex string of specified length
 */
export function randomHex(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a random base64 string of specified length
 */
export function randomBase64(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('base64');
}

/**
 * Generate a random UUID
 */
export function randomUUID(): string {
  return crypto.randomUUID();
}

/**
 * Create a mock Ed25519 key pair
 */
export function generateMockKeyPair(): { publicKey: Buffer; privateKey: Buffer } {
  return {
    publicKey: crypto.randomBytes(32),
    privateKey: crypto.randomBytes(32),
  };
}

/**
 * Create a mock signature
 */
export function generateMockSignature(length: number = 64): Buffer {
  return crypto.randomBytes(length);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert that a function throws an error with specific message
 */
export async function expectAsyncThrow(
  fn: () => Promise<unknown>,
  expectedMessage?: string | RegExp
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Expected function to throw') {
        throw error;
      }
      if (expectedMessage) {
        if (typeof expectedMessage === 'string') {
          expect(error.message).toContain(expectedMessage);
        } else {
          expect(error.message).toMatch(expectedMessage);
        }
      }
    }
  }
}

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;
  return { result, durationMs };
}

/**
 * Measure execution time of a sync function
 */
export function measureTimeSync<T>(fn: () => T): { result: T; durationMs: number } {
  const start = performance.now();
  const result = fn();
  const durationMs = performance.now() - start;
  return { result, durationMs };
}

/**
 * Create a mock timestamp (Date)
 */
export function mockTimestamp(offset: number = 0): Date {
  return new Date(Date.now() + offset);
}

/**
 * Create a mock epoch timestamp
 */
export function mockEpochSeconds(offset: number = 0): number {
  return Math.floor(Date.now() / 1000) + offset;
}

/**
 * Generate test data of specified size
 */
export function generateTestData(sizeBytes: number): Buffer {
  return crypto.randomBytes(sizeBytes);
}

/**
 * Create a deterministic hash for testing
 */
export function deterministicHash(input: string | Buffer): Buffer {
  return crypto.createHash('sha256').update(input).digest();
}

/**
 * Wait for condition to be true with timeout
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const result = await condition();
    if (result) {
      return true;
    }
    await sleep(intervalMs);
  }

  return false;
}

/**
 * Create a mock NestJS module testing helper
 */
export function createMockProvider<T>(
  token: string | symbol,
  implementation: Partial<T>
): {
  provide: string | symbol;
  useValue: Partial<T>;
} {
  return {
    provide: token,
    useValue: implementation,
  };
}
