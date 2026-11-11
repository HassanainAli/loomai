// Ambient "thinking" nebula: breathing magenta/cyan clouds with drifting stardust.
const DUST = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  size: 1 + (i % 3),
  delay: (i * 0.37) % 6,
  dur: 5 + (i % 5),
}));

export function Nebula({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="nn-nebula-cloud nn-nebula-a" />
      <div className="nn-nebula-cloud nn-nebula-b" />
      <div className="nn-nebula-cloud nn-nebula-c" />
      {DUST.map((d, i) => (
        <span
          key={i}
          className="nn-dust"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
