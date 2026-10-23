import { describe, expect, it } from "vitest";
import { ageFromDob, parseHeightInches, rowToMatch } from "./types";

describe("onboarding parsing", () => {
  it("parses feet/inches height", () => {
    expect(parseHeightInches(`5'10"`)).toBe(70);
    expect(parseHeightInches("6 ft 1 in")).toBe(73);
    expect(parseHeightInches("tall")).toBeNull();
  });
  it("computes age before and after birthday", () => {
    const now = new Date(2026, 9, 23);
    expect(ageFromDob("2005-10-24", now)).toBe(20);
    expect(ageFromDob("2005-10-23", now)).toBe(21);
  });
  it("shows similarity as a percent", () => {
    const m = rowToMatch({ match_id: "x", display_name: "A", campus_hub: "UW Seattle", date_of_birth: null, height_in: null, intention: "committed", seed_prompts: null, daily_answer: "a", my_answer: "b", prompt_text: null, similarity_score: 0.734 });
    expect(m.similarity).toBe(73);
  });
});
