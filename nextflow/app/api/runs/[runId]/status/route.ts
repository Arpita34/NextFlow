import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = await params;

    const run = await prisma.workflowRun.findUnique({
      where: { id: runId },
      include: {
        executions: true
      }
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Check if run is complete (all executions are success/failed)
    const allCompleted = run.executions.length > 0 && run.executions.every(
      (ex) => ex.status === "success" || ex.status === "failed"
    );

    if (allCompleted && run.status === "running") {
      await prisma.workflowRun.update({
        where: { id: runId },
        data: { 
          status: run.executions.some(ex => ex.status === "failed") ? "failed" : "success",
          completedAt: new Date(),
        }
      });
    }

    return NextResponse.json(run);
  } catch (error: any) {
    console.error("Run Status API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
