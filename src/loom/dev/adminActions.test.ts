import { describe, expect, it } from "vitest";
import { ADMIN_ACTIONS } from "./adminActions";

describe("admin action costs", () => {
  it("seeding is the only action that calls the AI gateway (4 embeddings)", () => {
    expect(ADMIN_ACTIONS.seed.externalCalls).toBe(4);
    const others = Object.entries(ADMIN_ACTIONS).filter(([k]) => k !== "seed");
    for (const [, info] of others) expect(info.externalCalls).toBe(0);
  });
  it("wipe is marked destructive", () => {
    expect(ADMIN_ACTIONS.wipe.destructive).toBe(true);
  });
});
