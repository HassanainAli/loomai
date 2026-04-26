import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PrimaryButton } from "../Shell";
import { Balance } from "../types";

export function Onboard3({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [choice, setChoice] = useState<Balance>(null);

  const cards: { id: Balance; title: string; desc: string }[] = [
    {
      id: "mirror",
      title: "The Mirror",
      desc: "Someone whose lifestyle and pacing closely reflect my own.",
    },
    {
      id: "counterweight",
      title: "The Counterweight",
      desc: "Someone whose strengths and pacing balance out my own.",
    },
  ];

  return (
    <div className="flex flex-col h-full p-8 pt-8">
      <button
        onClick={onBack}
        className="-ml-2 mb-4 p-2 w-9 text-foreground/70 hover:text-foreground transition-colors"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Step 3 of 3
      </p>
      <h2 className="text-3xl font-black tracking-tight mb-8">
        How should we match your energy?
      </h2>

      <div className="space-y-4 mb-8">
        {cards.map((c) => {
          const active = choice === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setChoice(c.id)}
              className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card hover:border-muted-foreground"
              }`}
            >
              <h3 className="text-2xl font-black tracking-tight mb-2">
                {c.title}
              </h3>
              <p
                className={`text-sm leading-relaxed ${active ? "opacity-80" : "text-muted-foreground"}`}
              >
                {c.desc}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />
      <PrimaryButton onClick={onNext} disabled={!choice}>
        Complete Profile
      </PrimaryButton>
    </div>
  );
}