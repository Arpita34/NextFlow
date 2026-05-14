"use client";

import { useState } from "react";
import {
  Type,
  Image as ImageIcon,
  Video,
  Brain,
  Scissors,
  Film,
  MoreHorizontal,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";

const NODE_ITEMS = [
  { type: "textNode", label: "Text", icon: <Type size={18} />, bg: "bg-zinc-800", text: "text-white", ring: "ring-zinc-600" },
  { type: "uploadImageNode", label: "Upload Image", icon: <ImageIcon size={18} />, bg: "bg-blue-600", text: "text-white", ring: "ring-blue-400" },
  { type: "uploadVideoNode", label: "Upload Video", icon: <Video size={18} />, bg: "bg-orange-500", text: "text-white", ring: "ring-orange-400" },
  { type: "llmNode", label: "LLM", icon: <Brain size={18} />, bg: "bg-purple-600", text: "text-white", ring: "ring-purple-400" },
  { type: "cropImageNode", label: "Crop Image", icon: <Scissors size={18} />, bg: "bg-emerald-600", text: "text-white", ring: "ring-emerald-400" },
  { type: "extractFrameNode", label: "Extract Frame", icon: <Film size={18} />, bg: "bg-pink-600", text: "text-white", ring: "ring-pink-400" },
];

export default function LeftSidebar() {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`${expanded ? "w-[180px]" : "w-[52px]"} bg-[#0a0a0f] flex flex-col h-full shrink-0 py-3 transition-all duration-200 ease-in-out overflow-hidden`}
    >

      {/* Expand/Collapse toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mx-auto w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:text-white hover:bg-zinc-800 transition-colors mb-2"
        title={expanded ? "Collapse" : "Expand"}
      >
        {expanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
      </button>

      {/* Node Icons */}
      <div className="flex flex-col gap-3 px-1.5">
        {NODE_ITEMS.map((node) => (
          <div
            key={node.type}
            className={`flex items-center gap-2.5 rounded-xl cursor-grab transition-all hover:ring-2 active:scale-95 ${node.ring} ${expanded ? "px-2 py-2" : "justify-center py-2"}`}
            title={!expanded ? node.label : undefined}
            onDragStart={(event) => {
              event.dataTransfer.setData("application/reactflow", node.type);
              event.dataTransfer.effectAllowed = "move";
            }}
            draggable
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${node.bg} ${node.text}`}>
              {node.icon}
            </div>
            {expanded && (
              <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{node.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom icon */}
      <div className="flex justify-center">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
          <MoreHorizontal size={18} />
        </div>
      </div>
    </aside>
  );
}
