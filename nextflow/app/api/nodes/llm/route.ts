import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { tasks } from "@trigger.dev/sdk/v3";
import type { llmNodeTask } from "@/trigger/llm-node-task";
import { z } from "zod";

const llmSchema = z.object({
  systemPrompt: z.string().optional(),
  userMessage: z.string().min(1, "User message is required"),
  imageUrls: z.array(z.string()).optional(),
  model: z.string().default("nvidia/nemotron-nano-12b-v2-vl:free"),
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
    const parsed = llmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const payload = parsed.data;

    // Create NodeExecution record
    const execution = await prisma.nodeExecution.create({
      data: {
        runId: payload.runId,
        nodeId: payload.nodeId,
        nodeType: "llm",
        status: "running",
        inputs: {
          systemPrompt: payload.systemPrompt,
          userMessage: payload.userMessage,
          imageUrls: payload.imageUrls,
          model: payload.model
        }
      }
    });

    // Trigger the background task — pass API key from server env since Trigger.dev worker can't read .env
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    console.log("[LLM Route] OPENROUTER_API_KEY present:", !!openRouterKey, "length:", openRouterKey?.length || 0);

    const handle = await tasks.trigger<typeof llmNodeTask>("llm-node-task", {
      ...payload,
      executionId: execution.id,
      apiKey: openRouterKey || ""
    });

    return NextResponse.json({
      success: true,
      executionId: execution.id,
      triggerRunId: handle.id
    });
  } catch (error: any) {
    console.error("LLM Node API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
