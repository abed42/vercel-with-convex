// PROTOTYPE — does NOT touch priceDeal or any rendered path. Proves that a panel
// model can call a live web-search TOOL (backed by Orange Slice SERP) and still
// return the structured ModelBet. This is the "real tools → spread reflects
// different evidence" upgrade, derisked in isolation.
//
//   bun Tools/price-with-tools.ts [modelId] [prospect]
//   e.g. bun Tools/price-with-tools.ts gpt Lovable
//
// Requires AI_GATEWAY_API_KEY (auto-loaded from .env.local by bun) and Orange
// Slice auth (~/.config/orangeslice/config.json from `npx orangeslice login`).

import { generateText, generateObject, tool, stepCountIs } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { services } from "orangeslice";
import { buildSystemPrompt, buildUserPrompt } from "../lib/peitho/prompt";
import { getSeller } from "../lib/peitho/sellers";
import { MODEL_LENSES } from "../lib/peitho/config";
import type { Dossier, ModelId } from "../lib/peitho/types";

const modelId = (process.argv[2] ?? "gpt") as ModelId;
const prospect = process.argv[3] ?? "Lovable";
const seller = getSeller("convex");

// Deliberately THIN dossier so the model is motivated to search for live signals.
const dossier: Dossier = {
  summary: `${prospect} is an AI-native software company. Limited dossier on file — fresh signals unknown.`,
  signals: [{ source: "linkedin", claim: "industry: Software Development" }],
};

const betSchema = z.object({
  price: z.number().describe("purchase likelihood, 0-100"),
  confidence: z.number().describe("model's own confidence, 0.0-1.0"),
  rationale: z.string().describe("one concise line, why this price"),
  signalsUsed: z.array(z.string()).describe("exact claims leaned on; prefix web finds with [web]"),
});

// The live tool — uniform across every model (no per-provider gateway quirks).
const searchQueries: string[] = [];
const webSearch = tool({
  description:
    "Search the live web (Google) for RECENT facts about a company — funding, hiring, product launches, news. Use to find evidence not in the dossier.",
  inputSchema: z.object({ query: z.string().describe("the search query") }),
  execute: async ({ query }) => {
    searchQueries.push(query);
    try {
      const [res] = await services.web.batchSearch({ queries: [{ query }] });
      const top = (res?.results ?? [])
        .slice(0, 4)
        .map((r) => `- ${r.title}: ${r.snippet ?? ""}`)
        .join("\n");
      console.error(`  ↳ SERP "${query.slice(0, 40)}…" → ${(res?.results ?? []).length} results`);
      return top || "no results found";
    } catch (e) {
      console.error(`  ↳ SERP ERROR for "${query.slice(0, 30)}…":`, (e as Error)?.message ?? e);
      return `search error: ${(e as Error)?.message ?? e}`;
    }
  },
});

const toolAddendum =
  "\n\nTOOL USE: You MAY call webSearch up to 3 times to find FRESH live evidence not in the dossier " +
  "(recent funding, hiring, launches, news). Any fact you use from search MUST be added to signalsUsed " +
  "prefixed with [web]. If search returns nothing useful, price on the dossier and keep confidence honest. " +
  "This OVERRIDES the earlier 'do not invent facts' rule ONLY for verified web findings.";

async function main() {
  const slug = MODEL_LENSES[modelId].gatewayModel;
  console.log(`\n▸ ${MODEL_LENSES[modelId].label} (${slug}) pricing "${prospect}" as ${seller.name}, WITH live web search…\n`);

  // Step 1 — let the model reason + call the live search tool.
  const research = await generateText({
    model: gateway(slug),
    system: buildSystemPrompt(modelId, seller) + toolAddendum,
    prompt: buildUserPrompt(prospect, dossier, seller),
    tools: { webSearch },
    stopWhen: stepCountIs(5),
    maxRetries: 1,
  });

  const toolNames = research.toolCalls.map((c) => c.toolName);
  console.log("searches the model ran:", searchQueries.length ? searchQueries : "(none)");
  console.log("tool calls:", toolNames.length ? toolNames : "(none)");
  console.log("\nmodel analysis:\n", research.text.trim(), "\n");

  // Step 2 — format the finished analysis into the structured bet (same API the engine uses).
  const { object } = await generateObject({
    model: gateway(slug),
    schema: betSchema,
    system: "Format the finished analysis below into the bet JSON. Do not change the conclusion.",
    prompt: research.text,
    maxRetries: 1,
  });

  console.log("structured bet:\n", JSON.stringify(object, null, 2));
  console.log("");
}

main().catch((e) => {
  console.error("FAILED:", e?.message ?? e);
  process.exit(1);
});
