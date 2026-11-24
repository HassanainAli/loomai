import { describe, expect, it } from "vitest";
import { ELI_SAMPLE, MATCHES, MAYA_SAMPLE } from "../types";
import { guestCard, guestProfile } from "./mockProfile";

describe("guest profile data", () => {
  it("keeps Maya and Eli as the two guest matches", () => {
    expect(MATCHES).toHaveLength(2);
    expect(MATCHES.map((match) => match.name)).toEqual(["Maya", "Eli"]);
    expect(MAYA_SAMPLE.location).toBe("UW Seattle");
    expect(MAYA_SAMPLE.dailyAnswer).not.toBe(ELI_SAMPLE.dailyAnswer);
    expect(MAYA_SAMPLE.conflictAnswer).not.toBe(ELI_SAMPLE.conflictAnswer);
    expect(MAYA_SAMPLE.sundayAnswer).not.toBe(ELI_SAMPLE.sundayAnswer);
    expect(MAYA_SAMPLE.pace).not.toBe(ELI_SAMPLE.pace);
  });

  it("uses the same default public profile as the shared sample fixture", () => {
    const { id, status, ...sample } = ELI_SAMPLE;
    expect(guestCard()).toEqual({ ...sample, id: "me", name: "Alex" });
    expect(guestProfile.name).toBe("Alex");
    expect(ELI_SAMPLE.name).toBe("Eli");
    expect(guestProfile.seeds).toEqual([
      ELI_SAMPLE.conflictAnswer, ELI_SAMPLE.sundayAnswer, ELI_SAMPLE.pace,
    ]);
  });

  it("keeps guest edits local instead of changing the sample match", () => {
    const saved = guestProfile.major;
    try {
      guestProfile.major = "Psychology";
      expect(guestCard().major).toBe("Senior · Psychology");
      expect(ELI_SAMPLE.major).toBe("Senior · Computer Science");
    } finally {
      guestProfile.major = saved;
    }
  });
});