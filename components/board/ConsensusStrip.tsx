"use client";

import { motion } from "motion/react";
import { modelDisplay } from "@/lib/peitho/display";
import { ModelGlyph } from "@/lib/peitho/modelIcons";
import { EASE_OUT } from "@/lib/ease";
import type { ModelBet } from "@/lib/peitho/types";
import { ALL_MODELS } from "@/lib/peitho/config";

// EXPERIMENTAL: the four models collapsed onto ONE axis. Each model's icon sits
// at the % it priced — icons clustered = agreement, spread out = disagreement.
// The core "spread is the signal" idea made literal in a single line.
export function ConsensusStrip({
  bets,
  consensus,
}: {
  bets: ModelBet[];
  consensus: number;
}) {
  const byModel = new Map(bets.map((b) => [b.model, b]));

  return (
    <div className="px-3">
      {/* scale */}
      <div className="mb-1 flex justify-between text-[9px] font-medium tabular-nums text-muted-foreground">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>

      {/* the axis */}
      <div className="relative h-6">
        {/* track */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted" />

        {/* consensus marker (the mean the panel landed on) */}
        {bets.length > 0 && (
          <motion.div
            className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/50"
            initial={{ left: "50%" }}
            animate={{ left: `${consensus}%` }}
            transition={{ duration: 1.2, ease: EASE_OUT }}
          />
        )}

        {/* each model's icon at the mark it landed */}
        {ALL_MODELS.map((m) => {
          const bet = byModel.get(m);
          if (!bet) return null;
          const { color, version } = modelDisplay(m);
          return (
            <motion.div
              key={m}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ left: "50%", opacity: 0, scale: 0.6 }}
              animate={{ left: `${bet.price}%`, opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: EASE_OUT }}
              title={`${version} · ${bet.price}%`}
              style={{ color }}
            >
              <ModelGlyph model={m} size={20} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
