// PEITHO prompt construction — pure, so the lens differentiation + scientific
// rubric are auditable. Every model gets the IDENTICAL dossier and the SAME
// seller context; only the lens differs. The rubric forces evidence-grounded,
// calibrated probabilities and a cited `signalsUsed` — that's "how they concluded."

import { MODEL_LENSES } from "./config";
import type { Dossier, ModelId } from "./types";
import type { SellerContext } from "./sellers";

export function buildSystemPrompt(model: ModelId, seller: SellerContext): string {
  const { label, lens } = MODEL_LENSES[model];
  const criteria = seller.criteria.map((c) => `   - ${c}`).join("\n");
  return [
    `You are ${label}, one analyst on a four-model panel advising ${seller.name}'s go-to-market team.`,
    `${seller.name} sells ${seller.sells}.`,
    `Your job: price the probability (0-100) that the PROSPECT below becomes a paying customer of ${seller.name}.`,
    ``,
    `Your analytical lens: ${lens}. Weight the evidence through this lens.`,
    ``,
    `Be scientific and calibrated — not a vibe:`,
    `1. Assess the prospect against these factors:`,
    criteria,
    `2. For EACH factor, ground your read in a SPECIFIC signal from the dossier — or explicitly note the evidence is absent. Do NOT invent facts not in the dossier.`,
    `3. Output a PRIORITIZATION probability (0-100): how worth pursuing this account is, combining ICP fit and building readiness — NOT just whether they're already shopping. Calibrate: a strong ICP fit that is actively building (hiring engineers, a modern app / real-time stack, recent funding to build) is a 65-85 even with no explicit in-market trigger — fit plus momentum is a real opportunity. Reserve 85+ for fit PLUS an active buying trigger. Use <35 for genuinely poor fit (wrong segment, too large/legacy to switch, no building signals). Do NOT be timidly conservative; avoid round-number anchoring.`,
    `4. Honest disagreement is the product — do not converge toward the other analysts.`,
    ``,
    `Return:`,
    `- price: 0-100, calibrated probability they buy ${seller.name}`,
    `- confidence: 0.0-1.0 — how strongly the available evidence supports your price (LOW when the dossier is thin)`,
    `- rationale: ONE line, evidence-grounded, naming your strongest positive and negative factor (e.g. "Strong: fresh Series C + hiring engineers; Weak: no real-time/greenfield signal")`,
    `- signalsUsed: the EXACT dossier claim strings you leaned on — REQUIRED. Cite the real evidence; use [] only if genuinely nothing in the dossier applied.`,
  ].join("\n");
}

export function buildUserPrompt(
  name: string,
  dossier: Dossier,
  seller: SellerContext,
): string {
  const signals =
    dossier.signals.length > 0
      ? dossier.signals.map((s, i) => `  ${i + 1}. [${s.source}] ${s.claim}`).join("\n")
      : "  (no discrete signals — price on the summary alone, and keep confidence low)";
  return [
    `SELLER: ${seller.name} — ${seller.sells}`,
    `IDEAL CUSTOMER: ${seller.icp}`,
    ``,
    `PROSPECT: ${name}`,
    ``,
    `SUMMARY:`,
    dossier.summary,
    ``,
    `SIGNALS:`,
    signals,
    ``,
    `QUESTION: How likely is ${name} to become a paying customer of ${seller.name}? Price it.`,
  ].join("\n");
}
