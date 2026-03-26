/**
 * FaucetService unit tests
 *
 * - Tests per-chain URL generation
 * - Tests request formatting and response parsing
 * - Tests error handling and graceful failure
 * - Tests rate limiting / cooldown logic
 * - All HTTP calls are mocked — no actual network requests
 */

import { FaucetService } from './faucet.service';
import { ChainType } from '../schemas/chain.schema';
import * as https from 'https';

// ─── Mock native https ────────────────────────────────────────────────────────

jest.mock('https');
jest.mock('http');

// Helper to build a fake IncomingMessage-like response
function mockHttpsResponse(status: number, body: string) {
  const events: Record<string, ((...args: any[]) => void)[]> = {};

  const res = {
    statusCode: status,
    on: jest.fn((_event: string, _cb: (...args: any[]) => void) => {
      events[_event] = events[_event] || [];
      events[_event].push(_cb);
      // Immediately emit 'data' and 'end' so the promise resolves
      if (_event === 'data') _cb(body);
      if (_event === 'end') _cb();
    }),
  };

  const req = {
    on: jest.fn((_event: string, _cb: (...args: any[]) => void) => {
      // no-op for error/timeout
    }),
    write: jest.fn(),
    end: jest.fn(() => {
      // Trigger the callback with our fake response
    }),
    destroy: jest.fn(),
  };

  return { req, res };
}

/**
 * Patch https.request so the callback is invoked synchronously with `res`.
 */
function patchHttpsRequest(status: number, body: string) {
  const { req, res } = mockHttpsResponse(status, body);

  (https.request as jest.Mock).mockImplementation(
    (_options: any, callback: (res: any) => void) => {
      // Invoke callback immediately
      callback(res);
      return req;
    },
  );

  return { req, res };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FaucetService', () => {
  let service: FaucetService;

  beforeEach(() => {
    service = new FaucetService();
    jest.clearAllMocks();
  });

  // ─── getFaucetUrl ───────────────────────────────────────────────────────────

  describe('getFaucetUrl', () => {
    const cases: Array<[ChainType, string, string]> = [
      ['hedera',   'testnet', 'https://portal.hedera.com/faucet'],
      ['xrpl',     'testnet', 'https://faucet.altnet.rippletest.net/accounts'],
      ['solana',   'devnet',  'https://api.devnet.solana.com'],
      ['polkadot', 'testnet', 'https://faucet.polkadot.io'],
      ['ethereum', 'testnet', 'https://faucet.sepolia.dev'],
      ['polygon',  'testnet', 'https://faucet.polygon.technology'],
      ['bitcoin',  'testnet', 'https://coinfaucet.eu/en/btc-testnet/'],
    ];

    test.each(cases)('%s (%s) returns correct URL', (chain, network, expectedUrl) => {
      const url = service.getFaucetUrl(chain, network);
      expect(url).toBe(expectedUrl);
    });

    it('returns Solana mainnet URL when network=mainnet', () => {
      expect(service.getFaucetUrl('solana', 'mainnet')).toBe(
        'https://api.mainnet-beta.solana.com',
      );
    });

    it('returns XRPL mainnet URL when network=mainnet', () => {
      expect(service.getFaucetUrl('xrpl', 'mainnet')).toBe(
        'https://faucet.xrpl.org/accounts',
      );
    });

    it('returns empty string for unknown chain', () => {
      const url = service.getFaucetUrl('unknown' as ChainType);
      expect(url).toBe('');
    });
  });

  // ─── requestFunding — Hedera ────────────────────────────────────────────────

  describe('requestFunding — hedera', () => {
    it('returns success with amount when faucet responds 200', async () => {
      patchHttpsRequest(200, JSON.stringify({ amount: '100 HBAR', transactionId: 'tx-123' }));

      const result = await service.requestFunding('hedera', '0.0.123456');

      expect(result.success).toBe(true);
      expect(result.chain).toBe('hedera');
      expect(result.address).toBe('0.0.123456');
      expect(result.amount).toBe('100 HBAR');
      expect(result.transactionId).toBe('tx-123');
    });

    it('returns failure when faucet responds 429', async () => {
      patchHttpsRequest(429, 'Too Many Requests');

      const result = await service.requestFunding('hedera', '0.0.123456');

      expect(result.success).toBe(false);
      expect(result.chain).toBe('hedera');
      expect(result.error).toContain('429');
    });

    it('returns failure on network error (graceful)', async () => {
      const req = {
        on: jest.fn((event: string, cb: (...args: any[]) => void) => {
          if (event === 'error') cb(new Error('ECONNREFUSED'));
        }),
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
      };
      (https.request as jest.Mock).mockReturnValue(req);

      const result = await service.requestFunding('hedera', '0.0.999');

      expect(result.success).toBe(false);
      expect(result.error).toContain('ECONNREFUSED');
    });
  });

  // ─── requestFunding — XRPL ─────────────────────────────────────────────────

  describe('requestFunding — xrpl', () => {
    it('returns success with transaction hash when faucet responds 200', async () => {
      patchHttpsRequest(
        200,
        JSON.stringify({ amount: '1000', transaction: { hash: 'ABCDEF1234' } }),
      );

      const result = await service.requestFunding('xrpl', 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('ABCDEF1234');
      expect(result.amount).toBe('1000');
    });

    it('returns failure on 503 from XRPL faucet', async () => {
      patchHttpsRequest(503, 'Service Unavailable');

      const result = await service.requestFunding('xrpl', 'rTestAddress');

      expect(result.success).toBe(false);
      expect(result.error).toContain('503');
    });
  });

  // ─── requestFunding — Solana ────────────────────────────────────────────────

  describe('requestFunding — solana', () => {
    it('returns success when RPC returns a signature', async () => {
      patchHttpsRequest(200, JSON.stringify({ jsonrpc: '2.0', id: 1, result: 'sig_abc123' }));

      const result = await service.requestFunding('solana', 'GxREC...testAddress', 'devnet');

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('sig_abc123');
      expect(result.amount).toBe('1 SOL');
    });

    it('returns failure when RPC returns an error', async () => {
      patchHttpsRequest(
        200,
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -32600, message: 'airdrop limit exceeded' },
        }),
      );

      const result = await service.requestFunding('solana', 'GxREC...testAddress', 'devnet');

      expect(result.success).toBe(false);
      expect(result.error).toContain('airdrop limit exceeded');
    });
  });

  // ─── requestFunding — Polkadot ─────────────────────────────────────────────

  describe('requestFunding — polkadot', () => {
    it('returns success when faucet responds 200', async () => {
      patchHttpsRequest(200, JSON.stringify({ amount: '1 WND', hash: '0xdeadbeef' }));

      const result = await service.requestFunding('polkadot', '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('0xdeadbeef');
    });

    it('returns failure on 500', async () => {
      patchHttpsRequest(500, 'Internal Server Error');

      const result = await service.requestFunding('polkadot', '5GrwvaEF5z...');

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });
  });

  // ─── requestFunding — Ethereum ─────────────────────────────────────────────

  describe('requestFunding — ethereum', () => {
    it('returns success when Sepolia faucet responds 200', async () => {
      patchHttpsRequest(200, JSON.stringify({ amount: '0.5 ETH', txHash: '0xaaabbbccc' }));

      const result = await service.requestFunding('ethereum', '0xDeADbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF');

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('0xaaabbbccc');
    });
  });

  // ─── requestFunding — Polygon ──────────────────────────────────────────────

  describe('requestFunding — polygon', () => {
    it('returns success when Amoy faucet responds 200', async () => {
      patchHttpsRequest(200, JSON.stringify({ amount: '0.5 MATIC', txHash: '0xpolygontx' }));

      const result = await service.requestFunding('polygon', '0xPolygonAddress');

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('0xpolygontx');
    });
  });

  // ─── requestFunding — Bitcoin ──────────────────────────────────────────────

  describe('requestFunding — bitcoin', () => {
    it('returns success when Bitcoin testnet faucet responds 200', async () => {
      patchHttpsRequest(200, '<html>Sent 0.001 tBTC</html>');

      const result = await service.requestFunding('bitcoin', 'tb1qTestAddress');

      expect(result.success).toBe(true);
      expect(result.amount).toBe('0.001 tBTC');
    });

    it('returns failure on 404', async () => {
      patchHttpsRequest(404, 'Not Found');

      const result = await service.requestFunding('bitcoin', 'tb1qTestAddress');

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });
  });

  // ─── Rate limiting ──────────────────────────────────────────────────────────

  describe('rate limiting', () => {
    it('returns cooldown error when called twice in rapid succession', async () => {
      patchHttpsRequest(200, JSON.stringify({ amount: '100 HBAR' }));

      // First request succeeds
      const first = await service.requestFunding('hedera', '0.0.111');
      expect(first.success).toBe(true);

      // Second request should be rate-limited (cooldown is 60s for Hedera)
      const second = await service.requestFunding('hedera', '0.0.111');
      expect(second.success).toBe(false);
      expect(second.cooldownMs).toBeGreaterThan(0);
      expect(second.error).toContain('Rate limited');
    });

    it('allows request after cooldown is reset', async () => {
      patchHttpsRequest(200, JSON.stringify({ amount: '100 HBAR' }));

      // First request
      await service.requestFunding('hedera', '0.0.222');

      // Reset cooldown
      service.resetCooldown('hedera');

      // Second request should now succeed
      patchHttpsRequest(200, JSON.stringify({ amount: '100 HBAR' }));
      const result = await service.requestFunding('hedera', '0.0.222');
      expect(result.success).toBe(true);
    });

    it('tracks cooldowns independently per chain', async () => {
      // Exhaust Hedera cooldown
      patchHttpsRequest(200, JSON.stringify({}));
      await service.requestFunding('hedera', '0.0.333');

      // XRPL should still be available
      patchHttpsRequest(200, JSON.stringify({ transaction: { hash: 'xrpl-hash' } }));
      const xrplResult = await service.requestFunding('xrpl', 'rXrplTestAddr');

      expect(xrplResult.success).toBe(true);
    });
  });

  // ─── checkFaucetAvailability ────────────────────────────────────────────────

  describe('checkFaucetAvailability', () => {
    it('returns true when HEAD request returns 200', async () => {
      const req = {
        on: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
      };

      (https.request as jest.Mock).mockImplementation(
        (_options: any, callback: (res: any) => void) => {
          callback({ statusCode: 200 });
          return req;
        },
      );

      const available = await service.checkFaucetAvailability('hedera');
      expect(available).toBe(true);
    });

    it('returns false when HEAD request returns 503', async () => {
      const req = {
        on: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
      };

      (https.request as jest.Mock).mockImplementation(
        (_options: any, callback: (res: any) => void) => {
          callback({ statusCode: 503 });
          return req;
        },
      );

      const available = await service.checkFaucetAvailability('xrpl');
      expect(available).toBe(false);
    });

    it('returns false on network error', async () => {
      const req = {
        on: jest.fn((event: string, cb: (...args: any[]) => void) => {
          if (event === 'error') cb(new Error('ECONNREFUSED'));
        }),
        end: jest.fn(),
        destroy: jest.fn(),
      };
      (https.request as jest.Mock).mockReturnValue(req);

      const available = await service.checkFaucetAvailability('solana');
      expect(available).toBe(false);
    });
  });

  // ─── Edge cases ────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles non-JSON faucet response gracefully', async () => {
      patchHttpsRequest(200, 'OK — funds sent');

      const result = await service.requestFunding('hedera', '0.0.999');
      // Succeeds but amount falls back to default
      expect(result.success).toBe(true);
      expect(result.amount).toBe('100 HBAR');
    });

    it('never throws even when https.request throws synchronously', async () => {
      (https.request as jest.Mock).mockImplementation(() => {
        throw new Error('Synchronous explosion');
      });

      await expect(
        service.requestFunding('xrpl', 'rBlowUp'),
      ).resolves.toMatchObject({ success: false });
    });
  });
});
