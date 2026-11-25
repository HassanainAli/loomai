import { ReactNode, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Wordmark";
import quad from "@/assets/uw-quad-dusk.jpg.asset.json";

const BEATS = [
  {
    title: "Just UW.",
    body: "No tourists, no strangers three cities away. Every person on Loom has a verified UW email and actually walks this campus.",
  },
  {
    title: "No endless scrolling.",
    body: "You will never swipe through 200 faces before bed. We look at what you actually care about, how you think, and pick two people for you.",
  },
  {
    title: "8:00 PM every night.",
    body: "Two matches drop at eight. You both have 24 hours to say yes. If you both do, you are talking one-on-one.",
  },
];

export function DesktopLanding({ phoneContent }: { phoneContent: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative min-h-screen overflow-hidden">
        <img src={quad.url} alt="The UW Quad at dusk with cherry blossoms" className="lp-quad absolute inset-0 h-full w-full object-cover" />
        <div className="lp-vignette absolute inset-0" />
        <header className="relative z-10 mx-auto flex max-w-7xl px-10 py-8">
          <a href="/" aria-label="loom home"><Wordmark className="text-2xl" /></a>
        </header>
        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl flex-col justify-center px-10 pb-24">
          <h1 className="text-6xl font-black leading-[1.02] tracking-[-0.03em] xl:text-7xl">
            Two matches a day.
            <br />
            Exclusively for UW.
          </h1>
          <p className="mt-6 max-w-md text-lg text-foreground/75">
            Catch the drop every night at 8:00 PM. Verified .edu only.
          </p>
          <div className="mt-10">
            <button onClick={() => setOpen(true)} className="lp-glass-btn rounded-full px-8 py-4 text-base font-semibold">
              Join now →
            </button>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-7xl grid-cols-3 gap-6 px-10 py-28">
        {BEATS.map((b) => (
          <div key={b.title} className="lp-glass rounded-3xl p-8">
            <h2 className="text-2xl font-bold tracking-tight">{b.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground/65">{b.body}</p>
          </div>
        ))}
      </section>

      <footer className="mx-auto flex max-w-7xl items-center justify-between px-10 py-10 text-sm text-foreground/45">
        <span>© Loom.</span>
        <a href="mailto:support@tryloom.cc?subject=Request%20my%20campus" className="hover:text-foreground">Not at UW? Request your campus →</a>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
        </div>
      </footer>

      {open && (
        <div
          className="lp-backdrop fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Join Loom"
        >
          <div className="lp-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="nn-phone-screen">{phoneContent}</div>
          </div>
        </div>
      )}
    </div>
  );
}
