import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { PrimaryButton } from "../Shell";

export function SeedPrompt({
  step,
  total,
  title,
  prompt,
  helper,
  initialValue,
  placeholder,
  ctaLabel = "Next",
  onNext,
  onBack,
}: {
  step: number;
  total: number;
  title: string;
  prompt: string;
  helper?: string;
  initialValue: string;
  placeholder?: string;
  ctaLabel?: string;
  onNext: (value: string) => void;
  onBack: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const ready = value.trim().length > 10;

  return (
    <div className="flex flex-col h-full p-8 pt-8 overflow-y-auto">
      <button
        onClick={onBack}
        className="-ml-2 mb-4 p-2 w-9 text-foreground/70 hover:text-foreground transition-colors"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Step {step} of {total}
      </p>
      <h2 className="text-3xl font-black tracking-tight mb-2">{title}</h2>
      {helper && (
        <p className="text-sm text-muted-foreground mb-6">{helper}</p>
      )}

      <label className="text-sm font-bold mb-3 block leading-snug">
        {prompt}
      </label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={8}
        placeholder={placeholder ?? "Type your honest answer…"}
        className="w-full bg-secondary border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
      />

      <div className="flex-1 min-h-6" />
      <PrimaryButton onClick={() => onNext(value.trim())} disabled={!ready}>
        {ctaLabel}
      </PrimaryButton>
    </div>
  );
}
