"use client";

import { ConsoleTile } from "@/components/console-tile";
import { useHealth } from "@/components/health-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ConsoleEntry } from "@/lib/registry";
import { cn } from "@/lib/utils";

function Section({
  id,
  title,
  note,
  entries,
}: {
  id: string;
  title: string;
  note?: string;
  entries: ConsoleEntry[];
}) {
  if (entries.length === 0) return null;

  return (
    <section id={id} className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2
          className={cn(
            "text-sm font-medium tracking-wide uppercase",
            id === "consoles" ? "text-[var(--primary)]" : "text-muted-foreground",
          )}
        >
          {title}
        </h2>
        {note ? <p className="text-muted-foreground text-xs">{note}</p> : null}
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <ConsoleTile key={entry.id} entry={entry} />
        ))}
      </ul>
    </section>
  );
}

export function ConsoleGrid({
  live,
  planned,
}: {
  live: ConsoleEntry[];
  planned: ConsoleEntry[];
}) {
  const { error, refresh, syncing } = useHealth();

  if (live.length === 0 && planned.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="font-medium">No consoles registered</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Olympus reads its list from <code className="font-mono">lib/registry.ts</code>.
          Add an entry there — name, namespace, Service, accent — and it appears here.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {error ? (
        <Card
          role="alert"
          className="border-[var(--destructive)]/50 flex flex-wrap items-center justify-between gap-3 p-4"
        >
          <div>
            <p className="text-sm font-medium">Health check failed</p>
            <p className="text-muted-foreground text-sm">
              {error} — the tiles below show the last state we knew.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={syncing}>
            {syncing ? "Retrying…" : "Retry"}
          </Button>
        </Card>
      ) : null}

      <Section id="consoles" title="Consoles" entries={live} />
      <Section
        id="planned"
        title="Planned"
        note="named, not yet built — no health to report"
        entries={planned}
      />
    </div>
  );
}
