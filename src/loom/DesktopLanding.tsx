import { ReactNode, useEffect, useRef, useState } from "react";

const MONO = { fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace' };

function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    el.querySelectorAll(".nn-reveal").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return ref;
}

function Nav({ onCta }: { onCta: () => void }) {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <a href="/" className="text-white text-lg font-black tracking-tighter lowercase">
          loom<span className="text-[#FF00FF]">.</span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.18em] text-white/70" style={MONO}>
          <a href="#logic" className="hover:text-white transition-colors">The Logic</a>
          <a href="#safety" className="hover:text-white transition-colors">Safety</a>
          <a href="#terms" className="hover:text-white transition-colors">Terms</a>
        </div>
        <button
          onClick={onCta}
          className="nn-cta-ghost rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em]"
          style={MONO}
        >
          Get Access
        </button>
      </div>
    </nav>
  );
}

function PhoneFrame({ children, glitching }: { children: ReactNode; glitching: boolean }) {
  return (
    <div className={`nn-phone ${glitching ? "nn-glitch" : ""}`}>
      <div className="nn-phone-notch" />
      <div className="nn-phone-screen">{children}</div>
    </div>
  );
}

function BentoCard({
  index,
  label,
  title,
  body,
  metric,
}: {
  index: number;
  label: string;
  title: string;
  body: string;
  metric: string;
}) {
  return (
    <div
      className="nn-reveal group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-950/80 p-8 transition-colors hover:border-[#FF00FF]/60"
      data-delay={String(index)}
    >
      <div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-[#FF00FF]" style={MONO}>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF00FF] shadow-[0_0_12px_#FF00FF]" />
          {label}
        </div>
        <h3 className="mt-6 text-2xl font-bold text-white tracking-tight leading-tight">{title}</h3>
        <p className="mt-4 text-sm leading-relaxed text-white/60">{body}</p>
      </div>
      <div className="mt-10 flex items-baseline justify-between border-t border-white/10 pt-4 text-[10px] uppercase tracking-[0.22em]" style={MONO}>
        <span className="text-white/40">{`0${index}`} / 03</span>
        <span className="text-white/80">{metric}</span>
      </div>
    </div>
  );
}

export function DesktopLanding({ phoneContent }: { phoneContent: ReactNode }) {
  const [glitching, setGlitching] = useState(false);
  const [scanning, setScanning] = useState(false);
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const revealRoot = useReveal();

  const enterPortal = () => {
    setScanning(true);
    setGlitching(true);
    setTimeout(() => setScanning(false), 520);
    setTimeout(() => setGlitching(false), 520);
    phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div ref={revealRoot} className="min-h-screen bg-black text-white">
      {scanning && <div className="nn-scan" />}
      <Nav onCta={enterPortal} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 75% 30%, rgba(255,0,255,0.25) 0%, transparent 55%), radial-gradient(circle at 10% 90%, rgba(255,0,255,0.12) 0%, transparent 50%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-8 py-24 lg:grid-cols-[1.1fr_1fr]">
          {/* Left */}
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/70"
              style={MONO}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF00FF] shadow-[0_0_10px_#FF00FF]" />
              Closed-Loop // .edu only
            </div>
            <h1 className="mt-8 text-5xl font-black leading-[1.02] tracking-[-0.04em] text-white md:text-6xl lg:text-7xl">
              Two matches.
              <br />
              <span className="text-white">No endless</span>{" "}
              <span className="text-[#FF00FF]">scroll.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/60">
              A closed-loop network for verified university students. Catch the drop every night at{" "}
              <span className="text-white" style={MONO}>8pm</span>.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <button
                onClick={enterPortal}
                className="nn-cta rounded-full px-7 py-4 text-sm uppercase tracking-[0.2em]"
                style={MONO}
              >
                Enter the Portal →
              </button>
              <a
                href="#logic"
                className="text-xs uppercase tracking-[0.22em] text-white/50 hover:text-white transition-colors"
                style={MONO}
              >
                Read the logic
              </a>
            </div>

            {/* signal row */}
            <div className="mt-16 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-8 text-[10px] uppercase tracking-[0.22em] text-white/40" style={MONO}>
              <div>
                <div className="text-white text-lg font-bold tracking-tight" style={MONO}>2</div>
                <div className="mt-1">Matches / drop</div>
              </div>
              <div>
                <div className="text-white text-lg font-bold tracking-tight" style={MONO}>24h</div>
                <div className="mt-1">Decay window</div>
              </div>
              <div>
                <div className="text-white text-lg font-bold tracking-tight" style={MONO}>0</div>
                <div className="mt-1">Swipes</div>
              </div>
            </div>
          </div>

          {/* Right — phone */}
          <div ref={phoneRef} className="flex items-center justify-center">
            <PhoneFrame glitching={glitching}>{phoneContent}</PhoneFrame>
          </div>
        </div>
      </section>

      {/* SYSTEM LOGIC — bento */}
      <section id="logic" className="relative border-t border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-8 py-24">
          <div className="nn-reveal mb-16 max-w-2xl" data-delay="1">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#FF00FF]" style={MONO}>
              // System Logic
            </div>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white md:text-5xl">
              The architecture, in three blocks.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <BentoCard
              index={1}
              label="The Gate"
              title="University-only. .edu verified."
              body="Access is bound to a verified .edu address. No public profiles, no recycled accounts, no cold outsiders. The closed loop is the product."
              metric=".edu enforced"
            />
            <BentoCard
              index={2}
              label="The Engine"
              title="Behavioral Signal Acquisition."
              body="The engine reads pace and intention as weighted vectors — Mirror (alignment) vs. Counterweight (productive contrast) — to compose two high-signal matches."
              metric="Mirror ⇄ Counterweight"
            />
            <BentoCard
              index={3}
              label="The Drop"
              title="8pm drop. 24-hour decay."
              body="Two matches drop at 8:00 PM. Greenlight within 24 hours or the queue clears. The scarcity is the feature."
              metric="T-minus 24:00:00"
            />
          </div>
        </div>
      </section>

      {/* FOOTER — System Integrity */}
      <footer id="terms" className="border-t border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-8 py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
            <div id="safety" className="nn-reveal" data-delay="1">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#FF00FF]" style={MONO}>
                // System Integrity
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60" style={MONO}>
                No verified student status, no active dating profile.
                Accounts that fail .edu verification are not allowed into the
                matching pool, and their session activity is discarded. For
                verified users, Loom uses compatibility signals to improve
                match quality while protecting profile data and limiting what
                is stored.
              </p>
            </div>
            <div className="nn-reveal" data-delay="2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/40" style={MONO}>
                Network
              </div>
              <ul className="mt-4 space-y-2 text-sm text-white/70" style={MONO}>
                <li><a href="#logic" className="hover:text-white">The Logic</a></li>
                <li><a href="#safety" className="hover:text-white">Safety</a></li>
                <li><a href="#terms" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
            <div className="nn-reveal" data-delay="3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/40" style={MONO}>
                Status
              </div>
              <ul className="mt-4 space-y-2 text-sm text-white/70" style={MONO}>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF00FF] shadow-[0_0_10px_#FF00FF]" />
                  Engine online
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  Next drop 8pm
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
    </div>
  );
}