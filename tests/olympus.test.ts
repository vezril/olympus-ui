import { afterEach, describe, expect, it, vi } from "vitest";

import {
  OlympusServiceError,
  describeError,
  fetchConsoles,
  fetchConstellation,
  fetchHealth,
  liveConsoles,
  plannedConsoles,
  serviceUrl,
} from "@/lib/olympus";
import type { ConsoleEntry } from "@/lib/types";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(impl: (url: string) => Response | Promise<Response>) {
  const spy = vi.fn((input: RequestInfo | URL) => Promise.resolve(impl(String(input))));
  vi.stubGlobal("fetch", spy);
  return spy;
}

const hermes: ConsoleEntry = {
  id: "hermes",
  name: "Hermes",
  blurb: "Messaging and delivery.",
  href: "https://hermes.home.experimentalneutron.com",
  namespace: "hermes",
  service: "hermes-ui",
  accent: "oklch(0.8 0.25 145)",
  status: "live",
  healthUrl: "http://hermes-ui.hermes.svc.cluster.local/",
};

const hera: ConsoleEntry = { ...hermes, id: "hera", name: "Hera", status: "planned" };

describe("serviceUrl", () => {
  it("defaults to the in-cluster Service", () => {
    expect(serviceUrl({})).toBe("http://olympus-service.olympus.svc.cluster.local");
  });

  it("prefers a runtime override", () => {
    expect(serviceUrl({ OLYMPUS_SERVICE_URL: "http://127.0.0.1:8080" })).toBe(
      "http://127.0.0.1:8080",
    );
  });

  it("strips a trailing slash so paths do not double up", () => {
    expect(serviceUrl({ OLYMPUS_SERVICE_URL: "http://127.0.0.1:8080/" })).toBe(
      "http://127.0.0.1:8080",
    );
  });

  it("ignores a blank override", () => {
    expect(serviceUrl({ OLYMPUS_SERVICE_URL: "   " })).toBe(
      "http://olympus-service.olympus.svc.cluster.local",
    );
  });
});

describe("fetchConsoles", () => {
  it("calls the service's /consoles", async () => {
    const spy = stubFetch(() => Response.json([hermes]));
    await fetchConsoles();
    expect(String(spy.mock.calls[0][0])).toBe(
      "http://olympus-service.olympus.svc.cluster.local/consoles",
    );
  });

  it("returns the registry the service serves", async () => {
    stubFetch(() => Response.json([hermes, hera]));
    await expect(fetchConsoles()).resolves.toHaveLength(2);
  });

  it("throws rather than inventing a registry when the service errors", async () => {
    stubFetch(() => new Response("nope", { status: 500 }));
    await expect(fetchConsoles()).rejects.toBeInstanceOf(OlympusServiceError);
  });

  it("rejects a malformed payload instead of rendering nonsense", async () => {
    stubFetch(() => Response.json({ consoles: [] }));
    await expect(fetchConsoles()).rejects.toThrow(/malformed registry/);
  });
});

describe("fetchHealth", () => {
  it("calls the service's aggregated endpoint", async () => {
    const spy = stubFetch(() => Response.json({ checkedAt: "now", results: [] }));
    await fetchHealth();
    expect(String(spy.mock.calls[0][0])).toBe(
      "http://olympus-service.olympus.svc.cluster.local/health/consoles",
    );
  });

  it("relays the report", async () => {
    stubFetch(() =>
      Response.json({
        checkedAt: "2026-08-25T12:00:00Z",
        results: [{ id: "hermes", state: "live", latencyMs: 12 }],
      }),
    );
    const report = await fetchHealth();
    expect(report.results[0].state).toBe("live");
  });

  it("rejects a report with no results array", async () => {
    stubFetch(() => Response.json({ checkedAt: "now" }));
    await expect(fetchHealth()).rejects.toThrow(/malformed health report/);
  });
});

describe("fetchConstellation", () => {
  it("calls the service's /constellation", async () => {
    const spy = stubFetch(() => Response.json({ version: 1 }));
    await fetchConstellation();
    expect(String(spy.mock.calls[0][0])).toBe(
      "http://olympus-service.olympus.svc.cluster.local/constellation",
    );
  });

  it("relays the manifest", async () => {
    stubFetch(() => Response.json({ version: 1, services: [{ id: "hermes", status: "live" }] }));
    const m = await fetchConstellation();
    expect(m.services?.[0].id).toBe("hermes");
  });

  it("rejects a manifest that is not an object, rather than rendering an empty board", async () => {
    stubFetch(() => Response.json([1, 2, 3]));
    await expect(fetchConstellation()).rejects.toThrow(/malformed constellation/);
  });

  it("throws when the service errors instead of inventing a manifest", async () => {
    stubFetch(() => new Response("nope", { status: 500 }));
    await expect(fetchConstellation()).rejects.toBeInstanceOf(OlympusServiceError);
  });
});

describe("describeError", () => {
  it("names a timeout", () => {
    expect(describeError(new DOMException("t", "TimeoutError"))).toBe(
      "olympus-service timed out",
    );
  });

  it("unwraps the fetch cause", () => {
    const err = new Error("fetch failed", { cause: new Error("ECONNREFUSED") });
    expect(describeError(err)).toBe("ECONNREFUSED");
  });

  it("passes a service error through unchanged", () => {
    expect(describeError(new OlympusServiceError("HTTP 502"))).toBe("HTTP 502");
  });

  it("falls back for non-errors", () => {
    expect(describeError(null)).toBe("olympus-service is unreachable");
  });
});

describe("splitting the registry", () => {
  it("separates live from planned without dropping anything", () => {
    const all = [hermes, hera];
    expect(liveConsoles(all).map((c) => c.id)).toEqual(["hermes"]);
    expect(plannedConsoles(all).map((c) => c.id)).toEqual(["hera"]);
  });
});
