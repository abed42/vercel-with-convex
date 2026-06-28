"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelBet } from "@/lib/peitho/types";
import {
  GAUGE,
  betRange,
  gaugeArc,
  gaugePoint,
  modelDisplay,
} from "@/lib/peitho/display";

function useCountUp(target: number, ms = 700) {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setVal(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

export function ConsensusGauge({
  consensus,
  spread,
  bets,
  accent,
  pending,
}: {
  consensus: number;
  spread: number;
  bets: ModelBet[];
  accent: string;
  pending?: boolean;
}) {
  const shown = useCountUp(consensus);
  const [lo, hi] = betRange(bets);
  const hasBand = bets.length >= 2;

  return (
    <div className="relative flex flex-col items-center">
      <svg
        viewBox={`0 0 ${GAUGE.w} ${GAUGE.h}`}
        className="w-[280px] max-w-full overflow-visible"
      >
        {/* track */}
        <path
          d={gaugeArc(0, 100)}
          fill="none"
          stroke="currentColor"
          className="text-muted-foreground/30"
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* disagreement band: min..max of the panel — wider = less certain */}
        {hasBand && (
          <path
            d={gaugeArc(lo, hi)}
            fill="none"
            stroke={accent}
            strokeWidth={14}
            strokeLinecap="round"
            style={{ transition: "all 700ms cubic-bezier(0.22,1,0.36,1)" }}
            opacity={0.35}
          />
        )}
        {/* consensus tick */}
        {bets.length > 0 &&
          (() => {
            const p = gaugePoint(consensus);
            const inner = gaugePoint(consensus, GAUGE.r - 12);
            const outer = gaugePoint(consensus, GAUGE.r + 12);
            return (
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={accent}
                strokeWidth={4}
                strokeLinecap="round"
                style={{ transition: "all 700ms cubic-bezier(0.22,1,0.36,1)" }}
                key={`tick-${p.x}`}
              />
            );
          })()}
        {/* per-model dots */}
        {bets.map((b) => {
          const p = gaugePoint(b.price);
          const c = modelDisplay(b.model).color;
          return (
            <g key={b.model} style={{ transition: "all 700ms cubic-bezier(0.22,1,0.36,1)" }}>
              <circle cx={p.x} cy={p.y} r={6} fill={c} stroke="var(--background)" strokeWidth={2} />
            </g>
          );
        })}
      </svg>

      <div className="-mt-[88px] flex flex-col items-center">
        <div
          className="font-heading text-6xl font-bold tabular-nums tracking-tight text-foreground"
          style={{ color: bets.length ? accent : undefined }}
        >
          {pending && bets.length === 0 ? "··" : shown}
        </div>
        <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          consensus
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {bets.length >= 2 ? (
            <>
              spread{" "}
              <span className="font-semibold text-foreground">{spread}</span>{" "}
              <span className="text-muted-foreground">
                ({lo}–{hi}){spread <= 20 ? " · tight" : " · wide"}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">awaiting panel…</span>
          )}
        </div>
      </div>
    </div>
  );
}
