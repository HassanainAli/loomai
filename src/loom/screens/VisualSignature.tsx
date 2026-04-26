import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PrimaryButton } from "../Shell";
import { generateAuraImage } from "@/server/image.functions";

export function VisualSignature({
  name,
  identity,
  onComplete,
  onBack,
}: {
  name: string;
  identity: string;
  onComplete: () => void;
  onBack: () => void;
}) {
  const generate = useServerFn(generateAuraImage);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generate({ data: { name, identity } });
      if (res.error) setError(res.error);
      else setImage(res.image);
    } catch {
      setError("Aura engine offline. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full p-8 pt-8 overflow-y-auto">
      <button
        onClick={onBack}
        className="-ml-2 mb-4 p-2 w-9 text-foreground/70 hover:text-foreground transition-colors"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Step 5 of 5 · Final
      </p>
      <h2 className="text-3xl font-black tracking-tight mb-1">
        Visual Signature.
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Your unique data aura, generated from your identity spec.
      </p>

      <div className="relative aspect-square w-full rounded-3xl overflow-hidden border border-[#FACC15]/40 bg-black shadow-[0_0_40px_-8px_rgba(217,70,239,0.45)]">
        {/* Magenta glow backdrop */}
        <div className="absolute inset-0 bg-fuchsia-900/20 backdrop-blur-2xl" />

        {image && (
          <img
            src={image}
            alt={`${name}'s neon-noir data aura`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-200">
            <Loader2 className="w-6 h-6 animate-spin text-[#FACC15]" />
            <p className="text-xs font-mono uppercase tracking-widest text-[#FACC15]">
              Synthesizing aura…
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-rose-400 font-mono">{error}</p>
            <button
              onClick={run}
              className="flex items-center gap-2 text-xs font-bold text-[#FACC15] border border-[#FACC15]/60 rounded-full px-4 py-2 hover:bg-[#FACC15]/10 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* HUD overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 border border-[#FACC15]/40 rounded-full px-2.5 py-1">
          <Sparkles className="w-3 h-3 text-[#FACC15]" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#FACC15]">
            {name || "Aura"}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 bg-black/60 border border-fuchsia-500/40 rounded-full px-2.5 py-1">
          <span className="text-[9px] font-mono uppercase tracking-widest text-fuchsia-300">
            Gemini · 2.5 Flash Image
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-6" />
      <PrimaryButton onClick={onComplete} disabled={loading || !image}>
        Complete Profile
      </PrimaryButton>
    </div>
  );
}
