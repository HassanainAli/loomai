import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/loom/Shell";
import { Auth } from "@/loom/screens/Auth";
import { Onboard1 } from "@/loom/screens/Onboard1";
import { Onboard2 } from "@/loom/screens/Onboard2";
import { Onboard3 } from "@/loom/screens/Onboard3";
import { DailyGate } from "@/loom/screens/DailyGate";
import { Anticipation } from "@/loom/screens/Anticipation";
import { Queue } from "@/loom/screens/Queue";
import { Profile } from "@/loom/screens/Profile";
import { Focus } from "@/loom/screens/Focus";
import type { Match, Screen } from "@/loom/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Loom — Two matches a day. No swiping." },
      {
        name: "description",
        content:
          "An anti-burnout dating app for university students. Deep onboarding, one daily prompt, two curated matches at 8 PM.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [screen, setScreen] = useState<Screen>("auth");
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [passStreak, setPassStreak] = useState(5); // demo: one more pass triggers recalibration

  return (
    <Shell>
      {screen === "auth" && <Auth onNext={() => setScreen("onboard1")} />}
      {screen === "onboard1" && (
        <Onboard1 onNext={() => setScreen("onboard2")} />
      )}
      {screen === "onboard2" && (
        <Onboard2 onNext={() => setScreen("onboard3")} />
      )}
      {screen === "onboard3" && (
        <Onboard3 onNext={() => setScreen("dailyGate")} />
      )}
      {screen === "dailyGate" && (
        <DailyGate
          passStreak={passStreak}
          onSubmit={() => setScreen("anticipation")}
          onRecalibrate={() => {
            setPassStreak(0);
          }}
        />
      )}
      {screen === "anticipation" && (
        <Anticipation onDrop={() => setScreen("queue")} />
      )}
      {screen === "queue" && (
        <Queue
          onOpen={(m) => {
            setActiveMatch(m);
            setScreen("profile");
          }}
        />
      )}
      {screen === "profile" && activeMatch && (
        <Profile
          match={activeMatch}
          onBack={() => setScreen("queue")}
          onPass={() => {
            setPassStreak((p) => p + 1);
            setScreen("queue");
          }}
          onGreenLight={() => setScreen("focus")}
        />
      )}
      {screen === "focus" && activeMatch && (
        <Focus
          match={activeMatch}
          onEject={() => {
            setActiveMatch(null);
            setScreen("dailyGate");
          }}
        />
      )}
    </Shell>
  );
}
