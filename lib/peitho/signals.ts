import type { Signal } from "./types";

// Seeded "freshly-detected" signals for the live detection moment. Strong,
// news-style buying triggers that reliably move the odds when appended + re-priced.
// Ordered so the first detection lands the hardest (explicit in-market intent).
export const FRESH_SIGNALS: Signal[] = [
  {
    source: "x",
    claim:
      "VP Engineering posted today: “we've outgrown our current stack — evaluating a new platform this quarter”",
  },
  {
    source: "news",
    claim: "raised a fresh $150M round this week, earmarked to scale the engineering org",
  },
  {
    source: "linkedin",
    claim: "opened 40+ new engineering roles in the last 14 days",
  },
];
