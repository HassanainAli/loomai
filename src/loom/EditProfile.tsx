import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, Lock, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { embedBaseline } from "@/lib/matching.functions";
import { guestProfile } from "./guest/mockProfile"; // GUEST MODE
import { SEED_PROMPTS } from "./screens/Onboard2";
import { COMMON_MAJORS, HOBBY_SUGGESTIONS } from "./screens/SpecSheet";
import { CLASS_YEARS, MAX_HOBBIES, MAX_HOBBY_LENGTH, ageFromDob, capFirst, cleanHobby, type UserSpec } from "./types";

type Intention = "committed" | "intentional";
type Balance = "mirror" | "counterweight";

/** True when any seed answer text differs, so the AI baseline must be rebuilt. */
export function seedsChanged(before: string[], after: string[]): boolean {
  return after.some((a, i) => a.trim() !== (before[i] ?? "").trim());
}

const card = "rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5";
const eyebrow = "text-[10px] font-bold uppercase tracking-widest text-foreground mb-1";
const label = "text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5";
const field = "w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-[#FACC15] transition-all";

function Pills<T extends string>({ value, opts, onPick, name }: { value: string; opts: readonly T[]; onPick: (v: T) => void; name: string }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-cols-3 gap-2">
      {opts.map((o) => {
        const on = value === o;
        return (
          <button key={o} type="button" role="radio" aria-checked={on} onClick={() => onPick(o)}
            className={`rounded-full border py-2 text-xs font-bold transition-colors ${on ? "border-[#FF2BD6] bg-[#FF2BD6]/10 text-foreground" : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600"}`}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Choice({ on, title, desc, onClick }: { on: boolean; title: string; desc: string; onClick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-colors ${on ? "border-[#FF2BD6] bg-[#FF2BD6]/10" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"}`}>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
    </button>
  );
}

export function EditProfile({ userId, userSpec, onUpdateUserSpec, onClose, isGuest = false }: {
  isGuest?: boolean; // GUEST MODE
  userId: string | null;
  userSpec: UserSpec;
  onUpdateUserSpec: (patch: Partial<UserSpec>) => void;
  onClose: (saved: boolean) => void;
}) {
  const runEmbed = useServerFn(embedBaseline);
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState({ ...userSpec, hobbies: [...userSpec.hobbies] });
  const [intention, setIntention] = useState<Intention | "">("");
  const [balance, setBalance] = useState<Balance | "">("");
  const [seeds, setSeeds] = useState<string[]>(["", "", ""]);
  const [origSeeds, setOrigSeeds] = useState<string[]>(["", "", ""]);
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [hobbyDraft, setHobbyDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let off = false;
    if (isGuest) { // GUEST MODE
      const g = guestProfile;
      setS((prev) => ({ ...prev, name: g.name, gender: g.gender, seeking: g.seeking, campus: g.campus, major: g.major, classYear: g.classYear, hobbies: [...g.hobbies] }));
      setSeeds([...g.seeds]); setOrigSeeds([...g.seeds]); setIntention(g.intention); setBalance(g.balance);
      setEmail(g.email); setAge(g.age); setLoading(false);
      return;
    }
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (off) return;
      setEmail(u.user?.email ?? "");
      setAge(ageFromDob(u.user?.user_metadata?.date_of_birth as string | undefined));
      if (userId) {
        const [{ data: p }, { data: m }] = await Promise.all([
          (supabase as any).from("profiles").select("display_name, gender, campus_hub, target_preference, major, class_year, hobbies, seed_prompts").eq("id", userId).maybeSingle(),
          (supabase as any).from("matching_preferences").select("intention, balance").eq("user_id", userId).limit(1).maybeSingle(),
        ]);
        if (off) return;
        if (p) {
          setS((prev) => ({ ...prev, name: p.display_name ?? prev.name, gender: p.gender ?? "", seeking: p.target_preference ?? "", campus: p.campus_hub ?? "", major: p.major ?? "", classYear: p.class_year ?? "", hobbies: Array.isArray(p.hobbies) ? p.hobbies : [] }));
          const saved = Array.isArray(p.seed_prompts) ? p.seed_prompts : [];
          const ans = SEED_PROMPTS.map((q, i) => (saved.find((x: any) => x?.q === q)?.a ?? saved[i]?.a ?? "") as string);
          setSeeds(ans); setOrigSeeds(ans);
        }
        if (m) { setIntention(m.intention ?? ""); setBalance(m.balance ?? ""); }
      }
      setLoading(false);
    })();
    return () => { off = true; };
  }, [userId]);

  const set = (patch: Partial<UserSpec>) => setS((prev) => ({ ...prev, ...patch }));
  const addHobby = (raw: string) => {
    const h = cleanHobby(raw, s.hobbies);
    if (h) set({ hobbies: [...s.hobbies, h] });
    setHobbyDraft("");
  };

  async function save() {
    if (!s.gender || !s.seeking || !s.campus) { setError("Gender, who you're interested in, and campus are required."); return; }
    if (seeds.some((a) => a.trim().length <= 10)) { setError("Each prompt answer needs a little more detail."); return; }
    setBusy(true); setError(null);
    const major = capFirst(s.major);
    if (isGuest) { // GUEST MODE: save to the dummy account only
      Object.assign(guestProfile, { gender: s.gender, seeking: s.seeking, campus: s.campus, major, classYear: s.classYear, hobbies: [...s.hobbies], seeds: seeds.map((a) => a.trim()), ...(intention ? { intention } : {}), ...(balance ? { balance } : {}) });
    } else if (userId) {
      const { error: pErr } = await (supabase as any).from("profiles").update({
        gender: s.gender, target_preference: s.seeking, campus_hub: s.campus,
        major: major || null, class_year: s.classYear || null, hobbies: s.hobbies,
        seed_prompts: SEED_PROMPTS.map((q, i) => ({ q, a: seeds[i].trim() })),
      }).eq("id", userId);
      const { error: mErr } = pErr ? { error: null } : await (supabase as any).from("matching_preferences")
        .update({ ...(intention ? { intention } : {}), ...(balance ? { balance } : {}) }).eq("user_id", userId);
      if (pErr || mErr) { console.error("[EditProfile]", pErr ?? mErr); setBusy(false); setError("Couldn't save. Try again."); return; }
      if (seedsChanged(origSeeds, seeds)) {
        runEmbed().catch((e) => console.error("[EditProfile] baseline embedding failed", e));
      }
    }
    onUpdateUserSpec({ gender: s.gender, seeking: s.seeking, campus: s.campus, major, classYear: s.classYear, hobbies: s.hobbies });
    setBusy(false);
    onClose(true);
  }

  return (
    <div className="absolute inset-0 z-50 bg-background flex flex-col">
      <div className="shrink-0 flex items-center gap-2 px-4 pt-10 pb-3 border-b border-zinc-900">
        <button aria-label="Back" onClick={() => onClose(false)} className="p-2 text-foreground/70 hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-lg font-black tracking-tight text-foreground">Edit profile</h2>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4">
          <section className={card}>
            <p className={eyebrow}>Public Profile</p>
            <p className="text-xs text-muted-foreground mb-5">What your matches see.</p>
            <div className="space-y-4">
              <div>
                <label className={label}>Campus Hub</label>
                <div className="relative">
                  <select value={s.campus} onChange={(e) => set({ campus: e.target.value })} className={`${field} appearance-none pr-8`}>
                    <option value="" disabled>Select campus</option>
                    <option value="UW Bothell">UW Bothell</option>
                    <option value="UW Seattle">UW Seattle</option>
                    <option value="UW Tacoma">UW Tacoma</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className={label}>Class Standing</label>
                  <div className="relative">
                    <select value={s.classYear} onChange={(e) => set({ classYear: e.target.value })} className={`${field} appearance-none pr-8 truncate`}>
                      <option value="" disabled>Select year</option>
                      {CLASS_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className={label}>Major</label>
                  <input value={s.major} onChange={(e) => set({ major: e.target.value })} maxLength={60} list="edit-majors" spellCheck autoCorrect="on" autoCapitalize="words" autoComplete="off" placeholder="e.g. Informatics" className={field} />
                  <datalist id="edit-majors">{COMMON_MAJORS.map((m) => <option key={m} value={m} />)}</datalist>
                </div>
              </div>
              <div>
                <label htmlFor="edit-hobby" className={label}>Interests (optional)</label>
                {s.hobbies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {s.hobbies.map((h) => (
                      <button key={h} type="button" onClick={() => set({ hobbies: s.hobbies.filter((x) => x !== h) })} aria-label={`Remove ${h}`}
                        className="inline-flex items-center gap-1 rounded-full border border-[#FF2BD6] bg-[#FF2BD6]/10 px-3 py-1 text-xs font-bold text-foreground">
                        {capFirst(h)} <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
                {s.hobbies.length < MAX_HOBBIES ? (
                  <>
                    <input id="edit-hobby" value={hobbyDraft} maxLength={MAX_HOBBY_LENGTH} spellCheck autoCapitalize="words" placeholder="e.g. Coffee"
                      onChange={(e) => setHobbyDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addHobby(hobbyDraft); } }}
                      onBlur={() => hobbyDraft.trim() && addHobby(hobbyDraft)} className={field} />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {HOBBY_SUGGESTIONS.filter((h) => !s.hobbies.some((x) => x.toLowerCase() === h.toLowerCase())).slice(0, 4).map((h) => (
                        <button key={h} type="button" onClick={() => addHobby(h)} className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-400 hover:border-[#FF2BD6]/60 hover:text-foreground transition-colors">+ {h}</button>
                      ))}
                    </div>
                  </>
                ) : <p className="text-xs text-muted-foreground">Up to 5.</p>}
              </div>
            </div>
          </section>

          <section className={card}>
            <p className={eyebrow}>Matching Preferences</p>
            <p className="text-xs text-muted-foreground mb-5">Only used to pair you. Never shown on your profile.</p>
            <div className="space-y-4">
              <div><p className={label}>Gender</p><Pills name="Gender" value={s.gender} opts={["Man", "Woman", "Non-Binary"] as const} onPick={(v) => set({ gender: v })} /></div>
              <div><p className={label}>Interested In</p><Pills name="Interested In" value={s.seeking} opts={["Men", "Women", "Everyone"] as const} onPick={(v) => set({ seeking: v })} /></div>
              <div role="radiogroup" aria-label="Intention" className="space-y-2">
                <p className={label}>Intention</p>
                <Choice on={intention === "committed"} title="Committed" desc="Long-term relationship" onClick={() => setIntention("committed")} />
                <Choice on={intention === "intentional"} title="Intentional" desc="Dating, open to seeing where it goes" onClick={() => setIntention("intentional")} />
              </div>
              <div role="radiogroup" aria-label="Energy" className="space-y-2">
                <p className={label}>Energy</p>
                <Choice on={balance === "mirror"} title="The Mirror" desc="Lifestyle and pacing that reflect your own" onClick={() => setBalance("mirror")} />
                <Choice on={balance === "counterweight"} title="The Counterweight" desc="Strengths and pacing that balance yours" onClick={() => setBalance("counterweight")} />
              </div>
            </div>
          </section>

          <section className={card}>
            <p className={eyebrow}>Your Answers</p>
            <p className="text-xs text-muted-foreground mb-5">Changes shape your matches starting with the next drop.</p>
            <div className="space-y-4">
              {SEED_PROMPTS.map((q, i) => (
                <div key={q}>
                  <label className="text-sm font-bold text-foreground block mb-2 leading-snug">{q}</label>
                  <textarea rows={3} value={seeds[i]} onChange={(e) => setSeeds((p) => p.map((a, j) => (j === i ? e.target.value : a)))}
                    className={`${field} resize-none`} />
                </div>
              ))}
            </div>
          </section>

          <section className={card}>
            <p className={eyebrow}>Account</p>
            <p className="text-xs text-muted-foreground mb-4">Locked to keep Loom verified.</p>
            {[["Name", s.name || "Not set"], ["Age", age != null ? String(age) : "Not set"], ["Campus email", email]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2.5 border-t border-zinc-900 first:border-t-0">
                <span className="text-xs text-muted-foreground">{k}</span>
                <span className="flex items-center gap-1.5 text-sm text-zinc-400 truncate max-w-[65%]"><span className="truncate">{v}</span><Lock className="w-3 h-3 shrink-0" /></span>
              </div>
            ))}
          </section>
        </div>
      )}

      <div className="shrink-0 px-5 pt-3 pb-6 border-t border-zinc-900 bg-background">
        {error && <p className="text-sm text-destructive mb-2">{error}</p>}
        <button disabled={busy || loading} onClick={save} className="w-full rounded-full bg-primary text-primary-foreground py-3 font-bold disabled:opacity-50">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
