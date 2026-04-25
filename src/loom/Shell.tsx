import { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-0 sm:p-6">
      <div className="w-full max-w-md min-h-screen sm:min-h-[800px] sm:h-[800px] bg-background sm:rounded-3xl sm:border sm:border-border sm:shadow-2xl overflow-hidden flex flex-col relative">
        {children}
      </div>
    </div>
  );
}

export function Brand({ className = "" }: { className?: string }) {
  return (
    <h1 className={`font-black tracking-tighter ${className}`}>
      Loom<span className="text-primary">.</span>
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