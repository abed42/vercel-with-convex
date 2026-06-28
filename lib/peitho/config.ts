// PEITHO tuning constants — ONE place. Judges may want these tuned live, so
// every threshold that shapes the board is a one-line change here.

import type { ModelId } from "./types";

// Product identity — NOT locked in; this is a prototype. Rename here only.
export const PRODUCT = {
  name: "Peitho",
  tagline: "go-to-market intelligence",
} as const;

export const THRESHOLDS = {
  // tier 1: models agree it's strong
  tier1MinConsensus: 65,
  tier1MaxSpread: 20,
  // tier 3: low, skip regardless of spread
  tier3MaxConsensus: 35,
  // (tier 2 is everything in between — mid consensus, or high consensus but
  // wide spread: the "they disagree" bucket)
} as const;

// The four analytical lenses. MVP differentiation: each model gets a distinct
// system-prompt lens, so identical evidence yields meaningful spread. Upgrade
// path swaps each lens for the model's native live tool — contract unchanged.
export const MODEL_LENSES: Record<
  ModelId,
  { label: string; lens: string; gatewayModel: string }
> = {
  claude: {
    label: "Claude",
    lens: "firmographic fit + strategic reasoning",
    gatewayModel: "anthropic/claude-sonnet-4.6",
  },
  gpt: {
    label: "GPT",
    lens: "timing / buying triggers",
    gatewayModel: "openai/gpt-5.4",
  },
  gemini: {
    label: "Gemini",
    lens: "growth signals (hiring, expansion, funding)",
    gatewayModel: "google/gemini-3-pro-preview",
  },
  grok: {
    label: "Grok",
    lens: "live market/social signal; skeptical when none is found",
    gatewayModel: "xai/grok-4.1-fast-reasoning",
  },
};

export const ALL_MODELS: ModelId[] = ["claude", "gpt", "gemini", "grok"];

// The one prospect priced LIVE on stage. Everything else is cached "looks real".
export const HERO_DEAL_ID = "lovable";

// Hour-one architecture proof deal — isolated from the board.
export const PROBE_DEAL_ID = "__probe__";
