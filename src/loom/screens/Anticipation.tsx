import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Nebula, type SignalPhase } from "../Nebula";
import { supabase } from "@/integrations/supabase/client";
import { secondsUntilPacific8pm, showSkipToDrop } from "../flow";

export function Anticipation({ onDrop, isGuest = false }: { onDrop: () => void; isGuest?: boolean }) {
  const [seconds, setSeconds] = useState<number | null>(null);
  const fired = useRef(false);
  const [phase, setPhase] = useState<SignalPhase>("idle");

  // Align the two focal nodes, then hand off to the queue.
  const reveal = () => {
    setPhase("aligned");
    setTimeout(onDrop, 1600);
  };

  // Drop is running: poll until this student's matches land (usually ~1 minute).
  useEffect(() => {
    if (phase !== "sync") return;
    if (isGuest) {
      const t = setTimeout(reveal, 3200);
      return () => clearTimeout(t);
    }
    let stopped = false;
    const started = Date.now();
    const check = async () => {
      const { data } = await (supabase as any).rpc("get_my_matches");
      if (stopped) return;
      const ready = (data ?? []).some((m: any) => ["pending", "waiting", "mutual"].includes(m.status));
      // After ~3 minutes, show the queue anyway (it explains empty drops).
      if (ready || Date.now() - started > 180_000) {
        stopped = true;
        reveal();
      }
    };
    const id = setInterval(check, 7000);
    const first = setTimeout(check, 3000);
    return () => {
      stopped = true;
      clearInterval(id);
      clearTimeout(first);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isGuest]);

  useEffect(() => {
    const tick = () => {
      const next = secondsUntilPacific8pm();
      setSeconds((prev) => {
        // The countdown wraps to ~24h right after 8 PM: that's the drop moment.
        if (!isGuest && !fired.current && prev !== null && next > prev) {
          fired.current = true;
          setPhase("sync");
        }
        return next;
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isGuest, onDrop]);

  const sec = seconds ?? 0;
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");

  return (
    <div className="relative flex flex-col h-full p-8 pt-14 overflow-y-auto">
      <Nebula phase={phase} />
      {phase === "idle" ? (
        <div key="idle">
          <p className="relative text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Drop at 8:00 PM Pacific
          </p>
          <div className="relative text-6xl font-black tracking-tight tabular-nums leading-none">
            {seconds === null ? "--:--:--" : `${h}:${m}:${s}`}
          </div>
          <p className="relative text-sm text-muted-foreground mt-4 max-w-[14rem] leading-relaxed">
            Your daily prompt is locked. The engine is analyzing the campus pool.
          </p>
        </div>
      ) : (
        <div key="sync" className="relative nn-fade-swap" role="status" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-wider text-signal mb-3">
            {phase === "aligned" ? "Drop ready" : "8:00 PM drop"}
          </p>
          <h2 className="text-4xl font-black tracking-tight leading-[1.05]">
            {phase === "aligned" ? "Your matches are in." : "Syncing tonight's drop."}
          </h2>
          <p className="text-sm text-muted-foreground mt-4 max-w-[16rem] leading-relaxed">
            {phase === "aligned"
              ? "Opening your queue."
              : "The drop is running across campus. This usually takes about a minute."}
          </p>
        </div>
      )}

      <div className="relative flex-1 flex flex-col justify-center gap-4 my-8">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`bg-secondary border rounded-3xl p-6 h-32 flex items-center gap-4 relative overflow-hidden transition-colors duration-700 ${
              phase === "aligned" ? "border-signal/60 shadow-[0_0_24px_-8px_var(--signal)]" : "border-border"
            }`}
          >
            {phase === "sync" && (
              <div
                className="absolute inset-0 z-20 nn-card-syncing border border-signal/40 rounded-3xl"
                style={{ animationDelay: `${i * 0.9}s` }}
              />
            )}
            <div className="absolute inset-0 backdrop-blur-md bg-secondary/60" />
            <div className="w-20 h-20 rounded-2xl bg-muted relative z-10" />
            <div className="flex-1 relative z-10 space-y-2">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
            <Lock
              className={`w-5 h-5 relative z-10 transition-all duration-500 ${
                phase === "aligned" ? "opacity-0 scale-50 text-signal" : "text-muted-foreground"
              }`}
            />
          </div>
        ))}
      </div>

      {showSkipToDrop(isGuest) && phase === "idle" && (
        <button
          onClick={() => setPhase("sync")}
          className="relative text-xs uppercase tracking-widest text-muted-foreground font-bold py-3"
        >
          ⏭ Skip to drop (demo)
        </button>
      )}
    </div>
  );
}
