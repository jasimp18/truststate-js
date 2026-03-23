/**
 * TrustState SDK — TypeScript type definitions.
 */

/** Result of a single compliance check. */
export interface ComplianceResult {
  /** True if all compliance checks passed. */
  passed: boolean;
  /** Immutable ledger record ID — only present when passed=true. */
  recordId?: string;
  /** Unique API request identifier (useful for support/debugging). */
  requestId: string;
  /** The entity identifier submitted (caller-supplied or auto-generated). */
  entityId: string;
  /** Human-readable reason for failure — only present when passed=false. */
  failReason?: string;
  /** Numeric step that failed. 8 = schema validation, 9 = policy check. */
  failedStep?: number;
  /** True when this result was synthesised locally in mock mode (no HTTP call). */
  mock: boolean;
}

/** Aggregated result for a batch compliance submission. */
export interface BatchResult {
  /** Unique identifier for this batch request. */
  batchId: string;
  /** Total number of items submitted. */
  total: number;
  /** Number of items that passed compliance checks. */
  accepted: number;
  /** Number of items that failed compliance checks. */
  rejected: number;
  /** Per-item results in the same order as the submitted items. */
  results: ComplianceResult[];
  /** True when running in mock mode (no HTTP calls made). */
  mock: boolean;
}

/** A single item in a batch submission. */
export interface CheckItem {
  /** The TrustState entity type (e.g. "AgentResponse", "Transaction"). */
  entityType: string;
  /** The record payload to validate. */
  data: Record<string, unknown>;
  /** Action being performed. Defaults to "CREATE". */
  action?: string;
  /** Optional stable entity identifier. Auto-generated if omitted. */
  entityId?: string;
  /** Schema version to validate against. Uses client default if omitted. */
  schemaVersion?: string;
  /** Actor ID for the audit trail. Uses client default if omitted. */
  actorId?: string;
}

/** Constructor options for TrustStateClient. */
export interface TrustStateClientOptions {
  /** Your TrustState API key (sent as X-API-Key header). */
  apiKey: string;
  /** Override the default API base URL. */
  baseUrl?: string;
  /** Default schema version applied when not specified per-call. */
  defaultSchemaVersion?: string;
  /** Default actor ID for the audit trail. */
  defaultActorId?: string;
  /**
   * Enable mock mode. When true, all HTTP calls are skipped and
   * synthetic results are returned locally.
   */
  mock?: boolean;
  /**
   * Probability (0.0–1.0) that a mock check returns passed=true.
   * 1.0 = always pass, 0.0 = always fail.
   */
  mockPassRate?: number;
  /** HTTP request timeout in milliseconds. */
  timeoutMs?: number;
}
