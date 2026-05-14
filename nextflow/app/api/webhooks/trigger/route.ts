import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { executionId, status, outputs, error } = body;

    if (!executionId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updateData: any = { status };
    if (outputs) updateData.outputs = outputs;
    if (error) updateData.error = error;

    await prisma.nodeExecution.update({
      where: { id: executionId },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Trigger Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
