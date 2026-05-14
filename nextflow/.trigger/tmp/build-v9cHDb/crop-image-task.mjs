import "./chunk-TGWDMH6N.mjs";
import "./chunk-57FWKJCD.mjs";
import {
  task
} from "./chunk-66LTAQP7.mjs";
import {
  init_esm
} from "./chunk-OYSLMRBF.mjs";

// trigger/crop-image-task.ts
init_esm();
import sharp from "sharp";
var cropImageTask = task({
  id: "crop-image-task",
  maxDuration: 300,
  run: async (payload) => {
    const sendWebhook = async (status, outputs, error) => {
      if (!payload.executionId) return;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await fetch(`${baseUrl}/api/webhooks/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executionId: payload.executionId, status, outputs, error })
      }).catch((err) => console.error("Webhook failed:", err));
    };
    try {
      console.log("Downloading image:", payload.imageUrl);
      const response = await fetch(payload.imageUrl);
      if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);
      const metadata = await sharp(inputBuffer).metadata();
      const imgW = metadata.width || 800;
      const imgH = metadata.height || 600;
      let cropX = Math.round(payload.x_percent / 100 * imgW);
      let cropY = Math.round(payload.y_percent / 100 * imgH);
      let cropW = Math.round(payload.width_percent / 100 * imgW);
      let cropH = Math.round(payload.height_percent / 100 * imgH);
      cropX = Math.max(0, Math.min(cropX, imgW - 1));
      cropY = Math.max(0, Math.min(cropY, imgH - 1));
      cropW = Math.max(1, Math.min(cropW, imgW - cropX));
      cropH = Math.max(1, Math.min(cropH, imgH - cropY));
      console.log(`Cropping: ${cropW}x${cropH} at (${cropX}, ${cropY}) from ${imgW}x${imgH}`);
      const outputBuffer = await sharp(inputBuffer).extract({ left: cropX, top: cropY, width: cropW, height: cropH }).jpeg({ quality: 85 }).toBuffer();
      const base64Data = outputBuffer.toString("base64");
      const dataUri = `data:image/jpeg;base64,${base64Data}`;
      await sendWebhook("success", { resultImageUrl: dataUri });
      return {
        output: dataUri,
        nodeId: payload.nodeId,
        runId: payload.runId,
        status: "success"
      };
    } catch (error) {
      console.error("Crop Task Error:", error.message);
      await sendWebhook("failed", {}, error.message);
      throw new Error(`Crop Execution failed: ${error.message}`);
    }
  }
});
export {
  cropImageTask
};
//# sourceMappingURL=crop-image-task.mjs.map
