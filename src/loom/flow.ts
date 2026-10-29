import type { Screen } from "./types";

export type LandingInput = {
  inActiveChat: boolean;
  hasOpenMatches: boolean;
  answeredToday: boolean;
};

/** Where a signed-in, onboarded student lands based on today's drop state. */
export function landingScreen(s: LandingInput): Screen {
  if (s.inActiveChat) return "focus"; // matched: Loom is just the chat
  if (s.hasOpenMatches) return "queue";
  if (s.answeredToday) return "anticipation";
  return "dailyGate";
}

/** Demo shortcuts (skip to drop) are guest-only. */
export function showSkipToDrop(isGuest: boolean): boolean {
  return isGuest;
}

/** Seconds until the next 8:00 PM in America/Los_Angeles. */
export function secondsUntilPacific8pm(now: Date = new Date()): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const h = Number(parts.hour) % 24;
  const elapsed = h * 3600 + Number(parts.minute) * 60 + Number(parts.second);
  const target = 20 * 3600;
  return elapsed < target ? target - elapsed : 24 * 3600 - elapsed + target;
}
