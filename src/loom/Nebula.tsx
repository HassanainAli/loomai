// Ambient "thinking" nebula: breathing magenta/cyan clouds.
export function Nebula({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="nn-nebula-cloud nn-nebula-a" />
      <div className="nn-nebula-cloud nn-nebula-b" />
      <div className="nn-nebula-cloud nn-nebula-c" />
    </div>
  );
}
