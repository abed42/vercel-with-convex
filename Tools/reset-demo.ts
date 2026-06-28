// Reset the demo to a clean starting state — run before each rehearsal / the
// real demo so the hero is back at its tier-2 "before" state.
//   bun Tools/reset-demo.ts
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set");
  process.exit(1);
}
const c = new ConvexHttpClient(url);

// Hero (Decagon) — minimal dossier so the detected signal lands a big flip.
const minimal = {
  summary: "Decagon — AI customer-support agents for enterprises.",
  signals: [
    { source: "linkedin", claim: "464 employees, Privately Held, San Francisco" },
    { source: "linkedin", claim: "founded 2023" },
  ],
};
await c.mutation(api.deals.createDeal, {
  dealId: "decagon",
  name: "Decagon",
  initials: "DE",
  domain: "decagon.ai",
  dossier: minimal,
  status: "cached",
});
for (const s of ["convex", "cursor"]) {
  await c.mutation(api.deals.clearBets, { dealId: "decagon", sellerId: s });
  const d = await c.action(api.engine.priceDeal, { dealId: "decagon", sellerId: s });
  console.log(`  ${s} Decagon: ${d.consensus}% → ${d.action}`);
}
console.log("✓ demo reset — hero is at its tier-2 'before' state\n");
