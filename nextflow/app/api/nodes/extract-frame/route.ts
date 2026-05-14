import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { tasks } from "@trigger.dev/sdk/v3";
import type { extractFrameTask } from "@/trigger/extract-frame-task";
import { z } from "zod";

const extractSchema = z.object({
  videoUrl: z.string().min(1, "Video URL is required"),
  timestamp: z.string().default("0"),
  nodeId: z.string(),
  runId: z.string()
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = extractSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input: " + JSON.stringify(parsed.error.flatten().fieldErrors) }, { status: 400 });
    }

    const payload = parsed.data;

    const execution = await prisma.nodeExecution.create({
      data: {
        runId: payload.runId,
        nodeId: payload.nodeId,
        nodeType: "extract-frame",
        status: "running",
        inputs: {
          videoUrl: payload.videoUrl,
          timestamp: payload.timestamp
        }
      }
    });

    const handle = await tasks.trigger<typeof extractFrameTask>("extract-frame-task", {
      ...payload,
      executionId: execution.id
    });

    return NextResponse.json({ 
      success: true, 
      executionId: execution.id,
      triggerRunId: handle.id
    });
  } catch (error: any) {
    console.error("Extract Frame Node API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
