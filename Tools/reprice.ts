// Re-price every deal on the board from a seller's perspective (no re-enrich).
//   bun Tools/reprice.ts [sellerId]
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const sellerId = process.argv[2] ?? "convex";
const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set");
  process.exit(1);
}
const convex = new ConvexHttpClient(url);

const deals = await convex.query(api.deals.listDeals, {});
console.log(`\n▸ re-pricing ${deals.length} deals as ${sellerId}…\n`);
for (const d of deals) {
  await convex.mutation(api.deals.clearBets, { dealId: d.id });
  const r = await convex.action(api.engine.priceDeal, { dealId: d.id, sellerId });
  console.log(
    `  ${r.name.slice(0, 22).padEnd(23)} ${String(r.consensus).padStart(3)}%  tier ${r.tier} → ${r.action}`,
  );
}
console.log("");
