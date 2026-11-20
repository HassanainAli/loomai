import { useState } from "react";
import { ChevronRight, LifeBuoy, LogOut, Pencil, Trash2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import { EditProfile } from "./EditProfile";
import type { UserSpec } from "./types";

export const SUPPORT_EMAIL = "support@tryloom.cc";

type View = "menu" | "edit" | "help" | "delete";

const FAQ = [
  ["When do matches drop?", "Every night at 8:00 PM Pacific. Answer the day's prompt before then to be included."],
  ["Why didn't I get a match?", "Some nights there isn't a strong fit. We'd rather skip a night than send someone random."],
  ["How does Focus Mode work?", "When you both greenlight, a private chat opens. It closes if neither of you writes for 48 hours."],
];

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div className="w-full max-h-[85%] overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-zinc-950 px-6 pt-3 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black tracking-tight text-foreground">{title}</h3>
          <button aria-label="Close" onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AccountMenu({ open, onClose, userId, userSpec, onUpdateUserSpec }: {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  userSpec: UserSpec;
  onUpdateUserSpec: (patch: Partial<UserSpec>) => void;
}) {
  const [view, setView] = useState<View>("menu");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const runDelete = useServerFn(deleteMyAccount);

  if (!open) return null;
  const close = () => { setView("menu"); setError(null); setConfirm(""); onClose(); };

  if (view === "edit") {
    return (
      <EditProfile userId={userId} userSpec={userSpec} onUpdateUserSpec={onUpdateUserSpec}
        onClose={(saved) => { if (saved) close(); else setView("menu"); }} />
    );
  }

  async function doDelete() {
    setBusy(true); setError(null);
    const res = await runDelete().catch(() => ({ ok: false as const }));
    if (!res.ok) { setBusy(false); setError("Couldn't delete your account. Try again."); return; }
    await supabase.auth.signOut();
  }

  const row = "w-full flex items-center gap-3 py-3.5 text-left text-sm font-semibold text-foreground";
  const mail = (subject: string) => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;

  if (view === "help") {
    return (
      <Sheet title="Help & support" onClose={close}>
        <div className="space-y-2 mb-5">
          <a href={mail("Loom support")} className="block rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm font-semibold text-foreground hover:border-zinc-600">
            Email support
            <span className="block text-xs font-normal text-muted-foreground mt-0.5">{SUPPORT_EMAIL}</span>
          </a>
          <a href={mail("Safety report")} className="block rounded-xl border border-[#FF2BD6]/40 bg-[#FF2BD6]/5 px-4 py-3 text-sm font-semibold text-foreground hover:border-[#FF2BD6]">
            Report a safety concern
            <span className="block text-xs font-normal text-muted-foreground mt-0.5">In an emergency, call 911 first.</span>
          </a>
        </div>
        <div className="divide-y divide-zinc-900 border-y border-zinc-900 mb-5">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground">
                {q}<ChevronRight className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <a href="/terms" target="_blank" rel="noreferrer" className="hover:text-foreground underline underline-offset-4">Terms</a>
          <a href="/privacy" target="_blank" rel="noreferrer" className="hover:text-foreground underline underline-offset-4">Privacy</a>
        </div>
        <button onClick={() => setView("menu")} className="mt-5 text-sm text-zinc-500">Back</button>
      </Sheet>
    );
  }

  if (view === "delete") {
    return (
      <Sheet title="Delete account" onClose={close}>
        <p className="text-sm text-zinc-300 leading-relaxed mb-4">
          This permanently removes your profile, prompt answers, matches, and chats. You won't be in future drops. This can't be undone.
        </p>
        <label className="text-xs text-muted-foreground">Type DELETE to confirm
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoCapitalize="characters"
            className="mt-1.5 w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#FACC15]" />
        </label>
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        <button disabled={busy || confirm !== "DELETE"} onClick={doDelete} className="mt-4 w-full rounded-full bg-destructive text-destructive-foreground py-3 font-bold disabled:opacity-40">
          {busy ? "Deleting…" : "Delete my account"}
        </button>
        <button onClick={() => setView("menu")} className="mt-3 w-full text-sm text-zinc-500">Cancel</button>
      </Sheet>
    );
  }

  return (
    <Sheet title="Account" onClose={close}>
      <div className="divide-y divide-zinc-900">
        <button className={row} onClick={() => setView("edit")}><Pencil className="w-4 h-4 text-zinc-400" />Edit profile<ChevronRight className="ml-auto w-4 h-4 text-zinc-600" /></button>
        <button className={row} onClick={() => setView("help")}><LifeBuoy className="w-4 h-4 text-zinc-400" />Help & support<ChevronRight className="ml-auto w-4 h-4 text-zinc-600" /></button>
        <button className={row} onClick={() => supabase.auth.signOut()}><LogOut className="w-4 h-4 text-zinc-400" />Sign out</button>
        <button className={`${row} text-destructive`} onClick={() => setView("delete")}><Trash2 className="w-4 h-4" />Delete account</button>
      </div>
    </Sheet>
  );
}
