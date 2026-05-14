import 'dotenv/config';
import { task } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs/promises";
import path from "path";
import os from "os";
import sharp from "sharp";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const extractFrameTask = task({
  id: "extract-frame-task",
  maxDuration: 300,
  run: async (payload: {
    videoUrl: string;
    timestamp: string;
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
      console.log("Downloading video:", payload.videoUrl);
      
      // Download the video to a temp file first
      const tempDir = os.tmpdir();
      const videoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
      const outputPath = path.join(tempDir, `frame_${Date.now()}.jpg`);

      const response = await fetch(payload.videoUrl);
      if (!response.ok) throw new Error(`Failed to download video: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      await fs.writeFile(videoPath, Buffer.from(arrayBuffer));
      console.log("Video downloaded, extracting frame...");

      // Parse timestamp - support "50%" or "5" (seconds)
      let seekTime = "0";
      if (payload.timestamp.endsWith("%")) {
        // Get duration first with ffprobe
        const duration = await new Promise<number>((resolve, reject) => {
          ffmpeg.ffprobe(videoPath, (err: Error | null, metadata: any) => {
            if (err) reject(err);
            else resolve(metadata?.format?.duration || 10);
          });
        });
        const pct = parseFloat(payload.timestamp) / 100;
        seekTime = String(Math.round(pct * duration));
      } else {
        seekTime = payload.timestamp || "0";
      }

      console.log(`Extracting frame at ${seekTime}s`);

      // Extract frame with FFmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(seekTime)
          .frames(1)
          .output(outputPath)
          .on("end", () => resolve())
          .on("error", (err: Error) => reject(err))
          .run();
      });

      // Read and compress with sharp
      const frameBuffer = await fs.readFile(outputPath);
      const outputBuffer = await sharp(frameBuffer)
        .jpeg({ quality: 80 })
        .toBuffer();

      const base64Data = outputBuffer.toString("base64");
      const dataUri = `data:image/jpeg;base64,${base64Data}`;

      // Cleanup
      await fs.unlink(videoPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});

      await sendWebhook("success", { resultImageUrl: dataUri });

      return {
        output: dataUri,
        nodeId: payload.nodeId,
        runId: payload.runId,
        status: "success"
      };

    } catch (error: any) {
      console.error("Extract Frame Task Error:", error.message);
      await sendWebhook("failed", {}, error.message);
      throw new Error(`Extract Frame Execution failed: ${error.message}`);
    }
  },
});
