import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { secondsUntilPacific8pm, showSkipToDrop } from "../flow";

export function Anticipation({ onDrop, isGuest = false }: { onDrop: () => void; isGuest?: boolean }) {
  const [seconds, setSeconds] = useState<number | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    const tick = () => {
      const next = secondsUntilPacific8pm();
      setSeconds((prev) => {
        // The countdown wraps to ~24h right after 8 PM: that's the drop moment.
        if (!isGuest && !fired.current && prev !== null && next > prev) {
          fired.current = true;
          setTimeout(onDrop, 3000); // give the nightly drop a moment to finish
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
    <div className="flex flex-col h-full p-8 pt-14 overflow-y-auto">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
        Drop at 8:00 PM Pacific
      </p>
      <div className="text-6xl font-black tracking-tight tabular-nums leading-none">
        {seconds === null ? "--:--:--" : `${h}:${m}:${s}`}
      </div>
      <p className="text-sm text-muted-foreground mt-4 max-w-[14rem] leading-relaxed">
        Your daily prompt is locked. The engine is analyzing the campus pool.
      </p>

      <div className="flex-1 flex flex-col justify-center gap-4 my-8">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-secondary border border-border rounded-3xl p-6 h-32 flex items-center gap-4 relative overflow-hidden"
          >
            <div className="absolute inset-0 backdrop-blur-md bg-secondary/60" />
            <div className="w-20 h-20 rounded-2xl bg-muted relative z-10" />
            <div className="flex-1 relative z-10 space-y-2">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
            <Lock className="w-5 h-5 text-muted-foreground relative z-10" />
          </div>
        ))}
      </div>

      {showSkipToDrop(isGuest) && (
        <button
          onClick={onDrop}
          className="text-xs uppercase tracking-widest text-muted-foreground font-bold py-3"
        >
          ⏭ Skip to drop (demo)
        </button>
      )}
    </div>
  );
}
