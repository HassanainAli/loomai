import { describe, expect, it } from "vitest";
import { landingScreen, secondsUntilPacific8pm, showSkipToDrop } from "./flow";

const base = { inActiveChat: false, hasOpenMatches: false, answeredToday: false };

describe("landingScreen", () => {
  it("active chat opens the chat directly", () => expect(landingScreen({ ...base, inActiveChat: true, hasOpenMatches: true })).toBe("focus"));
  it("open matches go to queue", () => expect(landingScreen({ ...base, hasOpenMatches: true, answeredToday: true })).toBe("queue"));
  it("answered today goes to countdown", () => expect(landingScreen({ ...base, answeredToday: true })).toBe("anticipation"));
  it("otherwise daily prompt", () => expect(landingScreen(base)).toBe("dailyGate"));
});

describe("skip to drop", () => {
  it("only guests see it", () => {
    expect(showSkipToDrop(true)).toBe(true);
    expect(showSkipToDrop(false)).toBe(false);
  });
});

describe("secondsUntilPacific8pm", () => {
  it("7pm Pacific (PDT) is one hour away", () => {
    expect(secondsUntilPacific8pm(new Date("2026-10-27T02:00:00Z"))).toBe(3600);
  });
  it("9pm Pacific rolls to tomorrow", () => {
    expect(secondsUntilPacific8pm(new Date("2026-10-27T04:00:00Z"))).toBe(23 * 3600);
  });
});
