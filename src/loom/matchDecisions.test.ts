import { describe, expect, it } from "vitest";
import { MATCHES } from "./types";
import { decideGuestMatch, isOpenMatch } from "./matchDecisions";

const fresh = () => MATCHES.map((match) => ({ ...match, status: "pending" as const }));
describe("nightly match decisions", () => {
  it("keeps both introductions available during exploration", () => {
    expect(fresh().filter(isOpenMatch)).toHaveLength(2);
  });
  it("passes only the selected introduction, leaving the green light available", () => {
    const matches = fresh();
    const [first, second] = matches;
    if (!first || !second) throw new Error("Two sample introductions required");
    const passed = decideGuestMatch(matches, first.id, "passed");
    expect(passed.map((match) => match.status)).toEqual(["passed", "pending"]);
    expect(decideGuestMatch(passed, second.id, "waiting").map((match) => match.status)).toEqual(["passed", "waiting"]);
  });
  it("allows one green light and closes the alternative without calling it a pass", () => {
    const matches = fresh();
    const [first, second] = matches;
    if (!first || !second) throw new Error("Two sample introductions required");
    const chosen = decideGuestMatch(matches, first.id, "waiting");
    expect(chosen.map((match) => match.status)).toEqual(["waiting", "closed"]);
    expect(chosen.filter(isOpenMatch)).toHaveLength(1);
    expect(decideGuestMatch(chosen, second.id, "waiting")).toBe(chosen);
  });
  it("does not restore a green light after the chosen connection ends", () => {
    const matches = fresh();
    const [first, second] = matches;
    if (!first || !second) throw new Error("Two sample introductions required");
    const ended = matches.map((match) => ({ ...match, status: match.id === first.id ? "ended" as const : "pending" as const }));
    expect(decideGuestMatch(ended, second.id, "waiting")).toBe(ended);
  });
  it("finishes the drop after two explicit passes", () => {
    const matches = fresh();
    const [first, second] = matches;
    if (!first || !second) throw new Error("Two sample introductions required");
    const done = decideGuestMatch(decideGuestMatch(matches, first.id, "passed"), second.id, "passed");
    expect(done.filter(isOpenMatch)).toHaveLength(0);
    expect(done.map((match) => match.status)).toEqual(["passed", "passed"]);
  });
});