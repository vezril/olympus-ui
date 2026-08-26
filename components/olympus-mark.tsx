/**
 * The Olympus mark: a temple crowning a terraced summit, in the family's cyan
 * neon linework. Olympus is not a god — it is the mountain the family lives on —
 * so it breaks the portrait convention every god mark follows, deliberately.
 *
 * Inlined rather than an <img> so the stroke can be `currentColor`: the caller
 * sets the colour from --sidebar-primary, which makes the "accent in the mark ==
 * --primary" echo (UX-STANDARDS §3.4) true BY CONSTRUCTION instead of by
 * somebody remembering to re-export a PNG when the accent moves.
 *
 * The raster twin lives at public/brand/olympus.svg; the keyed 1024px PNG for
 * the codex brand set is generated from the same geometry.
 */
export function OlympusMark({
  size = 32,
  glow = true,
  className,
}: {
  size?: number;
  glow?: boolean;
  className?: string;
}) {
  const filterId = "olympus-mark-glow";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
    >
      {glow ? (
        <defs>
          <filter id={filterId} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="2.4" result="b1" />
            <feGaussianBlur stdDeviation="6" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      ) : null}

      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glow ? `url(#${filterId})` : undefined}
      >
        {/* summit = the temple roof; the mountain flanks fall from its footing */}
        <path d="M128 36 L182 98 L182 152 L226 210 L30 210 L74 152 L74 98 Z" strokeWidth="8" />
        {/* architrave and stylobate */}
        <path d="M74 98 L182 98" strokeWidth="7" />
        <path d="M74 152 L182 152" strokeWidth="7" />
        {/* columns */}
        <path
          d="M95 104 L95 146 M116 104 L116 146 M140 104 L140 146 M161 104 L161 146"
          strokeWidth="5"
        />
        {/* terraces — spans reach the flanks so they read as contour, not dashes */}
        <path d="M62 176 L194 176" strokeWidth="4" opacity="0.42" />
        <path d="M48 194 L208 194" strokeWidth="4" opacity="0.26" />
      </g>
    </svg>
  );
}
