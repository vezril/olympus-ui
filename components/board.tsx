import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { columnLabel, componentSummary, serviceName, toColumns } from "@/lib/board";
import { markFor } from "@/lib/marks";
import type { Constellation, ConstellationService } from "@/lib/types";
import { cn } from "@/lib/utils";

import Image from "next/image";

function ServiceCard({ service }: { service: ConstellationService }) {
  const mark = markFor(service.id);
  const components = componentSummary(service);

  return (
    <li>
      <Card className="flex flex-col gap-2 p-3">
        <div className="flex items-start gap-2">
          {mark ? (
            <Image src={mark} alt="" aria-hidden width={24} height={24} className="shrink-0" />
          ) : (
            <span aria-hidden className="bg-muted mt-0.5 size-6 shrink-0 rounded-sm" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium">{serviceName(service)}</h3>
            {service.domain ? (
              <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{service.domain}</p>
            ) : null}
          </div>
        </div>

        {components ? (
          <p className="text-muted-foreground/80 font-mono text-[11px] leading-snug break-words">
            {components}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-1">
          {/* ares runs on Docker Compose off-cluster. Without this it reads as
              "missing from the cluster", which would be a lie. */}
          {service.off_cluster ? (
            <Badge variant="outline" className="text-[10px]">
              off-cluster
            </Badge>
          ) : null}
          {service.owner && service.owner !== "unassigned" ? (
            <Badge variant="outline" className="text-[10px]">
              {service.owner}
            </Badge>
          ) : null}
        </div>

        {service.awaiting ? (
          <p className="text-[var(--warning)] text-xs leading-snug">
            <span className="font-medium">Awaiting: </span>
            {service.awaiting}
          </p>
        ) : null}
      </Card>
    </li>
  );
}

function Swimlane({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-sm font-medium tracking-wide uppercase">{title}</h2>
        {note ? <p className="text-muted-foreground text-xs">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Board({ manifest }: { manifest: Constellation }) {
  const columns = toColumns(manifest);
  const decisions = manifest.open_decisions ?? [];
  const threads = manifest.threads ?? [];
  const infra = manifest.infra ?? [];
  const speculative = manifest.speculative ?? [];

  return (
    <div className="flex flex-col gap-10">
      {/* Waiting on you first: the whole point of surfacing it is that it is the
          part only Calvin can move. */}
      {decisions.length > 0 ? (
        <Swimlane id="decisions" title="Waiting on you" note="open decisions from the manifest">
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {decisions.map((d, i) => (
              <li key={`${d.card ?? "decision"}-${i}`}>
                <Card className="border-[var(--warning)]/40 flex items-start gap-2 p-3">
                  {d.card ? (
                    <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">
                      {d.card}
                    </Badge>
                  ) : null}
                  <p className="text-sm leading-snug">{d.question}</p>
                </Card>
              </li>
            ))}
          </ul>
        </Swimlane>
      ) : null}

      <Swimlane id="lifecycle" title="Lifecycle" note="a card moves when its real state changes">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col gap-2">
              <div className="border-border flex items-baseline justify-between border-b pb-1.5">
                <h3
                  className={cn(
                    "text-xs font-medium tracking-wide uppercase",
                    col.id === "live" ? "text-[var(--primary)]" : "text-muted-foreground",
                    col.id === "__unmapped" && "text-[var(--destructive)]",
                  )}
                >
                  {columnLabel(col.id === "__unmapped" ? { id: col.id, label: col.label } : col.id)}
                </h3>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {col.services.length}
                </span>
              </div>

              {col.services.length === 0 ? (
                <p className="text-muted-foreground/70 px-1 py-2 text-xs">Nothing here.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {col.services.map((s) => (
                    <ServiceCard key={s.id} service={s} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Swimlane>

      {threads.length > 0 ? (
        <Swimlane id="threads" title="Threads" note="cross-cutting work, not one service">
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {threads.map((t) => (
              <li key={t.id}>
                <Card className="flex flex-col gap-1 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-medium">{t.name ?? t.id}</h3>
                    {t.status ? (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {t.status}
                      </Badge>
                    ) : null}
                  </div>
                  {t.domain ? (
                    <p className="text-muted-foreground text-xs leading-snug">{t.domain}</p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        </Swimlane>
      ) : null}

      {infra.length > 0 ? (
        <Swimlane id="infra" title="Infra" note="live workloads that are not a divinity">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {infra.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </ul>
        </Swimlane>
      ) : null}

      {speculative.length > 0 ? (
        <Swimlane
          id="speculative"
          title="Speculative"
          note="a mark exists, the service does not — idea and verdict only"
        >
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {speculative.map((s) => (
              <li key={s.id}>
                <Card className="flex flex-col gap-1 p-3 opacity-75">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-medium">{s.name ?? s.id}</h3>
                    {s.has_art ? (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        mark
                      </Badge>
                    ) : null}
                  </div>
                  {s.idea ? (
                    <p className="text-muted-foreground text-xs leading-snug">{s.idea}</p>
                  ) : null}
                  {s.verdict ? (
                    <p className="text-muted-foreground/70 text-xs leading-snug italic">
                      {s.verdict}
                    </p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        </Swimlane>
      ) : null}
    </div>
  );
}
