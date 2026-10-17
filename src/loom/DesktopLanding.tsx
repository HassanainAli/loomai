import { type ReactNode, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DesktopLanding({ phoneContent, onEnter }: { phoneContent: ReactNode; onEnter: () => void }) {
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const enterCampus = () => {
    onEnter();
    phoneRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
    requestAnimationFrame(() => phoneRef.current?.querySelector<HTMLInputElement>('input[type="email"]')?.focus({ preventScroll: true }));
  };

  return (
    <div className="desktop-editorial min-h-screen bg-background text-foreground font-editorial">
      <nav aria-label="Desktop navigation" className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-10 xl:px-16">
          <Link to="/" aria-label="loom home" className="text-3xl font-bold">loom<span className="font-black">.</span></Link>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#daily-rhythm" className="transition-colors hover:text-foreground">The 8pm drop</a>
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
          </div>
          <Button variant="outline" onClick={enterCampus} className="h-10 rounded-sm px-5">Join your campus <ArrowUpRight aria-hidden="true" /></Button>
        </div>
      </nav>

      <main>
        <section aria-labelledby="landing-title" className="border-b border-border">
          <div className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-12 px-10 py-10 xl:px-16">
            <div className="py-8">
              <p className="mb-8 text-sm text-muted-foreground">For university students. For real connection.</p>
              <h1 id="landing-title" className="text-6xl font-bold leading-[1.06] xl:text-7xl">
                <span className="mb-4 block text-3xl">loom.</span>
                Connection,<br />minus the swipe.
              </h1>
              <p className="mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">One daily prompt. One meaningful match. Unlocks at 8:00 PM.</p>
              <Button onClick={enterCampus} className="mt-9 h-14 rounded-sm px-6 text-base">Join your campus waitlist <ArrowRight aria-hidden="true" /></Button>
              <p className="mt-4 text-xs text-muted-foreground">University email required · 18+</p>
              <div className="mt-14 flex gap-10 border-t border-border pt-6 text-sm">
                <div><span className="block text-xl font-semibold">One</span><span className="mt-1 block text-muted-foreground">Daily prompt</span></div>
                <div><span className="block text-xl font-semibold">8pm</span><span className="mt-1 block text-muted-foreground">A daily ritual</span></div>
                <div><span className="block text-xl font-semibold">No swipes</span><span className="mt-1 block text-muted-foreground">Just intention</span></div>
              </div>
            </div>
            <div ref={phoneRef} id="campus-access" className="flex justify-center scroll-mt-24">
              <div className="editorial-phone">
                <div className="editorial-phone-notch" />
                <div className="editorial-phone-screen">{phoneContent}</div>
              </div>
            </div>
          </div>
        </section>

        <section id="daily-rhythm" aria-labelledby="rhythm-title" className="scroll-mt-20">
          <div className="mx-auto max-w-7xl px-10 py-16 xl:px-16">
            <div className="flex items-baseline justify-between gap-8 border-b border-border pb-8">
              <h2 id="rhythm-title" className="text-3xl font-semibold">A little less scrolling.<br />A little more showing up.</h2>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">A campus network built around a daily rhythm, not an endless feed.</p>
            </div>
            <div className="grid grid-cols-3 gap-12 pt-10">
              {[
                { number: "01", title: "Your campus, your people.", body: "Start with your university email. Keep connection close to the life you actually live." },
                { number: "02", title: "Something real to say.", body: "One daily prompt gives you a place to start. A small answer can say more than a perfect profile." },
                { number: "03", title: "Make room for the 8pm drop.", body: "An intentional moment to meet someone, without spending your evening swiping." },
              ].map((item) => (
                <article key={item.number}>
                  <span className="text-sm text-muted-foreground">{item.number}</span>
                  <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-10 py-10 xl:px-16">
          <div><Link to="/" className="text-2xl font-bold">loom.</Link><p className="mt-2 text-xs text-muted-foreground">Independent. Not affiliated with any university.</p></div>
          <div className="flex gap-7 text-sm text-muted-foreground"><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></div>
        </div>
      </footer>
    </div>
  );
}
