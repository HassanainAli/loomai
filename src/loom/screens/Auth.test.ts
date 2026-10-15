import { describe, it, expect } from "vitest";
import { parseDob, ageFrom } from "./Auth";

describe("signup age rule", () => {
  const now = new Date(2026, 9, 15);
  it("17 years old is under 18", () => {
    expect(ageFrom(parseDob("10 / 16 / 2008")!, now)).toBe(17);
  });
  it("turning 18 today counts as 18", () => {
    expect(ageFrom(parseDob("10 / 15 / 2008")!, now)).toBe(18);
  });
  it("rejects impossible dates", () => {
    expect(parseDob("02 / 30 / 2000")).toBeNull();
  });
});
