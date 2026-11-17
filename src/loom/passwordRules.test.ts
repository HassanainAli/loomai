import { describe, it, expect } from "vitest";
import { passwordProblems, updatePasswordError } from "./passwordRules";

describe("password rules", () => {
  it("rejects under 8 characters", () => expect(passwordProblems("Ab!def")).toContain("At least 8 characters"));
  it("requires a capital", () => expect(passwordProblems("abcdefg!")).toEqual(["One capital letter"]));
  it("requires a special character", () => expect(passwordProblems("Abcdefgh")).toEqual(["One special character"]));
  it("accepts a valid password", () => expect(passwordProblems("Abcdefg!")).toEqual([]));
  it("explains reuse of old password", () =>
    expect(updatePasswordError("New password should be different from the old password.")).toBe("New password can't match your previous password."));
});
