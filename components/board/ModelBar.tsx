"use client";

import { modelDisplay } from "@/lib/peitho/display";
import { ModelAvatar, modelCode } from "@/lib/peitho/modelIcons";

// One model's row in the AI-consensus block — the bettor, their lobehub avatar,
// ticker code, price bar and price. The panel's top bet is shown at full opacity.
export function ModelBar({
  model,
  price,
  isMax,
}: {
  model: string;
  price: number | null;
  isMax: boolean;
}) {
  const { color } = modelDisplay(model);
  return (
    <div className="flex items-center gap-2">
      <ModelAvatar model={model} size={16} />
      <span className="w-7 shrink-0 font-mono text-[10px] font-bold" style={{ color }}>
        {modelCode(model)}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        {price !== null && (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${price}%`, backgroundColor: color, opacity: isMax ? 1 : 0.6 }}
          />
        )}
      </div>
      <span
        className="w-9 shrink-0 text-right font-mono text-[11px] font-bold tabular-nums"
        style={{ color: price !== null ? color : undefined }}
      >
        {price !== null ? `${price}%` : "—"}
      </span>
    </div>
  );
}
