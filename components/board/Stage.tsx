"use client";

import { useState } from "react";
import { PRODUCT } from "@/lib/peitho/config";
import { Story } from "./Story";
import { Board } from "./Board";

// The demo arc: open on the scripted Story, then hand off to the live Board,
// which carries the full GTPMarkets chrome (topbar/hero/status/grid/footer).
export function Stage() {
  const [mode, setMode] = useState<"story" | "board">("story");

  if (mode === "board") {
    return <Board onColdOpen={() => setMode("story")} />;
  }

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-sm font-bold tracking-tight text-foreground">
            {PRODUCT.name}
            <span className="ml-2 hidden text-xs font-normal text-muted-foreground sm:inline">
              {PRODUCT.tagline}
            </span>
          </span>
          <button
            onClick={() => setMode("board")}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Enter live board →
          </button>
        </div>
      </div>

      <Story onPivot={() => setMode("board")} />
    </div>
  );
}
