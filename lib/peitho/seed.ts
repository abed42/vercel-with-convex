// Board fixtures — the "looks real" cached tiers behind the one live hero.
// Each non-hero deal carries pre-written bets so the board reads as a full
// pipeline. Deterministic: same board every run. NOTE the `orange slice`
// sources — when the live SDK lands, these rows populate from the intent feed
// instead of by hand, with no other change.

import type { Dossier, ModelBet } from "./types";

export type SeedBet = Omit<ModelBet, "toolCalls">;

export type SeedDeal = {
  dealId: string;
  name: string;
  initials: string;
  dossier: Dossier;
  bets: SeedBet[]; // empty for the live hero (priced on stage)
  hero?: boolean;
};

const b = (
  model: string,
  price: number,
  confidence: number,
  rationale: string,
  signalsUsed: string[] = [],
): SeedBet => ({ model, price, confidence, rationale, signalsUsed });

export const SEED_DEALS: SeedDeal[] = [
  // ── HERO — priced LIVE on stage (no seeded bets) ───────────────────────────
  {
    dealId: "northwind",
    name: "Northwind Logistics",
    initials: "NL",
    hero: true,
    bets: [],
    dossier: {
      summary:
        "Mid-market freight brokerage, ~600 employees, modernizing ops after a funding round. Evaluating tooling to automate carrier and prospect outreach.",
      signals: [
        { source: "crunchbase", claim: "raised $40M Series B in April 2026" },
        { source: "linkedin", claim: "hiring 9 SDRs and a RevOps lead in the last 30 days" },
        { source: "x", claim: "VP Sales posted about replacing our manual prospecting stack this quarter" },
        { source: "orange slice", claim: "visited pricing page 6 times in two weeks" },
        { source: "hand", claim: "current CRM is a legacy on-prem system" },
      ],
    },
  },

  // ── TIER 1 — strong consensus, tight spread (prioritize) ───────────────────
  {
    dealId: "helios",
    name: "Helios Health",
    initials: "HH",
    bets: [
      b("claude", 84, 0.86, "Clear ICP, budget freed post-raise, exec sponsor named.", ["raised Series C", "new VP RevOps hire"]),
      b("gpt", 88, 0.9, "Q-end timing + active eval = buying window open now.", ["evaluating vendors this quarter"]),
      b("gemini", 86, 0.88, "Headcount up 22% YoY, expansion budget evident.", ["headcount up 22% YoY"]),
      b("grok", 81, 0.7, "Some social chatter on tooling; no red flags.", []),
    ],
    dossier: {
      summary: "Series C healthtech scaling its commercial org; actively evaluating GTM tooling.",
      signals: [
        { source: "crunchbase", claim: "raised Series C" },
        { source: "linkedin", claim: "new VP RevOps hire" },
        { source: "linkedin", claim: "headcount up 22% YoY" },
        { source: "orange slice", claim: "evaluating vendors this quarter" },
      ],
    },
  },
  {
    dealId: "atlas",
    name: "Atlas Freight",
    initials: "AF",
    bets: [
      b("claude", 76, 0.8, "Solid fit, mature buying committee, clear pain.", ["RFP issued"]),
      b("gpt", 79, 0.82, "RFP in market — active, time-boxed cycle.", ["RFP issued"]),
      b("gemini", 72, 0.74, "Steady growth, no explosive expansion signal.", []),
      b("grok", 74, 0.66, "Neutral live signal; competitor mentions present.", []),
    ],
    dossier: {
      summary: "Established logistics firm running a formal RFP for outreach automation.",
      signals: [
        { source: "hand", claim: "RFP issued" },
        { source: "orange slice", claim: "two pricing-page sessions" },
      ],
    },
  },

  // ── TIER 2 — they disagree (personalize around the contested signal) ───────
  {
    dealId: "vertex",
    name: "Vertex Cloud",
    initials: "VC",
    bets: [
      b("claude", 58, 0.62, "Good fit but no urgency signal; could stall.", ["mid-market SaaS, strong ICP fit"]),
      b("gpt", 90, 0.84, "Leadership change + new budget = textbook trigger now.", ["new CRO started 6 weeks ago"]),
      b("gemini", 64, 0.6, "Modest hiring; growth not aggressive.", []),
      b("grok", 88, 0.78, "CRO publicly posting about 'fixing pipeline' — hot.", ["new CRO started 6 weeks ago"]),
    ],
    dossier: {
      summary: "Mid-market cloud vendor with fresh sales leadership; intent unclear.",
      signals: [
        { source: "hand", claim: "mid-market SaaS, strong ICP fit" },
        { source: "linkedin", claim: "new CRO started 6 weeks ago" },
        { source: "x", claim: "CRO posting about fixing pipeline" },
      ],
    },
  },
  {
    dealId: "borealis",
    name: "Borealis Mfg",
    initials: "BM",
    bets: [
      b("claude", 52, 0.55, "Industrial fit decent; long sales cycle risk.", []),
      b("gpt", 49, 0.5, "No clear timing trigger; passive interest.", []),
      b("gemini", 61, 0.6, "Plant expansion announced — capacity for new tools.", ["announced new plant expansion"]),
      b("grok", 47, 0.45, "Quiet socially; little to confirm intent.", []),
    ],
    dossier: {
      summary: "Manufacturer expanding capacity; GTM modernization is plausible but unproven.",
      signals: [
        { source: "crunchbase", claim: "announced new plant expansion" },
        { source: "orange slice", claim: "one whitepaper download" },
      ],
    },
  },

  // ── TIER 3 — low consensus (skip) ─────────────────────────────────────────
  {
    dealId: "quill",
    name: "Quill & Co",
    initials: "QC",
    bets: [
      b("claude", 24, 0.7, "Too small, no budget signal, poor fit.", []),
      b("gpt", 30, 0.68, "No buying trigger; not in market.", []),
      b("gemini", 22, 0.66, "Flat headcount, no expansion.", []),
      b("grok", 28, 0.6, "No live signal of intent.", []),
    ],
    dossier: {
      summary: "Small agency, no observable buying intent or expansion.",
      signals: [{ source: "hand", claim: "<25 employees, flat growth" }],
    },
  },
  {
    dealId: "pebble",
    name: "Pebble Retail",
    initials: "PR",
    bets: [
      b("claude", 31, 0.64, "Wrong segment; consumer retail, weak fit.", []),
      b("gpt", 27, 0.6, "No timing signal; recently churned a vendor.", ["churned prior tool 2 weeks ago"]),
      b("gemini", 33, 0.58, "Contraction signs in recent hiring.", []),
      b("grok", 20, 0.55, "Negative social sentiment on spend.", []),
    ],
    dossier: {
      summary: "Retail chain recently cutting software spend; poor segment fit.",
      signals: [
        { source: "hand", claim: "churned prior tool 2 weeks ago" },
        { source: "linkedin", claim: "hiring freeze" },
      ],
    },
  },
];
