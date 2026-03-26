# Local HSuite Packages

These packages are vendored from [smart-engines-multichain](https://github.com/HSuiteNetwork/smart-engines-multichain) 
to unblock development while `@hsuite/smart-engines-sdk` is not yet published to npm.

## Packages

### `@hsuite/smart-engines-shared` (v3.0.0)
Shared types, schemas, utilities, and error classes used across Smart Engines.

### `@hsuite/smart-engines-sdk` (v4.0.0)
Public client SDK for Smart Engines multi-chain infrastructure. Provides:
- `SmartEngineClient` — direct validator connection + auto-discovery via HCS
- Web3-style authentication (Hedera, XRPL, Solana, Polkadot)
- Multi-chain account, token, and transaction operations
- Backend-as-a-Service (BaaS) integration
- NestJS module for server-side apps
- V3 Validator management
- Subscription management

## Setup

These are wired as local file dependencies in the root `package.json`:

```json
{
  "dependencies": {
    "@hsuite/smart-engines-sdk": "file:packages/smart-engines-sdk",
    "@hsuite/smart-engines-shared": "file:packages/smart-engines-shared"
  }
}
```

After cloning, run:

```bash
npm install
cd packages/smart-engines-shared && npx tsc && cd ../..
cd packages/smart-engines-sdk && npx tsc && cd ../..
```

## Usage

```typescript
import { SmartEngineClient } from '@hsuite/smart-engines-sdk';

const client = new SmartEngineClient({
  baseUrl: 'https://validator.example.com',
});

const health = await client.getHealth();
```

## Migration to npm

Once `@hsuite/smart-engines-sdk` is published to npm, remove the `packages/` directory
and update `package.json` dependencies to point to the npm registry version:

```json
{
  "dependencies": {
    "@hsuite/smart-engines-sdk": "^4.0.0"
  }
}
```
