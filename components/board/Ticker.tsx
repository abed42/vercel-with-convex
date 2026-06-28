"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PROBE_DEAL_ID } from "@/lib/peitho/config";
import { TIER_DISPLAY } from "@/lib/peitho/display";
import type { Deal } from "@/lib/peitho/types";

// A tiny speedometer arc, echoing Polymarket's market-odds gauge.
function MiniSpeedo({ value, accent }: { value: number; accent: string }) {
  const w = 22;
  const h = 13;
  const r = 9;
  const cx = w / 2;
  const cy = h - 1.5;
  const pt = (v: number) => {
    const a = Math.PI * (1 - Math.max(0, Math.min(100, v)) / 100);
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  };
  const arc = (from: number, to: number) => {
    const a = pt(from);
    const b = pt(to);
    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${r} ${r} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-5 w-[34px] shrink-0">
      <path d={arc(0, 100)} fill="none" stroke="currentColor" className="text-muted-foreground/30" strokeWidth={2.5} strokeLinecap="round" />
      <path d={arc(0, value)} fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

function TickerItem({ deal }: { deal: Deal }) {
  const accent = TIER_DISPLAY[deal.tier].accent;
  const priced = deal.bets.length > 0;
  return (
    <div className="flex shrink-0 items-center gap-3 px-6">
      {deal.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={deal.logo}
          alt=""
          className="h-6 w-6 shrink-0 rounded-md object-contain"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
          {deal.initials}
        </span>
      )}
      <span className="whitespace-nowrap text-base font-medium text-foreground/90">
        {deal.name}
      </span>
      {priced ? (
        <>
          <MiniSpeedo value={deal.consensus} accent={accent} />
          <span className="text-base font-bold tabular-nums" style={{ color: accent }}>
            {deal.consensus}%
          </span>
        </>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )}
    </div>
  );
}

export function Ticker() {
  const deals = useQuery(api.deals.listDeals);
  const items = (deals ?? []).filter((d) => d.id !== PROBE_DEAL_ID);
  if (items.length === 0) return null;

  // Duplicate the list so the translateX(-50%) loop is seamless.
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden border-b border-border bg-card/40">
      <style>{`
        @keyframes peithoTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .peitho-ticker { animation: peithoTicker 120s linear infinite; }
        .peitho-ticker:hover { animation-play-state: paused; }
      `}</style>
      <div className="peitho-ticker flex w-max items-center py-3.5">
        {loop.map((d, i) => (
          <div key={`${d.id}-${i}`} className="flex items-center">
            <TickerItem deal={d} />
            <span className="text-muted-foreground/30">·</span>
          </div>
        ))}
      </div>
    </div>
  );
}
