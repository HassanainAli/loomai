import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Wordmark";

/** Monitored inboxes on the primary domain. */
export const LEGAL_CONTACT = "legal@tryloom.cc";
export const SUPPORT_CONTACT = "support@tryloom.cc";
export const LEGAL_EFFECTIVE = "Effective October 2026";

function LegalNav() {
  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-4 sm:pt-5">
      <div className="legal-island mx-auto flex w-fit items-center gap-3 rounded-full border border-foreground/10 bg-background/85 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:text-foreground">&larr; Back</Link>
        <div className="h-4 w-px bg-foreground/10" aria-hidden="true" />
        <nav className="flex items-center gap-0.5 rounded-full border border-foreground/10 bg-foreground/5 p-0.5 text-sm" aria-label="Legal">
          <Link to="/privacy" className="rounded-full px-3 py-1 text-center text-foreground/60 transition-colors hover:text-foreground" activeProps={{ className: "bg-foreground/10 text-foreground" }}>Privacy</Link>
          <Link to="/terms" className="rounded-full px-3 py-1 text-center text-foreground/60 transition-colors hover:text-foreground" activeProps={{ className: "bg-foreground/10 text-foreground" }}>Terms</Link>
        </nav>
      </div>
    </header>
  );
}

function LegalFooter() {
  return (
    <footer className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-10 text-center text-sm text-foreground/45 sm:px-8">
      <p className="max-w-md">Loom is an independent service and is not affiliated with, endorsed by, or operated by the University of Washington or any school.</p>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <span className="flex items-center gap-1.5"><span>&copy;</span><Wordmark className="text-sm font-bold" /></span>
        <a href={`mailto:${SUPPORT_CONTACT}`} className="hover:text-foreground">{SUPPORT_CONTACT}</a>
        <a href={`mailto:${LEGAL_CONTACT}`} className="hover:text-foreground">{LEGAL_CONTACT}</a>
      </div>
    </footer>
  );
}

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <LegalNav />
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-8 sm:pt-16">
        <h1 className="text-4xl font-bold leading-tight tracking-[-0.03em] sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-foreground/50">{LEGAL_EFFECTIVE}. Independent of the University of Washington.</p>
        <div className="mt-12 space-y-12 break-words">{children}</div>
      </main>
      <LegalFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-7 text-foreground/65 [&_.text-foreground]:text-foreground">{children}</div>
    </section>
  );
}
