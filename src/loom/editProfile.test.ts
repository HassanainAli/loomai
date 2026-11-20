import { describe, expect, it } from "vitest";
import { seedsChanged } from "./EditProfile";

describe("seedsChanged", () => {
  it("skips re-embedding when answers are unchanged (whitespace ignored)", () => {
    expect(seedsChanged(["a", "b", "c"], [" a", "b ", "c"])).toBe(false);
  });
  it("re-embeds when any answer text changes", () => {
    expect(seedsChanged(["a", "b", "c"], ["a", "b", "new"])).toBe(true);
  });
});
