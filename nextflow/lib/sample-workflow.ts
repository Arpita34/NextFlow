import { Node, Edge } from "@xyflow/react";

// Pre-built "Product Marketing Kit Generator" workflow
// Two parallel branches that converge at a final LLM node

export const SAMPLE_WORKFLOW_NAME = "Product Marketing Kit Generator";

export const SAMPLE_NODES: Node[] = [
  // ============ Branch A: Image Processing ============
  {
    id: "sample_upload_image",
    type: "uploadImageNode",
    position: { x: 50, y: 80 },
    data: { label: "Upload Image" },
  },
  {
    id: "sample_crop_image",
    type: "cropImageNode",
    position: { x: 400, y: 50 },
    data: {
      label: "Crop Image",
      x_percent: 10,
      y_percent: 10,
      width_percent: 80,
      height_percent: 80,
    },
  },
  {
    id: "sample_text_system",
    type: "textNode",
    position: { x: 400, y: 280 },
    data: {
      label: "System Prompt",
      text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description based on the product image provided.",
    },
  },
  {
    id: "sample_text_user",
    type: "textNode",
    position: { x: 400, y: 450 },
    data: {
      label: "Product Details",
      text: "Product: Wireless Bluetooth Headphones. Features: Active noise cancellation, 30-hour battery life, foldable design, premium memory foam ear cushions.",
    },
  },
  {
    id: "sample_llm_1",
    type: "llmNode",
    position: { x: 780, y: 120 },
    data: {
      label: "Product Description LLM",
      model: "nvidia/nemotron-nano-12b-v2-vl:free",
      systemPrompt: "",
      userMessage: "",
    },
  },

  // ============ Branch B: Video Frame Extraction ============
  {
    id: "sample_upload_video",
    type: "uploadVideoNode",
    position: { x: 50, y: 550 },
    data: { label: "Upload Video" },
  },
  {
    id: "sample_extract_frame",
    type: "extractFrameNode",
    position: { x: 400, y: 600 },
    data: {
      label: "Extract Frame",
      timestamp: "50%",
    },
  },

  // ============ Convergence: Final Marketing Summary ============
  {
    id: "sample_text_final",
    type: "textNode",
    position: { x: 780, y: 500 },
    data: {
      label: "Social Media Prompt",
      text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame. Make it catchy and engaging!",
    },
  },
  {
    id: "sample_llm_2",
    type: "llmNode",
    position: { x: 1180, y: 300 },
    data: {
      label: "Final Marketing LLM",
      model: "nvidia/nemotron-nano-12b-v2-vl:free",
      systemPrompt: "",
      userMessage: "",
    },
  },
];

export const SAMPLE_EDGES: Edge[] = [
  // Branch A: Image → Crop → LLM #1
  {
    id: "se_img_crop",
    source: "sample_upload_image",
    sourceHandle: "image",
    target: "sample_crop_image",
    targetHandle: "image_url",
    animated: true,
    style: { stroke: "#6C63FF", strokeWidth: 2, strokeDasharray: "5, 5" },
  },
  {
    id: "se_crop_llm1",
    source: "sample_crop_image",
    sourceHandle: "image",
    target: "sample_llm_1",
    targetHandle: "images",
    animated: true,
    style: { stroke: "#6C63FF", strokeWidth: 2, strokeDasharray: "5, 5" },
  },
  // Text → LLM #1 (system prompt + user message)
  {
    id: "se_sys_llm1",
    source: "sample_text_system",
    sourceHandle: "text",
    target: "sample_llm_1",
    targetHandle: "system_prompt",
    animated: true,
    style: { stroke: "#6C63FF", strokeWidth: 2, strokeDasharray: "5, 5" },
  },
  {
    id: "se_user_llm1",
    source: "sample_text_user",
    sourceHandle: "text",
    target: "sample_llm_1",
    targetHandle: "user_message",
    animated: true,
    style: { stroke: "#6C63FF", strokeWidth: 2, strokeDasharray: "5, 5" },
  },

  // Branch B: Video → Extract Frame
  {
    id: "se_vid_extract",
    source: "sample_upload_video",
    sourceHandle: "video",
    target: "sample_extract_frame",
    targetHandle: "video_url",
    animated: true,
    style: { stroke: "#6C63FF", strokeWidth: 2, strokeDasharray: "5, 5" },
  },

  // Convergence: LLM #1 output + Crop + Extract Frame → LLM #2
  {
    id: "se_llm1_llm2",
    source: "sample_llm_1",
    sourceHandle: "text",
    target: "sample_llm_2",
    targetHandle: "user_message",
    animated: true,
    style: { stroke: "#6C63FF", strokeWidth: 2, strokeDasharray: "5, 5" },
  },
  {
    id: "se_crop_llm2",
    source: "sample_crop_image",
    sourceHandle: "image",
    target: "sample_llm_2",
    targetHandle: "images",
    animated: true,
    style: { stroke: "#6C63FF", strokeWidth: 2, strokeDasharray: "5, 5" },
  },
  {
    id: "se_extract_llm2",
    source: "sample_extract_frame",
    sourceHandle: "image",
    target: "sample_llm_2",
    targetHandle: "images",
    animated: true,
    style: { stroke: "#6C63FF", strokeWidth: 2, strokeDasharray: "5, 5" },
  },
  {
    id: "se_final_llm2",
    source: "sample_text_final",
    sourceHandle: "text",
    target: "sample_llm_2",
    targetHandle: "system_prompt",
    animated: true,
    style: { stroke: "#6C63FF", strokeWidth: 2, strokeDasharray: "5, 5" },
  },
];
