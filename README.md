# TrustState Node.js / TypeScript SDK

[![npm version](https://img.shields.io/npm/v/@truststate/sdk.svg)](https://www.npmjs.com/package/@truststate/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

TypeScript/JavaScript SDK for the [TrustState](https://truststate.apps.trustchainlabs.com) compliance API — validate, audit, and enforce compliance rules on any entity or data record. Built for financial services, AI governance, and regulated industries.

## Install

```bash
npm install @truststate/sdk
# or
yarn add @truststate/sdk
```

Requires Node.js 18+ (uses native `fetch` and `crypto.randomUUID()`).

## Quickstart

```typescript
import { TrustStateClient } from "@truststate/sdk";

const client = new TrustStateClient({
  apiKey: "ts_your_api_key",
  defaultActorId: "my-service-001",  // must be registered in TrustState dashboard
});

const result = await client.check("SukukBond", {
  id: "BOND-001",
  issuerId: "ISS-001",
  currency: "MYR",
  faceValue: 5_000_000,
  maturityDate: "2030-06-01",
  status: "DRAFT",
});

if (result.passed) {
  console.log("✅ Passed — record ID:", result.recordId);
} else {
  console.log("❌ Failed —", result.failReason, `(step ${result.failedStep})`);
}
```

## Batch Writes

Submit multiple records in a single API call. Useful for feed-based pipelines.

```typescript
const result = await client.checkBatch(
  [
    { entityType: "SukukBond", data: { id: "BOND-001", ... } },
    { entityType: "SukukBond", data: { id: "BOND-002", ... } },
    { entityType: "SukukBond", data: { id: "BOND-003", ... } },
  ],
  {
    feedLabel: "core-banking-feed",  // echoed on every item result
    defaultActorId: "my-service-001",  // must be registered in TrustState dashboard
  }
);

console.log(`Accepted: ${result.accepted}/${result.total}`);
result.results.forEach((item) => {
  console.log(`  ${item.entityId}: ${item.passed ? "✅" : "❌"} ${item.feedLabel}`);
});
```

## BYOP Evidence (Oracle Data)

Attach oracle evidence to compliance checks — FX rates, KYC status, credit scores, sanctions screening.

```typescript
// Fetch evidence from registered oracle providers
const fx    = await client.fetchFxRate("MYR", "USD");
const kyc   = await client.fetchKycStatus("actor-jasim");
const score = await client.fetchCreditScore("actor-jasim");

// Submit with evidence attached
const result = await client.checkWithEvidence(
  "SukukBond",
  { id: "BOND-001", issuerId: "ISS-001", currency: "MYR", faceValue: 5_000_000 },
  [fx, kyc, score],
);
```

## Mock Mode

Test without making any API calls. Useful for unit tests and local development.

```typescript
const client = new TrustStateClient({
  apiKey: "any",
  mock: true,
  mockPassRate: 0.8,   // 80% of checks will pass
});

const result = await client.check("SukukBond", { id: "TEST-001", ... });
console.log(result.mock);   // true
```

## Express Middleware

Automatically validate incoming request bodies against TrustState policies.

```typescript
import express from "express";
import { TrustStateMiddleware } from "@truststate/sdk";

const app = express();

app.use(
  TrustStateMiddleware({
    apiKey: "ts_your_api_key",
    entityType: "AgentResponse",
    extractData: (req) => req.body,
  })
);
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | required | Your TrustState API key |
| `baseUrl` | `string` | production URL | Override the API base URL |
| `defaultSchemaVersion` | `string` | auto-resolved | Schema version (auto-resolved by server if omitted) |
| `defaultActorId` | `string` | **required** | Registered Data Source ID — must match a source registered in the TrustState dashboard. All writes are rejected without a valid Source ID. |
| `mock` | `boolean` | `false` | Enable mock mode (no HTTP calls) |
| `mockPassRate` | `number` | `1.0` | Pass probability in mock mode (0.0–1.0) |
| `timeoutMs` | `number` | `30000` | HTTP timeout in milliseconds |


## Data Sources (Required)

Every write must come from a **registered Data Source**. Register sources in the TrustState dashboard under **Manage → Data Sources**, then use the Source ID as `actorId`.

```typescript
// Register "my-service-001" in the dashboard first, then:
const client = new TrustStateClient({
  apiKey: "ts_your_api_key",
  defaultActorId: "my-service-001",  // applies to all check() / checkBatch() calls
});

// Or pass per-call:
const result = await client.check("KYCRecord", data, {
  actorId: "my-service-001",
});
```

If `actorId` is missing, the SDK throws a `TrustStateError(400)` before sending any request.
If `actorId` is not registered, the API returns `403 UNKNOWN_SOURCE`.

## API Reference

### `check(entityType, data, options?)`

Submit a single record for compliance checking.

```typescript
const result = await client.check("SukukBond", data, {
  action: "upsert",
  entityId: "BOND-001",
  schemaVersion: "1.0",
  actorId: "core-banking-feed",
});
```

Returns: `Promise<ComplianceResult>`

### `checkBatch(items, options?)`

Submit up to 500 records in a single call.

```typescript
const result = await client.checkBatch(items, {
  feedLabel: "core-banking-feed",
  defaultActorId: "core-banking-feed",
});
```

Returns: `Promise<BatchResult>`

### `checkWithEvidence(entityType, data, evidence, options?)`

Submit a record with oracle evidence attached.

Returns: `Promise<ComplianceResult>`

### `fetchFxRate(from, to, options?)`
### `fetchKycStatus(subjectId, options?)`
### `fetchCreditScore(subjectId, options?)`
### `fetchSanctions(subjectId, options?)`

Fetch oracle evidence items from registered providers.

Returns: `Promise<EvidenceItem>`

### `verify(recordId, bearerToken)`

Retrieve an immutable compliance record from the ledger.

Returns: `Promise<Record<string, unknown>>`

## Types

### `ComplianceResult`

```typescript
interface ComplianceResult {
  passed: boolean;
  recordId?: string;       // present when passed=true
  requestId: string;
  entityId: string;
  failReason?: string;     // present when passed=false
  failedStep?: number;     // 8=schema validation, 9=policy check
  feedLabel?: string | null;
  mock: boolean;
}
```

### `BatchResult`

```typescript
interface BatchResult {
  batchId: string;
  total: number;
  accepted: number;
  rejected: number;
  results: ComplianceResult[];
  feedLabel?: string | null;
  mock: boolean;
}
```

### `CheckItem`

```typescript
interface CheckItem {
  entityType: string;
  data: Record<string, unknown>;
  action?: string;           // default "upsert"
  entityId?: string;         // auto-generated if omitted
  schemaVersion?: string;    // auto-resolved if omitted
  actorId?: string;         // required per-item if no defaultActorId set on client
}
```

## Requirements

- Node.js 18+
- No external runtime dependencies (uses native `fetch`, `crypto`)

## License

MIT © Trustchain Labs
