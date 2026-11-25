// TEMPORARY guest preview mode. To remove: delete this folder and the
// lines marked "GUEST MODE" in src/routes/index.tsx and Auth.tsx.
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GUEST_JOURNEY, GUEST_ACCOUNT_SCREENS, guestAdjacentScreen, type GuestScreen } from "./navigation";

export const GUEST_MODE_ENABLED = true;

export const GUEST_SCREENS = [...GUEST_JOURNEY, ...GUEST_ACCOUNT_SCREENS];

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
  screen: GuestScreen;
  onJump: (s: GuestScreen) => void;
  onExit: () => void;
}) {
  const prev = guestAdjacentScreen(screen, "previous");
  const next = guestAdjacentScreen(screen, "next");
  return (
    <div data-guest-bar className="absolute left-1/2 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[60] -translate-x-1/2 flex items-center gap-1 rounded-full border border-border bg-background/85 px-2 py-1 text-xs text-foreground shadow-lg backdrop-blur">
      <Button variant="ghost" aria-label="Previous screen" title="Previous screen" disabled={!prev} onClick={() => prev && onJump(prev)} className="h-auto p-1 disabled:opacity-30">
        <ChevronLeft size={14} />
      </Button>
      <select
        aria-label="Jump to screen"
        value={screen}
        onChange={(e) => onJump(e.target.value as GuestScreen)}
        className="min-w-0 max-w-[210px] bg-transparent text-xs outline-none"
      >
        <optgroup label="Main journey" className="bg-background">
          {GUEST_JOURNEY.map((s) => (
            <option key={s.id} value={s.id} className="bg-background">Guest · {s.label}</option>
          ))}
        </optgroup>
        <optgroup label="Account menu (optional)" className="bg-background">
          {GUEST_ACCOUNT_SCREENS.map((s) => (
            <option key={s.id} value={s.id} className="bg-background">Guest · {s.label}</option>
          ))}
        </optgroup>
      </select>
      <Button variant="ghost" aria-label="Next screen" title={screen === "focus" ? "Back to Daily prompt" : "Next screen"} disabled={!next} onClick={() => next && onJump(next)} className="h-auto p-1 disabled:opacity-30">
        <ChevronRight size={14} />
      </Button>
      <Button variant="ghost" aria-label="Exit guest preview" title="Exit guest preview" onClick={onExit} className="ml-1 h-auto p-1 text-muted-foreground hover:text-primary">
        <X size={14} />
      </Button>
    </div>
  );
}
