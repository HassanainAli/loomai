import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PrimaryButton } from "../Shell";

export function Onboard1({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [intention, setIntention] = useState<string | null>(null);
  const [dealbreakers, setDealbreakers] = useState("");

  const options = [
    "Committed, long-term relationship",
    "Intentional dating, open to seeing where it goes",
  ];

  return (
    <div className="flex flex-col h-full p-8 pt-12 overflow-y-auto">
      <button
        onClick={onBack}
        className="absolute top-5 left-5 p-2 text-foreground/70 hover:text-foreground transition-colors"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Step 1 of 3
      </p>
      <h2 className="text-3xl font-black tracking-tight mb-8">
        Set your intentions.
      </h2>

      <div className="space-y-3 mb-8">
        {options.map((opt) => {
          const active = intention === opt;
          return (
            <button
              key={opt}
              onClick={() => setIntention(opt)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-muted-foreground"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    active ? "border-background" : "border-muted-foreground"
                  }`}
                >
                  {active && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
                <span className="font-semibold text-sm leading-snug">
                  {opt}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
        Absolute dealbreakers
      </label>
      <textarea
        value={dealbreakers}
        onChange={(e) => setDealbreakers(e.target.value)}
        placeholder="Smoking, bad communicators, doesn't read…"
        rows={3}
        className="w-full bg-secondary border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
      />

      <div className="flex-1 min-h-8" />
      <PrimaryButton onClick={onNext} disabled={!intention || !dealbreakers}>
        Next
      </PrimaryButton>
    </div>
  );
}