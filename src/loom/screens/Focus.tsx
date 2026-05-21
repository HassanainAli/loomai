import { useState } from "react";
import { X } from "lucide-react";
import { Match } from "../types";
import { Profile } from "./Profile";

interface Msg {
  from: "me" | "them";
  text: string;
}

// Local blacklist of user-id pairs that should never be matched again.
const blacklistedPairs: Array<[string, string]> = [];
const CURRENT_USER_ID = "me";

export function Focus({
  match,
  onEject,
}: {
  match: Match;
  onEject: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    { from: "them", text: `Okay, brunch is a scam — I respect the take.` },
    { from: "me", text: "Thank you. Finally someone gets it." },
    {
      from: "them",
      text: "What do you actually like to cook on a Sunday?",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [ejecting, setEjecting] = useState(false);
  const [matchStatus, setMatchStatus] = useState<"active" | "expired">("active");

  function handleEject() {
    // Lock the chat by transitioning match status to expired
    setMatchStatus("expired");
    // Blacklist this pair from future daily match loops
    blacklistedPairs.push([CURRENT_USER_ID, match.id]);
    setEjecting(false);
    onEject();
  }

  function send() {
    if (!draft.trim() || matchStatus === "expired") return;
    setMessages([...messages, { from: "me", text: draft.trim() }]);
    setDraft("");
  }

  if (showProfile) {
    return (
      <Profile match={match} hideActions onBack={() => setShowProfile(false)} />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border p-4 flex items-center justify-between bg-background">
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
        <button
          onClick={() => setEjecting(true)}
          className="text-xs font-bold border border-border rounded-full px-3 py-1.5 hover:bg-secondary transition-colors"
        >
          End Connection
        </button>
      </div>

      <div className="px-4 py-2 bg-primary/20 border-b border-border">
        <p className="text-[10px] font-black uppercase tracking-widest text-center">
          Focus Mode · Daily matching paused
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm border border-white ${
                m.from === "me"
                  ? "bg-foreground text-background rounded-br-md"
                  : "bg-black text-white rounded-bl-md"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={matchStatus === "expired" ? "Connection ended" : "Message…"}
          disabled={matchStatus === "expired"}
          className="flex-1 bg-secondary border border-border rounded-full px-5 py-3 text-sm focus:outline-none focus:border-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={send}
          disabled={matchStatus === "expired"}
          className="bg-primary text-primary-foreground font-bold px-5 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>

      {ejecting && (
        <div className="absolute inset-0 bg-foreground/60 flex items-end sm:items-center justify-center z-50">
          <div className="bg-background w-full sm:w-[90%] sm:rounded-3xl rounded-t-3xl p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-black tracking-tight">
                End this connection?
              </h3>
              <button onClick={() => setEjecting(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Calibrating engine. Please log the primary vector mismatch reason
              below. This session data will be permanently cleared.
            </p>
            <div className="space-y-2">
              {["No spark", "Ghosted", "Met someone offline", "Other"].map(
                (r) => (
                  <button
                    key={r}
                    onClick={handleEject}
                    className="w-full text-left p-4 rounded-2xl border-2 border-border font-semibold text-sm hover:border-foreground transition-colors"
                  >
                    {r}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}