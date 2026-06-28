"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { ALL_MODELS, MODEL_LENSES } from "../lib/peitho/config";
import { buildSystemPrompt, buildUserPrompt } from "../lib/peitho/prompt";
import type { Deal, ModelId } from "../lib/peitho/types";

// Strict structured output — the model is forced to this shape. No prose parsing.
const betSchema = z.object({
  price: z.number().describe("purchase likelihood, 0-100"),
  confidence: z.number().describe("model's own confidence, 0.0-1.0"),
  rationale: z.string().describe("one concise line, why this price"),
  signalsUsed: z
    .array(z.string())
    .describe("exact dossier claim strings leaned on; [] if none"),
});

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

const PER_MODEL_TIMEOUT_MS = 30_000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

/**
 * The consensus engine. Fans out the IDENTICAL dossier to all configured models
 * in parallel, each under its own lens, forces a strict ModelBet, writes each
 * bet as it lands (board animates via subscription), and settles the deal.
 * Caches per (dealId, model): a model with an existing bet is skipped unless
 * `force` is set. Any model that errors is dropped gracefully (e.g. Grok).
 */
export const priceDeal = action({
  args: { dealId: v.string(), force: v.optional(v.boolean()) },
  handler: async (ctx, { dealId, force }): Promise<Deal> => {
    const deal = await ctx.runQuery(api.deals.getDeal, { dealId });
    if (!deal) throw new Error(`priceDeal: no deal "${dealId}"`);

    const cached = new Set(
      await ctx.runQuery(api.deals.cachedModels, { dealId }),
    );

    await ctx.runMutation(api.deals.setStatus, { dealId, status: "pending" });

    const results = await Promise.allSettled(
      ALL_MODELS.map(async (model: ModelId) => {
        if (!force && cached.has(model)) {
          console.log(`[priceDeal] CACHE HIT ${dealId}/${model} — skipping model call`);
          return { model, cached: true };
        }
        console.log(`[priceDeal] LIVE CALL ${dealId}/${model} (${MODEL_LENSES[model].gatewayModel})`);
        const { object } = await withTimeout(
          generateObject({
            model: gateway(MODEL_LENSES[model].gatewayModel),
            schema: betSchema,
            system: buildSystemPrompt(model),
            prompt: buildUserPrompt(deal.name, deal.dossier),
            maxRetries: 2,
          }),
          PER_MODEL_TIMEOUT_MS,
          `${model}`,
        );

        await ctx.runMutation(api.deals.upsertBet, {
          dealId,
          model,
          price: Math.round(clamp(object.price, 0, 100)),
          confidence: Number(clamp(object.confidence, 0, 1).toFixed(2)),
          rationale: object.rationale.trim(),
          signalsUsed: object.signalsUsed ?? [],
          toolCalls: [], // empty in MVP — the tool-use upgrade fills this
        });
        // first bet to land flips the deal into "resolving" (idempotent)
        await ctx.runMutation(api.deals.setStatus, { dealId, status: "resolving" });
        return { model, cached: false };
      }),
    );

    const failed = results
      .map((r, i) => ({ r, model: ALL_MODELS[i] }))
      .filter(({ r }) => r.status === "rejected");
    for (const { r, model } of failed) {
      console.warn(
        `[priceDeal] DROPPED ${model}:`,
        (r as PromiseRejectedResult).reason?.message ?? r,
      );
    }

    await ctx.runMutation(api.deals.setStatus, { dealId, status: "settled" });
    const settled = await ctx.runQuery(api.deals.getDeal, { dealId });
    if (!settled) throw new Error(`priceDeal: deal "${dealId}" vanished mid-run`);
    return settled;
  },
});
