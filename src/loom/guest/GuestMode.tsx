// TEMPORARY guest preview mode. To remove: delete this folder and the
// lines marked "GUEST MODE" in src/routes/index.tsx and Auth.tsx.
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Screen } from "../types";

export const GUEST_MODE_ENABLED = true;

export const GUEST_SCREENS: { id: Screen; label: string }[] = [
  { id: "auth", label: "Sign in" },
  { id: "onboard1", label: "Onboarding 1" },
  { id: "onboard2", label: "Onboarding 2" },
  { id: "onboard3", label: "Onboarding 3" },
  { id: "specSheet", label: "Spec sheet" },
  { id: "dailyGate", label: "Daily prompt" },
  { id: "anticipation", label: "8pm drop" },
  { id: "queue", label: "Match queue" },
  { id: "profile", label: "Match profile" },
  { id: "focus", label: "Focus chat" },
];

export function GuestEntryLink({ onClick }: { onClick: () => void }) {
  if (!GUEST_MODE_ENABLED) return null;
  return (
    <p className="mt-4 text-center">
      <button
        type="button"
        onClick={onClick}
        className="text-xs text-white/40 underline underline-offset-4 hover:text-[#ff2bd6]"
      >
        Just looking around? Preview as guest →
      </button>
    </p>
  );
}

export function ReviewerBar({
  screen,
  onJump,
  onExit,
}: {
  screen: Screen;
  onJump: (s: Screen) => void;
  onExit: () => void;
}) {
  const idx = Math.max(0, GUEST_SCREENS.findIndex((s) => s.id === screen));
  const prev = GUEST_SCREENS[idx - 1];
  const next = GUEST_SCREENS[idx + 1];
  return (
    <div className="absolute left-1/2 top-3 z-50 -translate-x-1/2 flex items-center gap-1 rounded-full border border-white/15 bg-black/85 px-2 py-1 text-xs text-white shadow-lg backdrop-blur">
      <button aria-label="Previous screen" disabled={!prev} onClick={() => prev && onJump(prev.id)} className="p-1 disabled:opacity-30">
        <ChevronLeft size={14} />
      </button>
      <select
        aria-label="Jump to screen"
        value={GUEST_SCREENS[idx].id}
        onChange={(e) => onJump(e.target.value as Screen)}
        className="bg-transparent text-xs outline-none"
      >
        {GUEST_SCREENS.map((s) => (
          <option key={s.id} value={s.id} className="bg-black">
            Guest · {s.label}
          </option>
        ))}
      </select>
      <button aria-label="Next screen" disabled={!next} onClick={() => next && onJump(next.id)} className="p-1 disabled:opacity-30">
        <ChevronRight size={14} />
      </button>
      <button aria-label="Exit guest preview" onClick={onExit} className="ml-1 p-1 text-white/60 hover:text-[#ff2bd6]">
        <X size={14} />
      </button>
    </div>
  );
}
