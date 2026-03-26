/**
 * TokenAmount Value Object
 *
 * Encapsulates token amount with decimals
 * Provides type-safe operations and validation
 */
export class TokenAmount {
  private readonly value: string;
  private readonly decimals: number;

  private constructor(value: string, decimals: number = 0) {
    this.value = value;
    this.decimals = decimals;
    this.validate();
  }

  /**
   * Factory method to create TokenAmount
   */
  static create(value: string | number, decimals: number = 0): TokenAmount {
    const stringValue = typeof value === 'number' ? value.toString() : value;
    return new TokenAmount(stringValue, decimals);
  }

  /**
   * Create from smallest unit (e.g., wei, drops, tinybar)
   */
  static fromSmallestUnit(value: string | number, decimals: number): TokenAmount {
    const bigValue = BigInt(value.toString());
    const divisor = BigInt(10) ** BigInt(decimals);
    const wholePart = bigValue / divisor;
    const fractionalPart = bigValue % divisor;

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const amountStr = `${wholePart}.${fractionalStr}`.replace(/\.?0+$/, '');

    return new TokenAmount(amountStr || '0', decimals);
  }

  /**
   * Validate token amount
   */
  private validate(): void {
    if (!this.value) {
      throw new Error('TokenAmount value cannot be empty');
    }

    if (this.decimals < 0 || !Number.isInteger(this.decimals)) {
      throw new Error('Decimals must be a non-negative integer');
    }

    if (this.decimals > 18) {
      throw new Error('Decimals cannot exceed 18');
    }

    const num = parseFloat(this.value);
    if (isNaN(num)) {
      throw new Error(`Invalid token amount: ${this.value}`);
    }

    if (num < 0) {
      throw new Error('TokenAmount cannot be negative');
    }

    // Check decimal places don't exceed specified decimals
    const parts = this.value.split('.');
    if (parts.length === 2 && parts[1].length > this.decimals) {
      throw new Error(
        `Token amount has ${parts[1].length} decimal places but only ${this.decimals} allowed`
      );
    }
  }

  /**
   * Get the string value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Get decimals
   */
  getDecimals(): number {
    return this.decimals;
  }

  /**
   * Convert to smallest unit (e.g., wei, drops, tinybar)
   */
  toSmallestUnit(): string {
    const [wholePart = '0', fractionalPart = ''] = this.value.split('.');
    const paddedFractional = fractionalPart.padEnd(this.decimals, '0');
    const smallestUnit =
      BigInt(wholePart) * BigInt(10) ** BigInt(this.decimals) + BigInt(paddedFractional);
    return smallestUnit.toString();
  }

  /**
   * Convert to number (use with caution for large amounts)
   */
  toNumber(): number {
    return parseFloat(this.value);
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Add two token amounts
   */
  add(other: TokenAmount): TokenAmount {
    if (this.decimals !== other.decimals) {
      throw new Error('Cannot add amounts with different decimals');
    }

    const thisSmallest = BigInt(this.toSmallestUnit());
    const otherSmallest = BigInt(other.toSmallestUnit());
    const sum = thisSmallest + otherSmallest;

    return TokenAmount.fromSmallestUnit(sum.toString(), this.decimals);
  }

  /**
   * Subtract two token amounts
   */
  subtract(other: TokenAmount): TokenAmount {
    if (this.decimals !== other.decimals) {
      throw new Error('Cannot subtract amounts with different decimals');
    }

    const thisSmallest = BigInt(this.toSmallestUnit());
    const otherSmallest = BigInt(other.toSmallestUnit());
    const difference = thisSmallest - otherSmallest;

    if (difference < 0n) {
      throw new Error('Result cannot be negative');
    }

    return TokenAmount.fromSmallestUnit(difference.toString(), this.decimals);
  }

  /**
   * Compare with another amount
   */
  compareTo(other: TokenAmount): number {
    if (this.decimals !== other.decimals) {
      throw new Error('Cannot compare amounts with different decimals');
    }

    const thisSmallest = BigInt(this.toSmallestUnit());
    const otherSmallest = BigInt(other.toSmallestUnit());

    if (thisSmallest < otherSmallest) return -1;
    if (thisSmallest > otherSmallest) return 1;
    return 0;
  }

  /**
   * Check if equal
   */
  equals(other: TokenAmount): boolean {
    if (!other || !(other instanceof TokenAmount)) {
      return false;
    }
    return this.decimals === other.decimals && this.value === other.value;
  }

  /**
   * Check if greater than
   */
  isGreaterThan(other: TokenAmount): boolean {
    return this.compareTo(other) > 0;
  }

  /**
   * Check if less than
   */
  isLessThan(other: TokenAmount): boolean {
    return this.compareTo(other) < 0;
  }

  /**
   * Check if zero
   */
  isZero(): boolean {
    return this.toNumber() === 0;
  }
}
