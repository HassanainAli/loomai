import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

const MONO = { fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace' };

function LegalNav() {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        <Link to="/" className="text-white text-lg font-black tracking-tighter lowercase">
          loom<span className="text-[#FF00FF]">.</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.18em] text-white/70" style={MONO}>
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/privacy" className="hover:text-white transition-colors" activeProps={{ className: "text-white" }}>Privacy</Link>
          <Link to="/terms" className="hover:text-white transition-colors" activeProps={{ className: "text-white" }}>Terms</Link>
        </div>
        <Link to="/" className="nn-cta-ghost rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em]" style={MONO}>
          Get Access
        </Link>
      </div>
    </nav>
  );
}

function LegalFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#FF00FF]" style={MONO}>// System Integrity</div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60" style={MONO}>
              Loom is an independent service for verified university students. It is not affiliated with any academic institution.
            </p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/40" style={MONO}>Network</div>
            <ul className="mt-4 space-y-2 text-sm text-white/70" style={MONO}>
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/40" style={MONO}>Status</div>
            <ul className="mt-4 space-y-2 text-sm text-white/70" style={MONO}>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                Draft · pending legal review
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-6 text-[10px] uppercase tracking-[0.22em] text-white/40" style={MONO}>
          <span>loom // closed-loop</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-black text-white">
      <LegalNav />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-24 sm:px-8">
        <div className="text-[10px] uppercase tracking-[0.22em] text-white/40" style={MONO}>
          <Link to="/" className="hover:text-white transition-colors">loom</Link>
          <span className="mx-2">/</span>
          <span className="text-white/70">{title}</span>
        </div>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/70" style={MONO}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF00FF] shadow-[0_0_10px_#FF00FF]" />
          Draft · Not yet finalized
        </div>
        <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-[-0.04em] text-[#FAFAFA] md:text-6xl">{title}</h1>
        <p className="mt-6 border-l border-white/20 pl-4 text-sm leading-relaxed text-zinc-400">
          This page contains placeholder legal copy. It is not a finalized agreement or policy and requires legal review before the campus pilot.
        </p>
        <div className="mt-16 space-y-14">{children}</div>
      </main>
      <LegalFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-white/10 pt-10">
      <h2 className="text-2xl font-bold tracking-tight text-[#FAFAFA] sm:text-3xl">{title}</h2>
      <div className="mt-6 space-y-6 text-base leading-8 text-zinc-400 [&_.text-foreground]:text-[#FAFAFA]">{children}</div>
    </section>
  );
}
