import { useState } from "react";
import { X, Check, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Match, CURRENT_USER_SPEC } from "../types";
import { generateAlignmentSpec } from "@/server/alignment.functions";

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
  const generate = useServerFn(generateAlignmentSpec);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [spec, setSpec] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleViewAlignment = async () => {
    setOpen(true);
    if (spec || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generate({
        data: {
          user: CURRENT_USER_SPEC,
          match: { pace: match.pace, intention: match.intention, name: match.name },
        },
      });
      if (res.error) setError(res.error);
      else setSpec(res.text);
    } catch {
      setError("Engine offline. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="bg-[#FACC15] text-black p-5 flex items-start gap-3">
          <button onClick={onBack} className="shrink-0 mt-0.5">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
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

          {/* Photo Masonry: tall left, two stacked squares right */}
          <div className="grid grid-cols-2 grid-rows-2 gap-3 h-[420px]">
            <div className="row-span-2 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900" />
            <div className="rounded-2xl bg-gradient-to-br from-zinc-600 to-zinc-800" />
            <div className="rounded-2xl bg-gradient-to-br from-zinc-800 to-black" />
          </div>

          <Section label="Today's prompt · their answer">
            <p className="text-2xl font-black italic leading-snug tracking-tight">
              "{match.dailyAnswer}"
            </p>
          </Section>

          <Section label="Conflict style">
            <p className="text-sm leading-relaxed">{match.conflictAnswer}</p>
          </Section>

          <Section label="Perfect Sunday">
            <p className="text-sm leading-relaxed">{match.sundayAnswer}</p>
          </Section>

          {/* Technical Specs Footer */}
          <div className="pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
              Technical Specs
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "STRATEGY: THE MIRROR",
                "BATTERY: RECHARGE",
                "DEALBREAKER: SMOKING",
              ].map((spec) => (
                <span
                  key={spec}
                  className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-full border border-[#FACC15] text-[#FACC15] tracking-wider"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* View Alignment Spec CTA */}
          <button
            onClick={handleViewAlignment}
            className="w-full mt-2 relative rounded-2xl border-2 border-[#FACC15] bg-black/40 px-5 py-4 flex items-center justify-center gap-2 text-[#FACC15] font-bold text-sm tracking-wider uppercase shadow-[0_0_24px_-4px_rgba(250,204,21,0.6)] hover:shadow-[0_0_36px_-2px_rgba(250,204,21,0.85)] transition-shadow"
          >
            <Sparkles className="w-4 h-4" />
            View Alignment Spec
          </button>
        </div>
      </div>

      {!hideActions && (
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-5 flex gap-4">
          <button
            onClick={onPass}
            className="flex-1 bg-zinc-900 border-2 border-rose-900 text-rose-500 rounded-2xl py-4 flex items-center justify-center hover:border-rose-700 transition-colors"
          >
            <X className="w-7 h-7" strokeWidth={2.5} />
          </button>
          <button
            onClick={onGreenLight}
            className="flex-[2] bg-emerald-400 text-black rounded-2xl py-4 flex items-center justify-center font-bold gap-2 active:scale-[0.98] transition-transform"
          >
            <Check className="w-7 h-7" strokeWidth={3} />
            <span className="text-sm">Green Light</span>
          </button>
        </div>
      )}

      {open && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center p-6"
          onClick={() => setOpen(false)}
        >
          {/* Magenta blur backdrop */}
          <div className="absolute inset-0 backdrop-blur-2xl bg-fuchsia-900/30" />
          <div
            className="relative w-full max-w-sm rounded-3xl border border-[#FACC15]/40 bg-black/70 backdrop-blur-xl p-6 shadow-[0_0_60px_-10px_rgba(217,70,239,0.7)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#FACC15]">
                {CURRENT_USER_SPEC.name}'s Alignment Spec
              </p>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loading && (
              <div className="flex items-center gap-3 text-zinc-300 py-6">
                <Loader2 className="w-4 h-4 animate-spin text-[#FACC15]" />
                <span className="text-sm font-mono tracking-wider">Thinking…</span>
              </div>
            )}

            {!loading && error && (
              <p className="text-sm text-rose-400 font-mono py-2">{error}</p>
            )}

            {!loading && !error && spec && (
              <p className="text-base text-zinc-100 leading-relaxed font-medium">
                {spec}
              </p>
            )}

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                Engine · Gemma 4 (31B)
              </p>
              <p className="text-[9px] font-mono uppercase tracking-widest text-fuchsia-400">
                {match.name}
              </p>
            </div>
          </div>
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