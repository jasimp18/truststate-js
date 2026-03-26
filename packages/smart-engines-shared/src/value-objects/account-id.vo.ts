/**
 * AccountId Value Object
 *
 * Encapsulates account identifier with validation
 * Ensures type safety and immutability
 */
export class AccountId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    this.validate();
  }

  /**
   * Factory method to create AccountId
   */
  static create(value: string): AccountId {
    return new AccountId(value);
  }

  /**
   * Validate account ID
   */
  private validate(): void {
    if (!this.value || typeof this.value !== 'string') {
      throw new Error('AccountId must be a non-empty string');
    }

    const trimmed = this.value.trim();
    if (trimmed.length === 0) {
      throw new Error('AccountId cannot be empty or whitespace');
    }

    if (trimmed.length > 255) {
      throw new Error('AccountId cannot exceed 255 characters');
    }
  }

  /**
   * Get the string value
   */
  toString(): string {
    return this.value;
  }

  /**
   * Get the value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Check equality
   */
  equals(other: AccountId): boolean {
    if (!other || !(other instanceof AccountId)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Create a copy
   */
  clone(): AccountId {
    return new AccountId(this.value);
  }
}
