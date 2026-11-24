import type { Screen } from "../types";
import type { AccountView } from "../AccountMenu";

export type GuestScreen = Screen | "publicProfile" | "editProfile";

export function guestDestination(destination: GuestScreen): { screen: Screen; accountView: AccountView | null } {
  if (destination === "publicProfile") return { screen: "dailyGate", accountView: "preview" };
  if (destination === "editProfile") return { screen: "dailyGate", accountView: "edit" };
  return { screen: destination, accountView: null };
}