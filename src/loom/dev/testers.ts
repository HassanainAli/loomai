// DEV TESTERS — delete this folder (and admin-testers.functions.ts) before launch.
export const TEST_EMAIL_RE = /^loomtest-\d{1,3}@uw\.edu$/;
export const isTestEmail = (email: string | null | undefined) => TEST_EMAIL_RE.test((email ?? "").toLowerCase());
export const testerEmail = (n: number) => `loomtest-${n}@uw.edu`;

export function validCampusMinimum(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 500;
}

export const TESTERS = [
  { n: 1, name: "Test Jordan", gender: "Man", seeking: "Women", answer: "A quiet morning hike, then cooking dinner with friends and talking about books." },
  { n: 2, name: "Test Maya", gender: "Woman", seeking: "Men", answer: "Sunrise trail run, then a long dinner with friends trading book recommendations." },
] as const;
