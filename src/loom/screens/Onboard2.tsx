import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PrimaryButton } from "../Shell";

const PROMPTS = [
  "When you disagree with someone close to you, how do you typically handle it?",
  "Describe your perfect, no-obligations Sunday from morning to night.",
  "What is a hill you are absolutely willing to die on?",
];

export function Onboard2({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState(["", "", ""]);
  const allFilled = answers.every((a) => a.trim().length > 10);

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
        Step 2 of 3
      </p>
      <h2 className="text-3xl font-black tracking-tight mb-2">Seed the AI.</h2>
      <p className="text-sm text-muted-foreground mb-8">
        These answers train your match engine. Be honest — no one else sees them
        until you match.
      </p>

      <div className="space-y-6">
        {PROMPTS.map((q, i) => (
          <div key={i}>
            <label className="text-sm font-bold mb-2 block leading-snug">
              {q}
            </label>
            <textarea
              value={answers[i]}
              onChange={(e) => {
                const next = [...answers];
                next[i] = e.target.value;
                setAnswers(next);
              }}
              rows={3}
              placeholder="Type your honest answer…"
              className="w-full bg-secondary border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
            />
          </div>
        ))}
      </div>

      <div className="h-8" />
      <PrimaryButton onClick={onNext} disabled={!allFilled}>
        Next
      </PrimaryButton>
    </div>
  );
}