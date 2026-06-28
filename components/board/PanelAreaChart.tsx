"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ALL_MODELS } from "@/lib/peitho/config";
import { modelDisplay } from "@/lib/peitho/display";
import { ModelGlyph } from "@/lib/peitho/modelIcons";
import type { ModelBet } from "@/lib/peitho/types";

// A short settle trajectory from a 50 baseline out to the final price — reads as
// the panel forming its read as the bets land.
function settle(price: number): number[] {
  const n = 6;
  return Array.from({ length: n }, (_, k) =>
    Math.round(50 + (price - 50) * (k / (n - 1))),
  );
}

// shadcn gradient area chart: one filled area per model, brand-colored. The gap
// between the lines at the right edge IS the spread.
export function PanelAreaChart({ bets }: { bets: ModelBet[] }) {
  const present = ALL_MODELS.filter((m) => bets.some((b) => b.model === m));
  const byModel = new Map(bets.map((b) => [b.model, b]));

  const steps = 6;
  const data = Array.from({ length: steps }, (_, i) => {
    const row: Record<string, number> = { step: i };
    present.forEach((m) => {
      row[m] = settle(byModel.get(m)!.price)[i];
    });
    return row;
  });

  const config: ChartConfig = Object.fromEntries(
    present.map((m) => {
      const { label, color } = modelDisplay(m);
      // span wrapper keeps the glyph at full size (tooltip CSS shrinks bare <svg>)
      return [
        m,
        { label, color, icon: () => <span className="flex"><ModelGlyph model={m} size={14} /></span> },
      ];
    }),
  );

  return (
    <>
      <ChartContainer config={config} className="aspect-[16/7] w-full">
        <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="step" hide />
          <YAxis domain={[0, 100]} hide />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel indicator="line" />}
          />
          <defs>
            {present.map((m) => (
              <linearGradient key={m} id={`fill-${m}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${m})`} stopOpacity={0.35} />
                <stop offset="95%" stopColor={`var(--color-${m})`} stopOpacity={0.04} />
              </linearGradient>
            ))}
          </defs>
          {present.map((m) => (
            <Area
              key={m}
              dataKey={m}
              type="natural"
              fill={`url(#fill-${m})`}
              fillOpacity={1}
              stroke={`var(--color-${m})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ChartContainer>

      {/* legend with each model's final price */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {present.map((m) => {
          const { label } = modelDisplay(m);
          return (
            <span key={m} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ModelGlyph model={m} size={14} />
              {label}
              <span className="font-semibold tabular-nums text-foreground">
                {byModel.get(m)!.price}
              </span>
            </span>
          );
        })}
      </div>
    </>
  );
}
