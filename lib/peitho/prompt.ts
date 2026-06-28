// PEITHO prompt construction — pure, so the lens differentiation is auditable.
// Each model gets the IDENTICAL dossier; only the lens in the system prompt
// differs. Same evidence, different analytical lens → meaningful, honest spread.

import { MODEL_LENSES } from "./config";
import type { Dossier, ModelId } from "./types";

export function buildSystemPrompt(model: ModelId): string {
  const { label, lens } = MODEL_LENSES[model];
  return [
    `You are ${label}, one analyst on a four-model panel pricing how likely a B2B prospect is to buy.`,
    `Your assigned analytical lens: ${lens}.`,
    `Weight the shared evidence THROUGH that lens — emphasize what your lens cares about, discount what it doesn't.`,
    `You are not trying to agree with the other analysts. Honest disagreement is the product: when the panel splits, the spread tells the seller exactly what to investigate.`,
    ``,
    `Return:`,
    `- price: purchase likelihood 0-100 (whole number)`,
    `- confidence: your own confidence in that price, 0.0-1.0`,
    `- rationale: ONE concise line (max ~18 words) on why this price, in your lens's voice`,
    `- signalsUsed: the exact claim strings from the dossier you leaned on (verbatim; [] if none mattered to your lens)`,
  ].join("\n");
}

export function buildUserPrompt(name: string, dossier: Dossier): string {
  const signals =
    dossier.signals.length > 0
      ? dossier.signals.map((s, i) => `  ${i + 1}. [${s.source}] ${s.claim}`).join("\n")
      : "  (no discrete signals — price on the summary alone)";
  return [
    `PROSPECT: ${name}`,
    ``,
    `SUMMARY:`,
    dossier.summary,
    ``,
    `SIGNALS:`,
    signals,
  ].join("\n");
}
