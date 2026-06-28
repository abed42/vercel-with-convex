// Curated Convex prospect board — recognizable AI-native app startups that are
// genuine Convex fits (real-time / AI apps needing synced backend state).
// Deeply enriches each (firmographics + funding + hiring + tech stack) and prices
// from Convex's perspective.  bun Tools/curated.ts

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { enrichDossier } from "../lib/peitho/orangeslice";

const SELLER_ID = "convex";
const CURATED = [
  "linear.app",
  "lovable.dev",
  "perplexity.ai",
  "harvey.ai",
  "granola.ai",
  "suno.com",
  "decagon.ai",
  "mercor.com",
  "dub.co",
  "sierra.ai",
  "cognition.ai",
  "replit.com",
];

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set");
  process.exit(1);
}
const convex = new ConvexHttpClient(url);

console.log(`\n▸ building Convex's curated board (${CURATED.length} prospects)…\n`);
let n = 0;
for (const domain of CURATED) {
  try {
    const { name, initials, dossier, logo } = await enrichDossier({ domain, deep: true });
    const dealId = domain.split(".")[0].replace(/[^a-z0-9]/gi, "").slice(0, 24);
    await convex.mutation(api.deals.createDeal, {
      dealId,
      name,
      initials,
      logo,
      dossier,
      status: "cached",
    });
    await convex.mutation(api.deals.clearBets, { dealId });
    const d = await convex.action(api.engine.priceDeal, { dealId, sellerId: SELLER_ID });
    console.log(
      `  ✓ ${name.slice(0, 22).padEnd(23)} ${String(d.consensus).padStart(3)}%  tier ${d.tier} → ${d.action}  (${dossier.signals.length} signals${logo ? ", logo" : ""})`,
    );
    n++;
  } catch (e) {
    console.log(`  ✗ ${domain}: ${(e as Error)?.message ?? e}`);
  }
}
console.log(`\nseeded ${n} curated Convex prospects.\n`);
