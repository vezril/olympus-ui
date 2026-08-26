import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { hasMark, markFor } from "@/lib/marks";

const CONSOLES = [
  "dionysus",
  "hermes",
  "apollo",
  "artemis",
  "demeter",
  "hera",
  "poseidon",
  "ares",
];

describe("markFor", () => {
  it("returns a public path for a shipped mark", () => {
    expect(markFor("hermes")).toBe("/brand/hermes.png");
  });

  it("returns undefined for a console with no mark, so the tile falls back", () => {
    expect(markFor("zeus")).toBeUndefined();
    expect(hasMark("zeus")).toBe(false);
  });
});

describe("the shipped set matches what is actually on disk", () => {
  // The whole point of the set is to stop a 404 rendering as a broken image.
  // If it drifts from public/brand/, that guarantee is gone.
  it.each(CONSOLES)("%s has a file backing its entry", (id) => {
    expect(hasMark(id)).toBe(true);
    const path = join(process.cwd(), "public", "brand", `${id}.png`);
    expect(existsSync(path), `${path} is missing`).toBe(true);
  });

  it("olympus itself is NOT in the set — it is chrome, not a console tile", () => {
    expect(hasMark("olympus")).toBe(false);
  });
});
