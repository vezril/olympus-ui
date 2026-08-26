import { describe, expect, it } from "vitest";

import { columnLabel, componentSummary, serviceName, toColumns } from "@/lib/board";
import type { Constellation } from "@/lib/types";

const manifest: Constellation = {
  lifecycle: ["live", "building", "designed"],
  services: [
    { id: "hermes", name: "Hermes", status: "live", components: [{ repo: "hermes-ui", version: "0.1.8" }] },
    { id: "olympus", name: "Olympus", status: "live" },
    { id: "ares", name: "Ares", status: "building", off_cluster: true },
    { id: "tyche", name: "Tyche", status: "designed" },
  ],
};

describe("toColumns", () => {
  it("keeps the manifest's declared column order", () => {
    expect(toColumns(manifest).map((c) => c.id)).toEqual(["live", "building", "designed"]);
  });

  it("puts each service in the column its status names", () => {
    const byId = Object.fromEntries(toColumns(manifest).map((c) => [c.id, c.services.map((s) => s.id)]));
    expect(byId.live).toEqual(["hermes", "olympus"]);
    expect(byId.building).toEqual(["ares"]);
  });

  it("surfaces a status with no column instead of silently dropping it", () => {
    // The board must never hide what the manifest says.
    const odd = { ...manifest, services: [...(manifest.services ?? []), { id: "ghost", status: "nowhere" }] };
    const cols = toColumns(odd);
    const unmapped = cols.find((c) => c.id === "__unmapped");
    expect(unmapped?.services.map((s) => s.id)).toEqual(["ghost"]);
  });

  it("renders empty columns rather than omitting them", () => {
    const cols = toColumns({ lifecycle: ["live", "parked"], services: [] });
    expect(cols.map((c) => c.id)).toEqual(["live", "parked"]);
    expect(cols.every((c) => c.services.length === 0)).toBe(true);
  });

  it("survives a manifest missing the fields entirely", () => {
    expect(toColumns({})).toEqual([]);
  });
});

describe("columnLabel", () => {
  it("titles the known lifecycle ids", () => {
    expect(columnLabel("live")).toBe("Live");
    expect(columnLabel("speculative")).toBe("Speculative");
  });

  it("falls back to capitalising an unknown id", () => {
    expect(columnLabel("incubating")).toBe("Incubating");
  });

  it("prefers an explicit label from the manifest", () => {
    expect(columnLabel({ id: "live", label: "In production" })).toBe("In production");
  });
});

describe("componentSummary", () => {
  it("joins repo and version", () => {
    expect(
      componentSummary({ id: "x", status: "live", components: [
        { repo: "a", version: "1.0.0" }, { repo: "b", version: "2.0.0" },
      ] }),
    ).toBe("a 1.0.0 · b 2.0.0");
  });

  it("marks an unversioned component rather than pretending it has one", () => {
    expect(componentSummary({ id: "x", status: "live", components: [{ repo: "a", version: null }] }))
      .toBe("a —");
  });

  it("returns null when there are no components", () => {
    expect(componentSummary({ id: "x", status: "live" })).toBeNull();
  });
});

describe("serviceName", () => {
  it("falls back to the id", () => {
    expect(serviceName({ id: "hermes", status: "live" })).toBe("hermes");
  });
});
