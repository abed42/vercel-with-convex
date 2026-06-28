// PEITHO data contract — the load-bearing decision.
// Designed so the MVP and the full vision share the SAME shapes. Adding real
// tools, enrichment, and provenance later changes only what *populates* these
// fields, never the fields themselves. Build it exactly as written, including
// the fields the MVP leaves empty.

// A single piece of evidence in the dossier. `foundBy` is empty in MVP; later,
// when models investigate with their own tools, each can attribute a signal it
// discovered. This is what powers the "Gemini found a hiring spike the others
// missed" demo moment without a rewrite.
export type Signal = {
  source: string; // "orange slice" | "crunchbase" | "linkedin" | "x" | "hand"
  claim: string; // "raised Series C in March", "hiring 12 AEs"
  foundBy?: string; // which model surfaced it (empty in MVP)
};

// The shared evidence packet all models price on. MVP fills `summary` plus a few
// hand-written signals. Tier 2 enrichment populates `signals` richly. The engine
// never cares where the evidence came from — only that it exists.
export type Dossier = {
  summary: string;
  signals: Signal[];
};

// One model's bet. Contract is identical whether the model got here by a
// role-prompt lens (MVP) or by live tool use (later). `signalsUsed` and
// `toolCalls` are empty in MVP but exist from the first commit.
export type ModelBet = {
  model: string; // "claude" | "gpt" | "gemini" | "grok"
  price: number; // 0-100, purchase likelihood
  confidence: number; // 0-1, model's own stated confidence
  rationale: string; // one line, why this price
  signalsUsed: string[]; // claims it leaned on (empty ok in MVP)
  toolCalls?: string[]; // what it checked (empty in MVP, for tool-use upgrade)
};

export type DealAction = "prioritize" | "personalize" | "skip";
export type DealStatus = "cached" | "pending" | "resolving" | "settled";
export type DealTier = 1 | 2 | 3;

export type Deal = {
  id: string;
  name: string;
  initials: string;
  logo?: string; // company logo URL (from Orange Slice enrichment)
  dossier: Dossier;
  bets: ModelBet[];
  consensus: number; // mean of prices, rounded
  spread: number; // max(price) - min(price) — the confidence signal
  tier: DealTier; // derived (see thresholds)
  action: DealAction;
  contestedSignal?: string; // for tier 2: what the models most disagreed about
  status: DealStatus;
};

// The four model identities. Grok is dropped gracefully if its key is absent.
export type ModelId = "claude" | "gpt" | "gemini" | "grok";
