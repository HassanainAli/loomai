import { Nebula } from "./Nebula";

export function GreenLightSent({ onDone }: { onDone: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 nn-blur-in bg-background/60 backdrop-blur-xl">
      <Nebula />
      <div role="dialog" aria-labelledby="gl-title" className="relative text-center max-w-[17rem]">
        <h2 id="gl-title" className="text-2xl font-black tracking-tight">Green light sent</h2>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          We'll email you if they green light you back. If not, your next drop arrives tonight at 8:00 PM.
        </p>
        <button
          onClick={onDone}
          className="mt-8 w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
