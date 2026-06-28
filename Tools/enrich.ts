// Enrichment CLI — the real Orange Slice pipe, run ahead of the demo (stage-safe).
//   bun Tools/enrich.ts <domain> [dealId] [--price]
// Enriches a company via Orange Slice → builds a real Dossier → seeds Convex.
// With --price, also runs the live four-model panel on it immediately.

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { enrichDossier } from "../lib/peitho/orangeslice";

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const flags = argv.filter((a) => a.startsWith("--"));
const domain = positional[0];

if (!domain) {
  console.error("usage: bun Tools/enrich.ts <domain> [dealId] [--price]");
  process.exit(1);
}
const dealId = positional[1] ?? domain.split(".")[0].replace(/[^a-z0-9]/gi, "");
const doPrice = flags.includes("--price");

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set (run from project root; bun loads .env.local)");
  process.exit(1);
}
const convex = new ConvexHttpClient(url);

console.log(`\n▸ enriching ${domain} via Orange Slice…`);
const { name, initials, dossier, logo, domain: resolved } = await enrichDossier({ domain });
console.log(`  ${name} (${resolved}) — ${dossier.signals.length} real signals${logo ? " · logo ✓" : ""}:`);
for (const s of dossier.signals) console.log(`   · [${s.source}] ${s.claim}`);

await convex.mutation(api.deals.createDeal, {
  dealId,
  name,
  initials,
  logo,
  dossier,
  status: "cached",
});
console.log(`✓ seeded deal "${dealId}" into Convex`);

if (doPrice) {
  console.log(`▸ running the live four-model panel…`);
  await convex.mutation(api.deals.clearBets, { dealId });
  const d = await convex.action(api.engine.priceDeal, { dealId });
  console.log(
    `✓ priced: consensus ${d.consensus}, spread ${d.spread} (tier ${d.tier} → ${d.action})`,
  );
  for (const b of d.bets) console.log(`   ${b.model.padEnd(7)} ${b.price}  ${b.rationale}`);
}
console.log("");
