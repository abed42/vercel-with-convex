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

const cleanDomain = (d: string) =>
  d.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").trim();

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
  domain: string; // a domain OR a company name/slug ("Notion", "stripe.com")
  deep?: boolean; // also pull hiring (jobs) + tech stack + news — richer evidence
}): Promise<EnrichedCompany> {
  // Enrich by domain when it looks like one, otherwise by LinkedIn slug — the
  // slug path returns the right company even when the website field is odd.
  const isDomain = input.domain.includes(".");
  const enrichArg = isDomain
    ? { domain: input.domain, extended: true }
    : { shorthand: input.domain.toLowerCase().replace(/[^a-z0-9]+/g, ""), extended: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: any = await services.company.linkedin.enrich(enrichArg);
  if (!r || !r.name) {
    throw new Error(`Orange Slice: no company found for "${input.domain}"`);
  }

  // The domain we use for deep lookups + store on the deal.
  const resolvedDomain = cleanDomain(r.website ? String(r.website) : input.domain);
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

  // ── deep: hiring (jobs) + tech stack — the real fit evidence ──────────────
  if (input.deep) {
    const id = r.linkedin_company_id ? Number(r.linkedin_company_id) : null;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const [jobsRes, techRes, newsRes] = await Promise.all([
      id
        ? services.company.linkedin
            .search({
              sql: `SELECT title FROM linkedin_job WHERE linkedin_company_id = ${id} ORDER BY posted_date DESC NULLS LAST LIMIT 40`,
            })
            .catch((): any => null)
        : Promise.resolve(null),
      services.builtWith.lookupDomain({ domain: resolvedDomain }).catch((): any => null),
      services.predictLeads
        .companyNewsEvents({ company_id_or_domain: resolvedDomain, limit: 12 })
        .catch((): any => null),
    ]);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // hiring — engineering roles are the strongest "they're building" signal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const titles: string[] = ((jobsRes?.rows as any[]) ?? [])
      .map((j) => String(j?.title ?? "").trim())
      .filter(Boolean);
    const eng = titles.filter((t) =>
      /engineer|developer|software|swe|full.?stack|backend|frontend|infra|platform/i.test(t),
    );
    if (eng.length) {
      const sample = [...new Set(eng)].slice(0, 3).join(", ");
      signals.push({
        source: "linkedin",
        claim: `hiring ${eng.length} engineering role${eng.length > 1 ? "s" : ""} (e.g. ${sample})`,
      });
    } else if (titles.length) {
      signals.push({ source: "linkedin", claim: `${titles.length} open roles, none in engineering` });
    }

    // tech stack — flags exactly the backend/realtime pieces Convex replaces
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const techs: string[] = (((techRes as any)?.technologies as any[]) ?? [])
      .map((t) => String(t?.name ?? t?.Name ?? t?.technology ?? "").trim())
      .filter(Boolean);
    if (techs.length) {
      const RELEVANT =
        /react|next\.?js|node|vue|svelte|angular|postgres|mysql|mongo|firebase|supabase|graphql|websocket|socket\.io|redis|typescript|vercel|netlify|aws|gcp|firestore/i;
      const relevant = [...new Set(techs.filter((t) => RELEVANT.test(t)))].slice(0, 6);
      const list = (relevant.length ? relevant : [...new Set(techs)].slice(0, 5)).join(", ");
      signals.push({ source: "builtwith", claim: `tech stack: ${list}` });
    }

    // news events — real, dated buying signals from PredictLeads. The strongest
    // "something happened" evidence: financing, launches, integrations, hiring.
    const GOOD = new Set([
      "receives_financing", "invests_into", "launches", "partners_with",
      "integrates_with", "hires", "is_developing", "expands_facilities",
      "expands_offices_to", "expands_offices_in", "opens_new_location",
      "goes_public", "has_revenue", "receives_award", "signs_new_client",
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: any[] = ((newsRes as any)?.data as any[]) ?? [];
    const newsSignals = events
      .filter((e) => GOOD.has(e?.attributes?.category))
      .sort((a, b) =>
        String(b?.attributes?.found_at ?? "").localeCompare(String(a?.attributes?.found_at ?? "")),
      )
      .slice(0, 5)
      .map((e) => ({
        source: "news",
        claim: String(e.attributes.summary || e.attributes.article_sentence || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 170),
      }))
      .filter((s) => s.claim.length > 0);
    signals.push(...newsSignals);
  }

  const summary = (
    r.description
      ? String(r.description).replace(/\s+/g, " ").trim().slice(0, 300)
      : `${name} — ${r.industries?.[0] ?? "company"} based in ${loc || "—"}.`
  ).trim();

  return {
    name,
    initials: initialsFrom(name),
    domain: resolvedDomain,
    logo: typeof r.logo === "string" && r.logo ? r.logo : undefined,
    dossier: { summary, signals },
  };
}
