import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-6 sm:px-8">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
            Return to Loom
          </Link>
          <span aria-label="loom" className="text-2xl font-black">loom<span className="text-primary">.</span></span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12 sm:px-8 sm:py-16">
        <p className="mb-4 text-xs font-semibold uppercase text-primary">Draft · Not yet finalized</p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">
          This page contains placeholder legal copy. It is not a finalized agreement or policy and requires legal review before the campus pilot.
        </p>
        <div className="mt-12 space-y-10">{children}</div>
      </main>
      <footer className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-3 border-t border-border px-6 py-8 text-sm sm:px-8">
        <Link to="/privacy" activeProps={{ className: "text-foreground underline underline-offset-4" }} inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}>Privacy Policy</Link>
        <Link to="/terms" activeProps={{ className: "text-foreground underline underline-offset-4" }} inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}>Terms of Service</Link>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold leading-7 sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-base leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}