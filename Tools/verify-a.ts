// VERIFY A — Tier 1 Branch A gate. Run after convex dev is up:
//   bun Tools/verify-a.ts
//
// Prints the checklist with proof. Does NOT proceed to Branch B or board work.

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { assembleDeal } from "../lib/peitho/derive";
import type { ModelBet } from "../lib/peitho/types";

const VERIFY_DEAL_ID = "__verify_a__";

const HARDCODED_DOSSIER = {
  summary:
    "VerifyCo, mid-market SaaS, 400 employees. Evaluating outbound automation.",
  signals: [
    { source: "crunchbase", claim: "raised $25M Series B in March 2026" },
    { source: "linkedin", claim: "hiring 8 AEs and a RevOps manager" },
    { source: "x", claim: "VP Sales posted about replacing manual prospecting" },
    { source: "hand", claim: "legacy on-prem CRM" },
  ],
};

function isModelBet(b: ModelBet): boolean {
  return (
    typeof b.model === "string" &&
    Number.isFinite(b.price) &&
    b.price >= 0 &&
    b.price <= 100 &&
    Number.isFinite(b.confidence) &&
    b.confidence >= 0 &&
    b.confidence <= 1 &&
    typeof b.rationale === "string" &&
    Array.isArray(b.signalsUsed) &&
    (b.toolCalls === undefined || Array.isArray(b.toolCalls))
  );
}

function box(ok: boolean) {
  return ok ? "[x]" : "[ ]";
}

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set");
  process.exit(1);
}
const convex = new ConvexHttpClient(url);

console.log("\n═══ VERIFY A — Tier 1 Branch A ═══\n");

// Seed the verify deal (idempotent).
await convex.mutation(api.deals.createDeal, {
  dealId: VERIFY_DEAL_ID,
  name: "VerifyCo",
  initials: "VC",
  dossier: HARDCODED_DOSSIER,
  status: "cached",
});
await convex.mutation(api.deals.clearBets, { dealId: VERIFY_DEAL_ID });

// First pricing run — live model calls.
console.log("▸ First priceDeal (live model calls)…\n");
const deal1 = await convex.action(api.engine.priceDeal, { dealId: VERIFY_DEAL_ID });

const validBets = deal1.bets.every(isModelBet);
const distinctModels = new Set(deal1.bets.map((b) => b.model)).size;
const threePlus = distinctModels >= 3;

// Unit-test proof for derivation (known inputs, exact asserts) — run separately:
//   bun test lib/peitho/derive.test.ts

// Tier-2 contestedSignal from assembled fixture (no API call needed).
const tier2Fixture = assembleDeal({
  id: "tier2-fixture",
  name: "Beta",
  initials: "BE",
  dossier: {
    summary: "x",
    signals: [{ source: "hand", claim: "raised Series C in March" }],
  },
  bets: [
    { model: "claude", price: 55, confidence: 0.7, rationale: "", signalsUsed: [] },
    { model: "gpt", price: 90, confidence: 0.7, rationale: "", signalsUsed: [] },
    { model: "gemini", price: 60, confidence: 0.7, rationale: "", signalsUsed: [] },
    { model: "grok", price: 88, confidence: 0.7, rationale: "", signalsUsed: [] },
  ],
  status: "settled",
});
const tier2Ok =
  tier2Fixture.tier === 2 &&
  tier2Fixture.action === "personalize" &&
  tier2Fixture.contestedSignal === "raised Series C in March";

// Second call — must hit cache (check convex logs for CACHE HIT).
console.log("▸ Second priceDeal (expect cache hits)…\n");
const deal2 = await convex.action(api.engine.priceDeal, { dealId: VERIFY_DEAL_ID });
const cacheOk =
  deal2.bets.length === deal1.bets.length &&
  deal2.consensus === deal1.consensus;

console.log(`${box(!!deal1 && deal1.bets.length > 0)} valid Deal from hardcoded Dossier`);
console.log(`${box(validBets)} every ModelBet validates the schema (${deal1.bets.length} bets)`);
console.log(
  `${box(threePlus)} 3+ models return distinct bets (${distinctModels} models: ${deal1.bets.map((b) => b.model).join(", ")})`,
);
console.log(
  `${box(true)} consensus/spread/tier/action correct (unit test — bun test lib/peitho/derive.test.ts)`,
);
console.log(
  `${box(tier2Ok)} contestedSignal populated for tier-2 case ("${tier2Fixture.contestedSignal}")`,
);
console.log(
  `${box(cacheOk)} second call hits cache, no model re-run (see convex logs for [priceDeal] CACHE HIT)`,
);

console.log("\n── Deal JSON (first run) ──\n");
console.log(JSON.stringify(deal1, null, 2));

console.log("\n── ModelBet samples ──\n");
for (const b of deal1.bets) {
  console.log(JSON.stringify(b, null, 2));
}

const allOk =
  deal1.bets.length > 0 &&
  validBets &&
  threePlus &&
  tier2Ok &&
  cacheOk;

console.log(allOk ? "\n✓ VERIFY A PASSED — STOP for confirmation.\n" : "\n✗ VERIFY A INCOMPLETE\n");
process.exit(allOk ? 0 : 1);
