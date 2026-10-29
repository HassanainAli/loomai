import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Lock, Camera, Plus, ChevronDown, X } from "lucide-react";
import { PrimaryButton } from "../Shell";
import { OnboardingAnswers, UserSpec, parseHeightInches } from "../types";
import { useServerFn } from "@tanstack/react-start";
import { embedBaseline } from "@/lib/matching.functions";
import { supabase } from "@/integrations/supabase/client";

export function SpecSheet({
  onNext,
  onBack,
  userSpec,
  onUpdateUserSpec,
  userId,
  onboarding,
}: {
  onNext: (displayName?: string) => void;
  onBack: () => void;
  userSpec: UserSpec;
  onUpdateUserSpec: (patch: Partial<UserSpec>) => void;
  userId: string | null;
  onboarding: OnboardingAnswers;
}) {
  const runEmbedBaseline = useServerFn(embedBaseline);
  const [height, setHeight] = useState("");
  const [location, setLocation] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const fileInputs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    return () => {
      photos.forEach((p) => p && URL.revokeObjectURL(p));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = (i: number, file: File | null) => {
    if (!file) return;
    setPhotos((prev) => {
      const next = [...prev];
      if (next[i]) URL.revokeObjectURL(next[i] as string);
      next[i] = URL.createObjectURL(file);
      return next;
    });
  };

  const clearPhoto = (i: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      if (next[i]) URL.revokeObjectURL(next[i] as string);
      next[i] = null;
      return next;
    });
    const input = fileInputs[i].current;
    if (input) input.value = "";
  };

  async function handleComplete() {
    const { data: sessData } = await supabase.auth.getSession();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const activeUserId = userData?.user?.id ?? sessData.session?.user?.id ?? null;
    if (
      !userSpec.gender ||
      !userSpec.campus ||
      !userSpec.seeking
    ) {
      setSaveError("Please fill in gender, campus, and preference.");
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
        .upsert(
          [
            {
              id: activeUserId,
              ...(metaName ? { display_name: metaName } : {}),
              gender: userSpec.gender,
              campus_hub: userSpec.campus,
              target_preference: userSpec.seeking,
              height_in: parseHeightInches(height),
              ...(onboarding.seeds.length ? { seed_prompts: onboarding.seeds } : {}),
            },
          ],
          { onConflict: "id" },
        );
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
        <h2 className="text-3xl font-black tracking-tight">
          Spec Sheet
        </h2>
      </div>

      {/* Identity Specs */}
      <div className="bg-zinc-950 border-y border-zinc-800 px-8 py-8 font-mono">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-3.5 h-3.5 text-[#FACC15]" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FACC15]">
            Identity Specs
          </p>
        </div>
        <p className="text-xs text-zinc-500 mb-5">
          Input your baseline specs for the engine sync.
        </p>

        <div className="space-y-3">

          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1.5">
              Gender
            </label>
            <div className="relative">
              <select
                value={userSpec.gender}
                onChange={(e) => onUpdateUserSpec({ gender: e.target.value })}
                className={`w-full appearance-none bg-black border border-yellow-400/50 rounded-lg px-3 py-2.5 pr-9 text-sm text-[#FACC15] focus:outline-none focus:border-[#FACC15] focus:shadow-[0_0_12px_-2px_rgba(250,204,21,0.6)] transition-all font-mono ${
                  userSpec.gender ? "" : "opacity-50"
                }`}
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="Man">Man</option>
                <option value="Woman">Woman</option>
                <option value="Non-Binary">Non-Binary</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#FACC15] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1.5">
              Interested In
            </label>
            <div className="relative">
              <select
                value={userSpec.seeking}
                onChange={(e) => onUpdateUserSpec({ seeking: e.target.value })}
                className={`w-full appearance-none bg-black border border-yellow-400/50 rounded-lg px-3 py-2.5 pr-9 text-sm text-[#FACC15] focus:outline-none focus:border-[#FACC15] focus:shadow-[0_0_12px_-2px_rgba(250,204,21,0.6)] transition-all font-mono ${
                  userSpec.seeking ? "" : "opacity-50"
                }`}
              >
                <option value="" disabled>
                  Select preference
                </option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Everyone">Everyone</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#FACC15] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1.5">
              Campus Hub
            </label>
            <div className="relative">
              <select
                required
                value={userSpec.campus}
                onChange={(e) => onUpdateUserSpec({ campus: e.target.value })}
                className={`w-full appearance-none bg-black border border-yellow-400/50 rounded-lg px-3 py-2.5 pr-9 text-sm text-[#FACC15] focus:outline-none focus:border-[#FACC15] focus:shadow-[0_0_12px_-2px_rgba(250,204,21,0.6)] transition-all font-mono ${
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
              <ChevronDown className="w-4 h-4 text-[#FACC15] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[9px] text-zinc-500 leading-snug normal-case mt-1.5">
              Shown on your match profile. All UW campuses share one match pool.
            </p>
          </div>
        </div>
      </div>

      {/* Engine Metadata */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-8 py-8 font-mono">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-3.5 h-3.5 text-[#FACC15]" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FACC15]">
            Engine Metadata
          </p>
        </div>
        <p className="text-xs text-zinc-500 mb-5">
          For the AI's eyes only.
        </p>

        <div className="grid grid-cols-2 gap-3 items-start">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1.5">
              Height
            </label>
            <input
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder='5&apos;10"'
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#FACC15] transition-colors font-mono"
            />
          </div>
        </div>

      </div>

      {/* Public Ledger */}
      <div className="px-8 py-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-1">
          Public Profile
        </p>
        <p className="text-xs text-muted-foreground mb-5">
          What your matches see.
        </p>

        <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
          Photos
        </label>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[0, 1, 2].map((i) => {
            const preview = photos[i];
            return (
              <div key={i} className="relative aspect-square">
                <input
                  ref={fileInputs[i]}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(i, e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputs[i].current?.click()}
                  className="w-full h-full rounded-2xl bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 hover:border-[#FACC15] hover:text-[#FACC15] transition-colors overflow-hidden"
                  aria-label={preview ? "Replace photo" : "Upload photo"}
                >
                  {preview ? (
                    <img src={preview} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                  ) : i === 0 ? (
                    <Camera className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </button>
                {preview && (
                  <button
                    type="button"
                    onClick={() => clearPhoto(i)}
                    aria-label="Remove photo"
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 border border-zinc-700 flex items-center justify-center text-white hover:bg-black hover:border-[#FACC15] hover:text-[#FACC15] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
          Location
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City or Neighborhood"
          className="w-full bg-secondary border border-border rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-foreground transition-colors mb-5"
        />

        <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
          Hobbies
        </label>
        <input
          value={hobbies}
          onChange={(e) => setHobbies(e.target.value)}
          placeholder="Pottery, trail running, vinyl…"
          className="w-full bg-secondary border border-border rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-foreground transition-colors"
        />
      </div>

      <div className="flex-1 min-h-4" />
      <div className="p-8 pt-2">
        {saveError && (
          <p className="text-xs text-red-400 mb-3">{saveError}</p>
        )}
        <PrimaryButton onClick={handleComplete} disabled={saving}>
          {saving ? "Saving…" : "Complete Profile"}
        </PrimaryButton>
      </div>
    </div>
  );
}