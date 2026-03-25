/**
 * TrustStateClient — async HTTP client for the TrustState compliance API.
 *
 * Uses native fetch (Node 18+) and crypto.randomUUID(). Zero runtime dependencies.
 *
 * @example
 * ```typescript
 * import { TrustStateClient } from "@truststate/sdk";
 *
 * const client = new TrustStateClient({ apiKey: "your-key" });
 * const result = await client.check("AgentResponse", { text: "Hello!", score: 0.95 });
 * console.log(result.passed, result.recordId);
 * ```
 */

import { TrustStateError } from "./errors.js";
import type {
  BatchResult,
  CheckItem,
  ComplianceResult,
  EvidenceItem,
  TrustStateClientOptions,
} from "./types.js";

const DEFAULT_BASE_URL = "https://truststate-api.apps.trustchainlabs.com";

export class TrustStateClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultSchemaVersion: string;
  private readonly defaultActorId: string;
  private readonly mock: boolean;
  private readonly mockPassRate: number;
  private readonly timeoutMs: number;

  constructor(options: TrustStateClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.defaultSchemaVersion = options.defaultSchemaVersion ?? "1.0";
    this.defaultActorId = options.defaultActorId ?? "";
    this.mock = options.mock ?? false;
    this.mockPassRate = options.mockPassRate ?? 1.0;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Submit a single record for compliance checking.
   *
   * Internally wraps the record in a one-item batch call (POST /v1/write/batch).
   *
   * @param entityType - Entity category (e.g. "AgentResponse").
   * @param data - The record payload to validate.
   * @param options - Optional overrides for action, entityId, schemaVersion, actorId.
   * @returns ComplianceResult with pass/fail status and, if passed, a recordId.
   * @throws TrustStateError on HTTP 4xx/5xx.
   */
  async check(
    entityType: string,
    data: Record<string, unknown>,
    options: {
      action?: string;
      entityId?: string;
      schemaVersion?: string;
      actorId?: string;
    } = {}
  ): Promise<ComplianceResult> {
    const entityId = options.entityId ?? crypto.randomUUID();

    if (this.mock) {
      return this.mockSingleResult(entityId);
    }

    const batchResult = await this.checkBatch(
      [
        {
          entityType,
          data,
          action: options.action,
          entityId,
          schemaVersion: options.schemaVersion,
          actorId: options.actorId,
        },
      ],
      {
        defaultSchemaVersion: options.schemaVersion,
        defaultActorId: options.actorId,
      }
    );

    return batchResult.results[0];
  }

  /**
   * Submit multiple records for compliance checking in a single API call.
   *
   * @param items - Array of CheckItem objects.
   * @param options - Optional default schemaVersion and actorId for items that omit them.
   * @returns BatchResult with per-item results and aggregate counts.
   * @throws TrustStateError on HTTP 4xx/5xx.
   */
  async checkBatch(
    items: CheckItem[],
    options: {
      defaultSchemaVersion?: string;
      defaultActorId?: string;
      /** Label identifying this feed/source — echoed back on every item result. */
      feedLabel?: string;
    } = {}
  ): Promise<BatchResult> {
    const schemaVer = options.defaultSchemaVersion ?? this.defaultSchemaVersion;
    const actor = options.defaultActorId ?? this.defaultActorId;

    // Normalise items — assign missing entity IDs and fill defaults
    const normalised = items.map((item) => {
      const entry: Record<string, unknown> & { entityId: string } = {
        entityType: item.entityType,
        data: item.data,
        action: item.action ?? "upsert",
        entityId: item.entityId ?? crypto.randomUUID(),
        actorId: item.actorId ?? actor ?? "sdk-writer",
      };
      const sv = item.schemaVersion ?? schemaVer;
      if (sv) entry.schemaVersion = sv;
      return entry;
    });

    if (this.mock) {
      return this.mockBatchResult(normalised, options.feedLabel);
    }

    const payload: Record<string, unknown> = { items: normalised };
    if (schemaVer) payload.defaultSchemaVersion = schemaVer;
    if (actor) payload.defaultActorId = actor;
    if (options.feedLabel) payload.feedLabel = options.feedLabel;

    const responseJson = await this.post("/v1/write/batch", payload);
    return this.parseBatchResponse(responseJson);
  }

  /**
   * Retrieve an immutable compliance record from the ledger.
   *
   * @param recordId - The record ID returned by a previous check() that passed.
   * @param bearerToken - A valid Bearer token for the TrustState API.
   * @returns The full record object from the API.
   * @throws TrustStateError on HTTP 4xx/5xx.
   */
  // ---------------------------------------------------------------------------
  // BYOP Evidence fetch helpers
  // ---------------------------------------------------------------------------

  /** Fetch an FX rate oracle evidence item.
   * @example
   * const fx = await client.fetchFxRate("MYR", "USD");
   * const result = await client.checkWithEvidence("SukukBond", data, [fx]);
   */
  async fetchFxRate(
    fromCurrency: string,
    toCurrency: string,
    providerId = "reuters-fx",
    maxAgeSeconds = 300,
  ): Promise<EvidenceItem> {
    const subject = { from: fromCurrency, to: toCurrency };
    if (this.mock) {
      const stubs: Record<string, number> = { MYR_USD: 0.2119, USD_MYR: 4.72, EUR_USD: 1.085, GBP_USD: 1.267 };
      return this.makeEvidenceItem(providerId, "fx_rate", subject, stubs[`${fromCurrency}_${toCurrency}`] ?? 1.0, maxAgeSeconds);
    }
    const data: any = await this.get(`/v1/oracle/fx-rate?from=${fromCurrency}&to=${toCurrency}&providerId=${providerId}`);
    return this.parseEvidenceResponse(data, providerId, "fx_rate", subject, maxAgeSeconds);
  }

  /** Fetch a KYC status oracle evidence item. */
  async fetchKycStatus(
    subjectId: string,
    providerId = "sumsub-kyc",
    maxAgeSeconds = 86400,
  ): Promise<EvidenceItem> {
    const subject = { id: subjectId };
    if (this.mock) {
      return this.makeEvidenceItem(providerId, "kyc_status", subject, "PASS", maxAgeSeconds);
    }
    const data: any = await this.get(`/v1/oracle/kyc-status?subjectId=${subjectId}&providerId=${providerId}`);
    return this.parseEvidenceResponse(data, providerId, "kyc_status", subject, maxAgeSeconds);
  }

  /** Fetch a credit score oracle evidence item. */
  async fetchCreditScore(
    subjectId: string,
    providerId = "coface-credit",
    maxAgeSeconds = 86400,
  ): Promise<EvidenceItem> {
    const subject = { id: subjectId };
    if (this.mock) {
      return this.makeEvidenceItem(providerId, "credit_score", subject, 720, maxAgeSeconds);
    }
    const data: any = await this.get(`/v1/oracle/credit-score?subjectId=${subjectId}&providerId=${providerId}`);
    return this.parseEvidenceResponse(data, providerId, "credit_score", subject, maxAgeSeconds);
  }

  /** Fetch a sanctions screening oracle evidence item. */
  async fetchSanctions(
    subjectId: string,
    providerId = "refinitiv-sanct",
    maxAgeSeconds = 3600,
  ): Promise<EvidenceItem> {
    const subject = { id: subjectId };
    if (this.mock) {
      return this.makeEvidenceItem(providerId, "sanctions", subject, "CLEAR", maxAgeSeconds);
    }
    const data: any = await this.get(`/v1/oracle/sanctions?subjectId=${subjectId}&providerId=${providerId}`);
    return this.parseEvidenceResponse(data, providerId, "sanctions", subject, maxAgeSeconds);
  }

  /** Submit a compliance check with oracle evidence attached.
   * @example
   * const fx = await client.fetchFxRate("MYR", "USD");
   * const result = await client.checkWithEvidence("SukukBond", payload, [fx]);
   */
  async checkWithEvidence(
    entityType: string,
    data: Record<string, unknown>,
    evidence: EvidenceItem[],
    options: { action?: string; entityId?: string; schemaVersion?: string; actorId?: string } = {},
  ): Promise<ComplianceResult> {
    if (this.mock) return this.mockSingleResult(options.entityId ?? crypto.randomUUID());
    const entityId = options.entityId ?? crypto.randomUUID();
    const schemaVersion = options.schemaVersion ?? this.defaultSchemaVersion;
    const actorId = options.actorId ?? this.defaultActorId;
    const item: Record<string, unknown> = {
      entityType,
      data,
      action: options.action ?? "upsert",
      entityId,
      actorId: actorId ?? "sdk-writer",
      evidence,
    };
    if (schemaVersion) item.schemaVersion = schemaVersion;
    const response = await this.post("/v1/write/batch", { items: [item] });
    return this.parseBatchResponse(response).results[0];
  }

  private makeEvidenceItem(
    providerId: string,
    providerType: string,
    subject: Record<string, unknown>,
    observedValue: string | number,
    maxAgeSeconds: number,
  ): EvidenceItem {
    const now = new Date().toISOString();
    return {
      evidenceId:     crypto.randomUUID(),
      providerId,
      providerType,
      subject,
      observedValue,
      observedAt:     now,
      retrievedAt:    now,
      maxAgeSeconds,
      mock:           true,
    };
  }

  private parseEvidenceResponse(
    data: any,
    defaultProviderId: string,
    providerType: string,
    subject: Record<string, unknown>,
    maxAgeSeconds: number,
  ): EvidenceItem {
    return {
      evidenceId:     crypto.randomUUID(),
      providerId:     data.providerId ?? defaultProviderId,
      providerType,
      subject,
      observedValue:  data.observedValue,
      observedAt:     data.observedAt,
      retrievedAt:    new Date().toISOString(),
      maxAgeSeconds,
      proofHash:      data.proofHash,
      rawProofUri:    data.rawProofUri,
      attestation:    data.attestation,
    };
  }

  async verify(recordId: string, bearerToken: string): Promise<unknown> {
    const url = `${this.baseUrl}/v1/records/${recordId}`;
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${bearerToken}` },
        signal: controller.signal,
      });
    } catch (err) {
      throw new TrustStateError(`Network error: ${(err as Error).message}`);
    } finally {
      clearTimeout(timerId);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new TrustStateError(
        `API error ${response.status}: ${body}`,
        response.status
      );
    }

    return response.json();
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private async get(path: string): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: { "X-API-Key": this.apiKey },
        signal: controller.signal,
      });
    } catch (err) {
      throw new TrustStateError(`Network error: ${(err as Error).message}`);
    } finally {
      clearTimeout(timerId);
    }
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new TrustStateError(`API error ${response.status}: ${body}`, response.status);
    }
    return response.json() as Promise<Record<string, unknown>>;
  }

  private async post(
    path: string,
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err) {
      throw new TrustStateError(`Network error: ${(err as Error).message}`);
    } finally {
      clearTimeout(timerId);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new TrustStateError(
        `API error ${response.status}: ${body}`,
        response.status
      );
    }

    return response.json() as Promise<Record<string, unknown>>;
  }

  private parseBatchResponse(data: Record<string, unknown>): BatchResult {
    const rawResults = (data.results as Record<string, unknown>[]) ?? [];
    const results: ComplianceResult[] = rawResults.map((r) => {
      // Batch API returns status: 'accepted' | 'rejected', or passed: true/false directly
      const passed = r.status === "accepted" || r.passed === true;
      return {
        passed,
        recordId: r.recordId as string | undefined,
        requestId: (r.requestId as string) ?? "",
        entityId: (r.entityId as string) ?? "",
        failReason: r.failReason as string | undefined,
        failedStep: r.failedStep as number | undefined,
        feedLabel: (r.feedLabel as string | null) ?? null,
        mock: false,
      };
    });

    const accepted = results.filter((r) => r.passed).length;

    return {
      batchId: (data.batchId as string) ?? crypto.randomUUID(),
      total: (data.total as number) ?? results.length,
      accepted: (data.accepted as number) ?? accepted,
      rejected: (data.rejected as number) ?? results.length - accepted,
      results,
      feedLabel: (data.feedLabel as string | null) ?? null,
      mock: false,
    };
  }

  // ---------------------------------------------------------------------------
  // Mock helpers (zero network calls)
  // ---------------------------------------------------------------------------

  private mockSingleResult(entityId: string): ComplianceResult {
    const passed = Math.random() < this.mockPassRate;
    return {
      passed,
      recordId: passed ? `mock-rec-${crypto.randomUUID()}` : undefined,
      requestId: `mock-req-${crypto.randomUUID()}`,
      entityId,
      failReason: passed ? undefined : "Mock: simulated policy failure",
      failedStep: passed ? undefined : 9,
      mock: true,
    };
  }

  private mockBatchResult(
    normalisedItems: Array<{ entityId: string }>,
    feedLabel?: string
  ): BatchResult {
    const results = normalisedItems.map((item) => ({
      ...this.mockSingleResult(item.entityId),
      feedLabel: feedLabel ?? null,
    }));
    const accepted = results.filter((r) => r.passed).length;

    return {
      batchId: `mock-batch-${crypto.randomUUID()}`,
      total: results.length,
      accepted,
      rejected: results.length - accepted,
      results,
      feedLabel: feedLabel ?? null,
      mock: true,
    };
  }
}
