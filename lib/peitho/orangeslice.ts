// Orange Slice enrichment — the real "Prospect → Evidence dossier" stage.
// Turns a company domain into a Dossier of real, attributed Signals. This is the
// only thing that changes when we go from hand-assembled to live data: it fills
// Dossier.signals from the B2B database. The engine, derive, and board never
// change. Node-only (uses the orangeslice SDK) — runs in scripts, not the client.

import { services } from "orangeslice";
import type { Dossier, Signal } from "./types";

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return (a + b).toUpperCase() || "??";
}

function fmtAmount(n?: number | null): string {
  if (!n) return "";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${Math.round(n / 1e6)}M`;
  return `$${Math.round(n / 1e3)}K`;
}

export type EnrichedCompany = {
  name: string;
  initials: string;
  domain: string;
  logo?: string;
  dossier: Dossier;
};

/**
 * Enrich one company by domain into a real Dossier. ~1 credit, ~300-500ms.
 * Pulls firmographics + Crunchbase funding from the extended LinkedIn record and
 * maps each fact to an attributed Signal (source = where it came from).
 */
export async function enrichDossier(input: {
  domain: string;
}): Promise<EnrichedCompany> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: any = await services.company.linkedin.enrich({
    domain: input.domain,
    extended: true,
  });
  if (!r || !r.name) {
    throw new Error(`Orange Slice: no company found for "${input.domain}"`);
  }

  const name: string = r.name;
  const signals: Signal[] = [];

  // ── firmographic fit (Claude's lens) ──────────────────────────────────────
  const locality = String(r.locality ?? "");
  const region = String(r.region ?? "");
  const loc =
    region && !locality.includes(region)
      ? [locality, region].filter(Boolean).join(", ")
      : locality;
  if (r.employee_count) {
    signals.push({
      source: "linkedin",
      claim: `${Number(r.employee_count).toLocaleString()} employees${r.type ? `, ${r.type}` : ""}${loc ? `, ${loc}` : ""}`,
    });
  }
  const industries = (Array.isArray(r.industries) ? r.industries : [])
    .map((x: unknown) =>
      typeof x === "string"
        ? x
        : ((x as Record<string, unknown>)?.name ??
          (x as Record<string, unknown>)?.industry ??
          null),
    )
    .filter((x: unknown): x is string => typeof x === "string" && x.length > 0);
  if (industries.length) {
    signals.push({ source: "linkedin", claim: `industry: ${industries.slice(0, 2).join(", ")}` });
  }
  if (r.founded_year) {
    signals.push({ source: "linkedin", claim: `founded ${r.founded_year}` });
  }

  // ── funding / timing (GPT's lens) ─────────────────────────────────────────
  const funding: Array<Record<string, unknown>> = Array.isArray(r.crunchbase_funding)
    ? r.crunchbase_funding
    : [];
  const priced = funding
    .filter((f) => f.round_amount)
    .sort((a, b) => String(b.round_date ?? "").localeCompare(String(a.round_date ?? "")));
  const latest = priced[0];
  if (latest) {
    signals.push({
      source: "crunchbase",
      claim: `raised ${fmtAmount(latest.round_amount as number)} (${latest.round_name})${latest.round_date ? ` on ${String(latest.round_date).slice(0, 10)}` : ""}`,
    });
  }
  const roundCount = funding[0]?.funding_round_count as number | undefined;
  if (roundCount && roundCount > 1) {
    signals.push({ source: "crunchbase", claim: `${roundCount} funding rounds to date` });
  }

  // ── growth (Gemini's lens) ────────────────────────────────────────────────
  if (r.follower_count) {
    signals.push({
      source: "linkedin",
      claim: `${Number(r.follower_count).toLocaleString()} LinkedIn followers`,
    });
  }

  const summary = (
    r.description
      ? String(r.description).replace(/\s+/g, " ").trim().slice(0, 300)
      : `${name} — ${r.industries?.[0] ?? "company"} based in ${loc || "—"}.`
  ).trim();

  return {
    name,
    initials: initialsFrom(name),
    domain: r.website ? String(r.website).replace(/^https?:\/\//, "") : input.domain,
    logo: typeof r.logo === "string" && r.logo ? r.logo : undefined,
    dossier: { summary, signals },
  };
}
