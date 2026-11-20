import { useEffect, useState } from "react";
import { ChevronRight, LifeBuoy, LogOut, Trash2, X } from "lucide-react";
import { guestCard } from "./guest/mockProfile"; // GUEST MODE
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import { EditProfile } from "./EditProfile";
import { SEED_PROMPTS } from "./screens/Onboard2";
import { Profile } from "./screens/Profile";
import { ageFromDob, capFirst, type Match } from "./types";
import type { UserSpec } from "./types";

export const SUPPORT_EMAIL = "support@tryloom.cc";

type View = "menu" | "edit" | "help" | "delete" | "preview";

const FAQ = [
  ["When do matches drop?", "Every night at 8:00 PM Pacific. Answer the day's prompt before then to be included."],
  ["Why didn't I get a match?", "Some nights there isn't a strong fit. We'd rather skip a night than send someone random."],
  ["How does Focus Mode work?", "When you both greenlight, a private chat opens. It closes if neither of you writes for 48 hours."],
];

function Sheet({ title, onClose, children }: { title?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute right-4 top-24 w-[calc(100%-2rem)] max-w-xs max-h-[75%] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl origin-top-right animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        {title && <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black tracking-tight text-foreground">{title}</h3>
          <button aria-label="Close" onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>}
        {children}
      </div>
    </div>
  );
}

export function AccountMenu({ open, onClose, userId, userSpec, onUpdateUserSpec, isGuest = false }: {
  open: boolean;
  isGuest?: boolean; // GUEST MODE
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
  const [me, setMe] = useState<Match | null>(null);

  // Load the user's own card (as matches see it) whenever the menu opens.
  useEffect(() => {
    if (open && isGuest) { setMe(guestCard()); return; } // GUEST MODE
    if (!open || !userId) return;
    let off = false;
    (async () => {
      const [{ data: u }, { data: p }, { data: m }] = await Promise.all([
        supabase.auth.getUser(),
        (supabase as any).from("profiles").select("display_name, campus_hub, major, class_year, hobbies, seed_prompts").eq("id", userId).maybeSingle(),
        (supabase as any).from("matching_preferences").select("intention").eq("user_id", userId).limit(1).maybeSingle(),
      ]);
      if (off) return;
      const saved: any[] = Array.isArray(p?.seed_prompts) ? p.seed_prompts : [];
      const ans = SEED_PROMPTS.map((q, i) => (saved.find((x) => x?.q === q)?.a ?? saved[i]?.a ?? "") as string);
      const intention = m?.intention === "committed" ? "Long-term relationship" : m?.intention === "intentional" ? "Dating, open to seeing where it goes" : "";
      setMe({
        id: "me",
        name: p?.display_name || userSpec.name || "You",
        age: ageFromDob(u.user?.user_metadata?.date_of_birth as string | undefined) ?? 0,
        major: [p?.class_year, capFirst(p?.major ?? "")].filter(Boolean).join(" · "),
        location: p?.campus_hub ?? userSpec.campus,
        intention,
        hobbies: (Array.isArray(p?.hobbies) ? p.hobbies : []).map(capFirst),
        whyMatched: "This is how your card looks to tonight's matches.",
        dailyAnswer: "",
        conflictAnswer: ans[0], sundayAnswer: ans[1], pace: ans[2],
      });
    })();
    return () => { off = true; };
  }, [open, userId, view, isGuest]);

  if (!open) return null;
  const close = () => { setView("menu"); setError(null); setConfirm(""); onClose(); };

  if (view === "edit") {
    return (
      <EditProfile isGuest={isGuest} userId={userId} userSpec={userSpec} onUpdateUserSpec={onUpdateUserSpec}
        onClose={() => setView("menu")} />
    );
  }

  if (view === "preview" && me) {
    return (
      <div className="absolute inset-0 z-50 bg-background">
        <Profile match={me} preview onBack={() => setView("menu")} />
      </div>
    );
  }

  async function doDelete() {
    setBusy(true); setError(null);
    const res = isGuest ? ({ ok: false as const }) : await runDelete().catch(() => ({ ok: false as const }));
    if (!res.ok) { setBusy(false); setError("Couldn't delete your account. Try again."); return; }
    await supabase.auth.signOut();
  }

  const row = "w-full flex items-center gap-3 py-3 text-left text-sm font-semibold";
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
    <Sheet onClose={close}>
      <div className="mb-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="truncate text-xl font-black tracking-tight text-foreground mb-3">{me?.name || userSpec.name || "Your profile"}</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => me && setView("preview")} disabled={!me}
            className="rounded-full border border-[#FF2BD6]/50 py-2 text-xs font-bold text-foreground hover:bg-[#FF2BD6]/10 disabled:opacity-50">Preview</button>
          <button onClick={() => setView("edit")}
            className="rounded-full border border-zinc-700 py-2 text-xs font-bold text-foreground hover:border-zinc-500">Edit</button>
        </div>
      </div>
      <div className="divide-y divide-zinc-900">
        <button className={`${row} text-foreground`} onClick={() => setView("help")}><LifeBuoy className="w-4 h-4 text-zinc-400" />Help & support<ChevronRight className="ml-auto w-4 h-4 text-zinc-600" /></button>
        <button className={`${row} text-foreground`} onClick={() => (isGuest ? close() : supabase.auth.signOut())}><LogOut className="w-4 h-4 text-zinc-400" />Sign out</button>
        <button className={`${row} -mx-2 px-2 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-500/10`} onClick={() => setView("delete")}><Trash2 className="w-4 h-4" />Delete account</button>
      </div>
    </Sheet>
  );
}
