# Oddyssey — demo runbook (5–7 min)

> Consensus prediction market for B2B purchase intent. Four frontier models price
> the same evidence under different lenses; the **disagreement is the signal**.

## Pre-flight (before you go up)
1. `npm run dev` is running; open **http://localhost:3000** in a real browser.
2. **Reset the demo state:** `bun Tools/reset-demo.ts` → hero (Decagon) is back at its tier-2 "before" state.
3. Open two tabs: **`/ai-hackathon`** (cold open) and **`/`** (the board). Start on `/ai-hackathon`.
4. The board loads as **Convex** by default. The hero is **Decagon**. Don't pre-click anything.
5. One live beat (Detect signal) takes **~9–10s** — that's narration time, not dead air. Everything else is instant/cached.

---

## The arc

### 1 · Cold open — the hook (~90s) · tab `/ai-hackathon`
**Do:** Walk the 5 beats with `Next →`.
**Say:** "I almost didn't get into this hackathon. Found out late — then realized Orange Slice was running it, and I'd been on a call with their CEO a year ago. So I emailed Vihaar; he vouched, forwarded me to YC. They said they were full. I showed up in person anyway, reconnected — and here I am. **Every one of those moments shifted the odds.** That's a sales funnel. And that's exactly what Oddyssey prices — for every prospect in your pipeline."
> The story is deterministic — it can't stutter. The chart's four lines fan apart at beat 4 (the disagreement), resolve at beat 5.

### 2 · Pivot to the board · tab `/`
**Say:** "Every lead-scoring tool gives you a number. The score says 85 — now what? Oddyssey gives the **same evidence to a panel of models** — Claude, GPT, Gemini, Grok — each with a different analytical lens. When they agree, you're confident. **When they split, the disagreement tells you what to personalize.** And it's pricing from a specific seller's view — right now, **Convex.**"
**Do:** Gesture at the tiers — personalize (amber), skip. Note the evidence is real (LinkedIn, Crunchbase, BuiltWith, news).

### 3 · The seller switch — the wow (~15s)
**Do:** Click **`Convex ▾`** next to the logo → pick **Cursor**.
**Say:** "Same companies — but now I'm selling **Cursor**, an AI code editor for engineering teams. Watch the board re-price from *Cursor's* ICP." → the board lights up: **Perplexity, Linear, Sierra, Dub → PRIORITIZE.** "Convex is picky — greenfield app builders. Cursor wants every eng team. **The same prospect is worth different amounts to different sellers** — and the panel knows why."

### 4 · Click the hero (Decagon)
**Do:** Click **"Will Decagon convert?"** → modal opens. It's **tier-2, PERSONALIZE, contested**.
**Say:** "Decagon — the models are split. Look at the per-model votes: each one cites the exact evidence it used. This is a maybe."

### 5 · Detect a signal — the mic-drop (~10s)
**Do:** Click **📡 Detect new signal**. Narrate while it re-prices (~10s).
**Say:** "Now a signal lands — their **VP of Engineering just posted they're evaluating a new platform this quarter.** Watch the panel re-price, live, on real-time Convex…" → **Decagon jumps to 84% · PRIORITIZE · high conviction.** "The odds moved, the spread tightened, and every model now cites that signal. **Personalize → prioritize**, in real time."

### 6 · Land it / close
**Say:** "It never shows a number without an action. Tier 1 — close these. Tier 2 — personalize around the contested signal. Tier 3 — skip. **Everything is sales** — a deal, a hire, getting into a hackathon. Oddyssey prices the one case businesses pay for: will this prospect buy. Built on **Convex** for real-time, with a **panel of models** doing the betting, on **real company data**."

---

## Q&A armor
- **"Isn't this just lead scoring?"** → Category's crowded; the *mechanic* isn't. Model-consensus where disagreement becomes the confidence signal and tells you what to personalize. No crowd-price tool shows inter-model spread.
- **"Is the disagreement real signal?"** → It's a triage/attention tool, not an oracle. Different lenses (later, different live tools) → the spread flags where evidence is ambiguous, and *what* is contested.
- **"How do you know the odds are right?"** → They're calibrated model opinions grounded in cited evidence, not a backtest. The value is ranking + the spread, not a guarantee.
- **"Now what?"** → Every deal terminates in prioritize / personalize / skip. The tiers ARE the workflow.

## Reset between runs
`bun Tools/reset-demo.ts` (puts Decagon back to tier-2). Then refresh the board tab.

## If something breaks
- Board empty / wrong seller → refresh `/`.
- Detect hangs >20s → it'll settle; if not, click again (idempotent). Story tab (`/ai-hackathon`) is fully scripted and always works as a fallback.
