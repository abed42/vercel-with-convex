"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useActiveSeller } from "./SellerContext";

// Search any company → Orange Slice (or model) enriches it → the panel prices it
// live from the active seller's view → route to its market page. The "wow."
export function MarketSearch() {
  const router = useRouter();
  const build = useAction(api.engine.buildMarket);
  const { sellerId, seller } = useActiveSeller();
  const [q, setQ] = useState("");
  const [building, setBuilding] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  async function go() {
    const query = q.trim();
    if (!query || building) return;
    setErr(false);
    setBuilding(query);
    try {
      const res = await build({ query, sellerId });
      if (res?.dealId) {
        setQ("");
        router.push(`/market/${res.dealId}`);
      } else {
        setErr(true);
      }
    } catch {
      setErr(true);
    } finally {
      setBuilding(null);
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setErr(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") void go();
        }}
        disabled={!!building}
        placeholder={
          building
            ? `Building market for ${building}…`
            : err
              ? "Couldn't build that — try a company name"
              : `Search any company → price it as ${seller.name}`
        }
        className={`w-full rounded-full border bg-card py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-70 ${
          err ? "border-destructive/50" : "border-border focus:border-muted-foreground/40"
        }`}
      />
      {building && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 animate-ping rounded-full bg-primary" />
      )}
    </div>
  );
}
