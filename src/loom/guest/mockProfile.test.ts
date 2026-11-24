import { describe, expect, it } from "vitest";
import { ELI_SAMPLE, MATCHES } from "../types";
import { guestCard, guestProfile } from "./mockProfile";

describe("guest profile data", () => {
  it("uses Eli as the sole sample and the same default public profile", () => {
    expect(MATCHES).toHaveLength(1);
    expect(MATCHES[0]?.name).toBe("Eli");
    const { id, status, ...sample } = ELI_SAMPLE;
    expect(guestCard()).toEqual({ ...sample, id: "me" });
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