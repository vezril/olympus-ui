import { Card } from "@/components/ui/card";

/**
 * The registry lives in olympus-service now, so "the service is down" is a state
 * the portal has to render honestly — not a blank page and not a fake console list.
 */
export function ServiceUnreachable({ reason }: { reason: string }) {
  return (
    <Card role="alert" className="border-[var(--destructive)]/50 flex flex-col gap-2 p-6">
      <h2 className="font-medium">Can&apos;t reach olympus-service</h2>
      <p className="text-muted-foreground text-sm">
        The console registry lives in olympus-service, and it did not answer:{" "}
        <span className="text-[var(--destructive)] font-mono">{reason}</span>
      </p>
      <p className="text-muted-foreground text-sm">
        Nothing here is stale — the portal has no list to show. Check the service
        is up in the <span className="font-mono">olympus</span> namespace, and that{" "}
        <span className="font-mono">OLYMPUS_SERVICE_URL</span> points at it. Reload
        once it is back.
      </p>
    </Card>
  );
}
