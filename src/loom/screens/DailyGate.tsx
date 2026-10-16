import { useEffect, useState } from "react";
import { ArrowUp, Menu } from "lucide-react";
import { UserSpec } from "../types";
import { supabase } from "@/integrations/supabase/client";

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
  userId,
  displayName,
}: {
  passStreak: number;
  onSubmit: () => void;
  onRecalibrate: () => void;
  userSpec: UserSpec;
  onUpdateUserSpec: (patch: Partial<UserSpec>) => void;
  userId: string | null;
  displayName: string;
}) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Keyboard handling: pin the screen to the visible area above the iOS keyboard.
  const [focused, setFocused] = useState(false);
  const [vv, setVv] = useState<{ h: number; top: number } | null>(null);
  useEffect(() => {
    const v = window.visualViewport;
    if (!focused || !v) {
      setVv(null);
      document.body.classList.remove("kb-open");
      return;
    }
    document.body.classList.add("kb-open");
    const update = () => {
      setVv({ h: v.height, top: v.offsetTop });
      window.scrollTo(0, 0);
    };
    update();
    v.addEventListener("resize", update);
    v.addEventListener("scroll", update);
    return () => {
      v.removeEventListener("resize", update);
      v.removeEventListener("scroll", update);
      document.body.classList.remove("kb-open");
    };
  }, [focused]);
  const recalibrate = passStreak >= 6;
  const todaysPrompt = getDailyPrompt();
  const firstName = (
    displayName?.trim() || userSpec.name?.trim() || "there"
  ).split(" ")[0];

  async function handleSubmit() {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const activeUserId = userData?.user?.id ?? null;
    console.log("[DailyGate] latest auth user before prompt insert", {
      authUserId: activeUserId,
      propUserId: userId,
      authError: userErr,
    });
    if (userErr) console.error("[DailyGate] getUser error before prompt insert:", userErr);
    const text = answer.trim();
    if (text.length < 15) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!activeUserId) {
        throw new Error(userErr?.message || "No active authenticated user found for prompt submission.");
      }

      const { data: existingResponse, error: responseLookupErr } = await (supabase as any)
        .from("prompt_responses")
        .select("id")
        .eq("user_id", activeUserId)
        .eq("response_text", text)
        .limit(1)
        .maybeSingle();
      if (responseLookupErr) throw responseLookupErr;

      if (!existingResponse?.id) {
        const { error } = await (supabase as any)
          .from("prompt_responses")
          .insert({ user_id: activeUserId, response_text: text });
        if (error) throw error;
      }
      setAnswer("");
      onSubmit();
    } catch (err) {
      console.error("[DailyGate] prompt_responses insert failed", err);
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Prompt response insert failed. Check the console for the exact error object.";
      const details = err && typeof err === "object" && "details" in err ? String((err as { details?: unknown }).details) : "";
      const hint = err && typeof err === "object" && "hint" in err ? String((err as { hint?: unknown }).hint) : "";
      const dbMessage = [message, details && `Details: ${details}`, hint && `Hint: ${hint}`].filter(Boolean).join("\n");
      setSubmitError(dbMessage);
      window.alert(dbMessage);
    } finally {
      setSubmitting(false);
    }
  }

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
    <div
      className={vv ? "fixed inset-x-0 top-0 z-40 mx-auto max-w-md flex flex-col pt-12 overflow-hidden bg-background" : "flex flex-col h-full pt-12 relative overflow-y-auto"}
      style={vv ? { height: vv.h, transform: `translateY(${vv.top}px)` } : undefined}
    >
      <div className="flex items-start justify-between mb-10 px-8">
        <div>
          <p className="text-sm font-sans text-white mb-1 tracking-tight">
            Hello {firstName}
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

      <div className={`px-5 pt-4 ${vv ? "pb-3" : "pb-[max(1.5rem,env(safe-area-inset-bottom))]"} [:has(>[data-guest-bar])_&]:pb-16`}>
        {submitError && (
          <p className="text-xs text-red-400 mb-2 px-3">{submitError}</p>
        )}
        <div className="relative flex items-center w-full bg-secondary border border-border rounded-full pl-5 pr-1.5 py-1.5">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={1}
            maxLength={2000}
            placeholder="Your matches will see this."
            className="flex-1 min-w-0 bg-transparent text-base text-white placeholder:text-zinc-500 focus:outline-none resize-none leading-6 py-2 max-h-32"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={answer.trim().length < 15 || submitting}
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