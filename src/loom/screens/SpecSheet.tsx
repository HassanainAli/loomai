import { useState } from "react";
import { ArrowLeft, Lock, Camera, Plus } from "lucide-react";
import { PrimaryButton } from "../Shell";

export function SpecSheet({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
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
          Final Step
        </p>
        <h2 className="text-3xl font-black tracking-tight">
          Reviewing your specifications.
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

        <div className="grid grid-cols-2 gap-3">
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
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1.5">
              Weight
            </label>
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="160 lbs"
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#FACC15] transition-colors font-mono"
            />
          </div>
        </div>
      </div>

      {/* Public Ledger */}
      <div className="px-8 py-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground mb-1">
          Public Ledger
        </p>
        <p className="text-xs text-muted-foreground mb-5">
          What your matches see. High-signal, low-noise.
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
        <PrimaryButton onClick={onNext}>Finalize &amp; Lock</PrimaryButton>
      </div>
    </div>
  );
}