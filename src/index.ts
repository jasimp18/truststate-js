/**
 * @truststate/sdk — TypeScript/JavaScript SDK for TrustState compliance validation.
 *
 * @example
 * ```typescript
 * import { TrustStateClient } from "@truststate/sdk";
 *
 * const client = new TrustStateClient({ apiKey: "your-key" });
 * const result = await client.check("AgentResponse", { text: "Hello!", score: 0.95 });
 * ```
 */

export { TrustStateClient } from "./client.js";
export { TrustStateError } from "./errors.js";
export { trustStateMiddleware, withCompliance } from "./middleware.js";
export type {
  BatchResult,
  CheckItem,
  ComplianceResult,
  TrustStateClientOptions,
} from "./types.js";
export type { TrustStateMiddlewareOptions } from "./middleware.js";
