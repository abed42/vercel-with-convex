"use client";

import type { Deal } from "@/lib/peitho/types";
import { modelDisplay } from "@/lib/peitho/display";

// Polymarket shows a "Breaking News" rail. Ours shows what only a model-panel
// can: where the panel disagrees most, and exactly what they disagree about.
export function MoversRail({ deals }: { deals: Deal[] }) {
  const splits = [...deals]
    .filter((d) => d.bets.length >= 2)
    .sort((a, b) => b.spread - a.spread)
    .slice(0, 4);

  const contested = deals
    .filter((d) => d.action === "personalize" && d.contestedSignal)
    .slice(0, 4);

  return (
    <>
      <section className="h-full rounded-xl border border-border bg-card p-4 lg:col-start-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Sharpest splits</h3>
        <ol className="flex flex-col gap-3">
          {splits.map((d, i) => {
            const sorted = [...d.bets].sort((a, b) => a.price - b.price);
            const bear = sorted[0];
            const bull = sorted[sorted.length - 1];
            return (
              <li key={d.id} className="flex items-center gap-3">
                <span className="w-3 shrink-0 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{d.name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span style={{ color: modelDisplay(bull.model).color }}>
                      {modelDisplay(bull.model).label} {bull.price}
                    </span>
                    <span>vs</span>
                    <span style={{ color: modelDisplay(bear.model).color }}>
                      {modelDisplay(bear.model).label} {bear.price}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-xs font-bold tabular-nums text-amber-300 ring-1 ring-amber-500/30">
                  ±{d.spread}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {contested.length > 0 && (
        <section className="h-full rounded-xl border border-border bg-card p-4 lg:col-start-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">What&apos;s contested</h3>
          <ul className="flex flex-col gap-2.5">
            {contested.map((d) => (
              <li key={d.id} className="text-[13px] leading-snug">
                <span className="text-muted-foreground">{d.name}: </span>
                <span className="text-foreground">“{d.contestedSignal}”</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
