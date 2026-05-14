import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/workflows/[id]/runs — List all runs for a workflow
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const runs = await prisma.workflowRun.findMany({
      where: { workflowId: id, userId },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        executions: {
          select: {
            id: true,
            nodeId: true,
            nodeType: true,
            status: true,
            executionTime: true,
            error: true,
          },
        },
      },
    });

    return NextResponse.json({ runs });
  } catch (error: any) {
    console.error("List runs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
