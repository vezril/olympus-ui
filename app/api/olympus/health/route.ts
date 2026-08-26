import { NextResponse } from "next/server";

import { describeError, fetchHealth } from "@/lib/olympus";

// Health is a live read: never prerendered, never cached.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const report = await fetchHealth();
    return NextResponse.json(report, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    // 502, not 500: the failure is upstream, and the portal says so rather than
    // pretending every console is down.
    return NextResponse.json(
      { error: describeError(err) },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
