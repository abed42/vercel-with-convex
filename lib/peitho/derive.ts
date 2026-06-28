// PEITHO derivation rules — PURE functions, unit-tested. Given bets + dossier,
// these compute everything the board reads. No I/O, no Convex, no randomness.

import { THRESHOLDS } from "./config";
import type {
  Deal,
  DealAction,
  DealStatus,
  DealTier,
  Dossier,
  ModelBet,
} from "./types";

/** Mean of the model prices, rounded to a whole number. 0 when no bets. */
export function computeConsensus(bets: ModelBet[]): number {
  if (bets.length === 0) return 0;
  const sum = bets.reduce((acc, b) => acc + b.price, 0);
  return Math.round(sum / bets.length);
}

/** max(price) - min(price) — the confidence signal. 0 when fewer than 2 bets. */
export function computeSpread(bets: ModelBet[]): number {
  if (bets.length < 2) return 0;
  const prices = bets.map((b) => b.price);
  return Math.round(Math.max(...prices) - Math.min(...prices));
}

/**
 * tier 1 if consensus >= 65 and spread <= 20 (models agree it's strong)
 * tier 3 if consensus < 35 (low, skip regardless of spread)
 * tier 2 otherwise (mid consensus, or high consensus but wide spread)
 */
export function computeTier(consensus: number, spread: number): DealTier {
  if (
    consensus >= THRESHOLDS.tier1MinConsensus &&
    spread <= THRESHOLDS.tier1MaxSpread
  ) {
    return 1;
  }
  if (consensus < THRESHOLDS.tier3MaxConsensus) return 3;
  return 2;
}

/** tier 1 → prioritize, tier 2 → personalize, tier 3 → skip. */
export function actionForTier(tier: DealTier): DealAction {
  switch (tier) {
    case 1:
      return "prioritize";
    case 2:
      return "personalize";
    case 3:
      return "skip";
  }
}

/**
 * The claim the two extreme models most diverged on, as a short phrase.
 * Only meaningful for tier 2. Heuristic: take the highest and lowest bettors;
 * the contested claim is one the bull leaned on that the bear ignored (or vice
 * versa) — asymmetric usage = disagreement about that evidence's relevance.
 * MVP fallback (signalsUsed empty): the first dossier signal. undefined if none.
 */
export function computeContestedSignal(
  bets: ModelBet[],
  dossier: Dossier,
): string | undefined {
  if (bets.length >= 2) {
    const sorted = [...bets].sort((a, b) => a.price - b.price);
    const bear = sorted[0];
    const bull = sorted[sorted.length - 1];
    const bullOnly = bull.signalsUsed.find(
      (s) => !bear.signalsUsed.includes(s),
    );
    if (bullOnly) return bullOnly;
    const bearOnly = bear.signalsUsed.find(
      (s) => !bull.signalsUsed.includes(s),
    );
    if (bearOnly) return bearOnly;
  }
  // MVP fallback: no signalsUsed attribution yet.
  return dossier.signals[0]?.claim;
}

/** Assemble a fully-derived Deal from its identity + evidence + bets. */
export function assembleDeal(input: {
  id: string;
  name: string;
  initials: string;
  logo?: string;
  dossier: Dossier;
  bets: ModelBet[];
  status: DealStatus;
}): Deal {
  const consensus = computeConsensus(input.bets);
  const spread = computeSpread(input.bets);
  const tier = computeTier(consensus, spread);
  const action = actionForTier(tier);
  const contestedSignal =
    tier === 2 ? computeContestedSignal(input.bets, input.dossier) : undefined;

  return {
    id: input.id,
    name: input.name,
    initials: input.initials,
    logo: input.logo,
    dossier: input.dossier,
    bets: input.bets,
    consensus,
    spread,
    tier,
    action,
    contestedSignal,
    status: input.status,
  };
}
