"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/board/AppShell";
import { OddsChart } from "@/components/board/OddsChart";
import { DetectSignal } from "@/components/board/DetectSignal";
import { CompanyLogo } from "@/components/board/CompanyLogo";
import { useActiveSeller } from "@/components/board/SellerContext";
import {
  ACTION_DISPLAY,
  TIER_DISPLAY,
  actionLine,
  betRange,
  modelDisplay,
} from "@/lib/peitho/display";
import type { Deal } from "@/lib/peitho/types";

const settle = (price: number): number[] => {
  const n = 6;
  return Array.from({ length: n }, (_, k) => Math.round(50 + (price - 50) * (k / (n - 1))));
};

function RelatedMarkets({ currentId }: { currentId: string }) {
  const router = useRouter();
  const { sellerId } = useActiveSeller();
  const deals = useQuery(api.deals.listDeals, { sellerId });
  if (!deals) return null;
  const related = deals.filter((d) => d.id !== currentId).slice(0, 7);
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 text-sm font-semibold text-foreground">Related markets</div>
      <div className="space-y-1">
        {related.map((d) => (
          <button
            key={d.id}
            onClick={() => router.push(`/market/${d.id}`)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-muted"
          >
            <CompanyLogo logo={d.logo} initials={d.initials} className="h-7 w-7 rounded-md text-[10px]" />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{d.name}</span>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: TIER_DISPLAY[d.tier].accent }}
            >
              {d.consensus}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MarketDetail({ deal }: { deal: Deal }) {
  const router = useRouter();
  const { sellerId, seller } = useActiveSeller();
  const priceDeal = useAction(api.engine.priceDeal);
  const [running, setRunning] = useState(false);

  const action = ACTION_DISPLAY[deal.action];
  const tier = TIER_DISPLAY[deal.tier];
  const yes = deal.consensus;
  const no = 100 - yes;
  const [lo, hi] = betRange(deal.bets);
  const live = deal.status === "pending" || deal.status === "resolving";

  async function run() {
    setRunning(true);
    try {
      await priceDeal({ dealId: deal.id, force: true, sellerId });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <button
        onClick={() => router.push("/")}
        className="mb-3 text-xs text-muted-foreground transition hover:text-foreground"
      >
        ← Back to the board
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MAIN */}
        <div className="space-y-5 lg:col-span-2">
          <div className="flex items-start gap-4">
            <CompanyLogo logo={deal.logo} initials={deal.initials} className="h-14 w-14 rounded-2xl text-lg" />
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-2xl font-bold leading-tight text-foreground">
                Will {deal.name} convert?
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {tier.label} · priced for{" "}
                <span className="font-semibold text-foreground">{seller.name}</span> ·{" "}
                {deal.dossier.signals.length} signals
              </p>
            </div>
          </div>

          {/* big Yes/No */}
          <div>
            <div className="flex h-12 overflow-hidden rounded-xl text-base font-bold">
              <div
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground transition-all duration-500"
                style={{ width: `${yes}%` }}
              >
                <span>Yes</span>
                <span className="tabular-nums">{yes}%</span>
              </div>
              <div className="flex flex-1 items-center justify-center gap-2 bg-destructive text-white">
                <span>No</span>
                <span className="tabular-nums">{no}%</span>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              consensus {yes}% · spread ±{deal.spread} ({lo}–{hi}) · {tier.blurb}
            </p>
          </div>

          {/* chart */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              How the panel landed
            </div>
            {deal.bets.length > 0 && (
              <OddsChart
                series={deal.bets.map((b) => ({ model: b.model, points: settle(b.price) }))}
                consensus={deal.consensus}
              />
            )}
          </div>

          {/* market context = evidence */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 text-sm font-semibold text-foreground">
              Market context — the evidence
            </div>
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              {deal.dossier.summary}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {deal.dossier.signals.map((s, i) => (
                <span
                  key={i}
                  className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] text-foreground"
                >
                  <span className="mr-1 text-muted-foreground">{s.source}:</span>
                  {s.claim}
                </span>
              ))}
            </div>
          </div>

          {/* model votes */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 text-sm font-semibold text-foreground">
              AI model votes — how each concluded
            </div>
            <div className="space-y-3">
              {deal.bets.map((b) => {
                const { color, label } = modelDisplay(b.model);
                return (
                  <div key={b.model} className="rounded-lg bg-muted px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color }}>
                        {label}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-foreground">{b.price}%</span>
                    </div>
                    {b.rationale && (
                      <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{b.rationale}</p>
                    )}
                    {b.signalsUsed.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {b.signalsUsed.slice(0, 3).map((s, i) => (
                          <span
                            key={i}
                            className="rounded bg-background/60 px-1.5 py-0.5 text-[9px] text-muted-foreground ring-1 ring-border"
                          >
                            {s.length > 48 ? s.slice(0, 48) + "…" : s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIDEBAR — the action panel + related */}
        <aside className="space-y-4">
          <div className="sticky top-[120px] space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div
                className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2.5 ring-1 ${action.tone} ${action.ring}`}
              >
                <span className={`text-sm font-bold uppercase tracking-wide ${action.text}`}>
                  {action.label}
                </span>
                <span className="text-2xl font-bold tabular-nums" style={{ color: tier.accent }}>
                  {yes}%
                </span>
              </div>
              <p className="mb-3 text-sm text-foreground">{actionLine(deal)}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={run}
                  disabled={running || live}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {running || live ? (
                    <>
                      <span className="h-2 w-2 animate-ping rounded-full bg-primary-foreground" />
                      Panel investigating…
                    </>
                  ) : (
                    "Re-run the panel"
                  )}
                </button>
                <DetectSignal dealId={deal.id} />
              </div>
            </div>
            <RelatedMarkets currentId={deal.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function MarketWrapper() {
  const params = useParams();
  const router = useRouter();
  const { sellerId } = useActiveSeller();
  const dealId = String(params.id);
  const deal = useQuery(api.deals.getDeal, { dealId, sellerId });

  if (deal === undefined) {
    return (
      <div className="flex items-center justify-center py-40 text-muted-foreground">
        <span className="h-2 w-2 animate-ping rounded-full bg-muted-foreground" />
        <span className="ml-3">loading market…</span>
      </div>
    );
  }
  if (deal === null) {
    return (
      <div className="py-40 text-center text-muted-foreground">
        No market for “{dealId}”.{" "}
        <button onClick={() => router.push("/")} className="text-primary underline">
          Back to the board
        </button>
      </div>
    );
  }
  return <MarketDetail deal={deal} />;
}

export default function MarketPage() {
  return (
    <AppShell>
      <MarketWrapper />
    </AppShell>
  );
}
