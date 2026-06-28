import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { SEED_DEALS } from "../lib/peitho/seed";

// Load the board fixtures. Idempotent. The hero (no seeded bets) is left
// untouched so its live-priced bets survive a re-seed; non-hero deals get their
// cached bets written and are marked settled.
export const seedBoard = mutation({
  args: {},
  handler: async (ctx) => {
    for (const d of SEED_DEALS) {
      const existing = await ctx.db
        .query("deals")
        .withIndex("by_dealId", (q) => q.eq("dealId", d.dealId))
        .unique();
      const identity = {
        dealId: d.dealId,
        name: d.name,
        initials: d.initials,
        dossier: d.dossier,
        status: (d.bets.length > 0 ? "settled" : "cached") as
          | "settled"
          | "cached",
      };
      if (existing) {
        await ctx.db.patch(existing._id, identity);
      } else {
        await ctx.db.insert("deals", identity);
      }

      for (const bet of d.bets) {
        const row = await ctx.db
          .query("bets")
          .withIndex("by_deal_model", (q) =>
            q.eq("dealId", d.dealId).eq("model", bet.model),
          )
          .unique();
        const data = { dealId: d.dealId, toolCalls: [], ...bet };
        if (row) {
          await ctx.db.patch(row._id, data);
        } else {
          await ctx.db.insert("bets", data);
        }
      }
    }
    return { seeded: SEED_DEALS.length };
  },
});

// Stage reset: clear the live hero's bets so it can be priced fresh on demo.
export const resetHero = mutation({
  args: { dealId: v.string() },
  handler: async (ctx, { dealId }) => {
    const rows = await ctx.db
      .query("bets")
      .withIndex("by_dealId", (q) => q.eq("dealId", dealId))
      .collect();
    await Promise.all(rows.map((r) => ctx.db.delete(r._id)));
    const d = await ctx.db
      .query("deals")
      .withIndex("by_dealId", (q) => q.eq("dealId", dealId))
      .unique();
    if (d) await ctx.db.patch(d._id, { status: "cached" });
  },
});
