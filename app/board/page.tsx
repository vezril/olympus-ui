import { Board } from "@/components/board";
import { ServiceUnreachable } from "@/components/service-unreachable";
import { describeError, fetchConstellation } from "@/lib/olympus";

// The manifest is a live read: never prerendered, so the board cannot show a
// state that git has already moved past.
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  let manifest;
  try {
    manifest = await fetchConstellation();
  } catch (err) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-medium tracking-tight">Constellation</h1>
        </header>
        <ServiceUnreachable reason={describeError(err)} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium tracking-tight">Constellation</h1>
        <p className="text-muted-foreground text-sm">
          Status of record, rendered from codex&apos;s manifest. Read-only by design: a
          card moves when its real state changes, never by dragging.
          {manifest.updated ? (
            <span className="text-muted-foreground/70 font-mono">
              {" "}
              · updated {manifest.updated}
            </span>
          ) : null}
        </p>
      </header>

      <Board manifest={manifest} />
    </div>
  );
}
