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
}

export const CURRENT_USER_SPEC: UserSpec = {
  name: "",
  gender: "",
  seeking: "",
  pace: "Slow mornings, deep-focus afternoons, early to bed. Weekends fully unplugged.",
  intention: "Intentional dating with a long-term partner in mind.",
  campus: "",
};

export const MATCHES: Match[] = [
  {
    id: "m1",
    name: "Maya",
    age: 21,
    major: "Architecture",
    location: "2.1 mi away",
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
    age: 22,
    major: "Computer Science",
    location: "0.8 mi away",
    intention: "Committed, long-term relationship",
    hobbies: ["Bouldering", "Film photography", "Cooking"],
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
