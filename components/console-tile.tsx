"use client";

import { HealthPill, type PillState } from "@/components/health-pill";
import { Mark } from "@/components/mark";
import { Card } from "@/components/ui/card";
import { useHealth } from "@/components/health-context";
import type { ConsoleEntry } from "@/lib/registry";
import { cn } from "@/lib/utils";

function detailFor(
  state: PillState,
  latencyMs?: number,
  error?: string,
): string | undefined {
  if (state === "live") return latencyMs !== undefined ? `${latencyMs} ms` : undefined;
  if (state === "down") return error ?? "unreachable";
  return undefined;
}

export function ConsoleTile({ entry }: { entry: ConsoleEntry }) {
  const { byId, loading } = useHealth();
  const result = byId[entry.id];

  const state: PillState =
    entry.status === "planned" ? "planned" : loading && !result ? "checking" : (result?.state ?? "checking");

  const detail = detailFor(state, result?.latencyMs, result?.error);
  const planned = entry.status === "planned";

  const body = (
    <Card
      className={cn(
        "flex h-full flex-col gap-3 p-4 transition-colors",
        planned
          ? "opacity-55"
          : "hover:border-[var(--primary)] group-focus-visible:border-[var(--primary)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Mark entry={entry} size={40} />
        <HealthPill state={state} detail={detail} />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium tracking-tight">{entry.name}</h3>
        <p className="text-muted-foreground text-sm">{entry.blurb}</p>
      </div>

      <p className="text-muted-foreground/80 mt-auto font-mono text-xs">
        {planned ? "—" : new URL(entry.href).host}
        {state === "live" && result?.latencyMs !== undefined ? (
          <span className="text-muted-foreground/60"> · {result.latencyMs} ms</span>
        ) : null}
        {state === "down" && detail ? (
          <span className="text-[var(--destructive)]"> · {detail}</span>
        ) : null}
      </p>
    </Card>
  );

  if (planned) {
    return (
      <li aria-label={`${entry.name} — planned, not yet built`}>{body}</li>
    );
  }

  return (
    <li>
      <a
        href={entry.href}
        className="group block h-full rounded-md"
        aria-label={`Open ${entry.name}`}
      >
        {body}
      </a>
    </li>
  );
}
