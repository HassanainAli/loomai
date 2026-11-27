import { ReactNode, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Wordmark";
import quad from "@/assets/uw-quad-dusk.jpg.asset.json";

const BEATS = [
  {
    title: "Zero strangers",
    body: "No fake accounts, no travelers passing through SeaTac, and no one three cities away. Every profile belongs to a student who actually walks this campus.",
  },
  {
    title: "Answers, not photos",
    body: "You answer one quick prompt a day. We look at how you live, think, and pace your energy, not an endless casino feed of faces to scroll through.",
  },
  {
    title: "24 hours to say yes",
    body: "When a match drops, you have until the next night to greenlight. If you both do, you unlock a private 1-on-1 chat without the usual inbox ghost town.",
  },
];

export function DesktopLanding({ phoneContent }: { phoneContent: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const close = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 240);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closing]);

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
            Two matches a day
            <br />
            Exclusively for UW
          </h1>
          <p className="mt-6 max-w-lg text-lg text-foreground/75">
            The dating app with no swiping. Drops at 8:00 PM.
          </p>
          <div className="mt-10">
            <button onClick={() => setOpen(true)} className="lp-glass-btn rounded-full px-8 py-4 text-base font-semibold">
              Join now →
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-10 py-28" aria-label="How loom works">
        <ol className="grid grid-cols-3 gap-14">
          {BEATS.map((b, i) => (
            <li key={b.title} className="border-t border-foreground/15 pt-8">
              <span className="font-mono text-xs tracking-widest text-foreground/40">0{i + 1}</span>
              <h2 className="mt-5 text-3xl font-bold leading-tight tracking-[-0.02em]">{b.title}</h2>
              <p className="mt-5 max-w-sm text-base leading-relaxed text-foreground/60">{b.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mx-auto grid max-w-7xl grid-cols-3 items-center gap-6 px-10 py-10 text-sm text-foreground/45">
        <div className="flex items-center gap-1.5">
          <span>&copy;</span>
          <Wordmark className="text-sm font-bold" />
        </div>
        <a href="mailto:support@tryloom.cc?subject=Request%20my%20campus" className="justify-self-center hover:text-foreground">Not at UW? Request your campus &rarr;</a>
        <div className="flex justify-end gap-6">
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
        </div>
      </footer>

      {open && (
        <div
          className={`lp-backdrop ${closing ? "is-closing" : ""} fixed inset-0 z-50 flex items-center justify-center`}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Join Loom"
        >
          <div className={`lp-sheet ${closing ? "is-closing" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="nn-phone-screen">{phoneContent}</div>
          </div>
        </div>
      )}
    </div>
  );
}
