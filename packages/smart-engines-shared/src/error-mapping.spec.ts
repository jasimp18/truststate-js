/**
 * Chain-Specific Error Mapping Tests
 *
 * Tests the error mapping logic patterns used across all chain adapters.
 * Since adapters require NestJS DI, we test the mapping logic directly.
 */

// Generic error mapper factory (matches the pattern in all adapters)
function createMapper(patterns: Array<{ match: string | RegExp; type: string }>) {
  return (error: unknown): Error => {
    const message = error instanceof Error ? error.message : String(error);
    const lowerMsg = message.toLowerCase();
    for (const { match, type } of patterns) {
      if (typeof match === 'string' ? lowerMsg.includes(match) : match.test(lowerMsg)) {
        return new Error(`${type}: ${message}`);
      }
    }
    return error instanceof Error ? error : new Error(message);
  };
}

describe('Chain-Specific Error Mapping', () => {
  // ─── Hedera ─────────────────────────────────────────────────────────
  describe('Hedera error patterns', () => {
    const mapHederaError = createMapper([
      { match: 'insufficient_payer_balance', type: 'InsufficientFunds' },
      { match: 'invalid_signature', type: 'InvalidSignature' },
      { match: 'token_not_associated', type: 'TokenNotAssociated' },
      { match: 'account_deleted', type: 'AccountDeleted' },
      { match: 'token_is_paused', type: 'TokenPaused' },
      { match: 'account_frozen', type: 'AccountFrozen' },
      { match: 'transaction_expired', type: 'TransactionExpired' },
    ]);

    it('maps INSUFFICIENT_PAYER_BALANCE', () => {
      expect(mapHederaError(new Error('INSUFFICIENT_PAYER_BALANCE')).message).toMatch(/InsufficientFunds/);
    });
    it('maps INVALID_SIGNATURE', () => {
      expect(mapHederaError(new Error('INVALID_SIGNATURE')).message).toMatch(/InvalidSignature/);
    });
    it('maps TOKEN_NOT_ASSOCIATED', () => {
      expect(mapHederaError(new Error('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')).message).toMatch(/TokenNotAssociated/);
    });
    it('maps TOKEN_IS_PAUSED', () => {
      expect(mapHederaError(new Error('TOKEN_IS_PAUSED')).message).toMatch(/TokenPaused/);
    });
    it('maps ACCOUNT_FROZEN', () => {
      expect(mapHederaError(new Error('ACCOUNT_FROZEN_FOR_TOKEN')).message).toMatch(/AccountFrozen/);
    });
    it('passes through unknown errors', () => {
      const orig = new Error('unknown hedera error');
      expect(mapHederaError(orig)).toBe(orig);
    });
  });

  // ─── XRPL ──────────────────────────────────────────────────────────
  describe('XRPL error patterns', () => {
    const mapXrplError = createMapper([
      { match: 'tecunfunded_payment', type: 'InsufficientFunds' },
      { match: 'tecno_line', type: 'NoTrustLine' },
      { match: 'tembad_amount', type: 'InvalidAmount' },
      { match: 'tecfrozen', type: 'AccountFrozen' },
      { match: 'websocket', type: 'ConnectionError' },
      { match: 'tecpath_dry', type: 'PathDry' },
    ]);

    it('maps tecUNFUNDED_PAYMENT', () => {
      expect(mapXrplError(new Error('tecUNFUNDED_PAYMENT')).message).toMatch(/InsufficientFunds/);
    });
    it('maps tecNO_LINE', () => {
      expect(mapXrplError(new Error('tecNO_LINE')).message).toMatch(/NoTrustLine/);
    });
    it('maps temBAD_AMOUNT', () => {
      expect(mapXrplError(new Error('temBAD_AMOUNT')).message).toMatch(/InvalidAmount/);
    });
    it('maps tecFROZEN', () => {
      expect(mapXrplError(new Error('tecFROZEN')).message).toMatch(/AccountFrozen/);
    });
    it('maps WebSocket disconnect', () => {
      expect(mapXrplError(new Error('WebSocket disconnected')).message).toMatch(/ConnectionError/);
    });
    it('passes through unknown errors', () => {
      const orig = new Error('unknown xrpl error');
      expect(mapXrplError(orig)).toBe(orig);
    });
  });

  // ─── Solana ─────────────────────────────────────────────────────────
  describe('Solana error patterns', () => {
    const mapSolanaError = createMapper([
      { match: 'insufficient funds', type: 'InsufficientFunds' },
      { match: 'account not found', type: 'AccountNotFound' },
      { match: 'blockhash not found', type: 'BlockhashExpired' },
      { match: 'transaction simulation failed', type: 'SimulationFailed' },
      { match: 'timeout', type: 'ConnectionError' },
      { match: '429', type: 'RateLimited' },
    ]);

    it('maps insufficient funds', () => {
      expect(mapSolanaError(new Error('insufficient funds for transaction')).message).toMatch(/InsufficientFunds/);
    });
    it('maps account not found', () => {
      expect(mapSolanaError(new Error('Account not found')).message).toMatch(/AccountNotFound/);
    });
    it('maps blockhash expired', () => {
      expect(mapSolanaError(new Error('Blockhash not found')).message).toMatch(/BlockhashExpired/);
    });
    it('maps simulation failed', () => {
      expect(mapSolanaError(new Error('Transaction simulation failed')).message).toMatch(/SimulationFailed/);
    });
    it('maps timeout', () => {
      expect(mapSolanaError(new Error('Request timeout')).message).toMatch(/ConnectionError/);
    });
    it('passes through unknown errors', () => {
      const orig = new Error('unknown solana error');
      expect(mapSolanaError(orig)).toBe(orig);
    });
  });

  // ─── Polkadot ───────────────────────────────────────────────────────
  describe('Polkadot error patterns', () => {
    const mapPolkadotError = createMapper([
      { match: '1010', type: 'InvalidTransaction' },
      { match: 'existential deposit', type: 'BelowExistentialDeposit' },
      { match: 'insufficient', type: 'InsufficientFunds' },
      { match: 'pallet not available', type: 'PalletNotAvailable' },
      { match: 'bad origin', type: 'BadOrigin' },
      { match: 'dispatch error', type: 'DispatchError' },
    ]);

    it('maps 1010 Invalid Transaction', () => {
      expect(mapPolkadotError(new Error('1010: Invalid Transaction')).message).toMatch(/InvalidTransaction/);
    });
    it('maps existential deposit', () => {
      expect(mapPolkadotError(new Error('below existential deposit')).message).toMatch(/BelowExistentialDeposit/);
    });
    it('maps insufficient funds', () => {
      expect(mapPolkadotError(new Error('Insufficient balance')).message).toMatch(/InsufficientFunds/);
    });
    it('maps pallet not available', () => {
      expect(mapPolkadotError(new Error('Assets pallet not available')).message).toMatch(/PalletNotAvailable/);
    });
    it('maps dispatch error', () => {
      expect(mapPolkadotError(new Error('Dispatch error: Module')).message).toMatch(/DispatchError/);
    });
    it('passes through unknown errors', () => {
      const orig = new Error('unknown polkadot error');
      expect(mapPolkadotError(orig)).toBe(orig);
    });
  });

  // ─── Stellar ────────────────────────────────────────────────────────
  describe('Stellar error patterns', () => {
    const mapStellarError = createMapper([
      { match: 'tx_bad_seq', type: 'BadSequence' },
      { match: 'op_underfunded', type: 'InsufficientFunds' },
      { match: 'op_no_trust', type: 'NoTrustLine' },
      { match: 'op_not_authorized', type: 'NotAuthorized' },
      { match: 'op_low_reserve', type: 'BelowMinimumReserve' },
      { match: 'timeout', type: 'ConnectionError' },
    ]);

    it('maps tx_bad_seq', () => {
      expect(mapStellarError(new Error('tx_bad_seq')).message).toMatch(/BadSequence/);
    });
    it('maps op_underfunded', () => {
      expect(mapStellarError(new Error('op_underfunded')).message).toMatch(/InsufficientFunds/);
    });
    it('maps op_no_trust', () => {
      expect(mapStellarError(new Error('op_no_trust')).message).toMatch(/NoTrustLine/);
    });
    it('maps op_not_authorized', () => {
      expect(mapStellarError(new Error('op_not_authorized')).message).toMatch(/NotAuthorized/);
    });
    it('maps op_low_reserve', () => {
      expect(mapStellarError(new Error('op_low_reserve')).message).toMatch(/BelowMinimumReserve/);
    });
    it('passes through unknown errors', () => {
      const orig = new Error('unknown stellar error');
      expect(mapStellarError(orig)).toBe(orig);
    });
  });

  // ─── Bitcoin ────────────────────────────────────────────────────────
  describe('Bitcoin error patterns', () => {
    const mapBitcoinError = createMapper([
      { match: 'insufficient', type: 'InsufficientFunds' },
      { match: '-26', type: 'ScriptVerifyFailed' },
      { match: 'txn-mempool-conflict', type: 'DuplicateTransaction' },
      { match: 'dust', type: 'BelowDustThreshold' },
      { match: 'econnrefused', type: 'RPCConnectionError' },
      { match: 'fee', type: 'FeeTooLow' },
    ]);

    it('maps insufficient funds', () => {
      expect(mapBitcoinError(new Error('Insufficient funds in wallet')).message).toMatch(/InsufficientFunds/);
    });
    it('maps script verify failed', () => {
      expect(mapBitcoinError(new Error('Error -26: non-mandatory-script-verify-flag')).message).toMatch(/ScriptVerifyFailed/);
    });
    it('maps mempool conflict', () => {
      expect(mapBitcoinError(new Error('txn-mempool-conflict')).message).toMatch(/DuplicateTransaction/);
    });
    it('maps dust threshold', () => {
      expect(mapBitcoinError(new Error('Output below dust threshold')).message).toMatch(/BelowDustThreshold/);
    });
    it('maps RPC connection error', () => {
      expect(mapBitcoinError(new Error('ECONNREFUSED 127.0.0.1:8332')).message).toMatch(/RPCConnectionError/);
    });
    it('passes through unknown errors', () => {
      const orig = new Error('unknown bitcoin error');
      expect(mapBitcoinError(orig)).toBe(orig);
    });
  });
});
