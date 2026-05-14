import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createWorkflowSchema = z.object({
  name: z.string().min(1).default("Untitled"),
  nodes: z.any(),
  edges: z.any(),
});

// GET /api/workflows — List all workflows for current user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { runs: true } },
      },
    });

    return NextResponse.json({ workflows });
  } catch (error: any) {
    console.error("List workflows error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/workflows — Create a new workflow
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const workflow = await prisma.workflow.create({
      data: {
        userId,
        name: parsed.data.name,
        nodes: parsed.data.nodes || [],
        edges: parsed.data.edges || [],
      },
    });

    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error("Create workflow error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
