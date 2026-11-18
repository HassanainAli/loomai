export type Screen =
  | "auth"
  | "onboard1"
  | "onboard2"
  | "onboard3"
  | "specSheet"
  | "dailyGate"
  | "anticipation"
  | "queue"
  | "profile"
  | "focus";

export type Balance = "mirror" | "counterweight" | null;

export interface Match {
  id: string;
  name: string;
  age: number;
  major: string;
  location: string;
  intention: string;
  hobbies: string[];
  whyMatched: string;
  dailyAnswer: string;
  conflictAnswer: string;
  sundayAnswer: string;
  pace: string;
  matchId?: string;
  similarity?: number;
  promptText?: string;
  myAnswer?: string;
  status?: MatchState;
  threadId?: string;
  unread?: number;
}

export type MatchState = "pending" | "waiting" | "mutual" | "passed" | "ended" | "expired" | "closed";

// Maps a raw match row status to what the Queue shows.
export function matchState(status: string | null | undefined, threadId?: string | null): MatchState {
  if (status === "mutual" && threadId) return "mutual";
  if (status === "greenlit") return "waiting";
  if (status === "passed" || status === "ended" || status === "expired" || status === "closed") return status;
  if (status === "mutual") return "ended";
  return "pending";
}

export interface DropState {
  answered_today: boolean;
  had_match_last_drop: boolean;
  in_active_chat: boolean;
}
// Picks the empty match-list message.
export function emptyQueueMessage(s: DropState | null): string {
  if (s?.in_active_chat) return "You're in Focus Mode, so you're out of new drops for now.";
  if (s?.answered_today) return "You're in tonight's drop. Check back at 8 PM.";
  if (s && !s.had_match_last_drop) return "No match this time. Answer today's prompt to try again tonight.";
  return "Answer today's prompt before 8 PM to enter tonight's drop.";
}

export const MAX_MESSAGE_LENGTH = 1000;
export function cleanMessage(raw: string): string | null {
  const t = raw.trim();
  return t.length >= 1 && t.length <= MAX_MESSAGE_LENGTH ? t : null;
}

export interface OnboardingAnswers {
  intention: "committed" | "intentional" | null;
  seeds: { q: string; a: string }[];
  balance: "mirror" | "counterweight";
}

export interface UserSpec {
  name: string;
  gender: string;
  seeking: string;
  pace: string;
  intention: string;
  campus: string;
  classYear: string;
  major: string;
  hobbies: string[];
}

export const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate Student"] as const;
export const MAX_HOBBIES = 5;
export const MAX_HOBBY_LENGTH = 14;

/** Normalizes a typed interest; returns null when it can't be added. */
/** Capitalizes the first letter for clean profile display. */
export function capFirst(s: string): string {
  const t = s.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

export function cleanHobby(raw: string, existing: string[]): string | null {
  const t = raw.replace(/,/g, "").replace(/\s+/g, " ").trim();
  if (!t || t.length > MAX_HOBBY_LENGTH || existing.length >= MAX_HOBBIES) return null;
  if (existing.some((h) => h.toLowerCase() === t.toLowerCase())) return null;
  return capFirst(t);
}

export const CURRENT_USER_SPEC: UserSpec = {
  name: "",
  gender: "",
  seeking: "",
  pace: "Slow mornings, deep-focus afternoons, early to bed. Weekends fully unplugged.",
  intention: "Intentional dating with a long-term partner in mind.",
  campus: "",
  classYear: "",
  major: "",
  hobbies: [],
};

export const MATCHES: Match[] = [
  {
    id: "m1",
    name: "Maya",
    age: 21,
    major: "Junior · Architecture",
    location: "UW Seattle",
    intention: "Intentional dating, open to seeing where it goes",
    hobbies: ["Pottery", "Trail running", "Vinyl"],
    whyMatched:
      "You both strongly value structured routines and selected 'The Mirror' for pacing.",
    dailyAnswer:
      "Brunch is a scam. It's just expensive breakfast you waited two hours for. Make eggs at home.",
    conflictAnswer:
      "I sit with it for a day, then I bring it up directly. I hate when things fester. Calm but unflinching.",
    sundayAnswer:
      "Slow morning with coffee and a book, a long walk, then cooking something elaborate for dinner. No phone after 7.",
    pace: "Early riser, structured weekdays, slow Sundays. Phone off after 7 PM.",
  },
  {
    id: "m2",
    name: "Eli",
    status: "pending",
    age: 22,
    major: "Senior · Computer Science",
    location: "UW Bothell",
    intention: "Committed, long-term relationship",
    hobbies: ["Bouldering", "Film cameras", "Cooking"],
    whyMatched:
      "Your conflict styles are highly compatible — both prefer direct, low-drama conversation within 24 hours.",
    dailyAnswer:
      "Group trips of more than 4 people should require a written constitution. Otherwise it's chaos.",
    conflictAnswer:
      "Direct conversation, same day if possible. I'd rather have one uncomfortable hour than a week of weirdness.",
    sundayAnswer:
      "Gym early, then a long bike ride. Afternoon at the bookstore, evening cooking with friends. Asleep by 11.",
    pace: "Early gym, deep work blocks, social evenings. Asleep by 11 sharp.",
  },
];
// Parses 5'10", 5' 10, 5ft 10in, 70 or 70in into inches. Returns null if unreadable.
export function parseHeightInches(raw: string): number | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  const ft = t.match(/^(\d)\s*(?:'|ft|feet)\s*(\d{1,2})?\s*(?:"|in|inches)?$/);
  let inches: number | null = null;
  if (ft) inches = Number(ft[1]) * 12 + Number(ft[2] ?? 0);
  else {
    const only = t.match(/^(\d{2})\s*(?:"|in|inches)?$/);
    if (only) inches = Number(only[1]);
  }
  if (inches === null || inches < 48 || inches > 96) return null;
  return inches;
}

export function ageFromDob(dob: string | null | undefined, now = new Date()): number | null {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [y, m, d] = dob.split("-").map(Number);
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age;
}

export interface MatchRow {
  match_id: string;
  display_name: string | null;
  campus_hub: string | null;
  date_of_birth: string | null;
  height_in: number | null;
  intention: string | null;
  seed_prompts: { q: string; a: string }[] | null;
  daily_answer: string | null;
  my_answer: string | null;
  prompt_text: string | null;
  similarity_score: number;
  status?: string | null;
  thread_id?: string | null;
  unread_count?: number | null;
  major?: string | null;
  class_year?: string | null;
  hobbies?: string[] | null;
}

export function rowToMatch(r: MatchRow): Match {
  const pct = Math.round(Math.max(0, Math.min(1, r.similarity_score)) * 100);
  const seeds = Array.isArray(r.seed_prompts) ? r.seed_prompts : [];
  const year = r.class_year === "Graduate Student" ? "Grad" : r.class_year;
  const academic = [year, r.major ? capFirst(r.major) : null].filter(Boolean).join(" · ");
  return {
    id: r.match_id,
    matchId: r.match_id,
    name: r.display_name || "Loom student",
    age: ageFromDob(r.date_of_birth) ?? 0,
    major: academic,
    location: r.campus_hub || "UW",
    intention:
      r.intention === "committed"
        ? "Committed, long-term relationship"
        : r.intention === "intentional"
          ? "Intentional dating, open to seeing where it goes"
          : "",
    hobbies: Array.isArray(r.hobbies) ? r.hobbies.map(capFirst) : [],
    whyMatched: `${pct}% alignment on tonight's prompt.`,
    dailyAnswer: r.daily_answer ?? "",
    conflictAnswer: seeds[0]?.a ?? "",
    sundayAnswer: seeds[1]?.a ?? "",
    pace: seeds[2]?.a ?? "",
    similarity: pct,
    promptText: r.prompt_text ?? undefined,
    myAnswer: r.my_answer ?? undefined,
    status: matchState(r.status, r.thread_id),
    threadId: r.thread_id ?? undefined,
    unread: r.unread_count ?? 0,
  };
}

export type CampusStatus = { campus: string | null; participants: number; threshold: number; unlocked: boolean };
export function campusProgressLabel(s: CampusStatus): string {
  const name = s.campus ?? "your campus";
  return `Unlocking ${name}: ${Math.min(s.participants, s.threshold)} / ${s.threshold} students verified for the first drop.`;
}
