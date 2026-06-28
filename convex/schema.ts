import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// PEITHO schema. `deals` holds identity + shared evidence + status; `bets` holds
// one row per (dealId, model) so each parallel model call writes independently
// (no array races) and the board animates bets in as they land via subscription.
// Derived fields (consensus/spread/tier/action) are computed on read from bets
// by the pure functions in lib/peitho/derive — never stored stale.
export default defineSchema({
  // NOTE: kept from the starter template so the existing demo route keeps
  // working while PEITHO is built on the same trunk. Remove once the board ships.
  numbers: defineTable({
    value: v.number(),
  }),

  deals: defineTable({
    dealId: v.string(), // stable logical id (cache key + subscription key)
    name: v.string(),
    initials: v.string(),
    logo: v.optional(v.string()), // company logo URL (Orange Slice)
    dossier: v.object({
      summary: v.string(),
      signals: v.array(
        v.object({
          source: v.string(),
          claim: v.string(),
          foundBy: v.optional(v.string()),
        }),
      ),
    }),
    status: v.union(
      v.literal("cached"),
      v.literal("pending"),
      v.literal("resolving"),
      v.literal("settled"),
    ),
  }).index("by_dealId", ["dealId"]),

  bets: defineTable({
    dealId: v.string(),
    model: v.string(), // "claude" | "gpt" | "gemini" | "grok"
    price: v.number(), // 0-100
    confidence: v.number(), // 0-1
    rationale: v.string(),
    signalsUsed: v.array(v.string()),
    toolCalls: v.optional(v.array(v.string())),
  })
    .index("by_dealId", ["dealId"])
    .index("by_deal_model", ["dealId", "model"]), // unique cache key
});
