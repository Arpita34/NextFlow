import 'dotenv/config';
import { task } from "@trigger.dev/sdk/v3";
import sharp from "sharp";

export const cropImageTask = task({
  id: "crop-image-task",
  maxDuration: 300,
  run: async (payload: {
    imageUrl: string;
    x_percent: number;
    y_percent: number;
    width_percent: number;
    height_percent: number;
    nodeId: string;
    runId: string;
    executionId?: string;
  }) => {
    const sendWebhook = async (status: string, outputs: any, error?: string) => {
      if (!payload.executionId) return;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await fetch(`${baseUrl}/api/webhooks/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executionId: payload.executionId, status, outputs, error })
      }).catch(err => console.error("Webhook failed:", err));
    };

    try {
      // 1. Download image
      console.log("Downloading image:", payload.imageUrl);
      const response = await fetch(payload.imageUrl);
      if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      // 2. Get image dimensions
      const metadata = await sharp(inputBuffer).metadata();
      const imgW = metadata.width || 800;
      const imgH = metadata.height || 600;

      // 3. Calculate crop box in pixels from percentages, with clamping
      let cropX = Math.round((payload.x_percent / 100) * imgW);
      let cropY = Math.round((payload.y_percent / 100) * imgH);
      let cropW = Math.round((payload.width_percent / 100) * imgW);
      let cropH = Math.round((payload.height_percent / 100) * imgH);

      // Clamp: ensure crop box stays within image bounds
      cropX = Math.max(0, Math.min(cropX, imgW - 1));
      cropY = Math.max(0, Math.min(cropY, imgH - 1));
      cropW = Math.max(1, Math.min(cropW, imgW - cropX));
      cropH = Math.max(1, Math.min(cropH, imgH - cropY));

      console.log(`Cropping: ${cropW}x${cropH} at (${cropX}, ${cropY}) from ${imgW}x${imgH}`);

      // 4. Crop with sharp
      const outputBuffer = await sharp(inputBuffer)
        .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
        .jpeg({ quality: 85 })
        .toBuffer();

      // 5. Convert to base64 data URI
      const base64Data = outputBuffer.toString("base64");
      const dataUri = `data:image/jpeg;base64,${base64Data}`;

      await sendWebhook("success", { resultImageUrl: dataUri });

      return {
        output: dataUri,
        nodeId: payload.nodeId,
        runId: payload.runId,
        status: "success"
      };

    } catch (error: any) {
      console.error("Crop Task Error:", error.message);
      await sendWebhook("failed", {}, error.message);
      throw new Error(`Crop Execution failed: ${error.message}`);
    }
  },
});
