"use client";

import { Claude, Gemini, Grok, OpenAI } from "@lobehub/icons";

// The four panel models, rendered as the "bettors" on each market — brand
// avatars straight from lobehub, the way Polymarket shows who's holding a side.
export function ModelAvatar({
  model,
  size = 20,
}: {
  model: string;
  size?: number;
}) {
  switch (model) {
    case "gpt":
      return <OpenAI.Avatar size={size} />;
    case "claude":
      return <Claude.Avatar size={size} />;
    case "gemini":
      return <Gemini.Avatar size={size} />;
    case "grok":
      return <Grok.Avatar size={size} />;
    default:
      return null;
  }
}

// Background-less brand mark: the colored logo (Claude/Gemini) or mono mark
// (GPT/Grok, which inherit currentColor) with no avatar tile behind it.
export function ModelGlyph({
  model,
  size = 20,
}: {
  model: string;
  size?: number;
}) {
  switch (model) {
    case "gpt":
      return <OpenAI size={size} />;
    case "claude":
      return <Claude.Color size={size} />;
    case "gemini":
      return <Gemini.Color size={size} />;
    case "grok":
      return <Grok size={size} />;
    default:
      return null;
  }
}

// Short ticker-style codes, matching the prediction-market reference (GPT/CLD/…).
const CODE: Record<string, string> = {
  gpt: "GPT",
  claude: "CLD",
  gemini: "GEM",
  grok: "GRK",
};

export function modelCode(model: string): string {
  return CODE[model] ?? model.slice(0, 3).toUpperCase();
}
