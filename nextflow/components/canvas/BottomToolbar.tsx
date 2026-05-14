"use client";

import { useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useStore } from "@/lib/store";
import {
  Plus,
  MousePointer2,
  Hand,
  Scissors,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Brain,
  Crop,
  Film
} from "lucide-react";

const NODE_TYPES = [
  { type: "textNode", label: "Text", icon: "T", bgColor: "bg-zinc-800", textColor: "text-white" },
  { type: "uploadImageNode", label: "Upload Image", icon: <ImageIcon size={14} />, bgColor: "bg-blue-900/50", textColor: "text-blue-400" },
  { type: "uploadVideoNode", label: "Upload Video", icon: <Video size={14} />, bgColor: "bg-orange-900/50", textColor: "text-orange-400" },
  { type: "llmNode", label: "LLM", icon: <Brain size={14} />, bgColor: "bg-purple-900/50", textColor: "text-purple-400" },
  { type: "cropImageNode", label: "Crop Image", icon: <Scissors size={14} />, bgColor: "bg-green-900/50", textColor: "text-green-400" },
  { type: "extractFrameNode", label: "Extract Frame", icon: <Film size={14} />, bgColor: "bg-pink-900/50", textColor: "text-pink-400" },
];

export default function BottomToolbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { screenToFlowPosition } = useReactFlow();
  const addNode = useStore((state) => state.addNode);

  const getDefaultData = (type: string) => {
    switch (type) {
      case "llmNode":
        return { label: "LLM", model: "openrouter/owl-alpha" };
      case "textNode":
        return { label: "Text", text: "" };
      case "uploadImageNode":
        return { label: "Upload Image" };
      case "uploadVideoNode":
        return { label: "Upload Video" };
      case "cropImageNode":
        return { label: "Crop Image", xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100 };
      case "extractFrameNode":
        return { label: "Extract Frame", timestamp: "0" };
      default:
        return { label: type };
    }
  };

  const handleAddNode = (type: string) => {
    // Add node to the center of the screen
    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const newNode = {
      id: `node_${Date.now()}`,
      type,
      position: center,
      data: getDefaultData(type),
    };
    addNode(newNode);
    setMenuOpen(false);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-900/90 backdrop-blur border border-[#1E1E2E] rounded-xl p-1 z-50">

      {/* Menu Popup */}
      {menuOpen && (
        <div className="absolute bottom-14 left-0 bg-zinc-900 border border-[#1E1E2E] rounded-xl p-2 w-56 shadow-xl flex flex-col gap-1">
          {NODE_TYPES.map((node) => (
            <button
              key={node.type}
              onClick={() => handleAddNode(node.type)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors w-full text-left"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${node.bgColor} ${node.textColor} text-sm font-bold`}>
                {node.icon}
              </div>
              <span className="text-sm font-medium text-gray-200">{node.label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${menuOpen ? 'bg-zinc-800 text-white' : 'text-gray-400 hover:text-white hover:bg-zinc-800'}`}
      >
        <Plus size={18} />
      </button>
      <button className="w-10 h-10 flex items-center justify-center rounded-lg text-white bg-zinc-800 transition-colors">
        <MousePointer2 size={18} />
      </button>
      <button className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors">
        <Hand size={18} />
      </button>
      <button className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors">
        <Scissors size={18} />
      </button>
      <button className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors">
        <LinkIcon size={18} />
      </button>
    </div>
  );
}
