import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { tasks } from "@trigger.dev/sdk/v3";
import type { cropImageTask } from "@/trigger/crop-image-task";
import { z } from "zod";

const cropSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required"),
  x_percent: z.number().min(0).max(100).default(0),
  y_percent: z.number().min(0).max(100).default(0),
  width_percent: z.number().min(0).max(100).default(100),
  height_percent: z.number().min(0).max(100).default(100),
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
    const parsed = cropSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input: " + JSON.stringify(parsed.error.flatten().fieldErrors) }, { status: 400 });
    }

    const payload = parsed.data;

    const execution = await prisma.nodeExecution.create({
      data: {
        runId: payload.runId,
        nodeId: payload.nodeId,
        nodeType: "crop",
        status: "running",
        inputs: {
          imageUrl: payload.imageUrl,
          xPercent: payload.x_percent,
          yPercent: payload.y_percent,
          widthPercent: payload.width_percent,
          heightPercent: payload.height_percent
        }
      }
    });

    const handle = await tasks.trigger<typeof cropImageTask>("crop-image-task", {
      ...payload,
      executionId: execution.id
    });

    return NextResponse.json({ 
      success: true, 
      executionId: execution.id,
      triggerRunId: handle.id
    });
  } catch (error: any) {
    console.error("Crop Node API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
