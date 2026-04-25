import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

export function Anticipation({ onDrop }: { onDrop: () => void }) {
  const [seconds, setSeconds] = useState(4 * 3600 + 22 * 60 + 10);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex flex-col h-full p-8 pt-14">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
        Drop at 8:00 PM
      </p>
      <div className="text-6xl font-black tracking-tighter tabular-nums leading-none">
        {h}:{m}:{s}
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

      <button
        onClick={onDrop}
        className="text-xs uppercase tracking-widest text-muted-foreground font-bold py-3"
      >
        ⏭ Skip to drop (demo)
      </button>
    </div>
  );
}