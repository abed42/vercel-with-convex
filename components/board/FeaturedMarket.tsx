"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useAction, useMutation } from "convex/react";
import { Users, BarChart2, Activity } from "lucide-react";
import { EASE_OUT } from "@/lib/ease";
import { AnimatedNumber, fmtPct } from "@/components/AnimatedNumber";
import { api } from "@/convex/_generated/api";
import type { Deal } from "@/lib/peitho/types";
import { ALL_MODELS, HERO_DEAL_ID } from "@/lib/peitho/config";
import { CompanyLogo } from "./CompanyLogo";
import { DetectSignal } from "./DetectSignal";
import {
  ACTION_DISPLAY,
  actionLine,
  agreementBadge,
  consensusStdDev,
  guerrillaMove,
  modelDisplay,
} from "@/lib/peitho/display";
import { ModelGlyph } from "@/lib/peitho/modelIcons";
import { OddsChart } from "./OddsChart";

// A short settle trajectory from a 50 baseline out to each final price — reads as
// the panel forming its read as the bets land (same shape OddsChart expects).
function settle(price: number): number[] {
  const n = 6;
  return Array.from({ length: n }, (_, k) =>
    Math.round(50 + (price - 50) * (k / (n - 1))),
  );
}

export function FeaturedMarket({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const priceDeal = useAction(api.engine.priceDeal);
  const resetHero = useMutation(api.seed.resetHero);
  const [running, setRunning] = useState(false);

  const yes = deal.consensus;
  const no = 100 - yes;
  const badge = agreementBadge(consensusStdDev(deal.bets));
  const action = ACTION_DISPLAY[deal.action];
  const maxVote = deal.bets.length ? Math.max(...deal.bets.map((b) => b.price)) : -1;
  const isHero = deal.id === HERO_DEAL_ID;
  const live = deal.status === "pending" || deal.status === "resolving";
  const move = guerrillaMove(deal);

  const byModel = new Map(deal.bets.map((b) => [b.model, b]));
  // While the panel is live, models that haven't priced yet get a skeleton slot.
  const pending = live || running;
  const chartSeries = deal.bets.map((b) => ({ model: b.model, points: settle(b.price) }));

  async function run() {
    setRunning(true);
    try {
      await resetHero({ dealId: deal.id });
      await priceDeal({ dealId: deal.id });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-card to-secondary/40">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-1 items-start gap-4">
            <CompanyLogo logo={deal.logo} initials={deal.initials} className="h-12 w-12 rounded-xl text-base" />
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {isHero ? "Live Hero" : "Featured Market"}
                </span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <h2 className="font-heading text-xl font-bold leading-tight text-foreground">
                Will {deal.name} convert?
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users size={11} /> {deal.bets.length} of 4 models priced
                </span>
                <span className="flex items-center gap-1">
                  <BarChart2 size={11} /> ±{deal.spread} spread
                </span>
                <span className="flex items-center gap-1">
                  <Activity size={11} /> {deal.dossier.signals.length} signals
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-xs text-muted-foreground transition hover:text-foreground"
          >
            ✕ close
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* left: consensus price + action */}
          <div>
            <div className="mb-3 flex h-10 overflow-hidden rounded-xl text-sm font-bold">
              <motion.div
                className="flex items-center justify-center gap-1 overflow-hidden bg-[#10b981] text-white"
                initial={{ width: "50%" }}
                animate={{ width: `${yes}%` }}
                transition={{ duration: 1.2, ease: EASE_OUT }}
              >
                <span>Yes</span>
                <AnimatedNumber value={yes} format={fmtPct} />
              </motion.div>
              <div className="flex flex-1 items-center justify-center gap-1 overflow-hidden bg-[#FB2B37] text-white">
                <span>No</span>
                <AnimatedNumber value={no} format={fmtPct} />
              </div>
            </div>
            {/* The spread is the product's whole thesis — give it the one box. */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Model spread
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-foreground/75">
                  {deal.spread <= 20
                    ? "Panel agrees — a tight, confident read."
                    : "Panel splits — the disagreement is the signal."}
                </p>
              </div>
              <div className="flex shrink-0 items-baseline gap-1">
                <span className="font-heading text-3xl font-bold tabular-nums text-foreground">
                  ±{deal.spread}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {deal.spread <= 20 ? "tight" : "wide"}
                </span>
              </div>
            </div>

            {/* Signature visual: four model lines diverging to their prices —
                the gap between them IS the spread named above. */}
            {deal.bets.length > 0 && (
              <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  How the panel landed
                </p>
                <OddsChart series={chartSeries} consensus={yes} />
              </div>
            )}

            {/* the seller action — every market ends in "do this" */}
            {move ? (
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <span className="text-2xl leading-none">🦍</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-400">
                    Guerrilla move needed
                  </p>
                  <p className="mt-0.5 text-sm text-foreground">{move}</p>
                </div>
              </div>
            ) : (
              <div className={`mt-3 flex items-center gap-3 rounded-xl px-4 py-2.5 ring-1 ${action.tone} ${action.ring}`}>
                <span className={`rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide ${action.text}`}>
                  {action.label}
                </span>
                <span className="text-sm text-foreground">{actionLine(deal)}</span>
              </div>
            )}

            {isHero && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={run}
                  disabled={running || live}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {running || live ? (
                    <>
                      <span className="h-2 w-2 animate-ping rounded-full bg-primary-foreground" />
                      Panel investigating…
                    </>
                  ) : deal.bets.length > 0 ? (
                    "Re-run the panel live"
                  ) : (
                    "Run the panel live"
                  )}
                </button>
                <DetectSignal dealId={deal.id} />
              </div>
            )}
          </div>

          {/* right: per-model breakdown */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              AI model votes
            </p>
            <div className="space-y-2.5">
              {ALL_MODELS.map((m) => {
                const b = byModel.get(m);
                if (!b) {
                  // Still thinking — show a skeleton only while the panel is live.
                  return pending ? <SkeletonVote key={m} model={m} /> : null;
                }
                const { color, label } = modelDisplay(b.model);
                return (
                  <div key={b.model} className="rounded-lg bg-muted px-3 py-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color }}>
                        <ModelGlyph model={b.model} size={16} />
                        {label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#10b981]">
                          Yes <AnimatedNumber value={b.price} format={fmtPct} />
                        </span>
                        <span className="text-[11px] font-bold text-[#FB2B37]">
                          No <AnimatedNumber value={100 - b.price} format={fmtPct} />
                        </span>
                      </div>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-md">
                      <motion.div
                        className="h-full overflow-hidden bg-[#10b981]"
                        initial={{ width: "50%" }}
                        animate={{ width: `${b.price}%` }}
                        transition={{ duration: 1.2, ease: EASE_OUT }}
                      />
                      <div className="h-full flex-1 bg-[#FB2B37]" />
                    </div>
                    {b.rationale && (
                      <p className="mt-1.5 text-[11px] leading-snug text-foreground/80">
                        {b.rationale}
                      </p>
                    )}
                    {b.signalsUsed.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {b.signalsUsed.slice(0, 3).map((s, i) => (
                          <span
                            key={i}
                            className="rounded bg-background/60 px-1.5 py-0.5 text-[9px] text-muted-foreground ring-1 ring-border"
                            title={s}
                          >
                            {s.length > 46 ? s.slice(0, 46) + "…" : s}
                          </span>
                        ))}
                      </div>
                    )}
                    {b.price === maxVote && (
                      <p className="mt-1 text-[10px] text-muted-foreground">↑ Highest conviction on Yes</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder for a model that hasn't posted its bet yet — identity stays sharp
// (so you see who's still out), the data placeholders pulse.
function SkeletonVote({ model }: { model: string }) {
  const { color, label } = modelDisplay(model);
  return (
    <div className="rounded-lg bg-muted px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color }}>
          <ModelGlyph model={model} size={16} />
          {label}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-ping rounded-full" style={{ backgroundColor: color }} />
          weighing in…
        </span>
      </div>
      <div className="animate-pulse space-y-2">
        <div className="h-2 w-full rounded-md bg-muted-foreground/15" />
        <div className="h-2.5 w-full rounded bg-muted-foreground/10" />
        <div className="h-2.5 w-3/4 rounded bg-muted-foreground/10" />
        <div className="flex gap-1 pt-0.5">
          <div className="h-4 w-24 rounded bg-muted-foreground/10" />
          <div className="h-4 w-20 rounded bg-muted-foreground/10" />
        </div>
      </div>
    </div>
  );
}
