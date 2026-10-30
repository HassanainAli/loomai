import type { ElementType } from "react";

/** Brand wordmark: lowercase "loom" + bold yellow period. Single source of truth. */
export function Wordmark({
  as: Tag = "span",
  className = "",
}: {
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag className={`font-sans font-black lowercase tracking-[-0.05em] text-white ${className}`}>
      loom<span className="font-black text-[#FACC15]">.</span>
    </Tag>
  );
}
