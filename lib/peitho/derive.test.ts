import { expect, test, describe } from "bun:test";
import {
  computeConsensus,
  computeSpread,
  computeTier,
  actionForTier,
  computeContestedSignal,
  assembleDeal,
} from "./derive";
import type { ModelBet, Dossier } from "./types";

function bet(model: string, price: number, signalsUsed: string[] = []): ModelBet {
  return { model, price, confidence: 0.7, rationale: "", signalsUsed };
}

describe("computeConsensus", () => {
  test("mean of prices, rounded", () => {
    expect(computeConsensus([bet("a", 70), bet("b", 80), bet("c", 75)])).toBe(75);
  });
  test("rounds half up", () => {
    // (70 + 71) / 2 = 70.5 -> 71
    expect(computeConsensus([bet("a", 70), bet("b", 71)])).toBe(71);
  });
  test("empty bets -> 0", () => {
    expect(computeConsensus([])).toBe(0);
  });
});

describe("computeSpread", () => {
  test("max - min", () => {
    expect(computeSpread([bet("a", 40), bet("b", 90), bet("c", 65)])).toBe(50);
  });
  test("single bet -> 0", () => {
    expect(computeSpread([bet("a", 50)])).toBe(0);
  });
  test("empty -> 0", () => {
    expect(computeSpread([])).toBe(0);
  });
});

describe("computeTier", () => {
  test("tier 1: high consensus, tight spread", () => {
    expect(computeTier(80, 10)).toBe(1);
    expect(computeTier(65, 20)).toBe(1); // exact boundary
  });
  test("tier 3: low consensus regardless of spread", () => {
    expect(computeTier(34, 5)).toBe(3);
    expect(computeTier(20, 60)).toBe(3);
  });
  test("tier 2: high consensus but wide spread (they disagree)", () => {
    expect(computeTier(80, 40)).toBe(2);
    expect(computeTier(65, 21)).toBe(2); // spread one over the tier-1 line
  });
  test("tier 2: mid consensus", () => {
    expect(computeTier(50, 10)).toBe(2);
    expect(computeTier(35, 5)).toBe(2); // exact lower boundary of tier 2
  });
});

describe("actionForTier", () => {
  test("maps each tier to its action", () => {
    expect(actionForTier(1)).toBe("prioritize");
    expect(actionForTier(2)).toBe("personalize");
    expect(actionForTier(3)).toBe("skip");
  });
});

describe("computeContestedSignal", () => {
  const dossier: Dossier = {
    summary: "x",
    signals: [
      { source: "hand", claim: "raised Series C in March" },
      { source: "hand", claim: "hiring 12 AEs" },
    ],
  };

  test("asymmetric signalsUsed: bull-only claim is contested", () => {
    const bets = [
      bet("bear", 40, ["raised Series C in March"]),
      bet("bull", 90, ["raised Series C in March", "hiring 12 AEs"]),
    ];
    expect(computeContestedSignal(bets, dossier)).toBe("hiring 12 AEs");
  });

  test("MVP fallback: empty signalsUsed -> first dossier signal", () => {
    const bets = [bet("a", 40), bet("b", 90)];
    expect(computeContestedSignal(bets, dossier)).toBe("raised Series C in March");
  });

  test("no signals at all -> undefined", () => {
    const bets = [bet("a", 40), bet("b", 90)];
    expect(computeContestedSignal(bets, { summary: "x", signals: [] })).toBeUndefined();
  });
});

describe("assembleDeal — known inputs, exact outputs", () => {
  const dossier: Dossier = {
    summary: "Acme Corp",
    signals: [{ source: "hand", claim: "raised Series C in March" }],
  };

  test("tier 1 deal: prioritize, no contestedSignal", () => {
    const deal = assembleDeal({
      id: "d1",
      name: "Acme",
      initials: "AC",
      dossier,
      bets: [bet("claude", 78), bet("gpt", 82), bet("gemini", 80), bet("grok", 84)],
      status: "settled",
    });
    expect(deal.consensus).toBe(81);
    expect(deal.spread).toBe(6);
    expect(deal.tier).toBe(1);
    expect(deal.action).toBe("prioritize");
    expect(deal.contestedSignal).toBeUndefined();
  });

  test("tier 2 deal: high consensus, wide spread -> personalize + contestedSignal", () => {
    const deal = assembleDeal({
      id: "d2",
      name: "Beta",
      initials: "BE",
      dossier,
      bets: [bet("claude", 55), bet("gpt", 90), bet("gemini", 60), bet("grok", 88)],
      status: "settled",
    });
    expect(deal.consensus).toBe(73);
    expect(deal.spread).toBe(35);
    expect(deal.tier).toBe(2);
    expect(deal.action).toBe("personalize");
    expect(deal.contestedSignal).toBe("raised Series C in March");
  });

  test("tier 3 deal: low consensus -> skip", () => {
    const deal = assembleDeal({
      id: "d3",
      name: "Gamma",
      initials: "GA",
      dossier,
      bets: [bet("claude", 20), bet("gpt", 30), bet("gemini", 25), bet("grok", 28)],
      status: "settled",
    });
    expect(deal.consensus).toBe(26);
    expect(deal.spread).toBe(10);
    expect(deal.tier).toBe(3);
    expect(deal.action).toBe("skip");
  });
});
