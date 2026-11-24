import { useState } from "react";
import { X, Check, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Match, CURRENT_USER_SPEC, UserSpec } from "../types";
import { generateAlignmentSpec } from "@/lib/alignment.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function Profile({
  match,
  onPass,
  onGreenLight,
  onBack,
  hideActions = false,
  onUndo,
  notice,
  userSpec = CURRENT_USER_SPEC,
  isGuest = false, // GUEST MODE
  preview = false,
}: {
  match: Match;
  onPass?: () => void;
  onGreenLight?: () => void;
  onBack: () => void;
  hideActions?: boolean;
  onUndo?: () => void;
  notice?: string | null;
  userSpec?: UserSpec;
  isGuest?: boolean; // GUEST MODE
  /** Self-preview: show the card as matches see it, with no match actions. */
  preview?: boolean;
}) {
  const generate = useServerFn(generateAlignmentSpec);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [spec, setSpec] = useState<string | null>(null);
  const [diag, setDiag] = useState<{ unlocked: boolean; daily_sim: number | null; base_sim: number | null; style_fit: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleViewAlignment = async () => {
    setOpen(true);
    if (spec || loading) return;
    setLoading(true);
    setError(null);
    // GUEST MODE: show a sample spec instead of calling the engine.
    if (isGuest) {
      await new Promise((r) => setTimeout(r, 600));
      setSpec("Both profiles prioritize intentional pacing and low-stimulus environments. High compatibility signal for quiet 1-on-1 campus walks.");
      setLoading(false);
      return;
    }
    // Real matches: score breakdown, full detail unlocked only for Loom+.
    if (match.matchId) {
      const { data } = await (supabase as any).rpc("get_match_diagnostics", { p_match: match.matchId });
      setDiag(data?.[0] ?? null);
      setError(null);
      setSpec(null);
      setLoading(false);
      return;
    }
    try {
      const res: any = await generate({
        data: {
          user: { pace: userSpec.pace, intention: userSpec.intention },
          match: { pace: match.pace, intention: match.intention, name: match.name },
        },
      });
      if (typeof res?.text === "string") setSpec(res.text);
      else setError(typeof res?.error === "string" ? res.error : "Engine offline. Try again.");
    } catch {
      setError("Engine offline. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`flex-1 overflow-y-auto ${preview ? "pb-8" : "pb-32"}`}>
        <div className="flex items-center gap-3 border-b border-border">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back" className="shrink-0 text-foreground hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <p className="text-sm font-semibold text-muted-foreground">{preview ? "Public profile" : "Tonight's match"}</p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-4xl font-black break-words">
              {match.name}{match.age ? `, ${match.age}` : ""}
            </h2>
            {match.major && (
              <p className="text-sm text-foreground/80 font-semibold mt-1">{match.major}</p>
            )}
            <p className="text-sm text-muted-foreground font-medium mt-0.5">{match.location}</p>
          </div>

          <Section label="Looking for">
            <p className="text-sm font-semibold">{match.intention}</p>
          </Section>

          {/* Photo Masonry: tall left, two stacked squares right */}
          <div className="grid grid-cols-2 grid-rows-2 gap-3 h-[420px]">
            <div className="row-span-2 rounded-lg bg-gradient-to-br from-muted to-secondary" />
            <div className="rounded-lg bg-gradient-to-br from-border to-muted" />
            <div className="rounded-lg bg-gradient-to-br from-secondary to-background" />
          </div>

          {match.hobbies.length > 0 && (
            <Section label="Interests">
              <div className="flex flex-wrap gap-2">
                {match.hobbies.map((h) => (
                  <span key={h} className="text-xs font-bold px-3 py-1.5 rounded-full bg-secondary border border-border whitespace-nowrap">
                    {h}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {match.dailyAnswer && <Section label="Today's prompt">
            {match.promptText && <p className="text-sm text-muted-foreground leading-relaxed mb-3">{match.promptText}</p>}
            <p className="text-2xl font-black italic leading-snug break-words">
              "{match.dailyAnswer}"
            </p>
            {!preview && match.myAnswer && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                  Your answer
                </p>
                <p className="text-sm italic leading-relaxed">"{match.myAnswer}"</p>
              </div>
            )}
          </Section>}

          {match.conflictAnswer && (
            <Section label="Conflict style">
              <p className="text-sm leading-relaxed">{match.conflictAnswer}</p>
            </Section>
          )}

          {match.sundayAnswer && (
            <Section label="Perfect Sunday">
              <p className="text-sm leading-relaxed">{match.sundayAnswer}</p>
            </Section>
          )}

          {match.pace && (
            <Section label="Hill to die on">
              <p className="text-sm leading-relaxed">{match.pace}</p>
            </Section>
          )}


          {/* View Alignment Spec CTA */}
          {!preview && <Button variant="outline"
            onClick={handleViewAlignment}
            className="alignment-trigger w-full h-auto mt-2 rounded-2xl border-2 border-alignment-gold bg-alignment-glass/40 px-5 py-4 text-alignment-gold font-bold text-sm uppercase hover:bg-alignment-glass/40 hover:text-alignment-gold"
          >
            <Sparkles className="w-4 h-4" />
            View Alignment Spec
          </Button>}
        </div>
      </div>

      {notice && (
        <p role="alert" className="absolute bottom-28 left-5 right-5 text-center text-sm text-destructive">
          {notice}
        </p>
      )}
      {hideActions && !preview && (
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-5">
          <p className="text-xs text-muted-foreground text-center">
            Green light locked in. If it's mutual, you'll chat in Focus Mode.
          </p>
        </div>
      )}
      {!hideActions && !preview && (
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
          <div className="absolute inset-0 backdrop-blur-2xl bg-alignment-backdrop/30" />
          <div role="dialog" aria-modal="true" aria-label="Alignment Spec"
            className="alignment-dialog relative w-full max-w-sm rounded-3xl border border-alignment-gold/40 bg-alignment-glass/70 backdrop-blur-xl p-6 max-h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-alignment-gold">
                {userSpec.name.trim()
                  ? `${userSpec.name.trim()}'s Alignment Spec`
                  : "Alignment Spec"}
              </p>
              <Button variant="ghost" size="icon"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {loading && (
              <div className="flex items-center gap-3 text-foreground/80 py-6">
                <Loader2 className="w-4 h-4 animate-spin text-alignment-gold" />
                <span className="text-sm font-mono tracking-wider">Thinking…</span>
              </div>
            )}

            {!loading && error && (
              <p className="text-sm text-destructive font-mono py-2">{error}</p>
            )}

            {match.matchId && (
              <div className="py-2">
                <p className="text-lg font-black text-foreground mb-1">Why you matched</p>
                {diag?.unlocked && <p className="text-sm text-foreground/80 leading-relaxed mb-3">{match.whyMatched}</p>}
                {match.similarity !== undefined && (
                  <p className="mt-1 mb-4 text-3xl font-black text-alignment-gold">{match.similarity}% aligned</p>
                )}
                <div className={`space-y-3 ${diag?.unlocked ? "" : "blur-sm select-none"}`} aria-hidden={!diag?.unlocked}>
                  {[
                    ["Prompt overlap", diag?.unlocked ? diag.daily_sim : 0.72],
                    ["Values", diag?.unlocked ? diag.base_sim : 0.64],
                    ["Style", diag?.unlocked ? diag.style_fit : 0.81],
                  ].map(([label, v]) => (
                    <div key={label as string}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{label}</span>
                        <span>{v == null ? "Not available" : `${Math.round(Number(v) * 100)}%`}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-alignment-magenta" style={{ width: `${Math.max(0, Math.min(100, Number(v ?? 0) * 100))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {!diag?.unlocked && (
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    The full breakdown is part of Loom+. Coming soon.
                  </p>
                )}
              </div>
            )}

            {!loading && !error && spec && (
              <p className="text-base text-foreground leading-relaxed font-medium">{spec}</p>
            )}

            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                {match.matchId ? (diag?.unlocked ? "Loom+ · Unlocked" : "Loom+ · Locked") : "Guest preview"}
              </p>
              <p className="text-[9px] font-mono uppercase tracking-widest text-alignment-gold">
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