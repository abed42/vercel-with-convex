"use client";

import { useState } from "react";
import { assembleDeal } from "@/lib/peitho/derive";
import { STORY_BEATS, STORY_PROSPECT } from "@/lib/peitho/story";
import { ALL_MODELS } from "@/lib/peitho/config";
import { ACTION_DISPLAY, TIER_DISPLAY, actionLine } from "@/lib/peitho/display";
import { ConsensusGauge } from "./ConsensusGauge";
import { ModelBets } from "./ModelBets";
import { OddsChart } from "./OddsChart";

export function Story({ onPivot }: { onPivot?: () => void }) {
  const [i, setI] = useState(0);
  const beat = STORY_BEATS[i];
  const last = i === STORY_BEATS.length - 1;

  // Derived with the SAME pure function the live engine uses.
  const deal = assembleDeal({
    id: "story",
    name: STORY_PROSPECT.name,
    initials: STORY_PROSPECT.initials,
    dossier: { summary: beat.narration, signals: [] },
    bets: beat.bets,
    status: "settled",
  });
  const tier = TIER_DISPLAY[deal.tier];
  const action = ACTION_DISPLAY[deal.action];

  // Real per-beat trajectories: each model's price across the beats so far.
  const series = ALL_MODELS.map((m) => ({
    model: m,
    points: STORY_BEATS.slice(0, i + 1).map(
      (bt) => bt.bets.find((b) => b.model === m)?.price ?? 0,
    ),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Cold open · priced like a live market
        </p>
        <h2 className="mt-1 font-heading text-xl font-semibold text-foreground">
          {STORY_PROSPECT.name}
        </h2>
      </div>

      {/* beat progress */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {STORY_BEATS.map((b, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === i ? "w-8 bg-primary" : idx < i ? "w-4 bg-muted-foreground" : "w-4 bg-muted"
            }`}
            title={b.title}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Beat {i + 1} · {beat.title}
            </div>
            <p className="mt-2 text-lg leading-relaxed text-foreground">
              {beat.narration}
            </p>
          </div>
          <div className="shrink-0">
            <ConsensusGauge
              consensus={deal.consensus}
              spread={deal.spread}
              bets={deal.bets}
              accent={tier.accent}
            />
          </div>
        </div>

        <div className="mt-5">
          <ModelBets bets={deal.bets} />
        </div>

        <div className="mt-5">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Odds across the story — four lenses, live
          </div>
          <OddsChart series={series} consensus={deal.consensus} />
        </div>

        <div className={`mt-4 flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${action.tone} ${action.ring}`}>
          <span className={`rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide ${action.text}`}>
            {action.label}
          </span>
          <span className="text-sm text-foreground">{actionLine(deal)}</span>
        </div>
      </div>

      {/* controls */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => setI((n) => Math.max(0, n - 1))}
          disabled={i === 0}
          className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:bg-muted disabled:opacity-40"
        >
          ← Back
        </button>
        {!last ? (
          <button
            onClick={() => setI((n) => Math.min(STORY_BEATS.length - 1, n + 1))}
            className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={onPivot}
            className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
          >
            Pivot to the board →
          </button>
        )}
        <button
          onClick={() => setI(0)}
          className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
