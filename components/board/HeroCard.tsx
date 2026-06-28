"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Deal } from "@/lib/peitho/types";
import {
  ACTION_DISPLAY,
  TIER_DISPLAY,
  actionLine,
} from "@/lib/peitho/display";
import { ConsensusGauge } from "./ConsensusGauge";
import { ModelBets } from "./ModelBets";
import { OddsChart } from "./OddsChart";

// A short settle trajectory from a shared 50 baseline out to each final price —
// reads as the panel forming its read as the bets land.
function settle(price: number): number[] {
  const n = 6;
  return Array.from({ length: n }, (_, k) =>
    Math.round(50 + (price - 50) * (k / (n - 1))),
  );
}

export function HeroCard({ deal }: { deal: Deal }) {
  const priceDeal = useAction(api.engine.priceDeal);
  const resetHero = useMutation(api.seed.resetHero);
  const [running, setRunning] = useState(false);

  const tier = TIER_DISPLAY[deal.tier];
  const action = ACTION_DISPLAY[deal.action];
  const live = deal.status === "pending" || deal.status === "resolving";
  const settled = deal.bets.length > 0 && deal.status === "settled";

  async function run() {
    setRunning(true);
    try {
      await resetHero({ dealId: deal.id }); // clear → price fresh, bets land live
      await priceDeal({ dealId: deal.id });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-2xl ring-1 ring-border backdrop-blur sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: identity + evidence */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-sm font-bold text-foreground">
              {deal.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {deal.name}
                </h2>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary ring-1 ring-primary/30">
                  Live hero
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{tier.label}</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-foreground">
            {deal.dossier.summary}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {deal.dossier.signals.map((s, i) => (
              <span
                key={i}
                className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] text-foreground"
                title={s.source}
              >
                <span className="mr-1 text-muted-foreground">{s.source}:</span>
                {s.claim}
              </span>
            ))}
          </div>

          <button
            onClick={run}
            disabled={running || live}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running || live ? (
              <>
                <span className="h-2 w-2 animate-ping rounded-full bg-primary-foreground" />
                Panel investigating…
              </>
            ) : settled ? (
              "Re-run the panel"
            ) : (
              "Run the panel live"
            )}
          </button>
        </div>

        {/* Right: the gauge */}
        <div className="flex flex-col items-center justify-center lg:w-[300px]">
          <ConsensusGauge
            consensus={deal.consensus}
            spread={deal.spread}
            bets={deal.bets}
            accent={tier.accent}
            pending={live || running}
          />
        </div>
      </div>

      {/* Four-model bet row */}
      <div className="mt-6">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          The panel — same evidence, four lenses
        </div>
        <ModelBets bets={deal.bets} />
      </div>

      {deal.bets.length > 0 && (
        <div className="mt-5">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Odds forming — the gap between lines is the spread
          </div>
          <OddsChart
            series={deal.bets.map((b) => ({ model: b.model, points: settle(b.price) }))}
            consensus={deal.consensus}
          />
        </div>
      )}

      {/* Recommended action — never a number without a "so do this" */}
      <div
        className={`mt-5 flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${action.tone} ${action.ring}`}
      >
        <span
          className={`rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide ${action.text}`}
        >
          {action.label}
        </span>
        <span className="text-sm text-foreground">{actionLine(deal)}</span>
      </div>
    </div>
  );
}
