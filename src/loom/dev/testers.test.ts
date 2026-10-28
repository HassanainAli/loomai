import { describe, expect, it } from "vitest";
import { isTestEmail, validCampusMinimum } from "./testers";

describe("god mode rules", () => {
  it("wipe only matches loomtest accounts", () => {
    expect(isTestEmail("loomtest-1@uw.edu")).toBe(true);
    expect(isTestEmail("alih1999@uw.edu")).toBe(false);
    expect(isTestEmail("loomtest-1@uw.edu.evil.com")).toBe(false);
    expect(isTestEmail("xloomtest-1@uw.edu")).toBe(false);
  });
  it("campus minimum must be 1-500", () => {
    expect(validCampusMinimum(2)).toBe(true);
    expect(validCampusMinimum(0)).toBe(false);
    expect(validCampusMinimum(501)).toBe(false);
    expect(validCampusMinimum(2.5)).toBe(false);
  });
});
