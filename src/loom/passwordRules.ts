export const PASSWORD_RULES = [
  { id: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "One capital letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "special", label: "One special character", test: (p: string) => /[^A-Za-z0-9\s]/.test(p) },
] as const;

export function passwordProblems(p: string): string[] {
  return PASSWORD_RULES.filter((r) => !r.test(p)).map((r) => r.label);
}

export const RESEND_COOLDOWN_SECONDS = 60;

/** Map raw auth errors on password update to student-friendly copy. */
export function updatePasswordError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("different from the old")) return "New password can't match your previous password.";
  if (m.includes("session") || m.includes("jwt") || m.includes("expired")) return "Your reset session expired. Request a new code to continue.";
  if (m.includes("weak") || m.includes("pwned") || m.includes("leaked")) return "That password is too common, and it can't match your previous password either. Choose a fresh, unique one.";
  return "Couldn't update your password. Try again or request a new code.";
}
