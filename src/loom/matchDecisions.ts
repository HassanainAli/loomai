import type { Match } from "./types";

export function isOpenMatch(match: Match): boolean {
  return !match.status || ["pending", "waiting", "mutual"].includes(match.status);
}

// Guest-only state transitions mirror the protected live decision transaction.
export function decideGuestMatch(matches: Match[], id: string, action: "passed" | "waiting"): Match[] {
  const target = matches.find((match) => match.id === id);
  if (!target || (target.status && target.status !== "pending")) return matches;
  if (action === "waiting" && matches.some((match) => ["waiting", "mutual", "ended"].includes(match.status ?? ""))) return matches;
  return matches.map((match) => {
    if (match.id === id) return { ...match, status: action };
    if (action === "waiting" && (!match.status || match.status === "pending")) return { ...match, status: "closed" };
    return match;
  });
}