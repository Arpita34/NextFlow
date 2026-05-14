import {
  task
} from "./chunk-66LTAQP7.mjs";
import {
  init_esm
} from "./chunk-OYSLMRBF.mjs";

// trigger/llm-node-task.ts
init_esm();
async function updateStatus(executionId, status, outputs, error) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/webhooks/trigger`;
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ executionId, status, outputs, error })
    });
    if (!res.ok) console.error("Webhook error:", res.status, await res.text());
  } catch (err) {
    console.error("Webhook fetch failed:", err);
  }
}
var llmNodeTask = task({
  id: "llm-node-task",
  maxDuration: 300,
  run: async (payload) => {
    console.log("LLM Task started:", payload.nodeId, "model:", payload.model);
    const apiKey = payload.apiKey || process.env.OPENROUTER_API_KEY || "";
    if (!apiKey) {
      throw new Error("No OpenRouter API key found. Please set OPENROUTER_API_KEY in .env");
    }
    try {
      const messages = [];
      if (payload.systemPrompt) {
        messages.push({ role: "system", content: payload.systemPrompt });
      }
      const userContent = [];
      if (payload.userMessage) {
        userContent.push({ type: "text", text: payload.userMessage });
      }
      if (payload.imageUrls && payload.imageUrls.length > 0) {
        for (const url of payload.imageUrls) {
          let base64Data = "";
          let mimeType = "image/jpeg";
          if (url.startsWith("data:")) {
            userContent.push({
              type: "image_url",
              image_url: { url }
            });
            continue;
          } else {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            base64Data = Buffer.from(arrayBuffer).toString("base64");
            mimeType = response.headers.get("content-type") || "image/jpeg";
            userContent.push({
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Data}` }
            });
          }
        }
      }
      messages.push({ role: "user", content: userContent });
      let resultText = "";
      let retries = 0;
      const maxRetries = 3;
      while (retries <= maxRetries) {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "http://localhost:3000",
              "X-Title": "Nextflow Builder"
            },
            body: JSON.stringify({
              model: payload.model || "nvidia/nemotron-nano-12b-v2-vl:free",
              messages
            })
          });
          if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 429 && retries < maxRetries) {
              const waitMs = (retries + 1) * 5e3;
              console.log(`Rate limited (429). Retrying in ${waitMs / 1e3}s...`);
              await new Promise((r) => setTimeout(r, waitMs));
              retries++;
              continue;
            }
            throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
          }
          const data = await response.json();
          resultText = data.choices?.[0]?.message?.content || "";
          break;
        } catch (err) {
          if (retries >= maxRetries) throw err;
          retries++;
          await new Promise((r) => setTimeout(r, 2e3));
        }
      }
      console.log("LLM Task success, output length:", resultText.length);
      if (payload.executionId) {
        await updateStatus(payload.executionId, "success", { result: resultText });
      }
      return { output: resultText, nodeId: payload.nodeId, runId: payload.runId, status: "success" };
    } catch (error) {
      console.error("LLM Task Error:", error.message);
      if (payload.executionId) {
        await updateStatus(payload.executionId, "failed", void 0, error.message);
      }
      throw new Error(`LLM Execution failed: ${error.message}`);
    }
  }
});
export {
  llmNodeTask
};
//# sourceMappingURL=llm-node-task.mjs.map
