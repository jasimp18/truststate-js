# @hsuite/smart-engines-sdk

Type-safe client SDK for Smart Engines multi-chain infrastructure. Build decentralized apps across Hedera, XRPL, Ethereum, Polygon, Solana, Polkadot, Stellar, and Bitcoin.

## Installation

```bash
yarn add @hsuite/smart-engines-sdk
# or
npm install @hsuite/smart-engines-sdk
```

## Quick Start

```typescript
import { SmartEngineClient } from '@hsuite/smart-engines-sdk';

// Connect to a validator
const client = new SmartEngineClient({
  baseUrl: 'https://v3-testnet-sn1.hsuite.network',
  apiKey: 'your-api-key',
});

// Check health
const health = await client.getHealth();
console.log(health.status); // 'ok'
```

## Auto-Discovery with Authentication

Connect to the network automatically via HCS registry:

```typescript
import { SmartEngineClient } from '@hsuite/smart-engines-sdk';
import { PrivateKey } from '@hashgraph/sdk';

const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!);

const { client, validator, session } = await SmartEngineClient.connectToNetwork({
  network: 'testnet',
  registryTopicId: process.env.REGISTRY_TOPIC_ID!,
  chain: 'hedera',
  address: process.env.HEDERA_ACCOUNT_ID!,
  publicKey: privateKey.publicKey.toStringRaw(),
  signFn: (challenge) => {
    const sig = privateKey.sign(Buffer.from(challenge));
    return Buffer.from(sig).toString('hex');
  },
});

console.log(`Connected to ${validator.operator} at ${validator.endpoint}`);
console.log(`Session expires: ${session.expiresAt}`);
```

## API Reference

### Account Operations

```typescript
// Create account
const account = await client.createAccount({
  chain: 'hedera',
  initialBalance: '10',
  validatorTimestamp: '1766490325.123456789',
  validatorTopicId: '0.0.98765',
});
console.log(`Account: ${account.accountId}`);

// Get account info
const info = await client.getAccountInfo('hedera', '0.0.12345');

// Get balance (native + tokens)
const balance = await client.getBalance('hedera', '0.0.12345');
console.log(`Balance: ${balance.balance} | Tokens: ${balance.tokens.length}`);
```

### Token Operations

```typescript
// Create a fungible token
const token = await client.createToken({
  chain: 'hedera',
  name: 'My Token',
  symbol: 'MTK',
  decimals: 8,
  initialSupply: '1000000',
  type: 'fungible',
  validatorTimestamp: '1766490325.123456789',
  validatorTopicId: '0.0.98765',
  capabilities: {
    mintable: true,
    burnable: true,
    pausable: true,
    restrictable: true,
    compliant: true,
    wipeable: true,
  },
});
console.log(`Token: ${token.tokenId}`);

// Mint additional tokens
await client.mintToken({
  chain: 'hedera',
  tokenId: token.tokenId,
  amount: '500000',
});

// Burn tokens
await client.burnToken({
  chain: 'hedera',
  tokenId: token.tokenId,
  amount: '100',
});

// Get token info
const tokenInfo = await client.getTokenInfo('hedera', token.tokenId);
console.log(`Supply: ${tokenInfo.totalSupply}`);
console.log(`Capabilities:`, tokenInfo.capabilities);
```

### Token Management (Universal Actions)

```typescript
// Pause all operations on a token
await client.pauseToken({ chain: 'hedera', tokenId: '0.0.123' });
await client.unpauseToken({ chain: 'hedera', tokenId: '0.0.123' });

// Freeze/unfreeze an account
await client.restrictAccount({ chain: 'hedera', tokenId: '0.0.123', accountId: '0.0.456' });
await client.unrestrictAccount({ chain: 'hedera', tokenId: '0.0.123', accountId: '0.0.456' });

// KYC grant/revoke
await client.enableCompliance({ chain: 'hedera', tokenId: '0.0.123', accountId: '0.0.456' });
await client.disableCompliance({ chain: 'hedera', tokenId: '0.0.123', accountId: '0.0.456' });

// Wipe tokens from account (compliance action)
await client.wipeFromAccount({ chain: 'hedera', tokenId: '0.0.123', accountId: '0.0.456', amount: '100' });
```

### Transaction Operations

```typescript
// Transfer native currency
const tx = await client.transfer({
  chain: 'hedera',
  from: '0.0.12345',
  to: '0.0.67890',
  amount: '5.0',
});
console.log(`TX: ${tx.transactionId} Status: ${tx.status}`);

// Get transaction details
const details = await client.getTransaction('hedera', tx.transactionId);

// Get receipt
const receipt = await client.getTransactionReceipt('hedera', tx.transactionId);
```

### Multi-Chain Examples

The same API works across all supported chains:

```typescript
// Create accounts on different chains
const hederaAccount = await client.createAccount({ chain: 'hedera', initialBalance: '10', ... });
const xrplAccount = await client.createAccount({ chain: 'xrpl', initialBalance: '25', ... });
const ethAccount = await client.createAccount({ chain: 'ethereum', initialBalance: '0.1', ... });
const solAccount = await client.createAccount({ chain: 'solana', initialBalance: '1', ... });

// Check balances across chains
const chains = ['hedera', 'xrpl', 'ethereum', 'solana', 'polkadot', 'stellar', 'bitcoin'];
for (const chain of chains) {
  const caps = await client.getChainCapabilities(chain);
  console.log(`${chain}: tokens=${caps.hasTokens} nfts=${caps.hasNFTs} dex=${caps.hasDEX}`);
}

// Query capabilities
const allCaps = await client.getAllCapabilities();
```

### Consensus Messaging (Hedera HCS)

```typescript
// Submit message to HCS topic
const result = await client.submitMessage('hedera', '0.0.98765', JSON.stringify({
  type: 'governance.proposal',
  data: { title: 'Increase validator cap', description: '...' },
}));
console.log(`Sequence: ${result.sequenceNumber}`);
```

### Validator Management

```typescript
// List validator templates
const templates = await client.validators.listTemplates();

// Check validator health
const health = await client.validators.getHealth();

// Get validator info
const validatorInfo = await client.validators.getInfo();
```

### Subscription Management

```typescript
// Check subscription status
const status = await client.subscription.getStatus('my-app-id');

// Request subscription (deposits HSUITE tokens)
const sub = await client.subscription.request({
  appId: 'my-app',
  developerAccountId: '0.0.12345',
  chain: 'hedera',
  selectedTier: 'starter',
  selectedNetworks: ['hedera'],
});
console.log(`Deposit to: ${sub.depositWallet} Amount: ${sub.amount}`);
```

### BaaS (Backend-as-a-Service)

```typescript
import { BaasClient } from '@hsuite/smart-engines-sdk';

const baas = new BaasClient({
  hostUrl: 'https://host.hsuite.network',
  appId: 'my-app-id',
  chain: 'hedera',
});

// Authenticate with wallet
await baas.authenticate({
  address: '0.0.12345',
  signFn: async (challenge) => privateKey.sign(Buffer.from(challenge)).toString('hex'),
});

// Database operations (with Merkle proofs)
const doc = await baas.database.insert('users', { name: 'Alice', role: 'admin' });
const users = await baas.database.find('users', { role: 'admin' });
const proof = await baas.database.getProof('users', doc.id); // Merkle proof

// Storage (IPFS-backed)
const file = await baas.storage.upload('data.json', Buffer.from(JSON.stringify(data)));
const download = await baas.storage.download(file.fileId);

// Serverless functions (Ed25519 code signing required)
await baas.functions.deploy({
  name: 'process-payment',
  runtime: 'nodejs',
  signedCode: { code, signature, publicKey, timestamp, hash },
});
const result = await baas.functions.invoke('process-payment', { amount: 100 });

// Real-time messaging
await baas.messaging.publish('notifications', { type: 'payment', amount: 100 });
```

## Error Handling

All errors are instances of `SmartEngineError` with structured error codes:

```typescript
import { SmartEngineError, ErrorCode } from '@hsuite/smart-engines-sdk';

try {
  await client.transfer({ chain: 'hedera', from: '0.0.1', to: '0.0.2', amount: '999999' });
} catch (error) {
  if (error instanceof SmartEngineError) {
    console.log(`Code: ${error.code}`);          // e.g., 'INSUFFICIENT_BALANCE'
    console.log(`Status: ${error.statusCode}`);   // e.g., 400
    console.log(`Retryable: ${error.isRetryable}`); // e.g., false
    console.log(`Context:`, error.context);       // e.g., { chain: 'hedera' }

    switch (error.code) {
      case ErrorCode.INSUFFICIENT_BALANCE:
        console.log('Not enough funds');
        break;
      case ErrorCode.CHAIN_CONNECTION_ERROR:
        console.log('Network issue — will retry');
        if (error.isRetryable) { /* retry logic */ }
        break;
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        console.log('Too many requests — back off');
        break;
    }
  }
}
```

### Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `INSUFFICIENT_BALANCE` | Not enough native or token balance | No |
| `INVALID_ACCOUNT_ID` | Account doesn't exist or is deleted | No |
| `CHAIN_CONNECTION_ERROR` | Network/RPC connectivity issue | Yes |
| `CHAIN_TIMEOUT` | Request timed out | Yes |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Yes |
| `INVALID_TRANSACTION` | Malformed or invalid transaction | No |
| `TRANSACTION_FAILED` | Transaction executed but failed | No |
| `CONTRACT_REVERT` | Smart contract execution reverted | No |
| `TOKEN_NOT_ASSOCIATED` | Token not associated to account (Hedera) | No |
| `TRUST_LINE_REQUIRED` | Trust line needed (XRPL/Stellar) | No |
| `INVALID_SIGNATURE` | Bad signature on transaction | No |

## NestJS Integration

```typescript
import { Module } from '@nestjs/common';
import { SmartEngineModule } from '@hsuite/smart-engines-sdk';

@Module({
  imports: [
    SmartEngineModule.forRoot({
      baseUrl: 'https://v3-testnet-sn1.hsuite.network',
      apiKey: process.env.SMART_ENGINE_API_KEY,
    }),
  ],
})
export class AppModule {}
```

Then inject:

```typescript
import { Injectable } from '@nestjs/common';
import { SmartEngineService } from '@hsuite/smart-engines-sdk';

@Injectable()
export class PaymentService {
  constructor(private readonly smartEngine: SmartEngineService) {}

  async processPayment(from: string, to: string, amount: string) {
    return this.smartEngine.client.transfer({
      chain: 'hedera',
      from,
      to,
      amount,
    });
  }
}
```

### Async configuration:

```typescript
SmartEngineModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    baseUrl: config.get('VALIDATOR_URL'),
    apiKey: config.get('API_KEY'),
  }),
  inject: [ConfigService],
});
```

## Supported Chains

| Chain | Account Ops | Tokens | NFTs | Messaging | DEX | Multi-Sig |
|-------|------------|--------|------|-----------|-----|-----------|
| Hedera | ✅ | ✅ HTS | ✅ | ✅ HCS | — | ✅ TSS |
| XRPL | ✅ | ✅ Trust Lines | ✅ XLS-20 | — | ✅ Native | ✅ SignerList |
| Ethereum | ✅ | ✅ ERC-20 | — | — | — | ✅ Safe |
| Polygon | ✅ | ✅ ERC-20 | — | — | — | ✅ Safe |
| Solana | ✅ | ✅ SPL | ✅ Metaplex | — | — | ✅ Squads |
| Polkadot | ✅ | ✅ Assets | — | — | — | — |
| Stellar | ✅ | ✅ Assets | — | — | ✅ SDEX | — |
| Bitcoin | ✅ | — | — | — | — | — |

## License

Proprietary — HSuite Trust
