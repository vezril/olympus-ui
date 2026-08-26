import Image from "next/image";

import type { ConsoleEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The mark slot. The real god marks are keyed to the #06060F ground and live in
 * codex `docs/brand/<god>.png`; drop them into public/brand/ and set `mark` on
 * the registry entry. Until then this renders a neutral accent-linework slot —
 * deliberately not a logo, because no logo beats a wrong logo.
 */
export function Mark({
  entry,
  size = 40,
  className,
}: {
  entry: ConsoleEntry;
  size?: number;
  className?: string;
}) {
  if (entry.mark) {
    return (
      <Image
        src={entry.mark}
        alt=""
        aria-hidden
        width={size}
        height={size}
        className={cn("shrink-0", className)}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <circle cx="20" cy="20" r="15" stroke={entry.accent} strokeWidth="1" opacity="0.7" />
      <circle
        cx="20"
        cy="20"
        r="9"
        stroke={entry.accentAlt ?? entry.accent}
        strokeWidth="1"
        opacity="0.35"
      />
      <circle cx="20" cy="20" r="2" fill={entry.accent} />
    </svg>
  );
}
