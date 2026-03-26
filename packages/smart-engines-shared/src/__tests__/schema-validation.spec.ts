/**
 * Shared Library Zod Schema Validation Tests
 *
 * Tests all exported schemas for correct validation, defaults, and rejection.
 */

import {
  // Account schemas
  AccountIdSchema,
  AccountInfoSchema,
  AccountBalanceSchema,
  // Token schemas
  TokenSchema,
  TokenTypeSchema,
  NFTMetadataSchema,
  // Transaction schemas
  TransactionSchema,
  TransactionStatusSchema,
  TransactionTypeSchema,
  // API schemas
  CreateAccountRequestSchema,
  TransferRequestSchema,
  // Chain schemas
  ChainTypeSchema,
} from '../schemas';

// ─── Account Schemas ─────────────────────────────────────────────────────────

describe('Account Schemas', () => {
  describe('AccountIdSchema', () => {
    it('should accept valid Hedera account ID', () => {
      expect(AccountIdSchema.parse('0.0.12345')).toBe('0.0.12345');
    });

    it('should accept valid XRPL address', () => {
      expect(AccountIdSchema.parse('rN7n3473SaZBCG4dFL83w7p1W9cgZw6n4C')).toBeTruthy();
    });

    it('should accept Ethereum address', () => {
      expect(AccountIdSchema.parse('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28')).toBeTruthy();
    });

    it('should reject empty string', () => {
      expect(AccountIdSchema.safeParse('').success).toBe(false);
    });
  });

  describe('AccountInfoSchema', () => {
    const validAccountInfo = {
      accountId: '0.0.12345',
      balance: '100.50000000',
      chain: 'hedera',
    };

    it('should accept valid account info', () => {
      const result = AccountInfoSchema.safeParse(validAccountInfo);
      expect(result.success).toBe(true);
    });

    it('should accept with optional fields', () => {
      const result = AccountInfoSchema.safeParse({
        ...validAccountInfo,
        publicKey: '302a300506032b6570...',
        createdAt: new Date(),
        metadata: { label: 'treasury' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing accountId', () => {
      const result = AccountInfoSchema.safeParse({ balance: '100', chain: 'hedera' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid chain', () => {
      const result = AccountInfoSchema.safeParse({
        ...validAccountInfo,
        chain: 'cardano',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AccountBalanceSchema', () => {
    it('should accept balance with tokens', () => {
      const result = AccountBalanceSchema.safeParse({
        accountId: '0.0.12345',
        chain: 'hedera',
        nativeBalance: '100.00000000',
        tokens: [
          { tokenId: '0.0.55555', balance: '1000', decimals: 8, symbol: 'HSUITE' },
        ],
        timestamp: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it('should accept balance without tokens', () => {
      const result = AccountBalanceSchema.safeParse({
        accountId: '0.0.12345',
        chain: 'hedera',
        nativeBalance: '0.00000001',
        timestamp: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it('should require timestamp', () => {
      const result = AccountBalanceSchema.safeParse({
        accountId: '0.0.12345',
        chain: 'hedera',
        nativeBalance: '100',
      });
      expect(result.success).toBe(false);
    });

    it('should validate token decimals as non-negative integer', () => {
      const result = AccountBalanceSchema.safeParse({
        accountId: '0.0.12345',
        chain: 'hedera',
        nativeBalance: '100',
        tokens: [{ tokenId: '0.0.55555', balance: '1000', decimals: -1 }],
        timestamp: new Date(),
      });
      expect(result.success).toBe(false);
    });
  });
});

// ─── Token Schemas ───────────────────────────────────────────────────────────

describe('Token Schemas', () => {
  describe('TokenTypeSchema', () => {
    it('should accept fungible', () => {
      expect(TokenTypeSchema.parse('fungible')).toBe('fungible');
    });

    it('should accept nft', () => {
      expect(TokenTypeSchema.parse('nft')).toBe('nft');
    });

    it('should accept semi_fungible', () => {
      expect(TokenTypeSchema.parse('semi_fungible')).toBe('semi_fungible');
    });

    it('should reject invalid type', () => {
      expect(TokenTypeSchema.safeParse('erc20').success).toBe(false);
    });
  });

  describe('TokenSchema', () => {
    const validToken = {
      tokenId: '0.0.55555',
      chain: 'hedera',
      name: 'Test Token',
      symbol: 'TT',
      decimals: 8,
      totalSupply: '1000000000000',
      type: 'fungible',
    };

    it('should accept valid token', () => {
      expect(TokenSchema.safeParse(validToken).success).toBe(true);
    });

    it('should reject negative decimals', () => {
      expect(TokenSchema.safeParse({ ...validToken, decimals: -1 }).success).toBe(false);
    });

    it('should reject missing name', () => {
      const { name: _, ...noName } = validToken;
      expect(TokenSchema.safeParse(noName).success).toBe(false);
    });
  });

  describe('NFTMetadataSchema', () => {
    it('should accept valid NFT metadata', () => {
      const result = NFTMetadataSchema.safeParse({
        name: 'Cool NFT #1',
        description: 'A very cool NFT',
        image: 'https://example.com/nft.png',
        attributes: [
          { trait_type: 'Rarity', value: 'Legendary' },
          { trait_type: 'Level', value: 10 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should accept minimal metadata (name only)', () => {
      expect(NFTMetadataSchema.safeParse({ name: 'NFT' }).success).toBe(true);
    });

    it('should reject invalid image URL', () => {
      expect(NFTMetadataSchema.safeParse({ name: 'NFT', image: 'not-a-url' }).success).toBe(false);
    });
  });
});

// ─── Transaction Schemas ─────────────────────────────────────────────────────

describe('Transaction Schemas', () => {
  describe('TransactionStatusSchema', () => {
    it.each(['pending', 'success', 'failed', 'expired'])('should accept %s', (status) => {
      expect(TransactionStatusSchema.parse(status)).toBe(status);
    });

    it('should reject invalid status', () => {
      expect(TransactionStatusSchema.safeParse('confirmed').success).toBe(false);
    });
  });

  describe('TransactionTypeSchema', () => {
    it.each([
      'transfer', 'token_transfer', 'account_create', 'token_create',
      'token_mint', 'token_burn', 'contract_call', 'contract_create',
      'topic_message', 'other',
    ])('should accept %s', (type) => {
      expect(TransactionTypeSchema.parse(type)).toBe(type);
    });
  });

  describe('TransactionSchema', () => {
    const validTx = {
      id: 'tx-001',
      chain: 'hedera',
      type: 'transfer',
      status: 'success',
      timestamp: new Date(),
      from: '0.0.12345',
      to: '0.0.67890',
      amount: '50.00000000',
      fee: '0.00500000',
    };

    it('should accept valid transaction', () => {
      expect(TransactionSchema.safeParse(validTx).success).toBe(true);
    });

    it('should accept transaction without optional to/amount', () => {
      const { to: _, amount: __, ...minimal } = validTx;
      expect(TransactionSchema.safeParse(minimal).success).toBe(true);
    });

    it('should reject missing fee', () => {
      const { fee: _, ...noFee } = validTx;
      expect(TransactionSchema.safeParse(noFee).success).toBe(false);
    });
  });
});

// ─── API Schemas ─────────────────────────────────────────────────────────────

describe('API Schemas', () => {
  describe('CreateAccountRequestSchema', () => {
    const validRequest = {
      chain: 'hedera',
      initialBalance: '10',
      validatorTimestamp: '1766490325.123456789',
      validatorTopicId: '0.0.123456',
    };

    it('should accept valid request', () => {
      const result = CreateAccountRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should apply defaults: immutable=true, securityMode=none', () => {
      const result = CreateAccountRequestSchema.parse(validRequest);
      expect(result.immutable).toBe(true);
      expect(result.securityMode).toBe('none');
    });

    it('should reject missing validatorTimestamp', () => {
      const { validatorTimestamp: _, ...noTs } = validRequest;
      expect(CreateAccountRequestSchema.safeParse(noTs).success).toBe(false);
    });

    it('should reject empty validatorTopicId', () => {
      const result = CreateAccountRequestSchema.safeParse({
        ...validRequest,
        validatorTopicId: '',
      });
      expect(result.success).toBe(false);
    });

    it('should accept all security modes', () => {
      for (const mode of ['none', 'partial', 'full']) {
        const result = CreateAccountRequestSchema.safeParse({
          ...validRequest,
          securityMode: mode,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid security mode', () => {
      expect(
        CreateAccountRequestSchema.safeParse({
          ...validRequest,
          securityMode: 'shared',
        }).success
      ).toBe(false);
    });
  });

  describe('TransferRequestSchema', () => {
    it('should accept valid transfer', () => {
      const result = TransferRequestSchema.safeParse({
        chain: 'hedera',
        from: '0.0.12345',
        to: '0.0.67890',
        amount: '1.00000000',
      });
      expect(result.success).toBe(true);
    });

    it('should accept transfer with tokenId (HTS transfer)', () => {
      const result = TransferRequestSchema.safeParse({
        chain: 'hedera',
        from: '0.0.12345',
        to: '0.0.67890',
        amount: '100',
        tokenId: '0.0.55555',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing from', () => {
      expect(
        TransferRequestSchema.safeParse({
          chain: 'hedera',
          to: '0.0.67890',
          amount: '1',
        }).success
      ).toBe(false);
    });
  });
});

// ─── Error Classes ───────────────────────────────────────────────────────────

describe('Error Classes', () => {
  // Import error classes
  const {
    SmartEngineError,
    ValidationError,
    ChainError,
    TransactionError,
    WalletError,
    AccountError,
    TokenError,
    InfrastructureError,
    ErrorCode,
  } = require('../errors/smart-engine.error');

  describe('SmartEngineError', () => {
    it('should construct with all fields', () => {
      const err = new SmartEngineError(
        'test error',
        ErrorCode.UNKNOWN_ERROR,
        500,
        { key: 'value' },
        true
      );
      expect(err.message).toBe('test error');
      expect(err.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(err.statusCode).toBe(500);
      expect(err.context).toEqual({ key: 'value' });
      expect(err.isRetryable).toBe(true);
      expect(err.name).toBe('SmartEngineError');
    });

    it('should serialize to JSON correctly', () => {
      const err = new SmartEngineError('json test', ErrorCode.VALIDATION_ERROR, 400);
      const json = err.toJSON();
      expect(json.error.name).toBe('SmartEngineError');
      expect(json.error.message).toBe('json test');
      expect(json.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(json.error.statusCode).toBe(400);
    });

    it('should be instanceof Error', () => {
      const err = new SmartEngineError('test', ErrorCode.UNKNOWN_ERROR);
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('ValidationError', () => {
    it('should default to 400 status and VALIDATION_ERROR code', () => {
      const err = new ValidationError('bad input');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(err.isRetryable).toBe(false);
      expect(err.name).toBe('ValidationError');
    });
  });

  describe('ChainError', () => {
    it('should default to 503 and retryable', () => {
      const err = new ChainError('connection lost');
      expect(err.statusCode).toBe(503);
      expect(err.isRetryable).toBe(true);
      expect(err.name).toBe('ChainError');
    });
  });

  describe('TransactionError', () => {
    it('should default to 400 and not retryable', () => {
      const err = new TransactionError('insufficient balance');
      expect(err.statusCode).toBe(400);
      expect(err.isRetryable).toBe(false);
      expect(err.name).toBe('TransactionError');
    });
  });

  describe('Error inheritance', () => {
    it('all errors should extend SmartEngineError', () => {
      expect(new ValidationError('x')).toBeInstanceOf(SmartEngineError);
      expect(new ChainError('x')).toBeInstanceOf(SmartEngineError);
      expect(new TransactionError('x')).toBeInstanceOf(SmartEngineError);
      expect(new WalletError('x')).toBeInstanceOf(SmartEngineError);
      expect(new AccountError('x')).toBeInstanceOf(SmartEngineError);
      expect(new TokenError('x')).toBeInstanceOf(SmartEngineError);
      expect(new InfrastructureError('x')).toBeInstanceOf(SmartEngineError);
    });

    it('all errors should extend Error', () => {
      expect(new ValidationError('x')).toBeInstanceOf(Error);
      expect(new ChainError('x')).toBeInstanceOf(Error);
      expect(new TransactionError('x')).toBeInstanceOf(Error);
    });
  });

  describe('ErrorCode enum', () => {
    it('should have chain-specific codes', () => {
      expect(ErrorCode.CHAIN_NOT_SUPPORTED).toBe('CHAIN_NOT_SUPPORTED');
      expect(ErrorCode.CHAIN_CONNECTION_ERROR).toBe('CHAIN_CONNECTION_ERROR');
    });

    it('should have transaction codes', () => {
      expect(ErrorCode.TRANSACTION_FAILED).toBe('TRANSACTION_FAILED');
      expect(ErrorCode.INSUFFICIENT_BALANCE).toBe('INSUFFICIENT_BALANCE');
    });

    it('should have token codes', () => {
      expect(ErrorCode.TOKEN_NOT_FOUND).toBe('TOKEN_NOT_FOUND');
      expect(ErrorCode.TRUST_LINE_REQUIRED).toBe('TRUST_LINE_REQUIRED');
    });
  });
});

// ─── Chain Type Schema ───────────────────────────────────────────────────────

describe('ChainTypeSchema', () => {
  it.each(['hedera', 'xrpl', 'bitcoin', 'ethereum', 'polygon', 'solana', 'polkadot', 'stellar'])(
    'should accept %s',
    (chain) => {
      expect(ChainTypeSchema.parse(chain)).toBe(chain);
    }
  );

  it('should reject unsupported chains', () => {
    expect(ChainTypeSchema.safeParse('cardano').success).toBe(false);
    expect(ChainTypeSchema.safeParse('avalanche').success).toBe(false);
  });
});
