import { describe, expect, it } from "vitest";
import { guestDestination } from "./navigation";

describe("guest account navigation", () => {
  it("opens the prefilled editor directly from guest navigation", () => {
    expect(guestDestination("editProfile")).toEqual({ screen: "dailyGate", accountView: "edit" });
  });
  it("opens the guest user's public preview directly", () => {
    expect(guestDestination("publicProfile")).toEqual({ screen: "dailyGate", accountView: "preview" });
  });
  it("returns to the daily prompt with no account menu open", () => {
    expect(guestDestination("dailyGate")).toEqual({ screen: "dailyGate", accountView: null });
  });
  it("lets the next guest destination leave the account editor", () => {
    expect(guestDestination("anticipation")).toEqual({ screen: "anticipation", accountView: null });
  });
});