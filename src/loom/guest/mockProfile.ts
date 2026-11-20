// GUEST MODE: dummy account used by the account menu, preview and edit screens.
// Delete with the rest of src/loom/guest/ before launch.
import { SEED_PROMPTS } from "../screens/Onboard2";
import type { Match } from "../types";

export const guestProfile = {
  name: "Alex", age: 21, email: "alex.guest@uw.edu",
  gender: "Man", seeking: "Women", campus: "UW Seattle", classYear: "Junior", major: "Informatics",
  hobbies: ["Coffee", "Concerts", "Hiking"],
  intention: "intentional" as "committed" | "intentional",
  balance: "mirror" as "mirror" | "counterweight",
  seeds: [
    "I take a beat to cool off, then I bring it up directly. I'd rather talk it out than let it sit.",
    "Farmers market in the morning, a long walk around Green Lake, then cooking something new at night.",
    "Pineapple belongs on pizza and I will defend it to anyone who asks.",
  ],
};

export function guestCard(): Match {
  const g = guestProfile;
  return {
    id: "me", name: g.name, age: g.age, major: [g.classYear, g.major].filter(Boolean).join(" · "),
    location: g.campus,
    intention: g.intention === "committed" ? "Long-term relationship" : "Dating, open to seeing where it goes",
    hobbies: g.hobbies, whyMatched: "", dailyAnswer: "",
    conflictAnswer: g.seeds[0], sundayAnswer: g.seeds[1], pace: g.seeds[2],
  };
}
export const GUEST_SEED_COUNT = SEED_PROMPTS.length;
