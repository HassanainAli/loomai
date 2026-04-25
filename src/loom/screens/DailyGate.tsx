import { useState } from "react";
import { PrimaryButton } from "../Shell";

export function DailyGate({
  passStreak,
  onSubmit,
  onRecalibrate,
}: {
  passStreak: number;
  onSubmit: () => void;
  onRecalibrate: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const recalibrate = passStreak >= 6;

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
    <div className="flex flex-col h-full p-8 pt-12 overflow-y-auto">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Today's prompt
      </p>
      <h2 className="text-2xl font-black tracking-tight mb-8 leading-snug">
        Unlock your daily matches.
      </h2>

      <div className="bg-secondary border border-border rounded-2xl p-6 mb-6">
        <p className="text-base font-bold leading-snug">
          What is a controversial opinion you hold about weekend plans?
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