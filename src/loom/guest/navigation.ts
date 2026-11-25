import type { Screen } from "../types";
import type { AccountView } from "../AccountMenu";

export type GuestScreen = Screen | "publicProfile" | "editProfile";

export const GUEST_JOURNEY: { id: GuestScreen; label: string }[] = [
  { id: "auth", label: "Sign in" },
  { id: "onboard1", label: "Step 1: Intentions" },
  { id: "onboard2", label: "Step 2: Seed the AI" },
  { id: "onboard3", label: "Step 3: Energy match" },
  { id: "specSheet", label: "Step 4: Spec sheet" },
  { id: "dailyGate", label: "Daily prompt" },
  { id: "anticipation", label: "8pm drop" },
  { id: "queue", label: "Match queue" },
  { id: "profile", label: "Tonight's match" },
  { id: "focus", label: "Focus chat" },
];

export const GUEST_ACCOUNT_SCREENS: { id: GuestScreen; label: string }[] = [
  { id: "publicProfile", label: "Your public profile" },
  { id: "editProfile", label: "Edit profile" },
];

export function guestAdjacentScreen(screen: GuestScreen, direction: "previous" | "next"): GuestScreen | null {
  if (screen === "publicProfile") return direction === "previous" ? "dailyGate" : "editProfile";
  if (screen === "editProfile") return direction === "previous" ? "publicProfile" : "dailyGate";
  if (screen === "focus" && direction === "next") return "dailyGate";
  const index = GUEST_JOURNEY.findIndex((step) => step.id === screen);
  if (index < 0) return null;
  return GUEST_JOURNEY[index + (direction === "next" ? 1 : -1)]?.id ?? null;
}

export function guestDestination(destination: GuestScreen): { screen: Screen; accountView: AccountView | null } {
  if (destination === "publicProfile") return { screen: "dailyGate", accountView: "preview" };
  if (destination === "editProfile") return { screen: "dailyGate", accountView: "edit" };
  return { screen: destination, accountView: null };
}