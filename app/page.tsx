import { ConsoleGrid } from "@/components/console-grid";
import { liveConsoles, plannedConsoles } from "@/lib/registry";

export default function Page() {
  // Registry is static config, so the tiles render on first paint with real
  // names; only the health pills wait on the BFF.
  const live = liveConsoles();
  const planned = plannedConsoles();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 md:p-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium tracking-tight">Consoles</h1>
        <p className="text-muted-foreground text-sm">
          Everything on the mountain. Health is polled server-side; pills refresh
          every 30 seconds.
        </p>
      </header>

      <ConsoleGrid live={live} planned={planned} />
    </div>
  );
}
