"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TopNav } from "@/components/board/TopNav";
import { FeaturedMarket } from "@/components/board/FeaturedMarket";
import { useActiveSeller } from "@/components/board/SellerContext";

function Market() {
  const params = useParams();
  const router = useRouter();
  const { sellerId, seller } = useActiveSeller();
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-xs text-muted-foreground transition hover:text-foreground"
        >
          ← Back to the board
        </button>
        <span className="text-xs text-muted-foreground">
          priced for <span className="font-semibold text-foreground">{seller.name}</span>
        </span>
      </div>
      <FeaturedMarket deal={deal} onClose={() => router.push("/")} />
    </div>
  );
}

export default function MarketPage() {
  return (
    <>
      <TopNav />
      <Market />
    </>
  );
}
