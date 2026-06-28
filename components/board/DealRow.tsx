"use client";

import { useState } from "react";
import type { Deal } from "@/lib/peitho/types";
import {
  ACTION_DISPLAY,
  TIER_DISPLAY,
  actionLine,
  betRange,
  modelDisplay,
} from "@/lib/peitho/display";
import { ModelBets } from "./ModelBets";

export function DealRow({ deal }: { deal: Deal }) {
  const [open, setOpen] = useState(false);
  const action = ACTION_DISPLAY[deal.action];
  const accent = TIER_DISPLAY[deal.tier].accent;
  const [lo, hi] = betRange(deal.bets);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground">
          {deal.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {deal.name}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {deal.action === "personalize" && deal.contestedSignal
              ? `contested: ${deal.contestedSignal}`
              : deal.dossier.summary}
          </div>
        </div>

        {/* spread band — wider = the panel disagrees more (less certain) */}
        <div className="hidden w-28 shrink-0 md:block">
          <div className="relative h-1.5 w-full rounded-full bg-muted">
            <div
              className="absolute h-1.5 rounded-full"
              style={{
                left: `${lo}%`,
                width: `${Math.max(2, hi - lo)}%`,
                backgroundColor: accent,
                opacity: 0.5,
              }}
            />
            {deal.bets.map((b) => (
              <span
                key={b.model}
                className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-background"
                style={{ left: `${b.price}%`, backgroundColor: modelDisplay(b.model).color }}
              />
            ))}
          </div>
          <div className="mt-1 text-center text-[9px] tabular-nums text-muted-foreground">
            {lo}–{hi}
          </div>
        </div>

        {/* consensus + spread */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div
              className="text-lg font-bold tabular-nums leading-none"
              style={{ color: accent }}
            >
              {deal.consensus}
            </div>
            <div className="text-[10px] text-muted-foreground">
              ±{deal.spread} spread
            </div>
          </div>
          <span
            className={`hidden rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 sm:inline ${action.tone} ${action.ring} ${action.text}`}
          >
            {action.label}
          </span>
          <span className="text-muted-foreground">{open ? "▾" : "▸"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-muted p-3">
          <ModelBets bets={deal.bets} />
          <p className="mt-2 text-xs text-muted-foreground">{actionLine(deal)}</p>
        </div>
      )}
    </div>
  );
}
