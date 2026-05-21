import { useState } from "react";
import { ArrowUp, Menu } from "lucide-react";
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
    <div className="flex flex-col h-full pt-12 relative">
      <div className="flex items-start justify-between mb-10 px-8">
        <div>
          <p className="text-sm font-sans text-zinc-500 mb-1 tracking-tight">
            Hello {firstName}.
          </p>
          <h2 className="text-2xl font-black tracking-tight text-white leading-snug font-sans">
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

      <div className="flex items-end gap-2 px-8">
        <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-border flex items-center justify-center">
          <img
            src="/favicon.ico"
            alt="Loom"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="bg-secondary border border-border rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%]">
          <p className="text-[15px] font-medium leading-snug text-white">
            {todaysPrompt}
          </p>
        </div>
      </div>

      <div className="flex-1" />

      <div className="px-5 pb-6 pt-4">
        <div className="relative flex items-center w-full bg-secondary border border-border rounded-full pl-5 pr-1.5 py-1.5">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={1}
            placeholder="Be honest. This goes to your two matches at 8 PM."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none resize-none leading-6 py-2 max-h-32"
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={answer.trim().length < 15}
            aria-label="Submit"
            className="shrink-0 ml-2 w-9 h-9 rounded-full bg-yellow-400 text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
          >
            <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}