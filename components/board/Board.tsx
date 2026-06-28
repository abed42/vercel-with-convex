"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Search, Zap } from "lucide-react";
import { Logomark } from "./Logomark";
import { api } from "@/convex/_generated/api";
import { ALL_MODELS, MODEL_LENSES, PRODUCT } from "@/lib/peitho/config";
import { modelDisplay } from "@/lib/peitho/display";
import type { Deal, DealAction } from "@/lib/peitho/types";
import { MarketCard } from "./MarketCard";
import { FeaturedMarket } from "./FeaturedMarket";
import { ModelAvatar, ModelGlyph } from "@/lib/peitho/modelIcons";

const CATEGORIES: { key: "all" | DealAction; label: string }[] = [
  { key: "all", label: "All" },
  { key: "prioritize", label: "Prioritize" },
  { key: "personalize", label: "Personalize" },
  { key: "skip", label: "Skip" },
];

type SortKey = "volume" | "trending" | "newest";
const SORTS: SortKey[] = ["volume", "trending", "newest"];

export function Board({ onColdOpen }: { onColdOpen?: () => void }) {
  const deals = useQuery(api.deals.listDeals);
  const [category, setCategory] = useState<"all" | DealAction>("all");
  const [sort, setSort] = useState<SortKey>("volume");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const all = deals ?? [];
  const filtered = all.filter((d) => category === "all" || d.action === category);
  const shown = [...filtered].sort((a, b) => {
    if (sort === "trending") return b.spread - a.spread;
    if (sort === "newest") return 0;
    return b.consensus - a.consensus; // volume → strongest signal first
  });

  const selected = selectedId ? all.find((d) => d.id === selectedId) ?? null : null;

  // Per-model average confidence across the board, for the status strip.
  const modelAvg = (model: string) => {
    const bets = all.flatMap((d) => d.bets).filter((b) => b.model === model);
    if (!bets.length) return null;
    return Math.round((bets.reduce((s, b) => s + b.confidence, 0) / bets.length) * 100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Topbar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-[1440px] items-center gap-6 px-6">
          <div className="flex shrink-0 items-center gap-2.5">
            <Logomark className="h-9 w-auto text-foreground" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              {PRODUCT.name}
            </span>
          </div>

          <nav className="ml-auto flex items-center gap-1">
            {["Markets", "Portfolio", "Leaderboard", "Docs"].map((item) => (
              <button
                key={item}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                {item}
              </button>
            ))}
            {onColdOpen && (
              <button
                onClick={onColdOpen}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                Cold open
              </button>
            )}
            <button className="ml-2 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
              Connect
            </button>
          </nav>
        </div>

        {/* Category nav */}
        <div className="border-t border-border">
          <div className="mx-auto flex h-[46px] max-w-[1440px] items-center gap-1 overflow-x-auto px-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`h-[34px] shrink-0 rounded-full px-3 text-sm font-semibold transition-colors ${
                  category === cat.key
                    ? "bg-card text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                4 AI models trading
              </span>
              <div className="flex -space-x-1.5">
                {ALL_MODELS.map((m) => (
                  <div key={m} className="rounded-full ring-2 ring-background">
                    <ModelAvatar model={m} size={20} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────── */}
      <main className="mx-auto max-w-[1440px] px-6 py-6">

        {/* AI model status strip */}
        <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
          {ALL_MODELS.map((m) => {
            const { color, label } = modelDisplay(m);
            const conf = modelAvg(m);
            return (
              <div
                key={m}
                className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5"
              >
                <ModelGlyph model={m} size={20} />
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <span className="hidden text-[11px] text-muted-foreground sm:inline">
                  {conf !== null ? `avg ${conf}% conf` : MODEL_LENSES[m as keyof typeof MODEL_LENSES]?.lens}
                </span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  Live
                </span>
                <span
                  className="h-2 w-2 animate-pulse rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            );
          })}
        </div>

        {/* Featured (click-to-expand) */}
        {selected && (
          <FeaturedMarket deal={selected} onClose={() => setSelectedId(null)} />
        )}

        {/* Grid header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Zap size={15} className="text-primary" />
            All markets
            <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Sort</span>
            <div className="flex gap-1 rounded-full border border-border bg-card p-0.5">
              {SORTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`rounded-full px-3 py-1 font-semibold capitalize transition-colors ${
                    sort === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Market grid — uniform, like the reference */}
        {deals === undefined ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <span className="h-2 w-2 animate-ping rounded-full bg-muted-foreground" />
            <span className="ml-3">connecting to the board…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((d: Deal) => (
              <MarketCard
                key={d.id}
                deal={d}
                onClick={() => setSelectedId((id) => (id === d.id ? null : d.id))}
              />
            ))}
          </div>
        )}

        {deals !== undefined && shown.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <Search size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No markets found</p>
            <p className="mt-1 text-sm">Try a different category</p>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="mt-12 border-t border-border px-6 py-8 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2.5">
            <Logomark className="h-7 w-auto text-foreground" />
            <span className="font-semibold text-foreground">{PRODUCT.name}</span>
            <span>— {PRODUCT.tagline}</span>
          </div>
          <div className="flex gap-5">
            {["About", "Docs", "API", "Terms", "Privacy"].map((l) => (
              <a key={l} href="#" className="transition-colors hover:text-foreground">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
