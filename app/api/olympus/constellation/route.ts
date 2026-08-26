import { NextResponse } from "next/server";

import { describeError, fetchConstellation } from "@/lib/olympus";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const manifest = await fetchConstellation();
    return NextResponse.json(manifest, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    // 502: the failure is upstream. The board says the manifest is unreachable
    // rather than rendering an empty board that looks like "nothing exists".
    return NextResponse.json(
      { error: describeError(err) },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
