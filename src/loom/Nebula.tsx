// Ambient "signal field": soft neon back-glow with campus signal nodes.
// phase "idle" = quiet pulses, "sync" = scan beam while the drop runs,
// "aligned" = the two focal nodes connect. variant "soft" is the settled glow used behind the queue.
export type SignalPhase = "idle" | "sync" | "aligned";

const NODES = [
  { x: 14, y: 22, d: 0 },
  { x: 82, y: 16, d: 1.4 },
  { x: 68, y: 38, d: 2.6 },
  { x: 22, y: 58, d: 3.1 },
  { x: 88, y: 66, d: 0.8 },
  { x: 40, y: 86, d: 2.1 },
];
// The two focal nodes ("you" and "them").
const A = { x: 24, y: 34 };
const B = { x: 80, y: 28 };

export function Nebula({
  className = "",
  phase = "idle",
  variant = "full",
}: {
  className?: string;
  phase?: SignalPhase;
  variant?: "full" | "soft";
}) {
  const soft = variant === "soft";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden nn-field nn-phase-${phase} ${soft ? "nn-field-soft" : ""} ${className}`}
    >
      <div className="nn-glow nn-glow-a" />
      <div className="nn-glow nn-glow-b" />
      {!soft && (
        <>
          {NODES.map((n, i) => (
            <span key={i} className="nn-node" style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${n.d}s` }} />
          ))}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line
              className="nn-link"
              x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              pathLength={1}
            />
          </svg>
          <span className="nn-node nn-focal nn-focal-a" style={{ left: `${A.x}%`, top: `${A.y}%` }} />
          <span className="nn-node nn-focal nn-focal-b" style={{ left: `${B.x}%`, top: `${B.y}%` }} />
          <div className="nn-scan" />
        </>
      )}
    </div>
  );
}
