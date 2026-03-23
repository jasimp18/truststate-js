/**
 * Unit tests for TrustStateClient (mock mode — zero network calls).
 *
 * Run: npm test
 */

import { TrustStateClient } from "../src/client.js";
import { TrustStateError } from "../src/errors.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockClient(mockPassRate = 1.0): TrustStateClient {
  return new TrustStateClient({
    apiKey: "test-key",
    mock: true,
    mockPassRate,
  });
}

const SAMPLE_DATA = { responseText: "Hello", confidenceScore: 0.9 };

// ---------------------------------------------------------------------------
// Mock mode — single check
// ---------------------------------------------------------------------------

describe("TrustStateClient — mock mode", () => {
  test("test_check_passes_in_mock_mode: passes when mockPassRate=1.0", async () => {
    const client = makeMockClient(1.0);
    const result = await client.check("AgentResponse", SAMPLE_DATA);

    expect(result.passed).toBe(true);
    expect(result.recordId).toBeDefined();
    expect(result.recordId).toMatch(/^mock-rec-/);
    expect(result.failReason).toBeUndefined();
    expect(result.failedStep).toBeUndefined();
    expect(result.mock).toBe(true);
    expect(result.entityId).toBeTruthy();
    expect(result.requestId).toBeTruthy();
  });

  test("test_check_batch_in_mock_mode: batch result has correct shape", async () => {
    const client = makeMockClient(1.0);
    const items = [
      { entityType: "Tx", data: { amount: 100 } },
      { entityType: "Tx", data: { amount: 200 } },
      { entityType: "Tx", data: { amount: 300 } },
    ];
    const batch = await client.checkBatch(items);

    expect(batch.total).toBe(3);
    expect(batch.accepted).toBe(3);
    expect(batch.rejected).toBe(0);
    expect(batch.results).toHaveLength(3);
    expect(batch.mock).toBe(true);
    expect(batch.batchId).toMatch(/^mock-batch-/);

    for (const r of batch.results) {
      expect(r.mock).toBe(true);
      expect(r.passed).toBe(true);
      expect(r.recordId).toBeDefined();
    }
  });

  test("test_mock_pass_rate_zero_always_fails: every check fails at rate=0.0", async () => {
    const client = makeMockClient(0.0);

    for (let i = 0; i < 10; i++) {
      const result = await client.check("AgentResponse", SAMPLE_DATA);
      expect(result.passed).toBe(false);
      expect(result.recordId).toBeUndefined();
      expect(result.failReason).toBeTruthy();
      expect(result.failedStep).toBe(9);
      expect(result.mock).toBe(true);
    }
  });

  test("test_entity_id_auto_generated: unique IDs generated when not provided", async () => {
    const client = makeMockClient(1.0);

    const r1 = await client.check("AgentResponse", SAMPLE_DATA);
    const r2 = await client.check("AgentResponse", SAMPLE_DATA);

    expect(r1.entityId).toBeTruthy();
    expect(r2.entityId).toBeTruthy();
    expect(r1.entityId).not.toBe(r2.entityId);
  });

  test("entity_id preserved when caller provides it", async () => {
    const client = makeMockClient(1.0);
    const myId = "my-stable-entity-id-123";

    const result = await client.check("AgentResponse", SAMPLE_DATA, {
      entityId: myId,
    });

    expect(result.entityId).toBe(myId);
  });

  test("batch auto-generates entity IDs for items without one", async () => {
    const client = makeMockClient(1.0);
    const items = [
      { entityType: "T", data: { x: 1 } }, // no entityId
      { entityType: "T", data: { x: 2 }, entityId: "explicit-id" },
    ];
    const batch = await client.checkBatch(items);

    expect(batch.results[0].entityId).toBeTruthy();
    expect(batch.results[1].entityId).toBe("explicit-id");
  });

  test("batch: accepted + rejected = total for mixed pass rate", async () => {
    // Seed-independent: just check the math holds
    const client = makeMockClient(0.5);
    const items = Array.from({ length: 20 }, (_, i) => ({
      entityType: "X",
      data: { v: i },
    }));
    const batch = await client.checkBatch(items);

    expect(batch.total).toBe(20);
    expect(batch.accepted + batch.rejected).toBe(20);
    expect(batch.results).toHaveLength(20);
  });
});

// ---------------------------------------------------------------------------
// TrustStateError
// ---------------------------------------------------------------------------

describe("TrustStateError", () => {
  test("carries message and statusCode", () => {
    const err = new TrustStateError("something broke", 422);
    expect(err.message).toBe("something broke");
    expect(err.statusCode).toBe(422);
    expect(err.name).toBe("TrustStateError");
    expect(err instanceof Error).toBe(true);
    expect(err instanceof TrustStateError).toBe(true);
  });

  test("statusCode defaults to 0 when not provided", () => {
    const err = new TrustStateError("network error");
    expect(err.statusCode).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Live mode (fetch mocking)
// ---------------------------------------------------------------------------

describe("TrustStateClient — live mode HTTP", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("throws TrustStateError on non-OK response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as unknown as Response);

    const client = new TrustStateClient({ apiKey: "bad-key", mock: false });

    await expect(
      client.check("AgentResponse", SAMPLE_DATA)
    ).rejects.toThrow(TrustStateError);
  });

  test("parses successful batch response", async () => {
    const mockResponse = {
      batchId: "batch-abc",
      total: 1,
      accepted: 1,
      rejected: 0,
      results: [
        {
          passed: true,
          recordId: "rec-xyz",
          requestId: "req-123",
          entityId: "ent-456",
          failReason: null,
          failedStep: null,
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response);

    const client = new TrustStateClient({ apiKey: "live-key", mock: false });
    const result = await client.check("AgentResponse", SAMPLE_DATA);

    expect(result.passed).toBe(true);
    expect(result.recordId).toBe("rec-xyz");
    expect(result.requestId).toBe("req-123");
    expect(result.mock).toBe(false);
  });
});
