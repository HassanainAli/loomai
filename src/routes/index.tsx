import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/loom/Shell";
import { DesktopLanding } from "@/loom/DesktopLanding";
import { Auth } from "@/loom/screens/Auth";
import { Onboard1 } from "@/loom/screens/Onboard1";
import { Onboard2 } from "@/loom/screens/Onboard2";
import { Onboard3 } from "@/loom/screens/Onboard3";
import { SpecSheet } from "@/loom/screens/SpecSheet";
import { DailyGate } from "@/loom/screens/DailyGate";
import { Anticipation } from "@/loom/screens/Anticipation";
import { Queue } from "@/loom/screens/Queue";
import { Profile } from "@/loom/screens/Profile";
import { Focus } from "@/loom/screens/Focus";
import type { Match, Screen, UserSpec } from "@/loom/types";
import { CURRENT_USER_SPEC } from "@/loom/types";

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
  const [userSpec, setUserSpec] = useState<UserSpec>(CURRENT_USER_SPEC);
  const updateUserSpec = (patch: Partial<UserSpec>) =>
    setUserSpec((prev) => ({ ...prev, ...patch }));

  const app = (
    <>
      {screen === "auth" && <Auth onNext={() => setScreen("onboard1")} />}
      {screen === "onboard1" && (
        <Onboard1
          onNext={() => setScreen("onboard2")}
          onBack={() => setScreen("auth")}
        />
      )}
      {screen === "onboard2" && (
        <Onboard2
          onNext={() => setScreen("onboard3")}
          onBack={() => setScreen("onboard1")}
        />
      )}
      {screen === "onboard3" && (
        <Onboard3
          onNext={() => setScreen("specSheet")}
          onBack={() => setScreen("onboard2")}
        />
      )}
      {screen === "specSheet" && (
        <SpecSheet
          onNext={() => setScreen("dailyGate")}
          onBack={() => setScreen("onboard3")}
          userSpec={userSpec}
          onUpdateUserSpec={updateUserSpec}
        />
      )}
      {screen === "dailyGate" && (
        <DailyGate
          passStreak={passStreak}
          onSubmit={() => setScreen("anticipation")}
          onRecalibrate={() => {
            setPassStreak(0);
          }}
          userSpec={userSpec}
          onUpdateUserSpec={updateUserSpec}
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
          userSpec={userSpec}
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
    </>
  );

  return (
    <>
      {/* Mobile (<lg): full-screen app shell only */}
      <div className="lg:hidden">
        <Shell>{app}</Shell>
      </div>
      {/* Desktop (lg+): landing page with the app embedded in a 3D phone */}
      <div className="hidden lg:block">
        <DesktopLanding
          phoneContent={
            <div className="absolute inset-0 flex flex-col bg-zinc-950">
              {app}
            </div>
          }
        />
      </div>
    </>
  );
}
