"use client";

import type { Deal } from "@/lib/peitho/types";
import { ALL_MODELS } from "@/lib/peitho/config";
import { ACTION_DISPLAY, agreementBadge, consensusStdDev, guerrillaMove } from "@/lib/peitho/display";
import { ModelBar } from "./ModelBar";
import { CompanyLogo } from "./CompanyLogo";

export function MarketCard({ deal, onClick }: { deal: Deal; onClick?: () => void }) {
  const yes = deal.consensus;
  const no = 100 - yes;
  const badge = agreementBadge(consensusStdDev(deal.bets));
  const byModel = new Map(deal.bets.map((b) => [b.model, b]));
  const maxVote = deal.bets.length ? Math.max(...deal.bets.map((b) => b.price)) : -1;
  const signals = deal.dossier.signals.length;
  const hot = deal.spread >= 25;
  const move = guerrillaMove(deal);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:bg-secondary/40"
    >
      {/* header: identity + the implicit market question */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <CompanyLogo logo={deal.logo} initials={deal.initials} className="h-9 w-9 rounded-lg text-xs" />
          <p className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-tight text-foreground">
            Will {deal.name} convert?
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2 pl-12">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {ACTION_DISPLAY[deal.action].label}
          </span>
          {hot && (
            <span className="text-[10px] font-semibold text-amber-400">↗ Contested</span>
          )}
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
            ±{deal.spread} spread
          </span>
        </div>
      </div>

      {/* Yes/No odds bar */}
      <div className="px-4 pb-3">
        <div className="flex h-6 overflow-hidden rounded-lg text-xs font-bold">
          <div
            className="flex items-center justify-center bg-primary text-primary-foreground transition-all duration-300"
            style={{ width: `${yes}%` }}
          >
            {yes >= 20 && <span className="tabular-nums">{yes}%</span>}
          </div>
          <div className="flex flex-1 items-center justify-center bg-destructive text-white transition-all duration-300">
            {no >= 20 && <span className="tabular-nums">{no}%</span>}
          </div>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-[11px] font-semibold text-primary">Yes {yes}¢</span>
          <span className="text-[11px] font-semibold text-destructive">No {no}¢</span>
        </div>
      </div>

      {/* near-zero odds: the funnel won't save it — call a guerrilla move */}
      {move && (
        <div className="px-4 pb-3">
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <span className="text-sm leading-none">🦍</span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400">
                Guerrilla move needed
              </p>
              <p className="text-[11px] leading-snug text-foreground/90">{move}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI consensus — the four models as the bettors */}
      <div className="border-t border-border px-4 pb-3 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            AI Consensus
          </span>
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
        <div className="space-y-1">
          {ALL_MODELS.map((m) => {
            const bet = byModel.get(m);
            return (
              <ModelBar
                key={m}
                model={m}
                price={bet ? bet.price : null}
                isMax={!!bet && bet.price === maxVote}
              />
            );
          })}
        </div>
      </div>

      {/* footer: honest stats + Yes/No */}
      <div className="flex items-center gap-4 border-t border-border px-4 py-2.5">
        <span className="text-[11px] text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{deal.bets.length}</span>/4 priced
        </span>
        <span className="text-[11px] text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{signals}</span> signals
        </span>
        <div className="ml-auto flex gap-2">
          <button
            className="rounded-lg bg-primary/15 px-3 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/25"
            onClick={(e) => e.stopPropagation()}
          >
            Yes
          </button>
          <button
            className="rounded-lg bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive transition-colors hover:bg-destructive/25"
            onClick={(e) => e.stopPropagation()}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
