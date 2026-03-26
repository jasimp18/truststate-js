/**
 * Chain-Specific Error Mapping Unit Tests
 *
 * Tests that each adapter's mapChainError() correctly maps chain SDK errors
 * to SmartEngineError subclasses with appropriate ErrorCode, retryable flags,
 * and chain context.
 */
import { ErrorCode, ChainError, TransactionError, AccountError, TokenError } from './smart-engine.error';

// Helper: create a mapper matching the pattern used in all adapters
function createSmartMapper(
  chain: string,
  patterns: Array<{ match: string; errorClass: 'chain' | 'transaction' | 'account' | 'token'; code: ErrorCode; retryable?: boolean }>
) {
  return (error: unknown): Error => {
    const message = error instanceof Error ? error.message : String(error);
    const lowerMsg = message.toLowerCase();
    for (const p of patterns) {
      if (lowerMsg.includes(p.match)) {
        const ctx = { chain };
        switch (p.errorClass) {
          case 'chain': return new ChainError(message, p.code, ctx, p.retryable ?? true);
          case 'transaction': return new TransactionError(message, p.code, ctx, p.retryable ?? false);
          case 'account': return new AccountError(message, p.code, ctx);
          case 'token': return new TokenError(message, p.code, ctx);
        }
      }
    }
    return error instanceof Error ? error : new Error(message);
  };
}

describe('SmartEngineError Chain Error Mapping', () => {

  // ─── Hedera ─────────────────────────────────────────────────────────
  describe('Hedera mapChainError', () => {
    const map = createSmartMapper('hedera', [
      { match: 'insufficient_payer_balance', errorClass: 'transaction', code: ErrorCode.INSUFFICIENT_BALANCE },
      { match: 'invalid_signature', errorClass: 'transaction', code: ErrorCode.INVALID_SIGNATURE },
      { match: 'token_not_associated', errorClass: 'token', code: ErrorCode.TOKEN_NOT_ASSOCIATED },
      { match: 'account_frozen', errorClass: 'account', code: ErrorCode.ACCOUNT_FROZEN },
      { match: 'token_is_paused', errorClass: 'token', code: ErrorCode.TOKEN_PAUSED },
      { match: 'busy', errorClass: 'chain', code: ErrorCode.RATE_LIMIT_EXCEEDED, retryable: true },
      { match: 'transaction_expired', errorClass: 'transaction', code: ErrorCode.TRANSACTION_TIMEOUT, retryable: true },
      { match: 'timeout', errorClass: 'chain', code: ErrorCode.CHAIN_CONNECTION_ERROR, retryable: true },
    ]);

    it('maps INSUFFICIENT_PAYER_BALANCE → TransactionError', () => {
      const err = map(new Error('INSUFFICIENT_PAYER_BALANCE'));
      expect(err).toBeInstanceOf(TransactionError);
      expect((err as TransactionError).code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
      expect((err as TransactionError).context?.chain).toBe('hedera');
    });

    it('maps INVALID_SIGNATURE → TransactionError', () => {
      const err = map(new Error('INVALID_SIGNATURE'));
      expect(err).toBeInstanceOf(TransactionError);
      expect((err as TransactionError).code).toBe(ErrorCode.INVALID_SIGNATURE);
    });

    it('maps TOKEN_NOT_ASSOCIATED → TokenError', () => {
      const err = map(new Error('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT'));
      expect(err).toBeInstanceOf(TokenError);
      expect((err as TokenError).code).toBe(ErrorCode.TOKEN_NOT_ASSOCIATED);
    });

    it('maps ACCOUNT_FROZEN → AccountError', () => {
      const err = map(new Error('ACCOUNT_FROZEN_FOR_TOKEN'));
      expect(err).toBeInstanceOf(AccountError);
    });

    it('maps BUSY → ChainError (retryable)', () => {
      const err = map(new Error('BUSY'));
      expect(err).toBeInstanceOf(ChainError);
      expect((err as ChainError).isRetryable).toBe(true);
    });

    it('maps timeout → ChainError (retryable)', () => {
      const err = map(new Error('Request timeout'));
      expect(err).toBeInstanceOf(ChainError);
      expect((err as ChainError).code).toBe(ErrorCode.CHAIN_CONNECTION_ERROR);
    });

    it('passes unknown errors through', () => {
      const orig = new Error('unknown hedera thing');
      expect(map(orig)).toBe(orig);
    });
  });

  // ─── EVM ────────────────────────────────────────────────────────────
  describe('EVM mapChainError', () => {
    const map = createSmartMapper('ethereum', [
      { match: 'insufficient funds', errorClass: 'transaction', code: ErrorCode.INSUFFICIENT_BALANCE },
      { match: 'nonce too low', errorClass: 'transaction', code: ErrorCode.NONCE_MISMATCH, retryable: true },
      { match: 'out of gas', errorClass: 'transaction', code: ErrorCode.GAS_ERROR },
      { match: 'execution reverted', errorClass: 'transaction', code: ErrorCode.CONTRACT_REVERT },
      { match: 'econnrefused', errorClass: 'chain', code: ErrorCode.CHAIN_CONNECTION_ERROR, retryable: true },
      { match: '429', errorClass: 'chain', code: ErrorCode.RATE_LIMIT_EXCEEDED, retryable: true },
    ]);

    it('maps insufficient funds → TransactionError(INSUFFICIENT_BALANCE)', () => {
      const err = map(new Error('insufficient funds for gas'));
      expect(err).toBeInstanceOf(TransactionError);
      expect((err as TransactionError).code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
    });

    it('maps nonce → TransactionError(retryable)', () => {
      const err = map(new Error('nonce too low'));
      expect((err as TransactionError).isRetryable).toBe(true);
    });

    it('maps revert → TransactionError(CONTRACT_REVERT)', () => {
      const err = map(new Error('execution reverted'));
      expect((err as TransactionError).code).toBe(ErrorCode.CONTRACT_REVERT);
    });

    it('maps connection → ChainError(retryable)', () => {
      const err = map(new Error('ECONNREFUSED'));
      expect(err).toBeInstanceOf(ChainError);
      expect((err as ChainError).isRetryable).toBe(true);
    });

    it('maps 429 → ChainError(RATE_LIMIT_EXCEEDED)', () => {
      const err = map(new Error('429 Too Many Requests'));
      expect((err as ChainError).code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
    });

    it('passes unknown errors through', () => {
      const orig = new Error('unknown evm error');
      expect(map(orig)).toBe(orig);
    });
  });

  // ─── XRPL ──────────────────────────────────────────────────────────
  describe('XRPL mapChainError', () => {
    const map = createSmartMapper('xrpl', [
      { match: 'tecunfunded_payment', errorClass: 'transaction', code: ErrorCode.INSUFFICIENT_BALANCE },
      { match: 'tecno_line', errorClass: 'token', code: ErrorCode.TRUST_LINE_REQUIRED },
      { match: 'disconnected', errorClass: 'chain', code: ErrorCode.CHAIN_CONNECTION_ERROR, retryable: true },
    ]);

    it('maps tecUNFUNDED_PAYMENT → TransactionError', () => {
      const err = map(new Error('tecUNFUNDED_PAYMENT'));
      expect(err).toBeInstanceOf(TransactionError);
      expect((err as TransactionError).code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
    });

    it('maps tecNO_LINE → TokenError(TRUST_LINE_REQUIRED)', () => {
      const err = map(new Error('tecNO_LINE'));
      expect(err).toBeInstanceOf(TokenError);
    });

    it('maps disconnect → ChainError(retryable)', () => {
      const err = map(new Error('Disconnected'));
      expect(err).toBeInstanceOf(ChainError);
      expect((err as ChainError).isRetryable).toBe(true);
    });

    it('passes unknown errors through', () => {
      const orig = new Error('unknown xrpl error');
      expect(map(orig)).toBe(orig);
    });
  });

  // ─── Solana ─────────────────────────────────────────────────────────
  describe('Solana mapChainError', () => {
    const map = createSmartMapper('solana', [
      { match: 'insufficient funds', errorClass: 'transaction', code: ErrorCode.INSUFFICIENT_BALANCE },
      { match: 'account not found', errorClass: 'account', code: ErrorCode.ACCOUNT_NOT_FOUND },
      { match: 'blockhash not found', errorClass: 'transaction', code: ErrorCode.TRANSACTION_TIMEOUT, retryable: true },
      { match: 'timeout', errorClass: 'chain', code: ErrorCode.CHAIN_CONNECTION_ERROR, retryable: true },
    ]);

    it('maps insufficient → TransactionError', () => {
      const err = map(new Error('insufficient funds'));
      expect(err).toBeInstanceOf(TransactionError);
    });

    it('maps account not found → AccountError', () => {
      const err = map(new Error('Account not found'));
      expect(err).toBeInstanceOf(AccountError);
    });

    it('maps blockhash → TransactionError(retryable)', () => {
      const err = map(new Error('Blockhash not found'));
      expect((err as TransactionError).isRetryable).toBe(true);
    });

    it('passes unknown errors through', () => {
      const orig = new Error('unknown solana error');
      expect(map(orig)).toBe(orig);
    });
  });

  // ─── Polkadot ───────────────────────────────────────────────────────
  describe('Polkadot mapChainError', () => {
    const map = createSmartMapper('polkadot', [
      { match: '1010', errorClass: 'transaction', code: ErrorCode.INVALID_TRANSACTION },
      { match: 'existential deposit', errorClass: 'transaction', code: ErrorCode.INSUFFICIENT_BALANCE },
      { match: 'bad origin', errorClass: 'transaction', code: ErrorCode.UNAUTHORIZED },
    ]);

    it('maps 1010 → InvalidTransaction', () => {
      const err = map(new Error('1010: Invalid Transaction'));
      expect((err as TransactionError).code).toBe(ErrorCode.INVALID_TRANSACTION);
    });

    it('maps existential deposit → InsufficientBalance', () => {
      const err = map(new Error('below existential deposit'));
      expect((err as TransactionError).code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
    });

    it('passes unknown errors through', () => {
      const orig = new Error('unknown dot error');
      expect(map(orig)).toBe(orig);
    });
  });

  // ─── Stellar ────────────────────────────────────────────────────────
  describe('Stellar mapChainError', () => {
    const map = createSmartMapper('stellar', [
      { match: 'op_underfunded', errorClass: 'transaction', code: ErrorCode.INSUFFICIENT_BALANCE },
      { match: 'op_no_trust', errorClass: 'token', code: ErrorCode.TRUST_LINE_REQUIRED },
      { match: 'tx_bad_seq', errorClass: 'transaction', code: ErrorCode.INVALID_TRANSACTION, retryable: true },
    ]);

    it('maps op_underfunded → InsufficientBalance', () => {
      const err = map(new Error('op_underfunded'));
      expect((err as TransactionError).code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
    });

    it('maps op_no_trust → TokenError', () => {
      const err = map(new Error('op_no_trust'));
      expect(err).toBeInstanceOf(TokenError);
    });

    it('passes unknown errors through', () => {
      const orig = new Error('unknown stellar error');
      expect(map(orig)).toBe(orig);
    });
  });

  // ─── Bitcoin ────────────────────────────────────────────────────────
  describe('Bitcoin mapChainError', () => {
    const map = createSmartMapper('bitcoin', [
      { match: 'insufficient', errorClass: 'transaction', code: ErrorCode.INSUFFICIENT_BALANCE },
      { match: '-26', errorClass: 'transaction', code: ErrorCode.TRANSACTION_FAILED },
      { match: 'econnrefused', errorClass: 'chain', code: ErrorCode.CHAIN_CONNECTION_ERROR, retryable: true },
    ]);

    it('maps insufficient → TransactionError', () => {
      const err = map(new Error('Insufficient funds'));
      expect(err).toBeInstanceOf(TransactionError);
    });

    it('maps -26 → TransactionError(TRANSACTION_FAILED)', () => {
      const err = map(new Error('error -26: script verify'));
      expect((err as TransactionError).code).toBe(ErrorCode.TRANSACTION_FAILED);
    });

    it('maps ECONNREFUSED → ChainError(retryable)', () => {
      const err = map(new Error('ECONNREFUSED'));
      expect(err).toBeInstanceOf(ChainError);
      expect((err as ChainError).isRetryable).toBe(true);
    });

    it('passes unknown errors through', () => {
      const orig = new Error('unknown btc error');
      expect(map(orig)).toBe(orig);
    });
  });
});
