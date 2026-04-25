import { X, Check, ArrowLeft } from "lucide-react";
import { Match } from "../types";

export function Profile({
  match,
  onPass,
  onGreenLight,
  onBack,
  hideActions = false,
}: {
  match: Match;
  onPass?: () => void;
  onGreenLight?: () => void;
  onBack: () => void;
  hideActions?: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="bg-primary text-primary-foreground p-5 flex items-start gap-3">
          <button onClick={onBack} className="shrink-0 mt-0.5">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1">
              Why we matched you
            </p>
            <p className="text-sm font-semibold leading-snug">
              {match.whyMatched}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-4xl font-black tracking-tight">
              {match.name}, {match.age}
            </h2>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              {match.major} · {match.location}
            </p>
          </div>

          <Section label="Looking for">
            <p className="text-sm font-semibold">{match.intention}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {match.hobbies.map((h) => (
                <span
                  key={h}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-secondary border border-border"
                >
                  {h}
                </span>
              ))}
            </div>
          </Section>

          <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-neutral-300 to-neutral-500" />

          <Section label="Today's prompt · their answer">
            <p className="text-base font-medium leading-relaxed italic">
              "{match.dailyAnswer}"
            </p>
          </Section>

          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-neutral-400 to-neutral-600" />
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-neutral-200 to-neutral-400" />
          </div>

          <Section label="Conflict style">
            <p className="text-sm leading-relaxed">{match.conflictAnswer}</p>
          </Section>

          <Section label="Perfect Sunday">
            <p className="text-sm leading-relaxed">{match.sundayAnswer}</p>
          </Section>
        </div>
      </div>

      {!hideActions && (
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-5 flex gap-4">
          <button
            onClick={onPass}
            className="flex-1 bg-secondary border-2 border-border rounded-2xl py-4 flex items-center justify-center hover:border-foreground transition-colors"
          >
            <X className="w-7 h-7" strokeWidth={2.5} />
          </button>
          <button
            onClick={onGreenLight}
            className="flex-[2] bg-primary text-primary-foreground rounded-2xl py-4 flex items-center justify-center font-bold gap-2 active:scale-[0.98] transition-transform"
          >
            <Check className="w-7 h-7" strokeWidth={3} />
            <span className="text-sm">Green Light</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}