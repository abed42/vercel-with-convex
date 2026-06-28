"use client";

import { motion } from "motion/react";
import type { Deal } from "@/lib/peitho/types";
import { ACTION_DISPLAY, agreementBadge, consensusStdDev, guerrillaMove } from "@/lib/peitho/display";
import { EASE_OUT } from "@/lib/ease";
import { AnimatedNumber, fmtPct, fmtCents } from "@/components/AnimatedNumber";
import { ConsensusStrip } from "./ConsensusStrip";
import { CompanyLogo } from "./CompanyLogo";

export function MarketCard({ deal, onClick }: { deal: Deal; onClick?: () => void }) {
  const yes = deal.consensus;
  const no = 100 - yes;
  const badge = agreementBadge(consensusStdDev(deal.bets));
  const hot = deal.spread >= 25;
  const move = guerrillaMove(deal);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary/30 hover:shadow-xl"
    >
      {/* header: identity + the implicit market question */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <CompanyLogo logo={deal.logo} initials={deal.initials} className="h-9 w-9 rounded-lg text-xs" />
          <p className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-tight text-foreground">
            Will {deal.name} convert?
          </p>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ring-1 ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 pl-12">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${ACTION_DISPLAY[deal.action].tone} ${ACTION_DISPLAY[deal.action].ring} ${ACTION_DISPLAY[deal.action].text}`}>
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
          <motion.div
            className="flex items-center justify-center overflow-hidden bg-[#243933] text-[#10b981] transition-colors group-hover:bg-[#10b981] group-hover:text-white"
            initial={{ width: "50%" }}
            animate={{ width: `${yes}%` }}
            transition={{ duration: 1.2, ease: EASE_OUT }}
          >
            {yes >= 20 && <AnimatedNumber value={yes} format={fmtPct} />}
          </motion.div>
          <div className="flex flex-1 items-center justify-center overflow-hidden bg-[#3B2426] text-[#FB2B37] transition-colors group-hover:bg-[#FB2B37] group-hover:text-white">
            {no >= 20 && <AnimatedNumber value={no} format={fmtPct} />}
          </div>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-[11px] font-semibold text-[#10b981]">
            Yes <AnimatedNumber value={yes} format={fmtCents} />
          </span>
          <span className="text-[11px] font-semibold text-[#FB2B37]">
            No <AnimatedNumber value={no} format={fmtCents} />
          </span>
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
        <div className="mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            AI Consensus
          </span>
        </div>
        <ConsensusStrip bets={deal.bets} consensus={deal.consensus} />
      </div>
    </div>
  );
}
