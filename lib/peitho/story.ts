// The scripted cold open — Abed getting into this hackathon, priced as a live
// market. FULLY DETERMINISTIC: hardcoded beats, ZERO live model calls. Each beat
// shifts the odds and the spread. Reuses the SAME derivation as the real engine,
// so the story's gauge behaves identically to the board's.

import type { ModelBet } from "./types";

export type StoryBeat = {
  title: string; // the development
  narration: string; // what just happened
  bets: ModelBet[]; // the panel's read after this beat
};

const mb = (
  model: string,
  price: number,
  confidence: number,
  rationale: string,
): ModelBet => ({ model, price, confidence, rationale, signalsUsed: [], toolCalls: [] });

export const STORY_PROSPECT = {
  name: "Abed → AI Growth Hackathon",
  initials: "AB",
};

export const STORY_BEATS: StoryBeat[] = [
  {
    title: "Found out late",
    narration:
      "Abed hears about the AI Growth Hackathon — but well after applications effectively closed.",
    bets: [
      mb("claude", 40, 0.5, "Strong founder-event fit, but a late start is a real structural disadvantage."),
      mb("gpt", 18, 0.6, "Window has basically closed — timing is working hard against this."),
      mb("gemini", 30, 0.45, "No momentum signal yet, just an intention."),
      mb("grok", 22, 0.4, "Nothing live to confirm any traction. Skeptical."),
    ],
  },
  {
    title: "The Orange Slice connection",
    narration:
      "It's organized by Orange Slice — and Abed was on a call with their CEO about a year ago.",
    bets: [
      mb("claude", 62, 0.62, "A prior relationship with the organizer is exactly the warm fit that moves odds."),
      mb("gpt", 45, 0.55, "A year-old call isn't a current trigger, but it's a door."),
      mb("gemini", 48, 0.5, "Network signal improving; still no concrete movement."),
      mb("grok", 58, 0.58, "A real human connection — that's a live signal I'll weight up."),
    ],
  },
  {
    title: "Vihaar replies, forwards to YC",
    narration:
      "Abed emails Vihaar. He replies “would love to have you” — and forwards it to YC.",
    bets: [
      mb("claude", 82, 0.8, "Direct invite plus an internal forward — real institutional pull now."),
      mb("gpt", 85, 0.82, "Active, time-sensitive intro in motion this minute. Strong trigger."),
      mb("gemini", 80, 0.78, "Clear forward momentum; the funnel is advancing fast."),
      mb("grok", 84, 0.75, "Founder publicly says ‘would love to have you’ — hard to argue with."),
    ],
  },
  {
    title: "YC ops says it's full",
    narration:
      "Then YC operations comes back: the event is full. Does a founder's vouch override ops?",
    bets: [
      mb("claude", 72, 0.6, "A founder vouch usually overrides ops capacity — I stay fairly high."),
      mb("gpt", 45, 0.55, "‘Full’ is a hard stop on timing; this likely doesn't close in time."),
      mb("gemini", 50, 0.5, "Mixed — momentum stalled against a capacity wall."),
      mb("grok", 78, 0.62, "Founder intent is live and strong; ops is a process detail. Bullish."),
    ],
  },
  {
    title: "Shows up in person",
    narration:
      "Abed shows up in person and reconnects directly. He's in.",
    bets: [
      mb("claude", 92, 0.9, "In-person reconnection closes it — fit, relationship, and presence."),
      mb("gpt", 95, 0.92, "Resolved in the room. The timing question is answered."),
      mb("gemini", 90, 0.88, "Converted. Full momentum."),
      mb("grok", 96, 0.9, "He's physically in. Confirmed."),
    ],
  },
];
