import { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-0 sm:p-6">
      <div className="w-full max-w-md min-h-screen sm:min-h-[800px] sm:h-[800px] bg-zinc-950/50 backdrop-blur-sm sm:rounded-3xl border border-zinc-800 sm:shadow-2xl overflow-hidden flex flex-col relative">
        {children}
      </div>
    </div>
  );
}

export function Brand({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <h1
      className={`font-black tracking-tighter lowercase text-white ${className}`}
      style={{
        fontFamily: "Inter, sans-serif",
        letterSpacing: "-0.05em",
        ...style,
      }}
    >
      loom
      <span
        className="inline-block align-baseline rounded-full ml-1"
        style={{
          width: "0.6em",
          height: "0.6em",
          backgroundColor: "#FACC15",
        }}
      />
    </h1>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-primary text-primary-foreground font-bold text-base py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-95"
    >
      {children}
    </button>
  );
}