import { useState } from "react";
import { ArrowLeft, Lock, Camera, Plus, ChevronDown } from "lucide-react";
import { PrimaryButton } from "../Shell";
import { UserSpec } from "../types";

export function SpecSheet({
  onNext,
  onBack,
  userSpec,
  onUpdateUserSpec,
}: {
  onNext: () => void;
  onBack: () => void;
  userSpec: UserSpec;
  onUpdateUserSpec: (patch: Partial<UserSpec>) => void;
}) {
  const [height, setHeight] = useState("");
  const [proximity, setProximity] = useState(true);
  const [location, setLocation] = useState("");
  const [hobbies, setHobbies] = useState("");

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 pt-8 pb-6">
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

      {/* Engine Metadata */}
      <div className="bg-zinc-950 border-y border-zinc-800 px-8 py-6 font-mono">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-3.5 h-3.5 text-[#FACC15]" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FACC15]">
            Engine Metadata
          </p>
        </div>
        <p className="text-xs text-zinc-500 mb-5">
          Literal specs. For the AI's eyes only.
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
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500">
                Prioritize Proximity
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={proximity}
                onClick={() => setProximity((p) => !p)}
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                  proximity ? "bg-[#FACC15]" : "bg-zinc-800"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black transition-transform ${
                    proximity ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <p className="text-[9px] text-zinc-500 leading-snug normal-case">
              Engine will strictly filter matches outside your immediate area.
            </p>
          </div>
        </div>
      </div>

      {/* Identity Specs */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-8 py-6 font-mono">
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
              Name
            </label>
            <input
              value={userSpec.name}
              onChange={(e) => onUpdateUserSpec({ name: e.target.value })}
              placeholder="Type your name..."
              className="w-full bg-black border border-yellow-400/50 rounded-lg px-3 py-2.5 text-sm text-[#FACC15] placeholder:text-[#FACC15] placeholder:opacity-50 placeholder:normal-case focus:outline-none focus:border-[#FACC15] focus:shadow-[0_0_12px_-2px_rgba(250,204,21,0.6)] transition-all font-mono"
            />
          </div>

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
        </div>
      </div>

      {/* Public Ledger */}
      <div className="px-8 py-6">
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
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              className="aspect-square rounded-2xl bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 hover:border-[#FACC15] hover:text-[#FACC15] transition-colors"
            >
              {i === 0 ? <Camera className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          ))}
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
        <PrimaryButton onClick={onNext}>Complete Profile</PrimaryButton>
      </div>
    </div>
  );
}