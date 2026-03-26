/**
 * FaucetService
 *
 * Unified testnet faucet interface for all 7 supported chains.
 * Provides graceful, non-throwing faucet requests with rate-limit awareness.
 *
 * Chains supported:
 *   - Hedera    → https://portal.hedera.com/faucet (testnet)
 *   - XRPL      → https://faucet.altnet.rippletest.net/accounts (testnet, POST)
 *   - Solana    → Devnet JSON-RPC requestAirdrop (no SDK needed)
 *   - Polkadot  → https://faucet.polkadot.io (Westend testnet)
 *   - Ethereum  → https://faucet.sepolia.dev (Sepolia testnet)
 *   - Polygon   → https://faucet.polygon.technology (Amoy testnet)
 *   - Bitcoin   → https://coinfaucet.eu/en/btc-testnet/ (testnet)
 *
 * Design principles:
 *   - Never throws — faucets are unreliable
 *   - Uses only native Node.js https module (no extra npm deps)
 *   - Tracks per-chain cooldowns to avoid hammering faucets
 */

import * as https from 'https';
import * as http from 'http';
import { ChainType } from '../schemas/chain.schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FaucetResult {
  success: boolean;
  chain: ChainType;
  address: string;
  amount?: string;
  transactionId?: string;
  error?: string;
  cooldownMs?: number;
}

interface CooldownEntry {
  lastRequestAt: number;
  cooldownMs: number;
}

// ─── Per-chain cooldown defaults (ms) ────────────────────────────────────────

const CHAIN_COOLDOWNS: Record<ChainType, number> = {
  hedera:   60_000,   // 1 minute
  xrpl:     10_000,   // 10 seconds
  solana:   60_000,   // 1 minute
  polkadot: 86_400_000, // 24 hours (Faucet is very strict)
  stellar:  10_000,   // 10 seconds (Friendbot instant)
  ethereum: 86_400_000, // 24 hours (Sepolia faucet)
  polygon:  86_400_000, // 24 hours (Amoy faucet)
  bitcoin:  60_000,   // 1 minute
};

// ─── FaucetService ────────────────────────────────────────────────────────────

export class FaucetService {
  /** Per-chain cooldown tracking: chain → CooldownEntry */
  private readonly cooldowns = new Map<ChainType, CooldownEntry>();

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Request testnet funding for an address on a given chain.
   *
   * Never throws. Returns success:false with an error message on failure.
   */
  async requestFunding(
    chain: ChainType,
    address: string,
    network: string = 'testnet',
  ): Promise<FaucetResult> {
    // Check cooldown before attempting the request
    const cooldownRemaining = this.getCooldownRemaining(chain);
    if (cooldownRemaining > 0) {
      return {
        success: false,
        chain,
        address,
        error: `Rate limited — please wait ${Math.ceil(cooldownRemaining / 1000)}s before requesting again`,
        cooldownMs: cooldownRemaining,
      };
    }

    try {
      let result: FaucetResult;

      switch (chain) {
        case 'hedera':
          result = await this.requestHederaFunding(address, network);
          break;
        case 'xrpl':
          result = await this.requestXrplFunding(address, network);
          break;
        case 'solana':
          result = await this.requestSolanaFunding(address, network);
          break;
        case 'polkadot':
          result = await this.requestPolkadotFunding(address, network);
          break;
        case 'ethereum':
          result = await this.requestEthereumFunding(address, network);
          break;
        case 'polygon':
          result = await this.requestPolygonFunding(address, network);
          break;
        case 'bitcoin':
          result = await this.requestBitcoinFunding(address, network);
          break;
        default:
          result = {
            success: false,
            chain,
            address,
            error: `Unsupported chain: ${chain}`,
          };
      }

      // Record cooldown regardless of success/failure to avoid hammering
      this.recordRequest(chain);
      return result;
    } catch (err: unknown) {
      // Graceful catch-all — faucets are unreliable
      this.recordRequest(chain);
      return {
        success: false,
        chain,
        address,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Get the canonical faucet URL for a chain/network combination.
   */
  getFaucetUrl(chain: ChainType, network: string = 'testnet'): string {
    switch (chain) {
      case 'hedera':
        return 'https://portal.hedera.com/faucet';
      case 'xrpl':
        return network === 'mainnet'
          ? 'https://faucet.xrpl.org/accounts'
          : 'https://faucet.altnet.rippletest.net/accounts';
      case 'solana':
        return network === 'mainnet'
          ? 'https://api.mainnet-beta.solana.com'
          : 'https://api.devnet.solana.com';
      case 'polkadot':
        return 'https://faucet.polkadot.io';
      case 'ethereum':
        return 'https://faucet.sepolia.dev';
      case 'polygon':
        return 'https://faucet.polygon.technology';
      case 'bitcoin':
        return 'https://coinfaucet.eu/en/btc-testnet/';
      default:
        return '';
    }
  }

  /**
   * Check whether the faucet for a given chain is currently reachable.
   *
   * Returns false on any error — never throws.
   */
  async checkFaucetAvailability(chain: ChainType): Promise<boolean> {
    const url = this.getFaucetUrl(chain);
    if (!url) return false;

    try {
      const parsed = new URL(url);
      const status = await this.httpHead(parsed);
      // Accept any 2xx or 3xx response as "available"
      return status >= 200 && status < 400;
    } catch {
      return false;
    }
  }

  // ─── Chain-specific implementations ────────────────────────────────────────

  private async requestHederaFunding(address: string, _network: string): Promise<FaucetResult> {
    // Hedera portal faucet — POST with account ID
    const body = JSON.stringify({ accountId: address });
    const response = await this.httpPost(
      'https://portal.hedera.com/faucet',
      body,
      { 'Content-Type': 'application/json' },
    );

    if (response.status >= 200 && response.status < 300) {
      const parsed = this.tryParseJson(response.body);
      return {
        success: true,
        chain: 'hedera',
        address,
        amount: parsed?.amount ?? parsed?.hbar ?? '100 HBAR',
        transactionId: parsed?.transactionId ?? parsed?.txId,
      };
    }

    return {
      success: false,
      chain: 'hedera',
      address,
      error: `Hedera faucet returned HTTP ${response.status}: ${response.body.slice(0, 200)}`,
    };
  }

  private async requestXrplFunding(address: string, _network: string): Promise<FaucetResult> {
    // XRPL faucet — POST with destination address
    const body = JSON.stringify({ destination: address });
    const response = await this.httpPost(
      'https://faucet.altnet.rippletest.net/accounts',
      body,
      { 'Content-Type': 'application/json' },
    );

    if (response.status >= 200 && response.status < 300) {
      const parsed = this.tryParseJson(response.body);
      return {
        success: true,
        chain: 'xrpl',
        address,
        amount: parsed?.amount ?? '1000 XRP',
        transactionId: parsed?.transaction?.hash ?? parsed?.hash,
      };
    }

    return {
      success: false,
      chain: 'xrpl',
      address,
      error: `XRPL faucet returned HTTP ${response.status}: ${response.body.slice(0, 200)}`,
    };
  }

  private async requestSolanaFunding(address: string, network: string): Promise<FaucetResult> {
    // Solana devnet — JSON-RPC requestAirdrop (native, no SDK)
    const rpcUrl = network === 'mainnet'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com';

    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'requestAirdrop',
      params: [address, 1_000_000_000], // 1 SOL in lamports
    });

    const response = await this.httpPost(rpcUrl, body, {
      'Content-Type': 'application/json',
    });

    const parsed = this.tryParseJson(response.body);

    if (parsed?.result) {
      return {
        success: true,
        chain: 'solana',
        address,
        amount: '1 SOL',
        transactionId: parsed.result,
      };
    }

    const rpcError = parsed?.error?.message ?? `HTTP ${response.status}`;
    return {
      success: false,
      chain: 'solana',
      address,
      error: `Solana airdrop failed: ${rpcError}`,
    };
  }

  private async requestPolkadotFunding(address: string, _network: string): Promise<FaucetResult> {
    // Polkadot Westend faucet — POST with address
    const body = JSON.stringify({ address, parachain_id: '', recaptcha: '' });
    const response = await this.httpPost(
      'https://faucet.polkadot.io',
      body,
      { 'Content-Type': 'application/json' },
    );

    if (response.status >= 200 && response.status < 300) {
      const parsed = this.tryParseJson(response.body);
      return {
        success: true,
        chain: 'polkadot',
        address,
        amount: parsed?.amount ?? '1 WND',
        transactionId: parsed?.hash,
      };
    }

    return {
      success: false,
      chain: 'polkadot',
      address,
      error: `Polkadot faucet returned HTTP ${response.status}: ${response.body.slice(0, 200)}`,
    };
  }

  private async requestEthereumFunding(address: string, _network: string): Promise<FaucetResult> {
    // Sepolia faucet — GET with address as query param (common pattern)
    const url = `https://faucet.sepolia.dev/api/fund?address=${encodeURIComponent(address)}`;
    const response = await this.httpGet(url);

    if (response.status >= 200 && response.status < 300) {
      const parsed = this.tryParseJson(response.body);
      return {
        success: true,
        chain: 'ethereum',
        address,
        amount: parsed?.amount ?? '0.5 ETH',
        transactionId: parsed?.txHash ?? parsed?.transactionHash,
      };
    }

    return {
      success: false,
      chain: 'ethereum',
      address,
      error: `Ethereum faucet returned HTTP ${response.status}: ${response.body.slice(0, 200)}`,
    };
  }

  private async requestPolygonFunding(address: string, _network: string): Promise<FaucetResult> {
    // Polygon Amoy faucet — POST
    const body = JSON.stringify({
      address,
      network: 'amoy',
      token: 'matic',
    });
    const response = await this.httpPost(
      'https://faucet.polygon.technology/api/v1/faucet',
      body,
      { 'Content-Type': 'application/json' },
    );

    if (response.status >= 200 && response.status < 300) {
      const parsed = this.tryParseJson(response.body);
      return {
        success: true,
        chain: 'polygon',
        address,
        amount: parsed?.amount ?? '0.5 MATIC',
        transactionId: parsed?.txHash ?? parsed?.message,
      };
    }

    return {
      success: false,
      chain: 'polygon',
      address,
      error: `Polygon faucet returned HTTP ${response.status}: ${response.body.slice(0, 200)}`,
    };
  }

  private async requestBitcoinFunding(address: string, _network: string): Promise<FaucetResult> {
    // Bitcoin testnet faucet — GET request
    const url = `https://coinfaucet.eu/en/btc-testnet/?address=${encodeURIComponent(address)}`;
    const response = await this.httpGet(url);

    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        chain: 'bitcoin',
        address,
        amount: '0.001 tBTC',
        // Bitcoin testnet faucets typically don't return a structured JSON
      };
    }

    return {
      success: false,
      chain: 'bitcoin',
      address,
      error: `Bitcoin faucet returned HTTP ${response.status}: ${response.body.slice(0, 200)}`,
    };
  }

  // ─── Rate limiting helpers ─────────────────────────────────────────────────

  private getCooldownRemaining(chain: ChainType): number {
    const entry = this.cooldowns.get(chain);
    if (!entry) return 0;

    const elapsed = Date.now() - entry.lastRequestAt;
    const remaining = entry.cooldownMs - elapsed;
    return remaining > 0 ? remaining : 0;
  }

  private recordRequest(chain: ChainType): void {
    this.cooldowns.set(chain, {
      lastRequestAt: Date.now(),
      cooldownMs: CHAIN_COOLDOWNS[chain],
    });
  }

  /**
   * Manually reset cooldown for a chain (for testing or forced retry).
   */
  resetCooldown(chain: ChainType): void {
    this.cooldowns.delete(chain);
  }

  // ─── HTTP helpers (native Node.js https) ───────────────────────────────────

  private httpPost(
    url: string,
    body: string,
    headers: Record<string, string> = {},
  ): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const isHttps = parsed.protocol === 'https:';
      const lib: typeof https = isHttps ? https : (http as unknown as typeof https);

      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 15_000,
      };

      const req = lib.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`HTTP POST to ${url} timed out`));
      });

      req.write(body);
      req.end();
    });
  }

  private httpGet(url: string): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const isHttps = parsed.protocol === 'https:';
      const lib: typeof https = isHttps ? https : (http as unknown as typeof https);

      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'GET',
        timeout: 15_000,
      };

      const req = lib.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`HTTP GET to ${url} timed out`));
      });

      req.end();
    });
  }

  private httpHead(parsed: URL): Promise<number> {
    return new Promise((resolve) => {
      const isHttps = parsed.protocol === 'https:';
      const lib: typeof https = isHttps ? https : (http as unknown as typeof https);

      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'HEAD',
        timeout: 8_000,
      };

      const req = lib.request(options, (res) => {
        resolve(res.statusCode ?? 0);
      });

      req.on('error', () => resolve(0));
      req.on('timeout', () => {
        req.destroy();
        resolve(0);
      });

      req.end();
    });
  }

  private tryParseJson(text: string): Record<string, any> | null {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}
