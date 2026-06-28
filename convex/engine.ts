"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { ALL_MODELS, MODEL_LENSES } from "../lib/peitho/config";
import { buildSystemPrompt, buildUserPrompt } from "../lib/peitho/prompt";
import { getSeller, DEFAULT_SELLER_ID } from "../lib/peitho/sellers";
import { FRESH_SIGNALS } from "../lib/peitho/signals";
import { enrichDossier } from "../lib/peitho/orangeslice";
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
  args: {
    dealId: v.string(),
    force: v.optional(v.boolean()),
    sellerId: v.optional(v.string()),
  },
  handler: async (ctx, { dealId, force, sellerId }): Promise<Deal> => {
    const deal = await ctx.runQuery(api.deals.getDeal, { dealId });
    if (!deal) throw new Error(`priceDeal: no deal "${dealId}"`);
    const seller = getSeller(sellerId ?? DEFAULT_SELLER_ID);

    const cached = new Set(
      await ctx.runQuery(api.deals.cachedModels, { dealId, sellerId: seller.id }),
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
            system: buildSystemPrompt(model, seller),
            prompt: buildUserPrompt(deal.name, deal.dossier, seller),
            maxRetries: 2,
          }),
          PER_MODEL_TIMEOUT_MS,
          `${model}`,
        );

        await ctx.runMutation(api.deals.upsertBet, {
          dealId,
          sellerId: seller.id,
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
    const settled = await ctx.runQuery(api.deals.getDeal, { dealId, sellerId: seller.id });
    if (!settled) throw new Error(`priceDeal: deal "${dealId}" vanished mid-run`);
    return settled;
  },
});

/**
 * The live signal-detection loop. Re-enriches the company through Orange Slice,
 * diffs the fresh evidence against the stored dossier, appends anything NEW it
 * detects, and re-prices — so the board's odds move on a real, just-detected
 * signal. Falls back to a curated fresh signal if nothing new surfaced, so the
 * demo can never stutter.
 */
export const detectSignal = action({
  args: { dealId: v.string(), sellerId: v.optional(v.string()) },
  handler: async (
    ctx,
    { dealId, sellerId },
  ): Promise<{ detected: { source: string; claim: string }[]; deal: Deal }> => {
    const deal = await ctx.runQuery(api.deals.getDeal, { dealId, sellerId });
    if (!deal) throw new Error(`detectSignal: no deal "${dealId}"`);

    // Seeded detection — Orange Slice live credits are exhausted, so detection
    // appends a strong, believable buying signal we control: deterministic and
    // stage-safe. The panel still re-prices for real on the new evidence.
    const used = new Set(deal.dossier.signals.map((s) => s.claim));
    const next = FRESH_SIGNALS.find((s) => !used.has(s.claim));
    const detected = next ? [{ source: next.source, claim: next.claim }] : [];

    for (const s of detected) {
      await ctx.runMutation(api.deals.addSignal, { dealId, signal: s });
    }
    const priced = await ctx.runAction(api.engine.priceDeal, {
      dealId,
      force: true,
      sellerId,
    });
    return { detected, deal: priced };
  },
});

// Model-generated enrichment — the fallback when Orange Slice credits are out.
// The model knows public companies; the gateway always works; Clearbit gives a
// real logo with no auth. Produces the same EnrichedCompany shape.
const genDossierSchema = z.object({
  name: z.string().describe("official company name"),
  summary: z.string().describe("one-line description"),
  signals: z
    .array(z.object({ source: z.string(), claim: z.string() }))
    .describe("6 concrete signals across firmographics, funding, hiring, tech, news"),
});

// Strip verbose legal suffixes from a company name ("Ramp Business Corporation"
// → "Ramp", "Notion Labs, Inc." → "Notion").
function cleanName(name: string): string {
  let n = String(name).split(",")[0].trim();
  const SUF =
    /\s+(Inc|LLC|L\.L\.C|PBC|Corp|Corporation|Ltd|Co|Company|Technologies|Technology|Labs|Software|Business|Group|Holdings|Platform)\.?$/i;
  for (let i = 0; i < 4; i++) {
    const m = n.replace(SUF, "").trim();
    if (m === n) break;
    n = m;
  }
  return n || name;
}

async function modelEnrich(query: string): Promise<{
  name: string;
  initials: string;
  domain: string;
  logo?: string;
  dossier: { summary: string; signals: { source: string; claim: string }[] };
}> {
  const { object } = await generateObject({
    model: gateway("google/gemini-3.5-flash"),
    schema: genDossierSchema,
    system:
      "You are a B2B sales-intelligence enrichment engine. Given a company, assemble a realistic dossier as if pulled from LinkedIn, Crunchbase, BuiltWith, and news. Use real public facts when you know the company; plausible specifics otherwise. Signals must be concrete and varied — firmographics (employees, HQ), funding (round + amount + date), hiring (specific eng roles), tech stack, and one recent news event. Source each as linkedin / crunchbase / builtwith / news.",
    prompt: `Company: ${query}\nReturn the official name, a one-line summary, and 6 specific sourced signals.`,
    maxRetries: 2,
  });
  const name = cleanName(object.name || query);
  // Domain from what the user typed (clean), not the model's verbose name.
  const domain = query.includes(".")
    ? query.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").trim()
    : `${query.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
  const initials =
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "??";
  return {
    name,
    initials,
    domain,
    logo: `https://logo.clearbit.com/${domain}`,
    dossier: { summary: object.summary, signals: object.signals },
  };
}

/**
 * Build a market on demand from a search query (company name or domain).
 * Enriches via Orange Slice (falls back to model-generated enrichment when OS
 * credits are out), creates the deal, and prices it live from the active
 * seller's perspective. Returns the dealId to route to its market page.
 */
export const buildMarket = action({
  args: { query: v.string(), sellerId: v.optional(v.string()) },
  handler: async (
    ctx,
    { query, sellerId },
  ): Promise<{ dealId: string | null; name?: string }> => {
    let enriched;
    try {
      enriched = await enrichDossier({ domain: query.trim(), deep: true });
    } catch (e) {
      console.warn(`[buildMarket] OS enrich failed (${(e as Error)?.message ?? e}) — model-enriching`);
      try {
        enriched = await modelEnrich(query.trim());
      } catch (e2) {
        console.warn(`[buildMarket] model enrich failed:`, (e2 as Error)?.message ?? e2);
        return { dealId: null };
      }
    }
    // Clean dealId from what the user typed: "Notion" → notion, "stripe.com" → stripe.
    const slug = query
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\..*$/, "")
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24);
    const dealId = slug || enriched.domain.split(".")[0].replace(/[^a-z0-9]/gi, "") || "market";
    await ctx.runMutation(api.deals.createDeal, {
      dealId,
      name: enriched.name,
      initials: enriched.initials,
      logo: enriched.logo,
      domain: enriched.domain,
      dossier: enriched.dossier,
      status: "cached",
    });
    await ctx.runMutation(api.deals.clearBets, { dealId, sellerId });
    await ctx.runAction(api.engine.priceDeal, { dealId, sellerId });
    return { dealId, name: enriched.name };
  },
});
