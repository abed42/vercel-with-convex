// Seller accounts — "who am I selling as." The board prices each prospect from
// the ACTIVE seller's perspective: "would this company buy US?" Switching the
// account re-frames every dossier + every model prompt. Start with Convex; the
// others are selectable and price the same prospects through a different ICP.

export type SellerContext = {
  id: string;
  name: string;
  logo?: string;
  sells: string; // what the seller sells, in one line
  icp: string; // ideal customer profile
  // The evidence-grounded factors the panel must assess for THIS seller. The
  // "scientific" rubric: each model cites the dossier signal behind each factor.
  criteria: string[];
};

export const SELLER_ACCOUNTS: SellerContext[] = [
  {
    id: "convex",
    name: "Convex",
    logo: "https://www.convex.dev/favicon.ico",
    sells:
      "a reactive TypeScript backend-as-a-service — database + serverless functions + live queries — that replaces stitching together Postgres, a websocket layer, and a job queue",
    icp: "startups and product teams building real-time or AI-native web/mobile apps; developer-led teams shipping fast; YC-style companies on greenfield products or modernizing a legacy backend",
    criteria: [
      "Are they actively building software / a product (vs. a non-technical business)?",
      "Greenfield build or modernizing an existing stack?",
      "Hiring full-stack / TypeScript / app engineers right now?",
      "Shipping AI or real-time features that need live, synced state?",
      "Developer-led, TypeScript-friendly engineering culture?",
      "Recent funding = budget + pressure to build fast?",
    ],
  },
  {
    id: "cursor",
    name: "Cursor",
    logo: "https://www.cursor.com/favicon.ico",
    sells:
      "an AI-native code editor and coding agent that makes engineering teams dramatically faster",
    icp: "software companies with growing engineering orgs; teams that have adopted AI tooling and want to ship faster",
    criteria: [
      "Do they have a sizeable, growing engineering team?",
      "Are they hiring software engineers right now?",
      "Evidence of AI-forward / fast-shipping culture?",
      "Would per-seat developer tooling fit their size and budget?",
      "Recent funding to expand engineering?",
    ],
  },
  {
    id: "orangeslice",
    name: "Orange Slice",
    logo: "https://www.orangeslice.ai/favicon.ico",
    sells:
      "B2B sales enrichment and prospecting data (companies, contacts, intent) for go-to-market teams",
    icp: "RevOps, growth, and outbound sales teams at B2B companies running pipeline at scale",
    criteria: [
      "Do they run an outbound / B2B sales motion?",
      "Hiring SDRs, AEs, or RevOps?",
      "Evidence of GTM scale-up (new sales leadership, pipeline build)?",
      "Recent funding to expand go-to-market?",
      "Signals of intent-data / enrichment need?",
    ],
  },
];

export function getSeller(id: string): SellerContext {
  return SELLER_ACCOUNTS.find((s) => s.id === id) ?? SELLER_ACCOUNTS[0];
}

// The default account in play until the dropdown switches it.
export const DEFAULT_SELLER_ID = "convex";
