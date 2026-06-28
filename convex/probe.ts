"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { MODEL_LENSES, PROBE_DEAL_ID } from "../lib/peitho/config";
import type { ModelBet } from "../lib/peitho/types";

// Hour-one architecture proof: one model → AI Gateway → Convex write → live subscription.

const HARDCODED_DOSSIER = {
  summary:
    "Acme Widgets, ~200 employees, evaluating sales automation after a recent funding round.",
  signals: [
    { source: "hand", claim: "raised $12M Series A in January 2026" },
    { source: "linkedin", claim: "hiring 4 SDRs this quarter" },
  ],
};

const betSchema = z.object({
  price: z.number().describe("purchase likelihood, 0-100"),
  confidence: z.number().describe("model confidence, 0.0-1.0"),
  rationale: z.string().describe("one concise line, why this price"),
  signalsUsed: z
    .array(z.string())
    .describe("exact dossier claim strings leaned on; [] if none"),
});

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/** Single-model round-trip: gateway → strict ModelBet JSON → bets table. */
export const runProbe = action({
  args: {},
  handler: async (ctx): Promise<ModelBet> => {
    await ctx.runMutation(api.deals.createDeal, {
      dealId: PROBE_DEAL_ID,
      name: "Acme Widgets (probe)",
      initials: "AW",
      dossier: HARDCODED_DOSSIER,
      status: "pending",
    });

    const model = "claude" as const;
    const { object } = await generateObject({
      model: gateway(MODEL_LENSES[model].gatewayModel),
      schema: betSchema,
      system: [
        "You are Claude pricing B2B purchase intent from shared evidence.",
        "Return strict JSON: price (0-100), confidence (0-1), rationale (one line), signalsUsed (verbatim claims).",
      ].join("\n"),
      prompt: [
        "PROSPECT: Acme Widgets",
        "",
        "SUMMARY:",
        HARDCODED_DOSSIER.summary,
        "",
        "SIGNALS:",
        ...HARDCODED_DOSSIER.signals.map(
          (s, i) => `  ${i + 1}. [${s.source}] ${s.claim}`,
        ),
      ].join("\n"),
      maxRetries: 2,
    });

    const bet: ModelBet = {
      model,
      price: Math.round(clamp(object.price, 0, 100)),
      confidence: Number(clamp(object.confidence, 0, 1).toFixed(2)),
      rationale: object.rationale.trim(),
      signalsUsed: object.signalsUsed ?? [],
      toolCalls: [],
    };

    await ctx.runMutation(api.deals.upsertBet, {
      dealId: PROBE_DEAL_ID,
      ...bet,
    });
    await ctx.runMutation(api.deals.setStatus, {
      dealId: PROBE_DEAL_ID,
      status: "settled",
    });

    console.log("[runProbe] ModelBet:", JSON.stringify(bet));
    return bet;
  },
});
