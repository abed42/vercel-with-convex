"use client";

import type { ModelBet } from "@/lib/peitho/types";
import { ALL_MODELS, MODEL_LENSES } from "@/lib/peitho/config";
import { modelDisplay } from "@/lib/peitho/display";
import { ModelAvatar } from "@/lib/peitho/modelIcons";

export function ModelBets({
  bets,
  compact,
}: {
  bets: ModelBet[];
  compact?: boolean;
}) {
  const byModel = new Map(bets.map((b) => [b.model, b]));

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ALL_MODELS.map((id) => {
        const bet = byModel.get(id);
        const { label, color } = modelDisplay(id);
        const lens = MODEL_LENSES[id].lens;
        return (
          <div
            key={id}
            className={`rounded-lg border border-border bg-muted p-3 ${
              bet ? "animate-[betIn_400ms_ease-out]" : "opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color }}
              >
                <ModelAvatar model={id} size={16} />
                {label}
              </span>
              {bet ? (
                <span className="text-lg font-bold tabular-nums text-foreground">
                  {bet.price}
                </span>
              ) : (
                <span className="h-5 w-6 animate-pulse rounded bg-muted-foreground/30" />
              )}
            </div>

            {!compact &&
              (bet ? (
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  {bet.rationale}
                </p>
              ) : (
                <p className="mt-1 text-[11px] italic leading-snug text-muted-foreground">
                  weighing {lens}…
                </p>
              ))}

            {/* confidence bar */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted-foreground/20">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: bet ? `${Math.round(bet.confidence * 100)}%` : "0%",
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
