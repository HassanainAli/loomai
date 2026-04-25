import { MATCHES, Match } from "../types";

export function Queue({ onOpen }: { onOpen: (m: Match) => void }) {
  return (
    <div className="flex flex-col h-full p-8 pt-14 overflow-y-auto">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
        8:00 PM Drop
      </p>
      <h2 className="text-3xl font-black tracking-tight mb-1">
        Your Curated Matches.
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        Two people. Hand-picked by the engine. That's it for today.
      </p>

      <div className="space-y-4">
        {MATCHES.map((m) => (
          <div
            key={m.id}
            className="bg-card border-2 border-border rounded-3xl p-5"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-300 to-neutral-500" />
              <div>
                <h3 className="text-xl font-black tracking-tight">{m.name}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {m.age} · {m.major}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpen(m)}
              className="w-full bg-foreground text-background font-bold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              View Full Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}