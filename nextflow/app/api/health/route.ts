import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Lightweight ping to keep Neon DB warm
// Hit this every 4 minutes with cron-job.org (free) to avoid cold starts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
