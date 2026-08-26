import { ConsoleGrid } from "@/components/console-grid";
import { ServiceUnreachable } from "@/components/service-unreachable";
import { describeError, fetchConsoles, liveConsoles, plannedConsoles } from "@/lib/olympus";

// The registry now lives in olympus-service, so this page is a live read.
export const dynamic = "force-dynamic";

export default async function Page() {
  let consoles;
  try {
    consoles = await fetchConsoles();
  } catch (err) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 md:p-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-medium tracking-tight">Consoles</h1>
        </header>
        <ServiceUnreachable reason={describeError(err)} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 md:p-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium tracking-tight">Consoles</h1>
        <p className="text-muted-foreground text-sm">
          Everything on the mountain. Health is polled by olympus-service; pills
          refresh every 30 seconds.
        </p>
      </header>

      <ConsoleGrid live={liveConsoles(consoles)} planned={plannedConsoles(consoles)} />
    </div>
  );
}
