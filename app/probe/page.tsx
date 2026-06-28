"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PROBE_DEAL_ID } from "@/lib/peitho/config";
import { useState } from "react";

// Minimal live-subscription proof — no polling, no board chrome.
export default function ProbePage() {
  const deal = useQuery(api.deals.getDeal, { dealId: PROBE_DEAL_ID });
  const runProbe = useAction(api.probe.runProbe);
  const reset = useMutation(api.deals.clearBets);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fire() {
    setRunning(true);
    setError(null);
    try {
      await reset({ dealId: PROBE_DEAL_ID });
      await runProbe({});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }

  const bet = deal?.bets[0];

  return (
    <main className="mx-auto max-w-lg px-4 py-16 font-mono text-sm">
      <h1 className="mb-2 font-sans text-xl font-bold">Hour-one probe</h1>
      <p className="mb-6 font-sans text-muted-foreground">
        One model → AI Gateway → Convex write → live subscription (no polling).
      </p>

      <button
        onClick={fire}
        disabled={running}
        className="rounded-full bg-primary px-5 py-2 font-sans text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {running ? "Calling Claude…" : "Run probe"}
      </button>

      {error && (
        <pre className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </pre>
      )}

      <div className="mt-8 rounded-lg border border-border bg-card p-4">
        <div className="mb-2 font-sans text-xs uppercase tracking-widest text-muted-foreground">
          Live subscription — api.deals.getDeal
        </div>
        {deal === undefined && <p className="text-muted-foreground">connecting…</p>}
        {deal === null && !running && (
          <p className="text-muted-foreground">No probe deal yet. Click Run probe.</p>
        )}
        {bet ? (
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(bet, null, 2)}
          </pre>
        ) : (
          deal && (
            <p className="text-muted-foreground">
              status: {deal.status} — waiting for bet to land…
            </p>
          )
        )}
      </div>

      <p className="mt-4 font-sans text-xs text-muted-foreground">
        Open two tabs: click Run probe in one; the other updates live when the bet
        writes.
      </p>
    </main>
  );
}
