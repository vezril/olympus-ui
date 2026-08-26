import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HealthState } from "@/lib/health";

export type PillState = HealthState | "degraded" | "checking";

const COPY: Record<
  PillState,
  { label: string; variant: "success" | "warning" | "destructive" | "outline" | "default" }
> = {
  live: { label: "Live", variant: "success" },
  degraded: { label: "Degraded", variant: "warning" },
  down: { label: "Down", variant: "destructive" },
  planned: { label: "Planned", variant: "outline" },
  checking: { label: "Checking…", variant: "default" },
};

/**
 * Status is never colour-only (UX-STANDARDS §5): every pill carries its word and
 * a shape — a filled dot for live, a hollow ring for down/planned, a pulse while
 * we are still asking.
 */
export function HealthPill({
  state,
  detail,
  className,
}: {
  state: PillState;
  detail?: string;
  className?: string;
}) {
  const { label, variant } = COPY[state];

  return (
    <Badge variant={variant} className={cn(className)} title={detail}>
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          state === "live" && "bg-current",
          state === "degraded" && "bg-current",
          state === "down" && "border border-current",
          state === "planned" && "border border-current",
          state === "checking" && "bg-current animate-pulse",
        )}
      />
      <span>{label}</span>
      {detail ? <span className="sr-only"> — {detail}</span> : null}
    </Badge>
  );
}
