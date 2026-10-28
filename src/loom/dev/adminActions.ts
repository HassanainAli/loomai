// Confirmation copy for God Mode actions: what happens + what it costs.
export type AdminActionKey = "seed" | "drop" | "wipe" | "pause" | "resume" | "campusMin" | "loomPlus";

export type AdminActionInfo = {
  title: string;
  action: string;
  cost: string;
  externalCalls: number;
  confirm: string;
  destructive?: boolean;
};

export const ADMIN_ACTIONS: Record<AdminActionKey, AdminActionInfo> = {
  seed: {
    title: "Seed 2 test accounts?",
    action: "Creates or refreshes loomtest-1@uw.edu and loomtest-2@uw.edu with full onboarding data and answers.",
    cost: "4 embeddings via AI gateway (~120 tokens · < 0.001 credits).",
    externalCalls: 4,
    confirm: "Confirm & seed",
  },
  drop: {
    title: "Trigger matching drop now?",
    action: "Matches eligible students for today's drop across unlocked campuses. Creates live match records.",
    cost: "Database-only math. 0 external API calls · 0 credits ($0.00).",
    externalCalls: 0,
    confirm: "Execute drop",
  },
  wipe: {
    title: "Purge all test data?",
    action: "Permanently removes all loomtest-* accounts, prompt answers, vectors, and test matches. Can't be undone.",
    cost: "Database-only cleanup. 0 external API calls · 0 credits ($0.00).",
    externalCalls: 0,
    confirm: "Wipe all test data",
    destructive: true,
  },
  pause: {
    title: "Pause nightly drops?",
    action: "Skips the automatic 8pm drop on every campus until resumed. Skipped nights are still logged.",
    cost: "Settings update. 0 credits ($0.00).",
    externalCalls: 0,
    confirm: "Confirm pause",
    destructive: true,
  },
  resume: {
    title: "Resume nightly drops?",
    action: "The 8pm drop runs again on every unlocked campus starting tonight.",
    cost: "Settings update. 0 credits ($0.00).",
    externalCalls: 0,
    confirm: "Confirm resume",
  },
  campusMin: {
    title: "Change campus minimum?",
    action: "Campuses below this number of onboarded students won't get drops.",
    cost: "Settings update. 0 credits ($0.00).",
    externalCalls: 0,
    confirm: "Save minimum",
  },
  loomPlus: {
    title: "Change Loom+ access?",
    action: "Grants or removes the full \"Why you matched\" breakdown for this student.",
    cost: "Settings update. 0 credits ($0.00).",
    externalCalls: 0,
    confirm: "Confirm",
  },
};
