import { useEffect, useState } from "react";
import { MATCHES, Match, MatchRow, rowToMatch } from "../types";
import { supabase } from "@/integrations/supabase/client";

export function Queue({
  onOpen,
  isGuest = false,
  onGoToPrompt,
}: {
  onOpen: (m: Match) => void;
  isGuest?: boolean;
  onGoToPrompt?: () => void;
}) {
  const [matches, setMatches] = useState<Match[] | null>(isGuest ? MATCHES : null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isGuest) return; // GUEST MODE: sample matches
    let cancelled = false;
    (supabase as any).rpc("get_my_matches").then(({ data, error }: any) => {
      if (cancelled) return;
      if (error) setError("Couldn't load your matches. Try again.");
      else setMatches(((data ?? []) as MatchRow[]).map(rowToMatch));
    });
    return () => {
      cancelled = true;
    };
  }, [isGuest]);

  return (
    <div className="flex flex-col h-full p-8 pt-14 overflow-y-auto">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
        8:00 PM Drop
      </p>
      <h2 className="text-3xl font-black tracking-tight mb-1">
        Your Curated Matches.
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        Up to two people. Picked by the engine. That's it for today.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {!error && matches === null && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}
      {!error && matches?.length === 0 && (
        <div className="bg-card border-2 border-border rounded-3xl p-6 text-center">
          <h3 className="text-xl font-black tracking-tight mb-2">No matches yet.</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Answer today's prompt before 8 PM to enter tonight's drop.
          </p>
          {onGoToPrompt && (
            <button
              onClick={onGoToPrompt}
              className="w-full bg-foreground text-background font-bold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Go to today's prompt
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {matches?.map((m) => (
          <div key={m.id} className="bg-card border-2 border-border rounded-3xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-300 to-neutral-500" />
              <div>
                <h3 className="text-xl font-black tracking-tight">{m.name}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {m.age ? `${m.age} · ` : ""}
                  {m.major}
                  {m.similarity !== undefined ? ` · ${m.similarity}% aligned` : ""}
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
