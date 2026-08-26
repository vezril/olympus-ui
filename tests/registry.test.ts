import { describe, expect, it } from "vitest";

import {
  REGISTRY,
  defaultHealthUrl,
  findConsole,
  healthUrlFor,
  liveConsoles,
  plannedConsoles,
} from "@/lib/registry";

describe("registry", () => {
  it("has unique ids", () => {
    const ids = REGISTRY.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("splits live and planned without dropping anything", () => {
    expect(liveConsoles().length + plannedConsoles().length).toBe(REGISTRY.length);
  });

  it("points every console at an https host under the portal domain", () => {
    for (const entry of REGISTRY) {
      const url = new URL(entry.href);
      expect(url.protocol).toBe("https:");
      expect(url.host).toBe(`${entry.id}.home.experimentalneutron.com`);
    }
  });

  it("ships no mark until the keyed PNGs land", () => {
    // Guard for the README promise: no logo beats a wrong logo. Delete this
    // test's expectation when real marks are added to public/brand/.
    expect(REGISTRY.every((c) => c.mark === undefined)).toBe(true);
  });

  it("finds a console by id", () => {
    expect(findConsole("hermes")?.name).toBe("Hermes");
    expect(findConsole("nobody")).toBeUndefined();
  });
});

describe("healthUrlFor", () => {
  const hermes = findConsole("hermes")!;

  it("defaults to the in-cluster Service DNS name", () => {
    expect(healthUrlFor(hermes, {})).toBe(
      "http://hermes-ui.hermes.svc.cluster.local/",
    );
    expect(defaultHealthUrl(hermes)).toBe(healthUrlFor(hermes, {}));
  });

  it("prefers a runtime env override", () => {
    const url = healthUrlFor(hermes, {
      OLYMPUS_HEALTH_URL_HERMES: "http://hermes-ui.hermes.svc.cluster.local/api/hermes/health",
    });
    expect(url).toBe("http://hermes-ui.hermes.svc.cluster.local/api/hermes/health");
  });

  it("ignores a blank override rather than probing an empty URL", () => {
    expect(healthUrlFor(hermes, { OLYMPUS_HEALTH_URL_HERMES: "   " })).toBe(
      defaultHealthUrl(hermes),
    );
  });
});
