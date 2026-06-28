// Prospecting pipeline — the "find Convex's prospects" query, end to end.
//   bun Tools/prospect.ts [sellerId] [count]
// Queries Orange Slice (Crunchbase) for companies matching the seller's ICP,
// enriches each into a real Dossier, and prices it from the seller's perspective.

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { services } from "orangeslice";
import { enrichDossier } from "../lib/peitho/orangeslice";

const sellerId = process.argv[2] ?? "convex";
const N = Number(process.argv[3] ?? 8);

// The ICP query per seller. For Convex: recently-funded, early-stage AI / dev-tool
// / SaaS startups — developer-led teams building greenfield products (its ICP).
const PROSPECT_SQL: Record<string, string> = {
  convex: `
    SELECT name, website_url, last_funding_type, last_funding_date
    FROM public.crunchbase_scraper_lean
    WHERE operating_status = 'active'
      AND website_url IS NOT NULL
      AND last_funding_date >= '2024-06-01'
      AND last_funding_type IN ('series_a', 'series_b')
      AND (categories::text ILIKE '%Artificial Intelligence%'
           OR categories::text ILIKE '%Developer Tools%'
           OR categories::text ILIKE '%SaaS%'
           OR categories::text ILIKE '%Apps%')
    ORDER BY last_funding_date DESC
    LIMIT 40
  `,
};

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set");
  process.exit(1);
}
const convex = new ConvexHttpClient(url);

const sql = PROSPECT_SQL[sellerId];
if (!sql) {
  console.error(`no prospecting query for seller "${sellerId}"`);
  process.exit(1);
}

console.log(`\n▸ querying Orange Slice for ${sellerId}'s ICP…`);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rows: any[] = await services.crunchbase.search({ sql });
const domains = rows
  .map((r) =>
    String(r.website_url)
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/\/.*$/, "")
      .trim(),
  )
  .filter(Boolean);
console.log(`  ${domains.length} candidates returned\n`);

let priced = 0;
for (const domain of domains) {
  if (priced >= N) break;
  try {
    const { name, initials, dossier, logo } = await enrichDossier({ domain, deep: true });
    if (dossier.signals.length < 2) continue; // skip thin records
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
    const d = await convex.action(api.engine.priceDeal, { dealId, sellerId });
    console.log(
      `  ✓ ${name.slice(0, 26).padEnd(27)} ${String(d.consensus).padStart(3)}%  tier ${d.tier} → ${d.action}`,
    );
    priced++;
  } catch {
    // skip companies not in the DB / that fail enrichment
  }
}
console.log(`\nseeded ${priced} ${sellerId} prospects.\n`);
