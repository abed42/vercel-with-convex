import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { assembleDeal } from "../lib/peitho/derive";
import { PROBE_DEAL_ID } from "../lib/peitho/config";
import { DEFAULT_SELLER_ID } from "../lib/peitho/sellers";
import type { Deal, ModelBet } from "../lib/peitho/types";

const dossierValidator = v.object({
  summary: v.string(),
  signals: v.array(
    v.object({
      source: v.string(),
      claim: v.string(),
      foundBy: v.optional(v.string()),
    }),
  ),
});

const statusValidator = v.union(
  v.literal("cached"),
  v.literal("pending"),
  v.literal("resolving"),
  v.literal("settled"),
);

// Map a stored bet row to the ModelBet contract shape.
function toModelBet(row: {
  model: string;
  price: number;
  confidence: number;
  rationale: string;
  signalsUsed: string[];
  toolCalls?: string[];
}): ModelBet {
  return {
    model: row.model,
    price: row.price,
    confidence: row.confidence,
    rationale: row.rationale,
    signalsUsed: row.signalsUsed,
    toolCalls: row.toolCalls,
  };
}

// Reactive read: every Deal, fully derived from its bets. Writing a single bet
// row re-fires this subscription — this is how the board animates with NO poll.
export const listDeals = query({
  args: { sellerId: v.optional(v.string()) },
  handler: async (ctx, { sellerId }): Promise<Deal[]> => {
    const seller = sellerId ?? DEFAULT_SELLER_ID;
    const allDeals = await ctx.db.query("deals").collect();
    // The probe deal is an internal architecture-proof deal — never on the board.
    const deals = allDeals.filter((d) => d.dealId !== PROBE_DEAL_ID);
    const assembled = await Promise.all(
      deals.map(async (d) => {
        const betRows = await ctx.db
          .query("bets")
          .withIndex("by_deal_seller", (q) =>
            q.eq("dealId", d.dealId).eq("sellerId", seller),
          )
          .collect();
        return assembleDeal({
          id: d.dealId,
          name: d.name,
          initials: d.initials,
          logo: d.logo,
          domain: d.domain,
          industry: d.industry,
          dossier: d.dossier,
          bets: betRows.map(toModelBet),
          status: d.status,
        });
      }),
    );
    // Only show markets actually priced for this seller (a deal with no bets for
    // the active seller would otherwise render as a misleading "0% / 100% No").
    return assembled
      .filter((d) => d.bets.length > 0)
      .sort((a, b) => a.tier - b.tier || b.consensus - a.consensus);
  },
});

export const getDeal = query({
  args: { dealId: v.string(), sellerId: v.optional(v.string()) },
  handler: async (ctx, { dealId, sellerId }): Promise<Deal | null> => {
    const seller = sellerId ?? DEFAULT_SELLER_ID;
    const d = await ctx.db
      .query("deals")
      .withIndex("by_dealId", (q) => q.eq("dealId", dealId))
      .unique();
    if (!d) return null;
    const betRows = await ctx.db
      .query("bets")
      .withIndex("by_deal_seller", (q) =>
        q.eq("dealId", dealId).eq("sellerId", seller),
      )
      .collect();
    return assembleDeal({
      id: d.dealId,
      name: d.name,
      initials: d.initials,
      logo: d.logo,
      domain: d.domain,
      industry: d.industry,
      dossier: d.dossier,
      bets: betRows.map(toModelBet),
      status: d.status,
    });
  },
});

// Upsert a deal's identity + evidence (idempotent on dealId).
export const createDeal = mutation({
  args: {
    dealId: v.string(),
    name: v.string(),
    initials: v.string(),
    logo: v.optional(v.string()),
    domain: v.optional(v.string()),
    industry: v.optional(v.string()),
    dossier: dossierValidator,
    status: v.optional(statusValidator),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("deals")
      .withIndex("by_dealId", (q) => q.eq("dealId", args.dealId))
      .unique();
    const patch = {
      dealId: args.dealId,
      name: args.name,
      initials: args.initials,
      logo: args.logo,
      domain: args.domain,
      industry: args.industry,
      dossier: args.dossier,
      status: args.status ?? "cached",
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("deals", patch);
    }
  },
});

// Append a freshly-detected signal to a deal's dossier (idempotent on claim).
// This is the "signal detection" event: new evidence arrives, then the panel
// re-prices on it and the board odds move live via the subscription.
export const addSignal = mutation({
  args: {
    dealId: v.string(),
    signal: v.object({
      source: v.string(),
      claim: v.string(),
      foundBy: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { dealId, signal }) => {
    const d = await ctx.db
      .query("deals")
      .withIndex("by_dealId", (q) => q.eq("dealId", dealId))
      .unique();
    if (!d) return;
    if (d.dossier.signals.some((s) => s.claim === signal.claim)) return; // dedupe
    await ctx.db.patch(d._id, {
      dossier: { ...d.dossier, signals: [...d.dossier.signals, signal] },
    });
  },
});

// Rename a deal (e.g. clean a verbose model-generated legal name).
export const setName = mutation({
  args: { dealId: v.string(), name: v.string() },
  handler: async (ctx, { dealId, name }) => {
    const d = await ctx.db
      .query("deals")
      .withIndex("by_dealId", (q) => q.eq("dealId", dealId))
      .unique();
    if (d) await ctx.db.patch(d._id, { name });
  },
});

// Set a deal's logo URL (e.g. swap a dead Clearbit URL for a working favicon).
export const setLogo = mutation({
  args: { dealId: v.string(), logo: v.string() },
  handler: async (ctx, { dealId, logo }) => {
    const d = await ctx.db
      .query("deals")
      .withIndex("by_dealId", (q) => q.eq("dealId", dealId))
      .unique();
    if (d) await ctx.db.patch(d._id, { logo });
  },
});

// Tag a deal's industry without touching its dossier or bets.
export const setIndustry = mutation({
  args: { dealId: v.string(), industry: v.string() },
  handler: async (ctx, { dealId, industry }) => {
    const d = await ctx.db
      .query("deals")
      .withIndex("by_dealId", (q) => q.eq("dealId", dealId))
      .unique();
    if (d) await ctx.db.patch(d._id, { industry });
  },
});

export const setStatus = mutation({
  args: { dealId: v.string(), status: statusValidator },
  handler: async (ctx, { dealId, status }) => {
    const d = await ctx.db
      .query("deals")
      .withIndex("by_dealId", (q) => q.eq("dealId", dealId))
      .unique();
    if (d) await ctx.db.patch(d._id, { status });
  },
});

// Insert or replace a single model's bet, keyed by (dealId, model) — the cache
// key. One row per model means the four parallel calls never race on an array.
export const upsertBet = mutation({
  args: {
    dealId: v.string(),
    sellerId: v.optional(v.string()),
    model: v.string(),
    price: v.number(),
    confidence: v.number(),
    rationale: v.string(),
    signalsUsed: v.array(v.string()),
    toolCalls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const sellerId = args.sellerId ?? DEFAULT_SELLER_ID;
    const row = { ...args, sellerId };
    const existing = await ctx.db
      .query("bets")
      .withIndex("by_deal_seller_model", (q) =>
        q.eq("dealId", args.dealId).eq("sellerId", sellerId).eq("model", args.model),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, row);
    } else {
      await ctx.db.insert("bets", row);
    }
  },
});

// Cache probe used by the engine: which models already have a bet for this deal.
export const cachedModels = query({
  args: { dealId: v.string(), sellerId: v.optional(v.string()) },
  handler: async (ctx, { dealId, sellerId }): Promise<string[]> => {
    const seller = sellerId ?? DEFAULT_SELLER_ID;
    const rows = await ctx.db
      .query("bets")
      .withIndex("by_deal_seller", (q) =>
        q.eq("dealId", dealId).eq("sellerId", seller),
      )
      .collect();
    return rows.map((r) => r.model);
  },
});

// Dev/stage helper: wipe a deal's bets so it can be re-priced live.
export const clearBets = mutation({
  args: { dealId: v.string(), sellerId: v.optional(v.string()) },
  handler: async (ctx, { dealId, sellerId }) => {
    const rows = sellerId
      ? await ctx.db
          .query("bets")
          .withIndex("by_deal_seller", (q) =>
            q.eq("dealId", dealId).eq("sellerId", sellerId),
          )
          .collect()
      : await ctx.db
          .query("bets")
          .withIndex("by_dealId", (q) => q.eq("dealId", dealId))
          .collect();
    await Promise.all(rows.map((r) => ctx.db.delete(r._id)));
  },
});

// Remove a single deal + its bets (e.g. clean up a test-built market).
export const removeDeal = mutation({
  args: { dealId: v.string() },
  handler: async (ctx, { dealId }) => {
    const d = await ctx.db
      .query("deals")
      .withIndex("by_dealId", (q) => q.eq("dealId", dealId))
      .unique();
    if (d) await ctx.db.delete(d._id);
    const bets = await ctx.db
      .query("bets")
      .withIndex("by_dealId", (q) => q.eq("dealId", dealId))
      .collect();
    await Promise.all(bets.map((bt) => ctx.db.delete(bt._id)));
  },
});

// Wipe the whole board (deals + bets) except the internal probe — for a clean
// re-seed when switching the prospect set.
export const clearBoard = mutation({
  args: {},
  handler: async (ctx) => {
    const deals = await ctx.db.query("deals").collect();
    const bets = await ctx.db.query("bets").collect();
    await Promise.all([
      ...deals
        .filter((d) => d.dealId !== PROBE_DEAL_ID)
        .map((d) => ctx.db.delete(d._id)),
      ...bets
        .filter((b) => b.dealId !== PROBE_DEAL_ID)
        .map((b) => ctx.db.delete(b._id)),
    ]);
  },
});
