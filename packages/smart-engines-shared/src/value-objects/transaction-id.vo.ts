/**
 * TransactionId Value Object
 *
 * Encapsulates transaction identifier with validation
 * Ensures type safety and immutability
 */
export class TransactionId {
  private readonly value: string;
  private readonly chain: string;

  private constructor(value: string, chain: string) {
    this.value = value;
    this.chain = chain;
    this.validate();
  }

  /**
   * Factory method to create TransactionId
   */
  static create(value: string, chain: string): TransactionId {
    return new TransactionId(value, chain);
  }

  /**
   * Validate transaction ID
   */
  private validate(): void {
    if (!this.value || typeof this.value !== 'string') {
      throw new Error('TransactionId must be a non-empty string');
    }

    if (!this.chain || typeof this.chain !== 'string') {
      throw new Error('Chain must be a non-empty string');
    }

    const trimmed = this.value.trim();
    if (trimmed.length === 0) {
      throw new Error('TransactionId cannot be empty or whitespace');
    }

    if (trimmed.length > 512) {
      throw new Error('TransactionId cannot exceed 512 characters');
    }
  }

  /**
   * Get the string value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Get the chain
   */
  getChain(): string {
    return this.chain;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Get qualified ID (chain:txId)
   */
  toQualifiedString(): string {
    return `${this.chain}:${this.value}`;
  }

  /**
   * Check equality
   */
  equals(other: TransactionId): boolean {
    if (!other || !(other instanceof TransactionId)) {
      return false;
    }
    return this.value === other.value && this.chain === other.chain;
  }

  /**
   * Create a copy
   */
  clone(): TransactionId {
    return new TransactionId(this.value, this.chain);
  }
}
