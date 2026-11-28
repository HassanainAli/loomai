import { useState } from "react";
import { ArrowLeft, Plus, ChevronDown, X } from "lucide-react";
import { PrimaryButton } from "../Shell";
import { OnboardingAnswers, UserSpec, CLASS_YEARS, MAX_HOBBIES, MAX_HOBBY_LENGTH, cleanHobby, capFirst } from "../types";
import { useServerFn } from "@tanstack/react-start";
import { embedBaseline } from "@/lib/matching.functions";
import { supabase } from "@/integrations/supabase/client";
import { PhotoEditor } from "../PhotoEditor";
import { guestProfile } from "../guest/mockProfile";

export const COMMON_MAJORS = [
  "Accounting", "Aeronautics & Astronautics", "Anthropology", "Applied Mathematics", "Architecture",
  "Art", "Biochemistry", "Bioengineering", "Biology", "Business Administration", "Chemical Engineering",
  "Chemistry", "Civil Engineering", "Communication", "Computer Engineering", "Computer Science",
  "Data Science", "Design", "Economics", "Education", "Electrical Engineering", "English",
  "Environmental Science", "Finance", "Gender Studies", "Geography", "Global Health", "History",
  "Human Centered Design & Engineering", "Industrial Engineering", "Informatics", "International Studies",
  "Journalism", "Law, Societies & Justice", "Linguistics", "Marketing", "Materials Science", "Mathematics",
  "Mechanical Engineering", "Media Studies", "Microbiology", "Music", "Neuroscience", "Nursing",
  "Philosophy", "Physics", "Political Science", "Psychology", "Public Health", "Sociology", "Statistics",
  "Undeclared",
];

export const HOBBY_SUGGESTIONS = [
  "Coffee", "Concerts", "Thrifting", "Hiking", "Matcha", "Reading", "Movies", "Baking", "Travel",
  "Gym", "Cooking", "Music", "Art", "Running", "Yoga", "Photography", "Gaming", "Anime", "Skiing",
  "Basketball", "Soccer", "Volleyball", "Tennis", "Bouldering",
];

export function SpecSheet({
  onNext,
  onBack,
  userSpec,
  onUpdateUserSpec,
  userId,
  onboarding,
  isGuest = false,
}: {
  onNext: (displayName?: string) => void;
  onBack: () => void;
  userSpec: UserSpec;
  onUpdateUserSpec: (patch: Partial<UserSpec>) => void;
  userId: string | null;
  onboarding: OnboardingAnswers;
  isGuest?: boolean;
}) {
  const runEmbedBaseline = useServerFn(embedBaseline);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hobbyDraft, setHobbyDraft] = useState("");
  const addHobby = () => {
    const h = cleanHobby(hobbyDraft, userSpec.hobbies);
    if (!h) return;
    onUpdateUserSpec({ hobbies: [...userSpec.hobbies, h] });
    setHobbyDraft("");
  };
  const removeHobby = (h: string) =>
    onUpdateUserSpec({ hobbies: userSpec.hobbies.filter((x) => x !== h) });
  const [photoState, setPhotoState] = useState({ valid: false, busy: false });

  async function handleComplete() {
    if (!photoState.valid || photoState.busy) return;
    if (isGuest) {
      Object.assign(guestProfile, { gender: userSpec.gender || guestProfile.gender, seeking: userSpec.seeking || guestProfile.seeking, campus: userSpec.campus || guestProfile.campus, major: capFirst(userSpec.major) || guestProfile.major, classYear: userSpec.classYear || guestProfile.classYear, hobbies: [...userSpec.hobbies], ...(onboarding.intention ? { intention: onboarding.intention } : {}), ...(onboarding.seeds.length ? { seeds: onboarding.seeds.map((s) => s.a) } : {}), balance: onboarding.balance });
      onNext(guestProfile.name);
      return;
    }
    const { data: sessData } = await supabase.auth.getSession();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const activeUserId = userData?.user?.id ?? sessData.session?.user?.id ?? null;
    if (
      !userSpec.gender ||
      !userSpec.campus ||
      !userSpec.seeking
    ) {
      setSaveError("Please select your gender, who you're interested in, and campus.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (!activeUserId) {
        throw new Error(
          "Your session expired. Please sign in again to finish onboarding.",
        );
      }

      const metaName =
        (userData?.user?.user_metadata?.display_name as string | undefined)?.trim() ||
        userSpec.name.trim() ||
        null;

      const { error: pErr } = await (supabase as any)
        .from("profiles")
        .update(
            {
              ...(metaName ? { display_name: metaName } : {}),
              gender: userSpec.gender,
              campus_hub: userSpec.campus,
              target_preference: userSpec.seeking,
              major: capFirst(userSpec.major) || null,
              class_year: userSpec.classYear || null,
              hobbies: userSpec.hobbies,
              ...(onboarding.seeds.length ? { seed_prompts: onboarding.seeds } : {}),
            },
        ).eq("id", activeUserId).select("id").single();
      if (pErr) throw pErr;

      const { data: existingPreference, error: prefLookupErr } = await (supabase as any)
        .from("matching_preferences")
        .select("id")
        .eq("user_id", activeUserId)
        .limit(1)
        .maybeSingle();
      if (prefLookupErr) throw prefLookupErr;

      const { error: mErr } = existingPreference?.id
        ? await (supabase as any)
            .from("matching_preferences")
            .update({
              pause_matching: false,
              balance: onboarding.balance,
              ...(onboarding.intention ? { intention: onboarding.intention } : {}),
            })
            .eq("id", existingPreference.id)
            .eq("user_id", activeUserId)
        : await (supabase as any)
            .from("matching_preferences")
            .insert({
              user_id: activeUserId,
              pause_matching: false,
              balance: onboarding.balance,
              ...(onboarding.intention ? { intention: onboarding.intention } : {}),
            });
      if (mErr) throw mErr;

      if (onboarding.seeds.length) {
        runEmbedBaseline().catch((e) => console.error("[SpecSheet] baseline embedding failed", e));
      }
      onNext(metaName ?? undefined);
    } catch (error) {
      console.error("[SpecSheet] onboarding submission failed — exact error:", error);
      const dbMessage =
        error && typeof error === "object"
          ? String(
              (error as { message?: unknown; details?: unknown }).message ||
                (error as { message?: unknown; details?: unknown }).details ||
                JSON.stringify(error),
            )
          : String(error);
      setSaveError(dbMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 pt-12 pb-6">
        <button
          onClick={onBack}
          className="-ml-2 mb-4 p-2 w-9 text-foreground/70 hover:text-foreground transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Step 4 of 4
        </p>
        <h2 className="text-3xl font-black tracking-[-0.015em]">
          Spec Sheet
        </h2>
      </div>

      {/* Matching Preferences */}
      <div className="px-5 space-y-4">
      <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/60 to-zinc-950/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">
            Matching Preferences
          </p>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Only used to pair you. Never shown on your profile.
        </p>

        <div className="space-y-4">
          {([
            { label: "Gender", key: "gender", opts: ["Man", "Woman", "Non-Binary"] },
            { label: "Interested In", key: "seeking", opts: ["Men", "Women", "Everyone"] },
          ] as const).map((f) => (
            <div key={f.key} role="radiogroup" aria-label={f.label}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{f.label}</p>
              <div className="grid grid-cols-3 gap-2">
                {f.opts.map((o) => {
                  const on = userSpec[f.key] === o;
                  return (
                    <button
                      key={o}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => onUpdateUserSpec({ [f.key]: o })}
                      className={`rounded-full border py-2 text-xs font-bold transition-colors ${
                        on
                          ? "border-[#FF2BD6] bg-[#FF2BD6]/10 text-foreground"
                          : "border-white/[0.06] bg-zinc-900/80 text-zinc-300 hover:border-zinc-500"
                      }`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Public Profile */}
      <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/60 to-zinc-950/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">
            Public Profile
          </p>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          What your matches see.
        </p>

        <div className="space-y-4 mb-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
              Campus Hub
            </label>
            <div className="relative">
              <select
                required
                value={userSpec.campus}
                onChange={(e) => onUpdateUserSpec({ campus: e.target.value })}
                className={`w-full appearance-none bg-zinc-950/80 border border-white/[0.08] rounded-lg pl-3 pr-8 py-2.5 truncate text-sm text-foreground focus:outline-none focus:border-[#FACC15] transition-all ${
                  userSpec.campus ? "" : "opacity-50"
                }`}
              >
                <option value="" disabled>
                  Select campus
                </option>
                <option value="UW Bothell">UW Bothell</option>
                <option value="UW Seattle">UW Seattle</option>
                <option value="UW Tacoma">UW Tacoma</option>
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
              Class Standing
            </label>
            <div className="relative">
              <select
                value={userSpec.classYear}
                onChange={(e) => onUpdateUserSpec({ classYear: e.target.value })}
                className={`w-full appearance-none bg-zinc-950/80 border border-white/[0.08] rounded-lg pl-3 pr-8 py-2.5 truncate text-sm text-foreground focus:outline-none focus:border-[#FACC15] transition-all ${userSpec.classYear ? "" : "opacity-50"}`}
              >
                <option value="" disabled>
                  Select year
                </option>
                {CLASS_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="min-w-0">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
              Major
            </label>
            <input
              type="text"
              maxLength={60}
              list="major-suggestions"
              spellCheck
              autoCorrect="on"
              autoCapitalize="words"
              autoComplete="off"
              value={userSpec.major}
              onChange={(e) => onUpdateUserSpec({ major: e.target.value })}
              placeholder="e.g. Informatics"
              className="w-full bg-zinc-950/80 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-[#FACC15] transition-all"
            />
            <datalist id="major-suggestions">
              {COMMON_MAJORS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="hobby-input" className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
            Interests (optional)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="hobby-input"
                type="text"
                value={hobbyDraft}
                spellCheck
                autoCorrect="on"
                autoCapitalize="words"
                autoComplete="off"
                maxLength={MAX_HOBBY_LENGTH}
                disabled={userSpec.hobbies.length >= MAX_HOBBIES}
                onChange={(e) => setHobbyDraft(e.target.value.replace(/,/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addHobby();
                  }
                }}
                placeholder={userSpec.hobbies.length >= MAX_HOBBIES ? `${MAX_HOBBIES}/${MAX_HOBBIES} added` : "e.g. Coffee"}
                className="w-full bg-zinc-950/80 border border-white/[0.08] rounded-lg pl-3 pr-10 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#FACC15] disabled:opacity-50 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-500">
                {MAX_HOBBY_LENGTH - hobbyDraft.length}
              </span>
            </div>
            <button
              type="button"
              onClick={addHobby}
              disabled={!cleanHobby(hobbyDraft, userSpec.hobbies)}
              aria-label="Add interest"
              className="w-11 shrink-0 rounded-lg border border-zinc-700 flex items-center justify-center text-[#FACC15] disabled:opacity-40 hover:border-[#FACC15] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {userSpec.hobbies.length < MAX_HOBBIES && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {HOBBY_SUGGESTIONS.filter(
                (h) =>
                  !userSpec.hobbies.some((x) => x.toLowerCase() === h.toLowerCase()) &&
                  (!hobbyDraft.trim() || h.toLowerCase().includes(hobbyDraft.trim().toLowerCase())),
              )
                .slice(0, 4)
                .map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      const c = cleanHobby(h, userSpec.hobbies);
                      if (!c) return;
                      onUpdateUserSpec({ hobbies: [...userSpec.hobbies, c] });
                      setHobbyDraft("");
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-300 hover:border-[#FF2BD6] hover:text-[#FF2BD6] hover:bg-[#FF2BD6]/10 transition-colors"
                  >
                    + {h}
                  </button>
                ))}
            </div>
          )}
          {userSpec.hobbies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {userSpec.hobbies.map((h) => (
                <span key={h} className="inline-flex items-center gap-1.5 text-xs font-bold pl-3 pr-1.5 py-1.5 rounded-full bg-[#FF2BD6]/10 border border-[#FF2BD6]/50 text-foreground shadow-[0_0_12px_-4px_rgba(255,43,214,0.6)] whitespace-nowrap">
                  {h}
                  <button type="button" onClick={() => removeHobby(h)} aria-label={`Remove ${h}`} className="text-[#FF2BD6]/80 hover:text-[#FF2BD6]">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {userSpec.hobbies.length >= MAX_HOBBIES && (
            <p className="text-[11px] text-zinc-500 mt-2">Up to {MAX_HOBBIES}.</p>
          )}
        </div>

        <PhotoEditor userId={userId} isGuest={isGuest} onState={setPhotoState} />

      </section>
      </div>

      <div className="flex-1 min-h-4" />
      <div className={`p-8 pt-2 ${isGuest ? "pb-16" : ""}`}>
        {saveError && (
          <p className="text-xs text-red-400 mb-3">{saveError}</p>
        )}
        <PrimaryButton onClick={handleComplete} disabled={saving || !photoState.valid || photoState.busy}>
          {saving ? "Saving…" : "Complete Profile"}
        </PrimaryButton>
      </div>
    </div>
  );
}