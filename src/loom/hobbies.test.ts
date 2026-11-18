import { describe, it, expect } from "vitest";
import { cleanHobby, rowToMatch } from "./types";

describe("interests", () => {
  it("rejects tags longer than 14 characters", () => {
    expect(cleanHobby("Film photography", [])).toBeNull();
    expect(cleanHobby("Vinyl records", [])).toBe("Vinyl records");
  });
  it("caps at 5 tags", () => {
    expect(cleanHobby("Matcha", ["a", "b", "c", "d", "e"])).toBeNull();
  });
  it("ignores duplicates", () => {
    expect(cleanHobby("matcha", ["Matcha"])).toBeNull();
  });
});

describe("profile header", () => {
  it("shows class standing and major, campus on its own", () => {
    const m = rowToMatch({ match_id: "x", display_name: "S", campus_hub: "UW Seattle", date_of_birth: null, height_in: null, intention: null, seed_prompts: null, daily_answer: null, my_answer: null, prompt_text: null, similarity_score: 0.5, major: "Informatics", class_year: "Junior", hobbies: ["Matcha"] } as any);
    expect(m.major).toBe("Junior · Informatics");
    expect(m.location).toBe("UW Seattle");
    expect(m.hobbies).toEqual(["Matcha"]);
  });
});
