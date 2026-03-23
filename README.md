# @truststate/sdk

[![npm version](https://img.shields.io/badge/npm-0.1.0-blue)](https://github.com/MyreneBot/truststate-js)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue)](https://www.typescriptlang.org)
[![Node](https://img.shields.io/badge/node-18%2B-green)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

TypeScript/JavaScript SDK for **[TrustState](https://trustchainlabs.com)** — real-time compliance validation and immutable audit trails for AI agents and financial systems.

Zero runtime dependencies. Uses native `fetch` and `crypto` (Node 18+).

---

## Installation

```bash
# Not yet on npm — install directly from GitHub:
npm install github:MyreneBot/truststate-js

# Or clone and link locally:
git clone https://github.com/MyreneBot/truststate-js.git
cd truststate-js && npm install && npm run build
npm link
```

---

## Quick Start

### CommonJS

```javascript
const { TrustStateClient } = require("@truststate/sdk");

const client = new TrustStateClient({ apiKey: "your-api-key" });

async function main() {
  const result = await client.check("AgentResponse", {
    responseText: "Portfolio rebalanced.",
    confidenceScore: 0.92,
  });

  if (result.passed) {
    console.log("✅ Passed — recordId:", result.recordId);
  } else {
    console.log("❌ Failed:", result.failReason, "step:", result.failedStep);
  }
}

main();
```

### ESM / TypeScript

```typescript
import { TrustStateClient } from "@truststate/sdk";

const client = new TrustStateClient({ apiKey: "your-api-key" });

const result = await client.check("AgentResponse", {
  responseText: "Portfolio rebalanced.",
  confidenceScore: 0.92,
});

if (result.passed) {
  console.log("✅ Passed — recordId:", result.recordId);
} else {
  console.log("❌ Failed:", result.failReason);
}
```

### Batch Submission

```typescript
const batch = await client.checkBatch([
  { entityType: "Transaction", data: { amount: 500, currency: "MYR" } },
  { entityType: "Transaction", data: { amount: 99000, currency: "MYR" } },
]);

console.log(`Accepted: ${batch.accepted}/${batch.total}`);
```

---

## Mock Mode

Develop and test without a live API connection. No HTTP calls are made.

```typescript
const client = new TrustStateClient({
  apiKey: "any-value",
  mock: true,
  mockPassRate: 0.8, // 80% pass, 20% fail
});

const result = await client.check("AgentResponse", { text: "hello" });
console.log(result.mock); // true
```

**Use cases:**
- Unit tests (no API key needed)
- CI pipelines
- Local development without credentials
- Offline demos

---

## Express Middleware

Automatically gate any route that includes the `X-Compliance-Entity-Type` header:

```typescript
import express from "express";
import { TrustStateClient, trustStateMiddleware } from "@truststate/sdk";

const app = express();
const client = new TrustStateClient({ apiKey: process.env.TRUSTSTATE_API_KEY! });

app.use(express.json());
app.use(trustStateMiddleware(client));

// Requests with X-Compliance-Entity-Type header will be validated.
// Failed checks automatically return HTTP 422.
app.post("/submit", (req, res) => {
  res.json({ ok: true });
});
```

### Request headers

| Header | Description |
|---|---|
| `X-Compliance-Entity-Type` | Entity type to validate (required to activate middleware) |
| `X-Compliance-Action` | Action string — default `"CREATE"` |
| `X-Compliance-Entity-Id` | Optional stable entity ID |

### Response headers (on pass)

| Header | Description |
|---|---|
| `X-Compliance-Record-Id` | Immutable ledger record ID |

---

## Next.js Middleware

Wrap individual API route handlers:

```typescript
// pages/api/agent-response.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withCompliance } from "@truststate/sdk";
import { client } from "@/lib/truststate";

export default withCompliance(client, "AgentResponse", async (req, res) => {
  // Only reaches here if compliance check passed
  res.json({ message: "Compliant response delivered" });
});
```

---

## API Reference

### `new TrustStateClient(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | required | Your TrustState API key |
| `baseUrl` | `string` | `https://truststate-api.apps.trustchainlabs.com` | API base URL |
| `defaultSchemaVersion` | `string` | `"1.0"` | Schema version for submissions |
| `defaultActorId` | `string` | `""` | Actor ID for audit trail |
| `mock` | `boolean` | `false` | Enable mock mode |
| `mockPassRate` | `number` | `1.0` | Probability of passing in mock mode |
| `timeoutMs` | `number` | `30000` | HTTP timeout in ms |

### `await client.check(entityType, data, options?)`

Submit a single record. Returns `Promise<ComplianceResult>`.

### `await client.checkBatch(items, options?)`

Submit multiple records in one call. Returns `Promise<BatchResult>`.

### `await client.verify(recordId, bearerToken)`

Retrieve an immutable record from the ledger. Returns `Promise<unknown>`.

---

## ComplianceResult

| Field | Type | Description |
|---|---|---|
| `passed` | `boolean` | True if all checks passed |
| `recordId` | `string?` | Immutable ledger ID (set only when passed) |
| `requestId` | `string` | Unique API request ID |
| `entityId` | `string` | The entity identifier |
| `failReason` | `string?` | Human-readable failure reason |
| `failedStep` | `number?` | Step that failed (8=schema, 9=policy) |
| `mock` | `boolean` | True when result is synthetic (mock mode) |

---

## API Compatibility

| SDK Version | TrustState API |
|---|---|
| 0.1.x | v1 |

---

## Platform

Built for [TrustState](https://trustchainlabs.com) by [TrustChain Labs](https://trustchainlabs.com).
