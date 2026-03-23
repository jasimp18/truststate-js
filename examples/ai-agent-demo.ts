/**
 * TrustState AI Agent Compliance Demo (TypeScript)
 *
 * Run: npx ts-node examples/ai-agent-demo.ts
 *  or: node --loader ts-node/esm examples/ai-agent-demo.ts
 *
 * Simulates an AI agent submitting 5 responses to TrustState for compliance
 * validation. 3 are designed to be compliant, 2 are non-compliant.
 *
 * Runs in MOCK mode automatically when TRUSTSTATE_API_KEY is not set.
 */

import { TrustStateClient } from "../src/index.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const API_KEY = process.env["TRUSTSTATE_API_KEY"] ?? "";
const BASE_URL =
  process.env["TRUSTSTATE_BASE_URL"] ??
  "https://truststate-api.apps.trustchainlabs.com";

const USE_MOCK = !API_KEY;

if (USE_MOCK) {
  console.log("⚠️  TRUSTSTATE_API_KEY not set — running in MOCK mode (no network calls).\n");
}

// ---------------------------------------------------------------------------
// Sample agent responses
// ---------------------------------------------------------------------------
const AGENT_RESPONSES = [
  // --- Compliant ---
  {
    name: "Balanced investment advice",
    payload: {
      responseText:
        "Based on your risk profile, a balanced portfolio with 60% equities " +
        "and 40% bonds is recommended. Past performance is not indicative of " +
        "future results. Please consult a licensed financial advisor.",
      confidenceScore: 0.92,
      hasDisclaimer: true,
      category: "INVESTMENT_ADVICE",
    },
  },
  {
    name: "Loan eligibility check",
    payload: {
      responseText:
        "Your preliminary eligibility score is 720. This is an indicative " +
        "assessment only. Final approval is subject to full credit evaluation.",
      confidenceScore: 0.88,
      hasDisclaimer: true,
      category: "CREDIT_ASSESSMENT",
    },
  },
  {
    name: "Transaction summary",
    payload: {
      responseText: "Your last 5 transactions total RM 4,230.50.",
      confidenceScore: 0.99,
      hasDisclaimer: false,
      category: "ACCOUNT_INFO",
    },
  },
  // --- Non-compliant: low confidence ---
  {
    name: "Uncertain market prediction (low confidence)",
    payload: {
      responseText: "The stock will definitely rise 20% next quarter.",
      confidenceScore: 0.31,
      hasDisclaimer: false,
      category: "MARKET_PREDICTION",
    },
  },
  // --- Non-compliant: missing disclaimer ---
  {
    name: "Insurance recommendation without disclaimer",
    payload: {
      responseText:
        "I recommend upgrading to the Premium Life plan — it covers everything.",
      confidenceScore: 0.78,
      hasDisclaimer: false,
      category: "INSURANCE_RECOMMENDATION",
    },
  },
];

// ---------------------------------------------------------------------------
// Demo runner
// ---------------------------------------------------------------------------
async function runDemo(): Promise<void> {
  const client = new TrustStateClient({
    apiKey: API_KEY || "mock-key",
    baseUrl: BASE_URL,
    mock: USE_MOCK,
    mockPassRate: 0.6, // simulate ~3/5 pass for demo
  });

  const LINE = "=".repeat(72);
  console.log(LINE);
  console.log("  TrustState AI Agent Compliance Demo (TypeScript)");
  console.log(LINE);
  console.log(`  Mode : ${USE_MOCK ? "MOCK (synthetic results)" : "LIVE (API calls)"}`);
  console.log(`  API  : ${BASE_URL}`);
  console.log(LINE);
  console.log();

  // Table header
  const col = (s: string, w: number) => s.slice(0, w).padEnd(w);
  console.log(
    `${col("#", 3)}${col("Name", 42)}${col("Status", 8)}${col("Step", 6)}Record / Reason`
  );
  console.log("-".repeat(72));

  const passedItems: Array<{ idx: number; recordId: string }> = [];

  for (let idx = 0; idx < AGENT_RESPONSES.length; idx++) {
    const agentResp = AGENT_RESPONSES[idx];
    const result = await client.check("AgentResponse", agentResp.payload, {
      action: "CREATE",
    });

    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    const step = result.failedStep != null ? String(result.failedStep) : "—";
    const detail = result.passed
      ? `record_id=${result.recordId}`
      : `${result.failReason}`;

    console.log(
      `${col(String(idx + 1), 3)}${col(agentResp.name, 42)}${col(status, 8)}${col(step, 6)}${detail}`
    );

    if (result.passed && result.recordId) {
      passedItems.push({ idx: idx + 1, recordId: result.recordId });
    }
  }

  console.log();
  console.log("📋 Audit trail URLs (passed records):");
  for (const { idx, recordId } of passedItems) {
    console.log(`  [${idx}] ${BASE_URL}/v1/records/${recordId}`);
  }

  console.log();
  console.log("Done. In production, passed recordIds are immutable compliance evidence.");
  console.log("Use client.verify(recordId, bearerToken) to retrieve full audit records.");
}

runDemo().catch((err) => {
  console.error("Demo error:", err);
  process.exit(1);
});
