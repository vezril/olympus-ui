import { afterEach, describe, expect, it, vi } from "vitest";

import { checkAll, describeError, isHealthyStatus, probe } from "@/lib/health";
import { findConsole, plannedConsoles } from "@/lib/registry";

const hermes = findConsole("hermes")!;
const hera = findConsole("hera")!;

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(impl: (url: string) => Promise<Response> | Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => Promise.resolve(impl(String(input)))),
  );
}

describe("isHealthyStatus", () => {
  it("passes 200-399, matching the k8s probe convention", () => {
    expect(isHealthyStatus(200)).toBe(true);
    expect(isHealthyStatus(302)).toBe(true);
    expect(isHealthyStatus(399)).toBe(true);
    expect(isHealthyStatus(400)).toBe(false);
    expect(isHealthyStatus(500)).toBe(false);
    expect(isHealthyStatus(199)).toBe(false);
  });
});

describe("describeError", () => {
  it("names a timeout", () => {
    expect(describeError(new DOMException("t", "TimeoutError"))).toBe("timed out");
  });

  it("unwraps the fetch cause, which carries the real reason", () => {
    const err = new Error("fetch failed", { cause: new Error("ECONNREFUSED") });
    expect(describeError(err)).toBe("ECONNREFUSED");
  });

  it("falls back for non-errors", () => {
    expect(describeError("nope")).toBe("unreachable");
  });
});

describe("probe", () => {
  it("reports live on a 200", async () => {
    stubFetch(() => new Response("ok", { status: 200 }));
    const result = await probe(hermes);
    expect(result.state).toBe("live");
    expect(result.httpStatus).toBe(200);
    expect(result.latencyMs).toBeTypeOf("number");
    expect(result.error).toBeUndefined();
  });

  it("reports down with the status on a 500", async () => {
    stubFetch(() => new Response("boom", { status: 500 }));
    const result = await probe(hermes);
    expect(result.state).toBe("down");
    expect(result.error).toBe("HTTP 500");
  });

  it("reports down with the reason when the connection fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.reject(new Error("fetch failed", { cause: new Error("ECONNREFUSED") })),
      ),
    );
    const result = await probe(hermes);
    expect(result.state).toBe("down");
    expect(result.error).toBe("ECONNREFUSED");
  });

  it("never probes a planned console", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await probe(hera);
    expect(result.state).toBe("planned");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("probes the in-cluster Service, not the public host", async () => {
    const seen: string[] = [];
    stubFetch((url) => {
      seen.push(url);
      return new Response("ok", { status: 200 });
    });
    await probe(hermes);
    expect(seen).toEqual(["http://hermes-ui.hermes.svc.cluster.local/"]);
  });
});

describe("checkAll", () => {
  it("returns a result per live console plus every planned one", async () => {
    stubFetch(() => new Response("ok", { status: 200 }));
    const report = await checkAll([hermes]);

    expect(report.results.filter((r) => r.state === "live").map((r) => r.id)).toEqual([
      "hermes",
    ]);
    expect(report.results.filter((r) => r.state === "planned").map((r) => r.id)).toEqual(
      plannedConsoles().map((c) => c.id),
    );
    expect(() => new Date(report.checkedAt).toISOString()).not.toThrow();
  });

  it("does not let one dead console take down the report", async () => {
    const apollo = findConsole("apollo")!;
    stubFetch((url) => {
      if (url.includes("apollo")) throw new Error("fetch failed");
      return new Response("ok", { status: 200 });
    });

    const report = await checkAll([hermes, apollo]);
    const byId = Object.fromEntries(report.results.map((r) => [r.id, r.state]));
    expect(byId.hermes).toBe("live");
    expect(byId.apollo).toBe("down");
  });
});
