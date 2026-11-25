import { describe, expect, it } from "vitest";
import { guestAdjacentScreen, guestDestination } from "./navigation";

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
  it("skips account screens in the main daily journey", () => {
    expect(guestAdjacentScreen("dailyGate", "next")).toBe("anticipation");
    expect(guestAdjacentScreen("anticipation", "previous")).toBe("dailyGate");
  });
  it("loops from Focus chat back to the daily prompt, not onboarding", () => {
    expect(guestAdjacentScreen("focus", "next")).toBe("dailyGate");
  });
  it("navigates optional account screens and returns to the daily prompt", () => {
    expect(guestAdjacentScreen("publicProfile", "previous")).toBe("dailyGate");
    expect(guestAdjacentScreen("publicProfile", "next")).toBe("editProfile");
    expect(guestAdjacentScreen("editProfile", "previous")).toBe("publicProfile");
    expect(guestAdjacentScreen("editProfile", "next")).toBe("dailyGate");
  });
});