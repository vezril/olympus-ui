import Image from "next/image";

import { markFor } from "@/lib/marks";
import type { ConsoleEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The console's god mark. Marks ship on transparent alpha (brand convention,
 * 2026-08-26), so they composite on the card surface without the #06060F square
 * a ground-baked mark would show.
 *
 * A console with no shipped mark falls back to neutral accent linework — a slot,
 * deliberately not a logo. No logo beats a wrong logo.
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
  const src = entry.mark ?? markFor(entry.id);

  if (src) {
    return (
      <Image
        src={src}
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
