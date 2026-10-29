import { useEffect, useRef, useState } from "react";
import { X, ArrowUp } from "lucide-react";
import { Match, MAX_MESSAGE_LENGTH, cleanMessage } from "../types";
import { Profile } from "./Profile";
import { supabase } from "@/integrations/supabase/client";

interface Msg {
  id: string;
  from: "me" | "them";
  text: string;
  failed?: boolean;
}

interface Row {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

// GUEST MODE: sample conversation shown without a real match.
const GUEST_MESSAGES: Msg[] = [
  { id: "g1", from: "them", text: "Okay, brunch is a scam — I respect the take." },
  { id: "g2", from: "me", text: "Thank you. Finally someone gets it." },
  { id: "g3", from: "them", text: "What do you actually like to cook on a Sunday?" },
];

export function Focus({
  match,
  onEject,
  userId,
  isGuest = false,
}: {
  match: Match;
  onEject: () => void;
  userId: string | null;
  isGuest?: boolean;
}) {
  const threadId = match.threadId;
  const live = !isGuest && !!threadId && !!userId;
  const [messages, setMessages] = useState<Msg[]>(live ? [] : GUEST_MESSAGES);
  const [draft, setDraft] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [ejecting, setEjecting] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [ejectNote, setEjectNote] = useState("");
  const [ended, setEnded] = useState(false);
  const [autoEnded, setAutoEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const toMsg = (r: Row): Msg => ({
    id: r.id,
    from: r.sender_id === userId ? "me" : "them",
    text: r.body,
  });

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    const sb = supabase as any;

    sb.from("match_messages")
      .select("id, sender_id, body, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .then(({ data }: { data: Row[] | null }) => {
        if (!cancelled && data) setMessages(data.map(toMsg));
      });
    sb.from("match_threads")
      .select("status, ended_by")
      .eq("id", threadId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!cancelled && data?.status === "ended") {
          setEnded(true);
          if (!data.ended_by) setAutoEnded(true);
        }
      });
    sb.rpc("mark_thread_read", { p_thread: threadId });

    const channel = supabase
      .channel(`thread-${threadId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "match_messages", filter: `thread_id=eq.${threadId}` },
        (payload: any) => {
          const r = payload.new as Row;
          setMessages((prev) => (prev.some((m) => m.id === r.id) ? prev : [...prev, toMsg(r)]));
          if (r.sender_id !== userId) sb.rpc("mark_thread_read", { p_thread: threadId });
        },
      )
      .on(
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table: "match_threads", filter: `id=eq.${threadId}` },
        (payload: any) => {
          if (payload.new?.status === "ended") {
            setEnded(true);
            if (!payload.new.ended_by) setAutoEnded(true);
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, threadId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleEject(reason: string, note: string) {
    if (live) {
      const { error } = await (supabase as any).rpc("end_connection", {
        p_thread: threadId,
        p_reason: reason,
        p_note: note,
      });
      if (error) {
        setError("Couldn't end the connection. Try again.");
        return;
      }
    }
    setEjecting(false);
    setSelectedReason(null);
    setEjectNote("");
    onEject();
  }

  async function deliver(text: string, tempId: string) {
    const { data, error } = await (supabase as any)
      .from("match_messages")
      .insert({ thread_id: threadId, sender_id: userId, body: text })
      .select("id, sender_id, body, created_at")
      .single();
    if (error) {
      if (/ended/i.test(error.message)) {
        setEnded(true);
        setError("This connection has ended.");
      }
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, failed: true } : m)));
      return;
    }
    setMessages((prev) => {
      const without = prev.filter((m) => m.id !== tempId);
      return without.some((m) => m.id === data.id) ? without : [...without, toMsg(data)];
    });
  }

  async function send() {
    const text = cleanMessage(draft);
    if (!text || ended) return;
    setDraft("");
    setError(null);
    const tempId = `l${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, from: "me", text }]);
    if (live) await deliver(text, tempId);
  }

  function retry(m: Msg) {
    if (ended) return;
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, failed: false } : x)));
    deliver(m.text, m.id);
  }

  if (showProfile) {
    return <Profile match={match} hideActions onBack={() => setShowProfile(false)} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 pt-12 pb-3 flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-300 to-neutral-500" />
          <div>
            <p className="font-black text-base leading-tight">{match.name}</p>
            <button
              onClick={() => setShowProfile(true)}
              className="text-xs text-muted-foreground underline underline-offset-2"
            >
              View Profile
            </button>
          </div>
        </div>
        {ended ? (
          <button
            onClick={onEject}
            className="text-xs font-bold border border-border rounded-full px-3 py-1.5 hover:bg-secondary transition-colors"
          >
            Back to matches
          </button>
        ) : (
          <button
            onClick={() => setEjecting(true)}
            className="text-xs font-bold border border-border rounded-full px-3 py-1.5 hover:bg-secondary transition-colors"
          >
            End Connection
          </button>
        )}
      </div>

      <div className="px-4 py-2 bg-primary/20 border-b border-border">
        <p className="text-[10px] font-black uppercase tracking-widest text-center">
          {autoEnded ? "This connection ended after 48 hours of quiet" : ended ? "This connection has ended" : "Focus Mode · Daily matching paused"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !ended && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            You both said yes. Say hi.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm border border-border break-words ${
                m.from === "me"
                  ? "bg-foreground text-background rounded-br-md"
                  : "bg-card text-card-foreground rounded-bl-md"
              }`}
            >
              {m.text}
            </div>
            {m.failed && (
              <button onClick={() => retry(m)} className="self-end ml-2 text-[11px] text-destructive underline underline-offset-2">
                Didn't send - tap to retry
              </button>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 pb-1 text-xs text-destructive">{error}</p>}
      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={ended ? "Connection ended" : "Message…"}
          disabled={ended}
          className="flex-1 bg-secondary border border-border rounded-full px-5 py-3 text-base focus:outline-none focus:border-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={send}
          disabled={ended}
          className="bg-primary text-primary-foreground font-bold px-5 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>

      {ejecting && (
        <div className="absolute inset-0 bg-foreground/60 flex items-end sm:items-center justify-center z-50">
          <div className="bg-background w-full sm:w-[90%] sm:rounded-3xl rounded-t-3xl p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-black tracking-tight">End this connection?</h3>
              <button onClick={() => setEjecting(false)} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              The chat closes for both of you and you won't be matched again. Tell us why so the
              engine gets better.
            </p>
            <div className="space-y-2">
              {["No spark", "Ghosted", "Met someone offline", "Report user", "Other"].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedReason(r)}
                  className={`w-full text-left p-4 rounded-2xl border-2 font-sans text-sm transition-colors ${
                    selectedReason === r
                      ? "border-foreground bg-secondary"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {selectedReason && (
              <div className="mt-4 relative flex items-center w-full bg-secondary border border-border rounded-full pl-5 pr-1.5 py-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  type="text"
                  value={ejectNote}
                  onChange={(e) => setEjectNote(e.target.value)}
                  maxLength={500}
                  onKeyDown={(e) => e.key === "Enter" && handleEject(selectedReason, ejectNote.trim())}
                  placeholder="Anything specific the system should note? (Optional)"
                  className="flex-1 bg-transparent text-base text-foreground font-sans placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={() => handleEject(selectedReason, ejectNote.trim())}
                  className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
                  aria-label="Submit"
                >
                  <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
