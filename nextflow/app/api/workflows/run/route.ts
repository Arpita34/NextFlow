import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workflowId, scope } = body;

    if (!workflowId) {
      return NextResponse.json({ error: "workflowId is required" }, { status: 400 });
    }

    // Ensure workflow exists or create a dummy one for testing
    let workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    });

    if (!workflow) {
      // Create a dummy workflow for testing Phase 6
      workflow = await prisma.workflow.create({
        data: {
          id: workflowId || "test-workflow",
          userId,
          name: "Test Workflow",
          nodes: [],
          edges: []
        }
      });
    }

    // Create the run
    const run = await prisma.workflowRun.create({
      data: {
        workflowId,
        userId,
        scope: scope || "full",
        status: "running"
      }
    });

    return NextResponse.json({ runId: run.id });
  } catch (error: any) {
    console.error("Failed to create workflow run:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
