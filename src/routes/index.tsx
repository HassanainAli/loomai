import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/loom/Shell";
import { Auth } from "@/loom/screens/Auth";
import { IdentitySpec } from "@/loom/screens/IdentitySpec";
import { SeedPrompt } from "@/loom/screens/SeedPrompt";
import { VisualSignature } from "@/loom/screens/VisualSignature";
import { DailyGate } from "@/loom/screens/DailyGate";
import { Anticipation } from "@/loom/screens/Anticipation";
import { Queue } from "@/loom/screens/Queue";
import { Profile } from "@/loom/screens/Profile";
import { Focus } from "@/loom/screens/Focus";
import { EMPTY_ONBOARDING, type Match, type OnboardingData, type Screen } from "@/loom/types";

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
  const [passStreak, setPassStreak] = useState(5);
  const [data, setData] = useState<OnboardingData>(EMPTY_ONBOARDING);

  const update = (patch: Partial<OnboardingData>) =>
    setData((d) => ({ ...d, ...patch }));

  return (
    <Shell>
      {screen === "auth" && <Auth onNext={() => setScreen("identity")} />}

      {screen === "identity" && (
        <IdentitySpec
          initialName={data.name}
          initialGender={data.gender}
          initialSeeking={data.seeking}
          onNext={(v) => {
            update(v);
            setScreen("seedConflict");
          }}
          onBack={() => setScreen("auth")}
        />
      )}

      {screen === "seedConflict" && (
        <SeedPrompt
          step={2}
          total={5}
          title="Seed the AI."
          helper="These answers train your match engine. Honest, not polished."
          prompt="When you disagree with someone close to you, how do you typically handle it?"
          initialValue={data.conflict}
          onNext={(v) => {
            update({ conflict: v });
            setScreen("seedSunday");
          }}
          onBack={() => setScreen("identity")}
        />
      )}

      {screen === "seedSunday" && (
        <SeedPrompt
          step={3}
          total={5}
          title="Map your Sunday."
          helper="Pacing reveals more than preferences."
          prompt="Describe your perfect, no-obligations Sunday from morning to night."
          initialValue={data.sunday}
          onNext={(v) => {
            update({ sunday: v });
            setScreen("seedHill");
          }}
          onBack={() => setScreen("seedConflict")}
        />
      )}

      {screen === "seedHill" && (
        <SeedPrompt
          step={4}
          total={5}
          title="Pick your hill."
          helper="One opinion you defend without flinching."
          prompt="What is a hill you are absolutely willing to die on?"
          initialValue={data.hill}
          onNext={(v) => {
            update({ hill: v });
            setScreen("visualSignature");
          }}
          onBack={() => setScreen("seedSunday")}
        />
      )}

      {screen === "visualSignature" && (
        <VisualSignature
          name={data.name}
          identity={data.gender}
          onComplete={() => setScreen("dailyGate")}
          onBack={() => setScreen("seedHill")}
        />
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
          currentUserName={data.name}
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
          currentUserName={data.name}
          onEject={() => {
            setActiveMatch(null);
            setScreen("dailyGate");
          }}
        />
      )}
    </Shell>
  );
}
