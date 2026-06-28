"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "convex/react";
import { LayoutGrid, Rows3, Search, Zap } from "lucide-react";
import { Logomark } from "./Logomark";
import { Wordmark } from "./Wordmark";
import { SellerSwitcher } from "./SellerSwitcher";
import { MarketSearch } from "./MarketSearch";
import { api } from "@/convex/_generated/api";
import { ALL_MODELS, PRODUCT } from "@/lib/peitho/config";
import type { Deal, DealAction } from "@/lib/peitho/types";
import { MarketCard } from "./MarketCard";
import { MarketCardSkeleton } from "./MarketCardSkeleton";
import { MarketTable } from "./MarketTable";
import { EASE_OUT } from "@/lib/ease";
import { FeaturedMarket } from "./FeaturedMarket";
import { OddsHero } from "./OddsHero";
import { useActiveSeller } from "./SellerContext";
import { ModelGlyph } from "@/lib/peitho/modelIcons";

const CATEGORIES: { key: "all" | DealAction; label: string }[] = [
  { key: "all", label: "All" },
  { key: "prioritize", label: "Prioritize" },
  { key: "personalize", label: "Personalize" },
  { key: "skip", label: "Skip" },
];

type SortKey = "volume" | "trending" | "newest";
const SORTS: SortKey[] = ["volume", "trending", "newest"];

export function Board({ onColdOpen }: { onColdOpen?: () => void }) {
  const { sellerId } = useActiveSeller();
  const deals = useQuery(api.deals.listDeals, { sellerId });
  const [category, setCategory] = useState<"all" | DealAction>("all");
  const [sort, setSort] = useState<SortKey>("volume");
  const [view, setView] = useState<"grid" | "table">("grid");
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const all = deals ?? [];
  const filtered = all.filter((d) => category === "all" || d.action === category);
  const shown = [...filtered].sort((a, b) => {
    if (sort === "trending") return b.spread - a.spread;
    if (sort === "newest") return 0;
    return b.consensus - a.consensus; // volume → strongest signal first
  });

  const selected = selectedId ? all.find((d) => d.id === selectedId) ?? null : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Topbar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-[1440px] items-center gap-6 px-6">
          <div className="flex shrink-0 items-center gap-2.5">
            <Link
              href="/"
              aria-label="Oddyssey home"
              className="flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80"
            >
              <Logomark className="h-9 w-auto text-foreground" />
              <Wordmark className="text-xl" />
            </Link>
            <span className="text-xl font-light text-muted-foreground">/</span>
            <SellerSwitcher />
          </div>

          <div className="mx-4 hidden flex-1 justify-center lg:flex">
            <MarketSearch />
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
              <div className="flex items-center gap-2">
                {ALL_MODELS.map((m) => (
                  <ModelGlyph key={m} model={m} size={20} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────── */}
      <main className="mx-auto max-w-[1440px] px-6 py-6">

        {/* Animated hero: companies orbit with their odds */}
        <div className="mb-6">
          <OddsHero deals={all} />
        </div>

        {/* Featured (click-to-expand) — springy bouncy-accordion open/close */}
        <AnimatePresence initial={false}>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.55, bounce: 0.3 }}
              className="overflow-hidden"
            >
              <FeaturedMarket deal={selected} onClose={() => setSelectedId(null)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Zap size={15} className="text-primary" />
              All markets
              <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
            </h2>
            {/* View toggle: card grid ↔ dense table */}
            <div className="flex gap-1 rounded-full border border-border bg-card p-0.5">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                title="Grid view"
                className={`flex items-center justify-center rounded-full p-1.5 transition-colors ${
                  view === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setView("table")}
                aria-label="Table view"
                title="Table view"
                className={`flex items-center justify-center rounded-full p-1.5 transition-colors ${
                  view === "table"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Rows3 size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
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
        </div>

        {/* Market grid — uniform, like the reference.
            Skeleton placeholders reserve the layout, then cross-fade to the
            real markets once the board query resolves (aria-busy for SRs). */}
        <div aria-busy={deals === undefined} aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {deals === undefined ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <MarketCardSkeleton key={i} />
                ))}
              </motion.div>
            ) : view === "table" ? (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
              >
                <MarketTable
                  deals={shown}
                  selectedId={selectedId}
                  onSelect={(id) => router.push(`/market/${id}`)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {shown.slice(0, 6).map((d: Deal) => (
                  <MarketCard
                    key={d.id}
                    deal={d}
                    onClick={() => router.push(`/market/${d.id}`)}
                  />
                ))}
                <OddsHero deals={all} variant="card" />
                {shown.slice(6).map((d: Deal) => (
                  <MarketCard
                    key={d.id}
                    deal={d}
                    onClick={() => router.push(`/market/${d.id}`)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
            <Wordmark className="text-sm" />
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
