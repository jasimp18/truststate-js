import { TokenAmount } from './token-amount.vo';

describe('TokenAmount Value Object', () => {
  describe('create', () => {
    it('should create from string value', () => {
      const amount = TokenAmount.create('100.5', 2);
      expect(amount.getValue()).toBe('100.5');
      expect(amount.getDecimals()).toBe(2);
    });

    it('should create from number value', () => {
      const amount = TokenAmount.create(100.5, 2);
      expect(amount.getValue()).toBe('100.5');
    });

    it('should create with default decimals (0)', () => {
      const amount = TokenAmount.create('100');
      expect(amount.getDecimals()).toBe(0);
    });
  });

  describe('validation', () => {
    it('should throw error for empty value', () => {
      expect(() => TokenAmount.create('', 2)).toThrow('TokenAmount value cannot be empty');
    });

    it('should throw error for negative decimals', () => {
      expect(() => TokenAmount.create('100', -1)).toThrow(
        'Decimals must be a non-negative integer'
      );
    });

    it('should throw error for non-integer decimals', () => {
      expect(() => TokenAmount.create('100', 2.5)).toThrow(
        'Decimals must be a non-negative integer'
      );
    });

    it('should throw error for decimals exceeding 18', () => {
      expect(() => TokenAmount.create('100', 19)).toThrow('Decimals cannot exceed 18');
    });

    it('should throw error for invalid amount', () => {
      expect(() => TokenAmount.create('abc', 2)).toThrow('Invalid token amount');
    });

    it('should throw error for negative amount', () => {
      expect(() => TokenAmount.create('-100', 2)).toThrow('TokenAmount cannot be negative');
    });

    it('should throw error for too many decimal places', () => {
      expect(() => TokenAmount.create('100.123', 2)).toThrow('decimal places but only 2 allowed');
    });
  });

  describe('fromSmallestUnit', () => {
    it('should convert from smallest unit with decimals', () => {
      const amount = TokenAmount.fromSmallestUnit('100000000', 8);
      expect(amount.getValue()).toBe('1');
      expect(amount.getDecimals()).toBe(8);
    });

    it('should handle fractional amounts', () => {
      const amount = TokenAmount.fromSmallestUnit('123456789', 8);
      expect(amount.getValue()).toBe('1.23456789');
    });

    it('should handle zero', () => {
      const amount = TokenAmount.fromSmallestUnit('0', 8);
      expect(amount.getValue()).toBe('0');
    });
  });

  describe('toSmallestUnit', () => {
    it('should convert to smallest unit', () => {
      const amount = TokenAmount.create('1', 8);
      expect(amount.toSmallestUnit()).toBe('100000000');
    });

    it('should handle fractional amounts', () => {
      const amount = TokenAmount.create('1.23456789', 8);
      expect(amount.toSmallestUnit()).toBe('123456789');
    });

    it('should handle zero decimals', () => {
      const amount = TokenAmount.create('100', 0);
      expect(amount.toSmallestUnit()).toBe('100');
    });
  });

  describe('arithmetic operations', () => {
    it('should add two amounts', () => {
      const amount1 = TokenAmount.create('1.5', 2);
      const amount2 = TokenAmount.create('2.3', 2);
      const sum = amount1.add(amount2);
      expect(sum.getValue()).toBe('3.8');
    });

    it('should throw error when adding amounts with different decimals', () => {
      const amount1 = TokenAmount.create('1.5', 2);
      const amount2 = TokenAmount.create('2.3', 4);
      expect(() => amount1.add(amount2)).toThrow('Cannot add amounts with different decimals');
    });

    it('should subtract two amounts', () => {
      const amount1 = TokenAmount.create('5.5', 2);
      const amount2 = TokenAmount.create('2.3', 2);
      const diff = amount1.subtract(amount2);
      expect(diff.getValue()).toBe('3.2');
    });

    it('should throw error for negative result in subtraction', () => {
      const amount1 = TokenAmount.create('1.0', 2);
      const amount2 = TokenAmount.create('2.0', 2);
      expect(() => amount1.subtract(amount2)).toThrow('Result cannot be negative');
    });
  });

  describe('comparison operations', () => {
    it('should compare amounts correctly', () => {
      const amount1 = TokenAmount.create('1.5', 2);
      const amount2 = TokenAmount.create('2.3', 2);
      const amount3 = TokenAmount.create('1.5', 2);

      expect(amount1.compareTo(amount2)).toBe(-1);
      expect(amount2.compareTo(amount1)).toBe(1);
      expect(amount1.compareTo(amount3)).toBe(0);
    });

    it('should check isGreaterThan', () => {
      const amount1 = TokenAmount.create('2.5', 2);
      const amount2 = TokenAmount.create('1.5', 2);
      expect(amount1.isGreaterThan(amount2)).toBe(true);
      expect(amount2.isGreaterThan(amount1)).toBe(false);
    });

    it('should check isLessThan', () => {
      const amount1 = TokenAmount.create('1.5', 2);
      const amount2 = TokenAmount.create('2.5', 2);
      expect(amount1.isLessThan(amount2)).toBe(true);
      expect(amount2.isLessThan(amount1)).toBe(false);
    });

    it('should check isZero', () => {
      const zeroAmount = TokenAmount.create('0', 2);
      const nonZeroAmount = TokenAmount.create('1', 2);
      expect(zeroAmount.isZero()).toBe(true);
      expect(nonZeroAmount.isZero()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal amounts', () => {
      const amount1 = TokenAmount.create('1.5', 2);
      const amount2 = TokenAmount.create('1.5', 2);
      expect(amount1.equals(amount2)).toBe(true);
    });

    it('should return false for different values', () => {
      const amount1 = TokenAmount.create('1.5', 2);
      const amount2 = TokenAmount.create('2.5', 2);
      expect(amount1.equals(amount2)).toBe(false);
    });

    it('should return false for different decimals', () => {
      const amount1 = TokenAmount.create('1.5', 2);
      const amount2 = TokenAmount.create('1.5', 4);
      expect(amount1.equals(amount2)).toBe(false);
    });
  });
});
