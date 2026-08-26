import { NextResponse } from "next/server";

import { checkAll } from "@/lib/health";

// Health is a live read: never prerendered, never cached.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const report = await checkAll();
  return NextResponse.json(report, {
    headers: { "cache-control": "no-store" },
  });
}
