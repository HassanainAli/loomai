// GUEST MODE: dummy account used by the account menu, preview and edit screens.
// Delete with the rest of src/loom/guest/ before launch.
import { SEED_PROMPTS } from "../screens/Onboard2";
import { ELI_SAMPLE, type Match } from "../types";

export const guestProfile = {
  name: "Alex", age: ELI_SAMPLE.age, email: "alex.guest@uw.edu",
  gender: "Man", seeking: "Women", campus: ELI_SAMPLE.location, classYear: "Senior", major: "Computer Science",
  hobbies: [...ELI_SAMPLE.hobbies],
  photos: [...(ELI_SAMPLE.photos ?? [])],
  intention: "committed" as "committed" | "intentional",
  balance: "mirror" as "mirror" | "counterweight",
  seeds: [ELI_SAMPLE.conflictAnswer, ELI_SAMPLE.sundayAnswer, ELI_SAMPLE.pace],
};

export function guestCard(): Match {
  const g = guestProfile;
  return {
    id: "me", name: g.name, age: g.age, major: [g.classYear, g.major].filter(Boolean).join(" · "),
    location: g.campus,
    intention: g.intention === "committed" ? "Committed, long-term relationship" : "Intentional dating, open to seeing where it goes",
    photos: [...g.photos],
    hobbies: [...g.hobbies], whyMatched: "", promptText: ELI_SAMPLE.promptText ?? "",
    dailyAnswer: ELI_SAMPLE.dailyAnswer,
    conflictAnswer: g.seeds[0], sundayAnswer: g.seeds[1], pace: g.seeds[2],
  };
}
export const GUEST_SEED_COUNT = SEED_PROMPTS.length;
