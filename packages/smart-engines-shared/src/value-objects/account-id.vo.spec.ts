import { AccountId } from './account-id.vo';

describe('AccountId Value Object', () => {
  describe('create', () => {
    it('should create valid account ID', () => {
      const accountId = AccountId.create('0.0.12345');
      expect(accountId).toBeInstanceOf(AccountId);
      expect(accountId.getValue()).toBe('0.0.12345');
    });

    it('should create account ID with string value', () => {
      const accountId = AccountId.create('rTestAccount123');
      expect(accountId.toString()).toBe('rTestAccount123');
    });
  });

  describe('validation', () => {
    it('should throw error for empty string', () => {
      // Empty string is falsy, so hits the first validation check
      expect(() => AccountId.create('')).toThrow('AccountId must be a non-empty string');
    });

    it('should throw error for whitespace only', () => {
      expect(() => AccountId.create('   ')).toThrow('AccountId cannot be empty or whitespace');
    });

    it('should throw error for null/undefined', () => {
      expect(() => AccountId.create(null as any)).toThrow('AccountId must be a non-empty string');
      expect(() => AccountId.create(undefined as any)).toThrow(
        'AccountId must be a non-empty string'
      );
    });

    it('should throw error for non-string values', () => {
      expect(() => AccountId.create(12345 as any)).toThrow('AccountId must be a non-empty string');
    });

    it('should throw error for string exceeding 255 characters', () => {
      const longString = 'a'.repeat(256);
      expect(() => AccountId.create(longString)).toThrow('AccountId cannot exceed 255 characters');
    });

    it('should accept string with exactly 255 characters', () => {
      const maxString = 'a'.repeat(255);
      const accountId = AccountId.create(maxString);
      expect(accountId.getValue()).toBe(maxString);
    });
  });

  describe('equals', () => {
    it('should return true for equal account IDs', () => {
      const id1 = AccountId.create('0.0.12345');
      const id2 = AccountId.create('0.0.12345');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different account IDs', () => {
      const id1 = AccountId.create('0.0.12345');
      const id2 = AccountId.create('0.0.67890');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      const id = AccountId.create('0.0.12345');
      expect(id.equals(null as any)).toBe(false);
      expect(id.equals(undefined as any)).toBe(false);
    });
  });

  describe('clone', () => {
    it('should create an independent copy', () => {
      const original = AccountId.create('0.0.12345');
      const cloned = original.clone();

      expect(cloned).not.toBe(original); // Different instances
      expect(cloned.equals(original)).toBe(true); // Same value
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const accountId = AccountId.create('0.0.12345');
      expect(accountId.toString()).toBe('0.0.12345');
    });
  });
});
