"use client";

import { ALL_MODELS } from "@/lib/peitho/config";
import { modelDisplay } from "@/lib/peitho/display";

// The signature visual. Polymarket plots ONE crowd-price line; Peitho plots
// FOUR model lines — the vertical gap between them at any point IS the spread.
// Story mode feeds real per-beat trajectories; the hero feeds a settle reveal.

export type OddsSeries = { model: string; points: number[] };

const W = 320;
const H = 84;
const PAD = 6;

function path(points: number[]): string {
  if (points.length === 0) return "";
  const n = points.length;
  return points
    .map((p, i) => {
      const x = n === 1 ? W / 2 : PAD + (i / (n - 1)) * (W - 2 * PAD);
      const y = PAD + (1 - Math.max(0, Math.min(100, p)) / 100) * (H - 2 * PAD);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function lastPoint(points: number[]): { x: number; y: number; v: number } {
  const n = points.length;
  const v = points[n - 1] ?? 0;
  const x = n <= 1 ? W / 2 : W - PAD;
  const y = PAD + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - 2 * PAD);
  return { x, y, v };
}

export function OddsChart({
  series,
  consensus,
}: {
  series: OddsSeries[];
  consensus?: number;
}) {
  // Order by ALL_MODELS so colors/legend are stable.
  const ordered = ALL_MODELS.map((m) => series.find((s) => s.model === m)).filter(
    (s): s is OddsSeries => Boolean(s && s.points.length > 0),
  );

  const consY =
    consensus !== undefined
      ? PAD + (1 - consensus / 100) * (H - 2 * PAD)
      : null;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible">
        {/* gridlines at 0 / 50 / 100 */}
        {[0, 50, 100].map((g) => {
          const y = PAD + (1 - g / 100) * (H - 2 * PAD);
          return (
            <line
              key={g}
              x1={PAD}
              x2={W - PAD}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-muted-foreground/15"
              strokeWidth={1}
              strokeDasharray={g === 50 ? "2 3" : undefined}
            />
          );
        })}

        {/* consensus reference line */}
        {consY !== null && (
          <line
            x1={PAD}
            x2={W - PAD}
            y1={consY}
            y2={consY}
            stroke="currentColor"
            className="text-foreground/40"
            strokeWidth={1}
            strokeDasharray="4 3"
            style={{ transition: "all 700ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        )}

        {/* model lines */}
        {ordered.map((s) => {
          const c = modelDisplay(s.model).color;
          const lp = lastPoint(s.points);
          return (
            <g key={s.model}>
              <path
                d={path(s.points)}
                fill="none"
                stroke={c}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ transition: "all 700ms cubic-bezier(0.22,1,0.36,1)" }}
              />
              <circle cx={lp.x} cy={lp.y} r={3} fill={c} stroke="var(--card)" strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {ordered.map((s) => {
          const { label, color } = modelDisplay(s.model);
          const v = s.points[s.points.length - 1];
          return (
            <span key={s.model} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
              <span className="font-semibold tabular-nums text-foreground">{v}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
