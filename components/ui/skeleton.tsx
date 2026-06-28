import { cn } from "@/lib/utils";

/**
 * Canonical shadcn/ui Skeleton — a pulsing placeholder that reserves layout so
 * content doesn't jump when data arrives. Pass `shimmer` for a sweeping
 * gradient instead of the default opacity pulse (nicer on larger surfaces).
 */
function Skeleton({
  className,
  shimmer = false,
  ...props
}: React.ComponentProps<"div"> & { shimmer?: boolean }) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "rounded-md bg-muted",
        shimmer ? "skeleton-shimmer" : "animate-pulse",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
