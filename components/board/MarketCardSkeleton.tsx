import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder that mirrors <MarketCard>'s exact shape — same outer
 * radius, padding, and section layout — so the grid reserves its final
 * dimensions and nothing jumps when real markets arrive.
 */
export function MarketCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      {/* header: logo + market question + agreement badge */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-4 w-10 shrink-0 rounded" />
        </div>
        <div className="mt-2 flex items-center gap-2 pl-12">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="ml-auto h-3 w-14 rounded" />
        </div>
      </div>

      {/* Yes/No odds bar */}
      <div className="px-4 pb-3">
        <Skeleton shimmer className="h-6 w-full rounded-lg" />
        <div className="mt-1 flex justify-between">
          <Skeleton className="h-3 w-14 rounded" />
          <Skeleton className="h-3 w-14 rounded" />
        </div>
      </div>

      {/* AI consensus strip */}
      <div className="border-t border-border px-4 pb-3 pt-3">
        <Skeleton className="mb-2 h-2.5 w-20 rounded" />
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 flex-1 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
