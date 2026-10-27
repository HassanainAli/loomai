import { useEffect, useState } from "react";
import { MATCHES, Match, MatchRow, rowToMatch, DropState, emptyQueueMessage } from "../types";
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
  const [dropState, setDropState] = useState<DropState | null>(null);

  useEffect(() => {
    if (isGuest) return; // GUEST MODE: sample matches
    let cancelled = false;
    const sb = supabase as any;
    sb.rpc("get_my_matches").then(({ data, error }: any) => {
      if (cancelled) return;
      if (error) setError("Couldn't load your matches. Try again.");
      else
        setMatches(
          ((data ?? []) as MatchRow[])
            .map(rowToMatch)
            .filter((m) => m.status === "pending" || m.status === "waiting" || m.status === "mutual"),
        );
    });
    sb.rpc("get_drop_state").then(({ data }: any) => {
      if (!cancelled && data?.[0]) setDropState(data[0] as DropState);
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
            {emptyQueueMessage(dropState)}
          </p>
          {onGoToPrompt && !dropState?.answered_today && !dropState?.in_active_chat && (
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
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-300 to-neutral-500">
                {!!m.unread && (
                  <span
                    aria-label="New messages"
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary ring-2 ring-card"
                  />
                )}
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">{m.name}</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {m.age ? `${m.age} · ` : ""}
                  {m.major}
                  {m.similarity !== undefined ? ` · ${m.similarity}% aligned` : ""}
                </p>
                {m.status === "waiting" && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                    Waiting on them
                  </p>
                )}
                {m.status === "mutual" && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">
                    It's a match
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => onOpen(m)}
              className="w-full bg-foreground text-background font-bold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              {m.status === "mutual" ? "Open chat" : "View Full Profile"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
