/**
 * ChainId Value Object
 *
 * Encapsulates blockchain chain identifier
 * Ensures type safety and immutability
 */
export class ChainId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value.toLowerCase();
    this.validate();
  }

  /**
   * Supported chain types
   */
  static readonly SUPPORTED_CHAINS = [
    'hedera',
    'xrpl',
    'polkadot',
    'solana',
    'ethereum',
    'polygon',
    'avalanche',
    'bsc',
  ] as const;

  /**
   * Factory method to create ChainId
   */
  static create(value: string): ChainId {
    return new ChainId(value);
  }

  /**
   * Create predefined chain IDs
   */
  static hedera(): ChainId {
    return new ChainId('hedera');
  }

  static xrpl(): ChainId {
    return new ChainId('xrpl');
  }

  static polkadot(): ChainId {
    return new ChainId('polkadot');
  }

  static solana(): ChainId {
    return new ChainId('solana');
  }

  /**
   * Validate chain ID
   */
  private validate(): void {
    if (!this.value || typeof this.value !== 'string') {
      throw new Error('ChainId must be a non-empty string');
    }

    const trimmed = this.value.trim();
    if (trimmed.length === 0) {
      throw new Error('ChainId cannot be empty or whitespace');
    }

    // Only lowercase alphanumeric and hyphens
    if (!/^[a-z0-9-]+$/.test(this.value)) {
      throw new Error('ChainId must contain only lowercase letters, numbers, and hyphens');
    }

    if (this.value.length > 50) {
      throw new Error('ChainId cannot exceed 50 characters');
    }
  }

  /**
   * Get the string value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check if chain is supported
   */
  isSupported(): boolean {
    return (ChainId.SUPPORTED_CHAINS as readonly string[]).includes(this.value);
  }

  /**
   * Check equality
   */
  equals(other: ChainId): boolean {
    if (!other || !(other instanceof ChainId)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Create a copy
   */
  clone(): ChainId {
    return new ChainId(this.value);
  }
}
