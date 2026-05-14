import { defineConfig } from "@trigger.dev/sdk/v3";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID || "proj_xjpoxxhipietzcijuysv",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./trigger"],
  build: {
    external: ["@prisma/client", "prisma", "sharp", "fluent-ffmpeg", "@ffmpeg-installer/ffmpeg"]
  }
});

