# Peitho — go-to-market intelligence

> A consensus prediction market for B2B purchase intent. A panel of frontier
> models each price how likely a prospect is to buy — and the **disagreement
> between them is the signal**.

Built for the **AI Growth Hackathon by Orange Slice** (YC, Jun 2026) —
track: *Reading Minds: Agentic Analytics, Signal Detection, Lead-Building*.

---

## The hook (the story)

I almost didn't get into this hackathon. Found out late, then realized Orange
Slice was running it — and that I'd been on a call with their CEO a year ago. So
I emailed Vihaar; he vouched and forwarded me to the YC team. They said they were
full. I showed up in person anyway, reconnected, and here I am. Every one of
those moments shifted the odds I'd get in. **That's a sales funnel.** And that's
exactly what Peitho prices — for every prospect in your pipeline.

## The problem

Every lead-scoring tool gives you a number. The score says 85. Great — now what?
A number with no action is useless, and a single model's number hides its own
uncertainty.

## The mechanic (what's different)

Peitho gives the **same evidence** to a panel of models — Claude, GPT, Gemini,
Grok — each with a **different analytical lens**. When they cluster, you're
confident. When they split, the disagreement itself tells you what to do: it
points at exactly the signal to personalize around. Polymarket prices a market
from a crowd. **Peitho prices a deal from a panel of models — and shows you the
spread, which no crowd-price tool can.**

| Model | Lens |
|-------|------|
| Claude | firmographic fit + strategic reasoning |
| GPT | timing / buying triggers |
| Gemini | growth signals (hiring, expansion, funding) |
| Grok | live market/social signal; skeptical when none found |

## The output (the part that wins)

It never shows a number without an action. The board is your pipeline, **tiered
by consensus**:

- **Tier 1 — models agree → prioritize.** Close these.
- **Tier 2 — models split → personalize** around the contested signal.
- **Tier 3 — low consensus → skip.**

It's a to-do list ranked by confidence.

## The close

Everything is sales. A deal closing, a hire accepting, getting into a hackathon
— it's all signals shifting a probability. Peitho makes that legible for the one
case businesses pay for: **will this prospect buy.** Built on **Convex** for
real-time, with a **panel of models** doing the betting, on **real company data
from Orange Slice.**

---

## The runtime loop

```
Prospect → shared evidence dossier → four models bet on the same evidence with
different lenses → consensus (odds) + spread (confidence) → tier → seller action
→ live tiered board (real-time via Convex subscriptions, no polling)
```

- **Evidence** is real: Orange Slice enrichment (firmographics + Crunchbase
  funding + logos) populates each dossier.
- **The panel** runs in parallel through the Vercel AI Gateway; each model is
  forced to strict JSON (`ModelBet`).
- **Aggregation** is pure, unit-tested math: `consensus = mean`, `spread =
  max − min`, tier + action derived from thresholds.
- **The board** is one Convex subscription — bets animate in as they land.

## Demo arc (5–7 min)

1. **Cold open (~90s)** — the getting-into-the-hackathon story, priced like a
   live market. Deterministic, rehearsed, cannot stutter. (`/ai-hackathon`)
2. **Hard pivot to the live board** — the pipeline reads at a glance.
3. **Click the live hero** — four models investigate and post bets on screen
   while you talk; the gauge settles to consensus, the spread shows confidence.
4. **Land the action** — "prioritize," or for a split deal, "personalize around
   [contested signal]."
5. **Close:** "everything is sales — this prices any deal."

> The story earns their attention; the working product earns the prize. One
> thing runs live (the hero); everything else is cached and looks real.

## Q&A armor

- **"Isn't this just lead scoring?"** → The category is crowded; the *mechanic*
  isn't. Model-consensus where disagreement becomes the confidence signal and
  tells you what to personalize. No crowd-price tool can show inter-model spread.
- **"Is the disagreement signal or noise?"** → It's a triage/attention
  mechanism, not an oracle. Each model takes a different lens (later, different
  live tools), so the spread flags where the evidence is ambiguous enough to
  warrant a human look — and *what specifically* is contested.
- **"Why does it disagree?"** → Different lenses now; different live data sources
  later (Claude reasons, Gemini grounds in search, Grok reads live X). The data
  contract already supports tool-attributed signals (`Signal.foundBy`,
  `ModelBet.toolCalls`) — no downstream change to add them.
- **"Now what?" (the score-with-no-action trap)** → Every deal terminates in
  prioritize / personalize / skip. The tiers ARE the workflow.

## Stack

Next.js + TypeScript + Tailwind · **Convex** (real-time store + subscriptions) ·
**Vercel AI Gateway** (model fan-out) · panel: Claude, GPT, Gemini, Grok ·
**Orange Slice** for real company enrichment.

## Run it

```bash
npm install
npm run dev                      # Next + Convex (local)
npm test                         # the derivation unit tests (bun test lib/peitho/)
bun Tools/enrich.ts <domain> <id> --price   # enrich a real company → price it live
```
