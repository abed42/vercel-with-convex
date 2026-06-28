"use client";

import { useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ALL_MODELS } from "@/lib/peitho/config";
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

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

// Softly-elevated panel — a top-down gradient + a faint inner highlight and a
// deep, diffuse shadow give the flat cards a little physical depth.
function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/40 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_12px_28px_-16px_rgba(0,0,0,0.7)] ${className}`}
    >
      {children}
    </div>
  );
}

// Section header with a small accent bar — gives the stacked cards a shared rhythm.
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-3.5 w-[3px] rounded-full bg-primary/70" />
      <span className="text-[13px] font-semibold tracking-tight text-foreground">{children}</span>
    </div>
  );
}

function SkeletonVote() {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <Sk className="h-4 w-16" />
        <Sk className="h-4 w-10" />
      </div>
      <Sk className="mt-2 h-3 w-full" />
      <Sk className="mt-1.5 h-3 w-2/3" />
    </div>
  );
}

function RelatedMarkets({ currentId }: { currentId: string }) {
  const router = useRouter();
  const { sellerId } = useActiveSeller();
  const deals = useQuery(api.deals.listDeals, { sellerId });
  if (!deals) return null;
  const related = deals.filter((d) => d.id !== currentId).slice(0, 7);
  return (
    <SectionCard>
      <SectionTitle>Related markets</SectionTitle>
      <div className="space-y-0.5">
        {related.map((d) => (
          <button
            key={d.id}
            onClick={() => router.push(`/market/${d.id}`)}
            className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-muted"
          >
            <CompanyLogo logo={d.logo} initials={d.initials} className="h-7 w-7 rounded-md text-[10px]" />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground transition-colors group-hover:text-foreground">{d.name}</span>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: TIER_DISPLAY[d.tier].accent }}
            >
              {d.consensus}%
            </span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

function MarketDetail({ deal }: { deal: Deal }) {
  const router = useRouter();
  const { sellerId, seller } = useActiveSeller();
  const priceDeal = useAction(api.engine.priceDeal);
  const clearBets = useMutation(api.deals.clearBets);
  const [running, setRunning] = useState(false);

  const action = ACTION_DISPLAY[deal.action];
  const tier = TIER_DISPLAY[deal.tier];
  const yes = deal.consensus;
  const no = 100 - yes;
  const [lo, hi] = betRange(deal.bets);
  const live = deal.status === "pending" || deal.status === "resolving";
  const pricing = running || live; // a re-run is in progress
  const ready = !pricing && deal.bets.length > 0; // show settled values
  const byModel = new Map(deal.bets.map((b) => [b.model, b]));

  async function run() {
    setRunning(true);
    try {
      await clearBets({ dealId: deal.id, sellerId }); // empty → votes fill fresh
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
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span
                  className="rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ring-border"
                  style={{ color: tier.accent }}
                >
                  {tier.label}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span>
                  priced for <span className="font-semibold text-foreground">{seller.name}</span>
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span>{deal.dossier.signals.length} signals</span>
              </div>
            </div>
          </div>

          {/* big Yes/No */}
          {ready ? (
            <div>
              <div className="flex h-12 overflow-hidden rounded-2xl text-base font-bold shadow-[0_8px_24px_-12px_rgba(0,0,0,0.7)] ring-1 ring-black/20">
                <div
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground transition-all duration-500"
                  style={{ width: `${yes}%` }}
                >
                  <span className="opacity-90">Yes</span>
                  <span className="tabular-nums">{yes}%</span>
                </div>
                <div className="flex flex-1 items-center justify-center gap-2 bg-gradient-to-r from-destructive to-destructive/90 text-white">
                  <span className="opacity-90">No</span>
                  <span className="tabular-nums">{no}%</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                consensus {yes}% · spread ±{deal.spread} ({lo}–{hi}) · {tier.blurb}
              </p>
            </div>
          ) : (
            <div>
              <Sk className="h-12 w-full rounded-xl" />
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
                panel re-pricing…
              </div>
            </div>
          )}

          {/* chart */}
          <SectionCard>
            <SectionTitle>How the panel landed</SectionTitle>
            {ready ? (
              <OddsChart
                series={deal.bets.map((b) => ({ model: b.model, points: settle(b.price) }))}
                consensus={deal.consensus}
              />
            ) : (
              <Sk className="h-[150px] w-full" />
            )}
          </SectionCard>

          {/* market context = evidence */}
          <SectionCard>
            <SectionTitle>Market context — the evidence</SectionTitle>
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              {deal.dossier.summary}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {deal.dossier.signals.map((s, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-border/70 bg-muted/60 px-2.5 py-1 text-[11px] text-foreground transition-colors hover:border-border hover:bg-muted"
                >
                  <span className="mr-1 font-medium uppercase tracking-wide text-muted-foreground/80 text-[10px]">{s.source}</span>
                  {s.claim}
                </span>
              ))}
            </div>
          </SectionCard>

          {/* model votes */}
          <SectionCard>
            <SectionTitle>AI model votes — how each concluded</SectionTitle>
            <div className="space-y-3">
              {ALL_MODELS.map((m) => {
                const b = byModel.get(m);
                if (!b) return pricing ? <SkeletonVote key={m} /> : null;
                const { color, label } = modelDisplay(b.model);
                return (
                  <div
                    key={b.model}
                    className="rounded-xl border-l-2 bg-gradient-to-r from-muted to-muted/40 px-3.5 py-2.5 animate-[betIn_400ms_ease-out]"
                    style={{ borderLeftColor: color }}
                  >
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
          </SectionCard>
        </div>

        {/* SIDEBAR — the action panel + related */}
        <aside className="space-y-4">
          <div className="sticky top-[120px] space-y-4">
            <SectionCard>
              {ready ? (
                <>
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
                </>
              ) : (
                <div className="mb-3">
                  <Sk className="h-11 w-full rounded-lg" />
                  <Sk className="mt-2 h-4 w-3/4" />
                </div>
              )}
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
            </SectionCard>
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
