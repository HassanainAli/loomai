import { useState } from "react";
import { X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import { CLASS_YEARS, MAX_HOBBIES, type UserSpec } from "./types";

type View = "menu" | "edit" | "delete";

export function AccountMenu({
  open,
  onClose,
  userId,
  userSpec,
  onUpdateUserSpec,
}: {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  userSpec: UserSpec;
  onUpdateUserSpec: (patch: Partial<UserSpec>) => void;
}) {
  const [view, setView] = useState<View>("menu");
  const [major, setMajor] = useState(userSpec.major);
  const [classYear, setClassYear] = useState(userSpec.classYear);
  const [hobbies, setHobbies] = useState(userSpec.hobbies.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const runDelete = useServerFn(deleteMyAccount);

  if (!open) return null;
  const close = () => { setView("menu"); setError(null); setConfirm(""); onClose(); };

  async function save() {
    const tags = hobbies.split(",").map((h) => h.trim()).filter(Boolean).slice(0, MAX_HOBBIES)
      .map((h) => h.charAt(0).toUpperCase() + h.slice(1));
    const m = major.trim() ? major.trim().charAt(0).toUpperCase() + major.trim().slice(1) : "";
    setBusy(true); setError(null);
    if (userId) {
      const { error } = await (supabase as any).from("profiles")
        .update({ major: m || null, class_year: classYear || null, hobbies: tags }).eq("id", userId);
      if (error) { setBusy(false); setError("Couldn't save. Try again."); return; }
    }
    onUpdateUserSpec({ major: m, classYear, hobbies: tags });
    setBusy(false);
    close();
  }

  async function doDelete() {
    setBusy(true); setError(null);
    const res = await runDelete().catch(() => ({ ok: false as const }));
    if (!res.ok) { setBusy(false); setError("Couldn't delete your account. Try again."); return; }
    await supabase.auth.signOut();
  }

  const item = "w-full text-left py-4 border-b border-border text-white font-sans text-base";
  const input = "w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-yellow-400";

  return (
    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end" onClick={close}>
      <div className="h-full w-[85%] bg-background border-l border-border px-6 pt-12 pb-8 flex flex-col overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black tracking-tight text-white font-sans">
            {view === "menu" ? "Account" : view === "edit" ? "Edit profile" : "Delete account"}
          </h3>
          <button aria-label="Close" onClick={close} className="p-2 -mr-2 text-zinc-500"><X className="w-5 h-5" /></button>
        </div>

        {view === "menu" && (
          <div>
            <button className={item} onClick={() => setView("edit")}>Edit profile</button>
            <button className={item} onClick={() => supabase.auth.signOut()}>Sign out</button>
            <button className={`${item} text-destructive border-b-0`} onClick={() => setView("delete")}>Delete account</button>
          </div>
        )}

        {view === "edit" && (
          <div className="flex flex-col gap-4">
            <label className="text-sm text-zinc-400 font-sans">Major
              <input className={`${input} mt-1.5`} value={major} onChange={(e) => setMajor(e.target.value)} spellCheck autoCapitalize="words" />
            </label>
            <label className="text-sm text-zinc-400 font-sans">Class standing
              <select className={`${input} mt-1.5`} value={classYear} onChange={(e) => setClassYear(e.target.value)}>
                <option value="">Select</option>
                {CLASS_YEARS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-sm text-zinc-400 font-sans">Interests (comma separated, up to 5)
              <input className={`${input} mt-1.5`} value={hobbies} onChange={(e) => setHobbies(e.target.value)} spellCheck />
            </label>
            <p className="text-xs text-zinc-500 font-sans">Changes apply starting with your next drop.</p>
            {error && <p className="text-sm text-destructive font-sans">{error}</p>}
            <button disabled={busy} onClick={save} className="mt-2 w-full rounded-full bg-primary text-primary-foreground py-3 font-sans font-bold disabled:opacity-50">
              {busy ? "Saving..." : "Save changes"}
            </button>
            <button onClick={() => setView("menu")} className="text-sm text-zinc-500 font-sans">Back</button>
          </div>
        )}

        {view === "delete" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-300 font-sans leading-relaxed">
              This permanently removes your profile, prompt answers, matches, and chats. You won't be in future drops. This can't be undone.
            </p>
            <label className="text-sm text-zinc-400 font-sans">Type DELETE to confirm
              <input className={`${input} mt-1.5`} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoCapitalize="characters" />
            </label>
            {error && <p className="text-sm text-destructive font-sans">{error}</p>}
            <button disabled={busy || confirm !== "DELETE"} onClick={doDelete} className="w-full rounded-full bg-destructive text-destructive-foreground py-3 font-sans font-bold disabled:opacity-40">
              {busy ? "Deleting..." : "Delete my account"}
            </button>
            <button onClick={() => setView("menu")} className="text-sm text-zinc-500 font-sans">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
