import { useState } from "react";
import { Menu } from "lucide-react";
import { PrimaryButton } from "../Shell";
import { UserSpec } from "../types";

const strategicPartyPrompts = [
  "You're going to hell. What minor inconvenience is your eternal punishment?",
  "If you were arrested with no explanation, what would your friends assume you did?",
  "What is a universally beloved food/trend that is actually absolute garbage?",
  "What is your most harmless, but entirely chaotic, 'red flag'?",
  "If you had the aux at a party, what song is clearing the room immediately?",
  "What is a deeply unserious hill you are willing to die on?",
  "What is your 'social battery is dead' survival strategy?",
];

function getDailyPrompt() {
  const idx =
    Math.floor(Date.now() / 86400000) % strategicPartyPrompts.length;
  return strategicPartyPrompts[idx];
}

export function DailyGate({
  passStreak,
  onSubmit,
  onRecalibrate,
  userSpec,
  onUpdateUserSpec,
}: {
  passStreak: number;
  onSubmit: () => void;
  onRecalibrate: () => void;
  userSpec: UserSpec;
  onUpdateUserSpec: (patch: Partial<UserSpec>) => void;
}) {
  const [answer, setAnswer] = useState("");
  const recalibrate = passStreak >= 6;
  const todaysPrompt = getDailyPrompt();
  const firstName = (userSpec.name?.trim() || "there").split(" ")[0];

  if (recalibrate) {
    const reasons = [
      "Energy/pacing was off",
      "Core values didn't align",
      "Not my type physically",
      "Add a new dealbreaker",
    ];
    return (
      <div className="flex flex-col h-full p-8 pt-16">
        <h2 className="text-3xl font-black tracking-tight mb-3">
          Let's recalibrate.
        </h2>
        <p className="text-sm text-muted-foreground mb-10 leading-relaxed">
          You've passed on your last 6 matches. What is the primary thing
          missing?
        </p>
        <div className="space-y-3">
          {reasons.map((r) => (
            <button
              key={r}
              onClick={onRecalibrate}
              className="w-full text-left p-5 rounded-2xl border-2 border-border bg-card font-semibold text-sm hover:border-foreground transition-colors"
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-8 pt-12 overflow-y-auto relative">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-sm font-mono text-zinc-500 mb-1">
            Hello {firstName}
          </p>
          <h2 className="text-2xl font-black tracking-tight text-white leading-snug">
            Today's prompt is live.
          </h2>
        </div>
        <div
          aria-label="Menu"
          className="shrink-0 -mr-1 -mt-1 p-2 text-zinc-500"
        >
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </div>

      <div className="bg-secondary border border-border rounded-2xl p-6 mb-6">
        <p className="text-base font-bold leading-snug">
          {todaysPrompt}
        </p>
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={6}
        placeholder="Be honest. This goes to your two matches at 8 PM."
        className="w-full bg-secondary border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
      />

      <div className="flex-1 min-h-8" />
      <PrimaryButton onClick={onSubmit} disabled={answer.trim().length < 15}>
        Submit & Unlock
      </PrimaryButton>

    </div>
  );
}