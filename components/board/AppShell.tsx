"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Ticker } from "./Ticker";
import { Logomark } from "./Logomark";
import { Wordmark } from "./Wordmark";
import { SellerSwitcher } from "./SellerSwitcher";
import { MarketSearch } from "./MarketSearch";

const CATEGORIES = ["All", "AI", "Fintech", "Dev Tools", "SaaS", "Infra"];

// The shared app shell: ticker + nav (logo / seller switcher, search, links) +
// category strip. Used by every page so the chrome is consistent.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <Ticker />
        <div className="mx-auto flex h-[60px] max-w-[1440px] items-center gap-6 px-6">
          <div className="flex shrink-0 items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2.5">
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
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            >
              Markets
            </Link>
            <Link
              href="/ai-hackathon"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            >
              Cold open
            </Link>
            <button className="ml-2 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
              Connect
            </button>
          </nav>
        </div>

        <div className="border-t border-border">
          <div className="mx-auto flex h-[46px] max-w-[1440px] items-center gap-1 overflow-x-auto px-6">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href="/"
                className="h-[34px] shrink-0 rounded-full px-3 text-sm font-semibold leading-[34px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
