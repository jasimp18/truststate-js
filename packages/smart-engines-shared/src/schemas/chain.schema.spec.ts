import { ChainTypeSchema, NetworkTypeSchema } from './chain.schema';

describe('ChainSchemas', () => {
  describe('ChainTypeSchema', () => {
    it('should validate valid chain types', () => {
      expect(() => ChainTypeSchema.parse('hedera')).not.toThrow();
      expect(() => ChainTypeSchema.parse('xrpl')).not.toThrow();
      expect(() => ChainTypeSchema.parse('polkadot')).not.toThrow();
      expect(() => ChainTypeSchema.parse('solana')).not.toThrow();
    });

    it('should reject invalid chain types', () => {
      expect(() => ChainTypeSchema.parse('avalanche')).toThrow();
      expect(() => ChainTypeSchema.parse('cardano')).toThrow();
      expect(() => ChainTypeSchema.parse('')).toThrow();
    });

    it('should infer correct TypeScript type', () => {
      const chain = ChainTypeSchema.parse('hedera');
      // TypeScript type check - assignment confirms the type inference works
      const typeTest: 'hedera' | 'xrpl' | 'polkadot' | 'solana' | 'stellar' | 'ethereum' | 'polygon' | 'bitcoin' = chain;
      // Use the variable to avoid unused variable warning
      expect(typeTest).toBe(chain);
    });
  });

  describe('NetworkTypeSchema', () => {
    it('should validate valid network types', () => {
      expect(() => NetworkTypeSchema.parse('mainnet')).not.toThrow();
      expect(() => NetworkTypeSchema.parse('testnet')).not.toThrow();
      expect(() => NetworkTypeSchema.parse('devnet')).not.toThrow();
      expect(() => NetworkTypeSchema.parse('local')).not.toThrow();
    });

    it('should reject invalid network types', () => {
      expect(() => NetworkTypeSchema.parse('production')).toThrow();
      expect(() => NetworkTypeSchema.parse('staging')).toThrow();
      expect(() => NetworkTypeSchema.parse('')).toThrow();
    });
  });
});
