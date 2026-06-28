"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { Users, BarChart2, Activity } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Deal } from "@/lib/peitho/types";
import { HERO_DEAL_ID } from "@/lib/peitho/config";
import { CompanyLogo } from "./CompanyLogo";
import {
  ACTION_DISPLAY,
  actionLine,
  agreementBadge,
  consensusStdDev,
  modelDisplay,
} from "@/lib/peitho/display";
import { ModelAvatar } from "@/lib/peitho/modelIcons";

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
    <div className="mb-4 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card to-secondary/40">
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
            <div className="mb-2 flex h-10 overflow-hidden rounded-xl text-sm font-bold">
              <div
                className="flex items-center justify-center gap-1 bg-primary text-primary-foreground"
                style={{ width: `${yes}%` }}
              >
                <span>Yes</span>
                <span className="tabular-nums">{yes}%</span>
              </div>
              <div className="flex flex-1 items-center justify-center gap-1 bg-destructive text-white">
                <span>No</span>
                <span className="tabular-nums">{no}%</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-lg font-bold tabular-nums text-primary">{yes}¢</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Consensus Yes</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-lg font-bold tabular-nums text-destructive">{no}¢</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Consensus No</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-lg font-bold tabular-nums text-foreground">±{deal.spread}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Model Spread</p>
              </div>
            </div>

            {/* the seller action — every market ends in "do this" */}
            <div className={`mt-3 flex items-center gap-3 rounded-xl px-4 py-2.5 ring-1 ${action.tone} ${action.ring}`}>
              <span className={`rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide ${action.text}`}>
                {action.label}
              </span>
              <span className="text-sm text-foreground">{actionLine(deal)}</span>
            </div>

            {isHero && (
              <button
                onClick={run}
                disabled={running || live}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
            )}
          </div>

          {/* right: per-model breakdown */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              AI model votes
            </p>
            <div className="space-y-2.5">
              {deal.bets.map((b) => {
                const { color, label } = modelDisplay(b.model);
                return (
                  <div key={b.model} className="rounded-lg bg-muted px-3 py-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color }}>
                        <ModelAvatar model={b.model} size={16} />
                        {label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-primary">Yes {b.price}%</span>
                        <span className="text-[11px] font-bold text-destructive">No {100 - b.price}%</span>
                      </div>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-md">
                      <div className="h-full bg-primary" style={{ width: `${b.price}%` }} />
                      <div className="h-full flex-1 bg-destructive" />
                    </div>
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
