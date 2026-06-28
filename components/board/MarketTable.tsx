"use client";

import type { Deal, ModelBet } from "@/lib/peitho/types";
import { ALL_MODELS } from "@/lib/peitho/config";
import { ACTION_DISPLAY, TIER_DISPLAY } from "@/lib/peitho/display";
import { ModelGlyph } from "@/lib/peitho/modelIcons";
import { CompanyLogo } from "./CompanyLogo";

// A short settle trajectory from a 50 baseline out to the final consensus.
function settle(price: number): number[] {
  const n = 6;
  return Array.from({ length: n }, (_, k) =>
    Math.round(50 + (price - 50) * (k / (n - 1))),
  );
}

// One clean consensus sparkline, accent-coloured by tier — the panel detail
// lives in the Panel column, so the Trend just reads the direction at a glance.
function ConsensusSpark({ value, accent }: { value: number; accent: string }) {
  const W = 120;
  const H = 28;
  const PAD = 4;
  const vals = settle(value);
  const x = (i: number) => PAD + (i / (vals.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => PAD + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - 2 * PAD);
  const path = vals.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-7 w-[120px] overflow-visible">
      <line
        x1={PAD}
        x2={W - PAD}
        y1={y(50)}
        y2={y(50)}
        stroke="currentColor"
        className="text-muted-foreground/15"
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <path
        d={path}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={x(vals.length - 1)} cy={y(value)} r={2.5} fill={accent} />
    </svg>
  );
}

function PanelAvatars({ bets }: { bets: ModelBet[] }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-2">
        {ALL_MODELS.map((m) => {
          const priced = bets.some((b) => b.model === m);
          return (
            <div key={m} className={priced ? "" : "opacity-30 grayscale"}>
              <ModelGlyph model={m} size={18} />
            </div>
          );
        })}
      </div>
      <span className="text-[11px] tabular-nums text-muted-foreground">{bets.length}/4</span>
    </div>
  );
}

export function MarketTable({
  deals,
  selectedId,
  onSelect,
}: {
  deals: Deal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col />
            <col className="w-[120px]" />
            <col className="w-[150px]" />
            <col className="w-[160px]" />
            <col className="w-[180px]" />
            <col className="w-[150px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-3.5 text-left font-semibold">Market</th>
              <th className="px-4 py-3.5 text-right font-semibold">Yes</th>
              <th className="px-4 py-3.5 text-right font-semibold">Spread</th>
              <th className="px-4 py-3.5 text-left font-semibold">Panel</th>
              <th className="px-4 py-3.5 text-left font-semibold">Trend</th>
              <th className="px-6 py-3.5 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deals.map((d) => {
              const action = ACTION_DISPLAY[d.action];
              const tight = d.spread <= 20;
              const isActive = d.id === selectedId;
              return (
                <tr
                  key={d.id}
                  onClick={() => onSelect(d.id)}
                  className={`cursor-pointer transition-colors hover:bg-secondary/30 ${
                    isActive ? "bg-secondary/40" : ""
                  }`}
                >
                  {/* Market */}
                  <td className="px-6 py-4 align-middle">
                    <div className="flex items-center gap-3">
                      <CompanyLogo
                        logo={d.logo}
                        initials={d.initials}
                        className="h-9 w-9 shrink-0 rounded-lg text-[10px]"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{d.name}</p>
                        {d.domain && (
                          <p className="truncate text-[11px] text-muted-foreground">{d.domain}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Yes / consensus */}
                  <td className="px-4 py-4 text-right align-middle">
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {d.consensus}
                      <span className="text-xs font-medium text-muted-foreground">%</span>
                    </span>
                  </td>

                  {/* Spread — the confidence signal */}
                  <td className="px-4 py-4 text-right align-middle">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        tight ? "text-primary" : "text-amber-400"
                      }`}
                    >
                      ±{d.spread}
                    </span>
                    <span className="ml-1.5 text-[10px] text-muted-foreground">
                      {tight ? "tight" : "wide"}
                    </span>
                  </td>

                  {/* Panel — the model logos */}
                  <td className="px-4 py-4 align-middle">
                    <PanelAvatars bets={d.bets} />
                  </td>

                  {/* Trend — clean consensus sparkline */}
                  <td className="px-4 py-4 align-middle">
                    <ConsensusSpark value={d.consensus} accent={TIER_DISPLAY[d.tier].accent} />
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-right align-middle">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${action.tone} ${action.ring} ${action.text}`}
                    >
                      {action.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
