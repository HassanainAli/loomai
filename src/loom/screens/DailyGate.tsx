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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [campusLock, setCampusLock] = useState(true);
  const recalibrate = passStreak >= 6;
  const todaysPrompt = getDailyPrompt();

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
          <p className="text-sm lowercase text-zinc-500 mb-1">
            hello {userSpec.name?.trim() || "there"}.
          </p>
          <h2 className="text-2xl font-black tracking-tight text-white leading-snug">
            Today's prompt is live.
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
          className="shrink-0 -mr-1 -mt-1 p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" strokeWidth={1.5} />
        </button>
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

      {settingsOpen && (
        <>
          <div
            onClick={() => setSettingsOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
          <div className="absolute top-0 right-0 h-full w-[88%] max-w-sm bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col font-mono animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#FACC15]">
                Profile Settings
              </p>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Name
                </label>
                <input
                  value={userSpec.name}
                  onChange={(e) => onUpdateUserSpec({ name: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#FACC15] transition-colors font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Campus Hub
                </label>
                <select
                  value={userSpec.campus}
                  onChange={(e) => onUpdateUserSpec({ campus: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#FACC15] transition-colors font-mono"
                >
                  <option value="" disabled>Select campus</option>
                  <option value="UW Bothell">UW Bothell</option>
                  <option value="UW Seattle">UW Seattle</option>
                  <option value="UW Tacoma">UW Tacoma</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Campus Lock
                  </label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={campusLock}
                    onClick={() => setCampusLock((p) => !p)}
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                      campusLock ? "bg-[#FACC15]" : "bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black transition-transform ${
                        campusLock ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[9px] text-zinc-500 leading-snug normal-case">
                  Restrict match pool to your campus hub.
                </p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Gender
                </label>
                <select
                  value={userSpec.gender}
                  onChange={(e) => onUpdateUserSpec({ gender: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#FACC15] transition-colors font-mono"
                >
                  <option value="" disabled>Select gender</option>
                  <option value="Man">Man</option>
                  <option value="Woman">Woman</option>
                  <option value="Non-Binary">Non-Binary</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Interested In
                </label>
                <select
                  value={userSpec.seeking}
                  onChange={(e) => onUpdateUserSpec({ seeking: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#FACC15] transition-colors font-mono"
                >
                  <option value="" disabled>Select preference</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Everyone">Everyone</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}