"use client";

import { useState } from "react";
import type { Deal } from "@/lib/peitho/types";
import { TIER_DISPLAY } from "@/lib/peitho/display";

// A single orbiting logo. Falls back to the company initials if the image is
// missing OR fails to load — so a dead logo URL never shows a broken-image icon.
function OrbitLogo({ deal, size }: { deal: Deal; size: number }) {
  const [failed, setFailed] = useState(false);
  if (deal.logo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={deal.logo}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="rounded-2xl object-contain drop-shadow-lg"
        style={{ height: size, width: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-2xl bg-muted text-base font-bold text-foreground"
      style={{ height: size, width: size }}
    >
      {deal.initials}
    </div>
  );
}

// A tiny speedometer arc, same as the top ticker.
function MiniSpeedo({ value, accent }: { value: number; accent: string }) {
  const w = 26;
  const h = 15;
  const r = 11;
  const cx = w / 2;
  const cy = h - 1.5;
  const pt = (v: number) => {
    const a = Math.PI * (1 - Math.max(0, Math.min(100, v)) / 100);
    return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
  };
  const arc = (from: number, to: number) => {
    const a = pt(from);
    const b = pt(to);
    return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${r} ${r} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[15px] w-[26px] shrink-0">
      <path d={arc(0, 100)} fill="none" stroke="currentColor" className="text-muted-foreground/30" strokeWidth={2.5} strokeLinecap="round" />
      <path d={arc(0, value)} fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

// Companies orbit a circle whose center sits below the card, so only the top arc
// shows. Each company is pinned to the TOP-CENTER of an equal-size layer that's
// rotated by its angle; a single CSS keyframe spins the whole stack. Because
// every layer shares the same center and the placement is a pure rigid rotation,
// the orbit can't drift (the old translate-in-rotated-frame approach did).
const CFG = {
  banner: { height: 208, radius: 620, centerY: 650, logo: 56, items: 24, dur: 90, titlePos: "bottom-5 left-6", titleSize: "text-4xl sm:text-5xl" },
  card: { height: 300, radius: 270, centerY: 320, logo: 42, items: 18, dur: 80, titlePos: "bottom-4 left-4", titleSize: "text-2xl" },
} as const;

export function OddsHero({
  deals,
  variant = "banner",
}: {
  deals: Deal[];
  variant?: "banner" | "card";
}) {
  // Drop dead markets from the orbit — a company sitting at 0% odds reads as a
  // broken/empty slot, so it shouldn't spin in the hero.
  const live = deals.filter((d) => d.consensus > 0);
  if (live.length === 0) return null;
  const c = CFG[variant];
  const ring = Array.from({ length: c.items }, (_, i) => live[i % live.length]);
  const anim = `orbit_${variant}`;
  const size = c.radius * 2;

  return (
    <div
      className="relative h-full overflow-hidden rounded-2xl border border-border bg-card"
      style={{ minHeight: variant === "banner" ? c.height : undefined }}
    >
      <style>{`@keyframes ${anim}{to{transform:rotate(360deg)}} .${anim}{animation:${anim} ${c.dur}s linear infinite}`}</style>

      {/* spin stage: a square centered on the orbit center, below the card */}
      <div
        className={anim}
        style={{
          position: "absolute",
          left: "50%",
          top: c.centerY,
          width: size,
          height: size,
          marginLeft: -c.radius,
          marginTop: -c.radius,
          transformOrigin: "center",
        }}
      >
        {ring.map((d, i) => {
          const angle = (i / c.items) * 360;
          const accent = TIER_DISPLAY[d.tier].accent;
          return (
            // a full-size layer rotated by the company's angle; logo pinned to top-center
            <div key={i} className="absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
              <div className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center">
                <OrbitLogo deal={d} size={c.logo} />
                <div className="mt-3 flex items-center gap-1">
                  <MiniSpeedo value={d.consensus} accent={accent} />
                  <span className="text-xs font-bold tabular-nums" style={{ color: accent }}>
                    {d.consensus}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* title — drop-shadow keeps it legible over the orbiting logos */}
      <div className={`absolute z-10 ${c.titlePos}`}>
        <h2
          className={`font-heading font-extrabold leading-[1.05] tracking-tight text-foreground ${c.titleSize}`}
          style={{ filter: "drop-shadow(0 2px 10px rgba(0,0,0,1)) drop-shadow(0 4px 24px rgba(0,0,0,0.95))" }}
        >
          Pipeline
          <br />
          Odds &amp; Predictions
        </h2>
      </div>
    </div>
  );
}
