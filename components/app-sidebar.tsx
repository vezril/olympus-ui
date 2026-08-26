"use client";

import Image from "next/image";

import { summarize, useHealth } from "@/components/health-context";
import { HealthPill } from "@/components/health-pill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const NAV = [
  { href: "#consoles", label: "Consoles" },
  { href: "#planned", label: "Planned" },
];

/**
 * Chrome per UX-STANDARDS §5: left sidebar, mark slot top-left, vertical nav,
 * health pill at the bottom. No top-nav layouts.
 *
 * Below md it collapses to a single compact bar — the sidebar stacked whole
 * pushed the first tile off a phone screen, and phones are a first-class path
 * for this portal (DESIGN-access-gateway.md). The two section anchors are
 * dropped there rather than shrunk: the page is short enough to scroll.
 */
export function AppSidebar() {
  const { byId, checkedAt, error, loading, syncing, refresh } = useHealth();
  const { up, total, state } = summarize(byId);

  const lastChecked = checkedAt
    ? new Date(checkedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <aside className="bg-[var(--sidebar)] border-border flex w-full shrink-0 items-center justify-between gap-3 border-b px-4 py-3 md:h-dvh md:w-60 md:flex-col md:items-stretch md:justify-start md:gap-6 md:border-r md:border-b-0 md:p-4">
      <div className="flex items-center gap-3">
        {/* The keyed god mark, per UX-STANDARDS §3.4 / §5. Marks ship on
            transparent alpha (brand convention, 2026-08-26), so this composites
            on the sidebar surface without the #06060F square a baked-on mark
            would show here. */}
        <Image
          src="/brand/olympus.png"
          alt=""
          aria-hidden
          width={32}
          height={32}
          priority
          className="shrink-0"
        />
        <div className="leading-tight">
          <p className="text-sm font-medium tracking-wide">Olympus</p>
          <p className="text-muted-foreground text-xs">the front door</p>
        </div>
      </div>

      <nav aria-label="Sections" className="hidden md:block">
        <ul className="flex flex-col gap-1">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="hover:bg-[var(--sidebar-accent)] block rounded-sm px-2 py-1.5 text-sm"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-3 md:mt-auto md:flex-col md:items-start md:gap-2 md:border-t md:border-border md:pt-4">
        {loading ? (
          <Skeleton className="h-5 w-24" />
        ) : (
          <HealthPill
            // With no report there is nothing to aggregate — say Unknown rather
            // than borrowing "Planned", which would read as "nothing is built".
            state={error || state === "unknown" ? "unknown" : state}
            detail={
              error ? `olympus-service: ${error}` : `${up} of ${total} consoles answering`
            }
            className="w-fit"
          />
        )}

        <p className="text-muted-foreground hidden font-mono text-xs sm:block">
          {loading
            ? "checking…"
            : error
              ? "no report"
              : `${up}/${total} up${lastChecked ? ` · ${lastChecked}` : ""}`}
        </p>

        <Button
          variant="ghost"
          size="sm"
          className="w-fit px-2"
          onClick={refresh}
          disabled={syncing}
        >
          {syncing ? "Syncing…" : "Refresh"}
        </Button>
      </div>
    </aside>
  );
}
