"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Settings, 
  Workflow, 
  Folder, 
  Image as ImageIcon, 
  Video, 
  Wand2, 
  Banana, 
  Zap, 
  Edit3, 
  Mic, 
  User, 
  Box,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home, color: "" },
  { href: "#", label: "Train Lora", icon: Settings, color: "text-orange-400", disabled: true },
  { href: "/editor", label: "Node Editor", icon: Workflow, color: "text-blue-400" },
  { href: "#", label: "Assets", icon: Folder, color: "text-cyan-400", disabled: true },
];

const TOOLS = [
  { label: "Image", icon: ImageIcon, color: "text-blue-300" },
  { label: "Video", icon: Video, color: "text-orange-300" },
  { label: "Enhancer", icon: Wand2, color: "text-gray-300" },
  { label: "Nano Banana", icon: Banana, color: "text-yellow-400" },
  { label: "Realtime", icon: Zap, color: "text-cyan-400" },
  { label: "Edit", icon: Edit3, color: "text-purple-400" },
  { label: "Video Lipsync", icon: Mic, color: "text-green-400" },
  { label: "Motion Transfer", icon: User, color: "text-lime-400" },
  { label: "3D Objects", icon: Box, color: "text-white" },
];

const MIN_WIDTH = 52;
const DEFAULT_WIDTH = 200;
const MAX_WIDTH = 320;

export default function GlobalSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH + 20, startWidth + (ev.clientX - startX)));
      setWidth(newWidth);
    };
    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [width]);

  const sidebarWidth = collapsed ? MIN_WIDTH : width;

  return (
    <aside
      ref={sidebarRef}
      className="shrink-0 bg-[#0a0a09] text-gray-300 flex flex-col h-full overflow-hidden relative transition-[width] duration-200 ease-in-out"
      style={{ width: sidebarWidth }}
    >
      {/* Collapse toggle */}
      <div className={`p-2 ${collapsed ? "flex justify-center" : "flex justify-end"}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-white hover:bg-zinc-800 transition-colors"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href === "/editor" && pathname.startsWith("/editor"));
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-lg transition-colors opacity-50 cursor-not-allowed ${collapsed ? "justify-center px-0 py-2" : "px-3 py-2"}`}
                title={item.label}
              >
                <Icon size={18} className={item.color || ""} />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg transition-colors ${collapsed ? "justify-center px-0 py-2" : "px-3 py-2"} ${isActive ? "bg-zinc-800/80 text-white font-medium" : "hover:bg-zinc-900"}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className={item.color || ""} />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Tools */}
      <div className="flex flex-col gap-0.5 px-2 mt-4">
        {!collapsed && (
          <span className="px-3 text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Tools</span>
        )}
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.label}
              className={`flex items-center gap-3 rounded-lg transition-colors opacity-60 cursor-not-allowed ${collapsed ? "justify-center px-0 py-2" : "px-3 py-2"}`}
              title={tool.label}
            >
              <Icon size={18} className={tool.color} />
              {!collapsed && <span className="text-sm">{tool.label}</span>}
            </div>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom */}
      <div className="p-2 flex flex-col gap-2 border-t border-[#1E1E2E]">
        {!collapsed && (
          <>
            <span className="text-[10px] text-gray-500 px-1">Earn 3,000 Credits</span>
            <button className="w-full h-10 rounded-lg bg-gradient-to-r from-blue-700 to-blue-500 text-white text-sm font-medium hover:from-blue-600 hover:to-blue-400 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]">
              Upgrade
            </button>
          </>
        )}
        <div className={`flex items-center gap-2 pt-1 ${collapsed ? "justify-center" : "px-1"}`}>
          <UserButton />
          {!collapsed && (
            <span className="text-xs text-gray-500 truncate">Free</span>
          )}
        </div>
      </div>

      {/* Resize Handle — only when expanded */}
      {!collapsed && (
        <div
          onMouseDown={startResize}
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#6C63FF]/50 transition-colors ${isResizing ? "bg-[#6C63FF]/50" : ""}`}
        />
      )}
    </aside>
  );
}
