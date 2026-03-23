/**
 * TrustState Batch Ingestion Demo — CIMB-style Transactions (TypeScript)
 *
 * Run: npx ts-node examples/batch-feed.ts
 *
 * Demonstrates submitting 10 financial transactions as a single batch call
 * for compliance validation before downstream processing.
 *
 * Runs in MOCK mode automatically when TRUSTSTATE_API_KEY is not set.
 */

import { TrustStateClient, CheckItem } from "../src/index.js";

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
// Helper: short random ID
// ---------------------------------------------------------------------------
function shortId(): string {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

// ---------------------------------------------------------------------------
// Sample transaction batch (CIMB-style)
// ---------------------------------------------------------------------------
const TRANSACTIONS: CheckItem[] = [
  {
    entityType: "FinancialTransaction",
    action: "CREATE",
    data: { transactionId: `TXN-${shortId()}`, fromAccount: "MY-ACC-001", toAccount: "MY-ACC-099", amount: 1500.00, currency: "MYR", channel: "MOBILE_APP", category: "TRANSFER", riskScore: 0.12 },
  },
  {
    entityType: "FinancialTransaction",
    action: "CREATE",
    data: { transactionId: `TXN-${shortId()}`, fromAccount: "MY-ACC-002", toAccount: "VENDOR-567", amount: 299.99, currency: "MYR", channel: "ONLINE_BANKING", category: "BILL_PAYMENT", riskScore: 0.05 },
  },
  {
    entityType: "FinancialTransaction",
    action: "CREATE",
    data: { transactionId: `TXN-${shortId()}`, fromAccount: "MY-ACC-003", toAccount: "INTL-BANK-AU", amount: 50000.00, currency: "MYR", channel: "BRANCH", category: "INTERNATIONAL_TRANSFER", riskScore: 0.78 },
  },
  {
    entityType: "FinancialTransaction",
    action: "CREATE",
    data: { transactionId: `TXN-${shortId()}`, fromAccount: "MY-ACC-004", toAccount: "MY-ACC-110", amount: 800.00, currency: "MYR", channel: "ATM", category: "CASH_WITHDRAWAL", riskScore: 0.09 },
  },
  {
    entityType: "FinancialTransaction",
    action: "CREATE",
    data: { transactionId: `TXN-${shortId()}`, fromAccount: "MY-ACC-005", toAccount: "E-WALLET-GXS", amount: 150.00, currency: "MYR", channel: "MOBILE_APP", category: "WALLET_TOP_UP", riskScore: 0.03 },
  },
  {
    entityType: "FinancialTransaction",
    action: "CREATE",
    data: { transactionId: `TXN-${shortId()}`, fromAccount: "MY-ACC-006", toAccount: "MY-ACC-006", amount: 0.01, currency: "MYR", channel: "SYSTEM", category: "INTEREST_CREDIT", riskScore: 0.00 },
  },
  {
    entityType: "FinancialTransaction",
    action: "CREATE",
    data: { transactionId: `TXN-${shortId()}`, fromAccount: "UNKNOWN", toAccount: "MY-ACC-007", amount: 9900.00, currency: "MYR", channel: "ONLINE_BANKING", category: "TRANSFER", riskScore: 0.91 },
  },
  {
    entityType: "FinancialTransaction",
    action: "CREATE",
    data: { transactionId: `TXN-${shortId()}`, fromAccount: "MY-ACC-008", toAccount: "MERCHANT-MCM", amount: 4200.00, currency: "MYR", channel: "POS", category: "PURCHASE", riskScore: 0.14 },
  },
  {
    entityType: "FinancialTransaction",
    action: "CREATE",
    data: { transactionId: `TXN-${shortId()}`, fromAccount: "MY-ACC-009", toAccount: "CRYPTO-EXCHANGE", amount: 25000.00, currency: "MYR", channel: "ONLINE_BANKING", category: "CRYPTO_PURCHASE", riskScore: 0.67 },
  },
  {
    entityType: "FinancialTransaction",
    action: "CREATE",
    data: { transactionId: `TXN-${shortId()}`, fromAccount: "MY-ACC-010", toAccount: "GOVT-LHDN", amount: 12500.00, currency: "MYR", channel: "ONLINE_BANKING", category: "TAX_PAYMENT", riskScore: 0.02 },
  },
];

// ---------------------------------------------------------------------------
// Demo runner
// ---------------------------------------------------------------------------
async function runBatchDemo(): Promise<void> {
  const client = new TrustStateClient({
    apiKey: API_KEY || "mock-key",
    baseUrl: BASE_URL,
    defaultSchemaVersion: "1.0",
    defaultActorId: "CIMB-BATCH-PROCESSOR",
    mock: USE_MOCK,
    mockPassRate: 0.7,
  });

  const LINE = "=".repeat(72);
  console.log(LINE);
  console.log("  TrustState Batch Ingestion Demo — CIMB-style Transactions");
  console.log(LINE);
  console.log(`  Mode       : ${USE_MOCK ? "MOCK" : "LIVE"}`);
  console.log(`  Batch size : ${TRANSACTIONS.length} transactions`);
  console.log(LINE);
  console.log();

  const batchResult = await client.checkBatch(TRANSACTIONS, {
    defaultSchemaVersion: "1.0",
    defaultActorId: "CIMB-BATCH-PROCESSOR",
  });

  // Summary
  console.log(`  Batch ID  : ${batchResult.batchId}`);
  console.log(`  Total     : ${batchResult.total}`);
  console.log(`  ✅ Accepted : ${batchResult.accepted}`);
  console.log(`  ❌ Rejected : ${batchResult.rejected}`);
  console.log();

  // Per-item table
  const col = (s: string, w: number) => s.slice(0, w).padEnd(w);
  console.log(`${col("#", 3)}${col("Entity ID", 38)}${col("Status", 8)}Record / Reason`);
  console.log("-".repeat(72));

  for (let idx = 0; idx < batchResult.results.length; idx++) {
    const result = batchResult.results[idx];
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    const entityShort = result.entityId.slice(0, 36);
    const detail = result.passed
      ? `record_id=${result.recordId}`
      : `${result.failReason}`;
    console.log(`${col(String(idx + 1), 3)}${col(entityShort, 38)}${col(status, 8)}${detail}`);
  }

  console.log();
  const rate = Math.round((batchResult.accepted / batchResult.total) * 100);
  console.log(`  Acceptance rate: ${rate}%`);
  console.log();

  if (batchResult.rejected > 0) {
    console.log("⚠️  Rejected transactions require manual review before processing.");
  } else {
    console.log("✅ All transactions cleared for processing.");
  }
}

runBatchDemo().catch((err) => {
  console.error("Demo error:", err);
  process.exit(1);
});
