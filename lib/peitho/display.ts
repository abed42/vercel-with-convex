// Pure display helpers — colors, labels, and the gauge geometry. No React here
// so the mappings stay testable and the components stay thin.

import type { Deal, DealAction, DealTier, ModelBet } from "./types";

export const MODEL_DISPLAY: Record<string, { label: string; color: string }> = {
  claude: { label: "Claude", color: "#D97757" }, // clay
  gpt: { label: "GPT", color: "#10A37F" }, // teal
  gemini: { label: "Gemini", color: "#4285F4" }, // blue
  grok: { label: "Grok", color: "#8B5CF6" }, // violet
};

export function modelDisplay(model: string) {
  return MODEL_DISPLAY[model] ?? { label: model, color: "#64748b" };
}

export const ACTION_DISPLAY: Record<
  DealAction,
  { label: string; tone: string; ring: string; text: string }
> = {
  prioritize: {
    label: "Prioritize",
    tone: "bg-emerald-500/15",
    ring: "ring-emerald-500/40",
    text: "text-emerald-300",
  },
  personalize: {
    label: "Personalize",
    tone: "bg-amber-500/15",
    ring: "ring-amber-500/40",
    text: "text-amber-300",
  },
  skip: {
    label: "Skip",
    tone: "bg-muted",
    ring: "ring-border",
    text: "text-muted-foreground",
  },
};

export const TIER_DISPLAY: Record<
  DealTier,
  { label: string; blurb: string; accent: string }
> = {
  1: {
    label: "Tier 1 · Prioritize",
    blurb: "Panel agrees — strong, work these now",
    accent: "#10b981",
  },
  2: {
    label: "Tier 2 · Personalize",
    blurb: "Panel splits — the disagreement tells you what to address",
    accent: "#f59e0b",
  },
  3: {
    label: "Tier 3 · Skip",
    blurb: "Low consensus — not worth the cycles",
    accent: "#64748b",
  },
};

/** The [min, max] price range across bets — the literal disagreement band. */
export function betRange(bets: ModelBet[]): [number, number] {
  if (bets.length === 0) return [0, 0];
  const prices = bets.map((b) => b.price);
  return [Math.min(...prices), Math.max(...prices)];
}

/** A short, human action line that always ends in a "so do this". */
export function actionLine(deal: Deal): string {
  switch (deal.action) {
    case "prioritize":
      return "Prioritize — high conviction across the panel.";
    case "personalize":
      return deal.contestedSignal
        ? `Personalize around “${deal.contestedSignal}.”`
        : "Personalize — the panel is split on this one.";
    case "skip":
      return "Skip — no panel sees a reason to spend cycles.";
  }
}

// ── Gauge geometry: a 180° arc, 0 on the left, 100 on the right ──────────────
export const GAUGE = { w: 280, h: 160, cx: 140, cy: 150, r: 120 } as const;

/** Map a 0-100 value to a point on the semicircle arc. */
export function gaugePoint(value: number, radius: number = GAUGE.r) {
  const t = Math.max(0, Math.min(100, value)) / 100; // 0..1
  const angle = Math.PI * (1 - t); // π (left) → 0 (right)
  return {
    x: GAUGE.cx + radius * Math.cos(angle),
    y: GAUGE.cy - radius * Math.sin(angle),
  };
}

/** SVG arc path between two 0-100 values along the gauge. */
export function gaugeArc(from: number, to: number, radius: number = GAUGE.r): string {
  const a = gaugePoint(Math.min(from, to), radius);
  const b = gaugePoint(Math.max(from, to), radius);
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 0 1 ${b.x} ${b.y}`;
}

// ── Panel agreement ──────────────────────────────────────────────────────────
// Standard deviation of the model prices: a tight cluster means the panel agrees
// (high consensus); a scattered one means the lead is contested — the signal.
export function consensusStdDev(bets: ModelBet[]): number {
  if (bets.length === 0) return 0;
  const mean = bets.reduce((s, b) => s + b.price, 0) / bets.length;
  const variance = bets.reduce((s, b) => s + (b.price - mean) ** 2, 0) / bets.length;
  return Math.sqrt(variance);
}

/** Agreement badge, styled in Peitho's token palette (not raw hex). */
export function agreementBadge(stdDev: number): { label: string; cls: string } {
  if (stdDev < 3)
    return { label: "High Consensus", cls: "bg-primary/15 text-primary ring-primary/30" };
  if (stdDev < 6)
    return { label: "Moderate", cls: "bg-amber-500/15 text-amber-300 ring-amber-500/30" };
  return { label: "Contested", cls: "bg-destructive/15 text-destructive ring-destructive/30" };
}

// ── Guerrilla moves ──────────────────────────────────────────────────────────
// When the panel prices a prospect near-zero, the funnel won't save it — only a
// bold, unscalable move will (the Cursor coffee-truck-outside-their-office play).
// Below this consensus, we stop recommending "skip" and dare a guerrilla move.
export const GUERRILLA_THRESHOLD = 5;

const GUERRILLA_MOVES = [
  "Fly someone out and show up at their office in person.",
  "Park a branded coffee truck outside their HQ — the Cursor café move.",
  "Hand-write a letter to the CEO and overnight it.",
  "Send a custom gift to the decision-maker's desk.",
  "Buy a booth at their next all-hands or industry event.",
  "Rent a billboard on their morning commute.",
  "Cater lunch for the whole team with a note attached.",
  "Record a one-take Loom for the founder they can't ignore.",
];

/** A bold, deterministic guerrilla tactic for a near-zero prospect (else null). */
export function guerrillaMove(deal: Deal): string | null {
  if (deal.consensus >= GUERRILLA_THRESHOLD) return null;
  const hash = [...deal.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  return GUERRILLA_MOVES[hash % GUERRILLA_MOVES.length];
}
