import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [passStreak, setPassStreak] = useState(5); // demo: one more pass triggers recalibration
  const [userSpec, setUserSpec] = useState<UserSpec>(CURRENT_USER_SPEC);
  const updateUserSpec = (patch: Partial<UserSpec>) =>
    setUserSpec((prev) => ({ ...prev, ...patch }));

  // Hydrate session + profile and react to auth state changes.
  useEffect(() => {
    let cancelled = false;

    async function loadFor(uid: string) {
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("display_name, gender, campus_hub, target_preference")
        .eq("id", uid)
        .maybeSingle();
      if (cancelled) return;
      const onboardingComplete = !!(
        profile?.gender &&
        profile?.campus_hub &&
        profile?.target_preference
      );
      if (profile && onboardingComplete) {
        setDisplayName(profile.display_name ?? "");
        setUserSpec((prev) => ({
          ...prev,
          name: profile.display_name ?? "",
          gender: profile.gender ?? "",
          campus: profile.campus_hub ?? "",
          seeking: profile.target_preference ?? "",
        }));
        setScreen("dailyGate");
      } else {
        // Pre-fill the display_name from the auto-created profile row if present,
        // but keep the user inside onboarding until SpecSheet saves the rest.
        if (profile?.display_name) {
          setUserSpec((prev) => ({ ...prev, name: profile.display_name }));
        }
        setScreen("onboard1");
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (uid) loadFor(uid);
      else setScreen("auth");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        loadFor(uid);
      } else {
        setDisplayName("");
        setScreen("auth");
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

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
          userId={userId}
          onNext={(name?: string) => {
            if (name) setDisplayName(name);
            setScreen("dailyGate");
          }}
          onBack={() => setScreen("onboard3")}
          userSpec={userSpec}
          onUpdateUserSpec={updateUserSpec}
        />
      )}
      {screen === "dailyGate" && (
        <DailyGate
          userId={userId}
          displayName={displayName}
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
          userId={userId}
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
