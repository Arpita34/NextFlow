"use client";

import React, { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import dynamic from "next/dynamic";

const WorkflowCanvas = dynamic(() => import("@/components/canvas/WorkflowCanvas"), { 
  ssr: false,
  loading: () => <div className="flex-1 w-full h-full bg-[#0a0a09] flex items-center justify-center text-gray-500">Loading Canvas...</div>
});
import { ChevronDown, Undo, Redo, Play, Save, Check, Download, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import LeftSidebar from "@/components/sidebar/LeftSidebar";
import RightSidebar from "@/components/sidebar/RightSidebar";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  const workflowName = useStore((s) => s.workflowName);
  const setWorkflowName = useStore((s) => s.setWorkflowName);
  const saveWorkflow = useStore((s) => s.saveWorkflow);
  const loadWorkflow = useStore((s) => s.loadWorkflow);
  const isSaving = useStore((s) => s.isSaving);
  const lastSavedAt = useStore((s) => s.lastSavedAt);
  const workflowId = useStore((s) => s.workflowId);

  // Load workflow from DB if id is not "new"
  useEffect(() => {
    if (id && id !== "new") {
      loadWorkflow(id);
    } else {
      // New workflow — blank canvas
      const store = useStore.getState();
      store.setNodes([]);
      store.setEdges([]);
      useStore.setState({ workflowId: null, workflowName: "Untitled", lastSavedAt: null });
    }
  }, [id, loadWorkflow]);

  // Auto-save with Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSave = async () => {
    await saveWorkflow();
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const handleExportJSON = () => {
    const state = useStore.getState();
    const data = JSON.stringify({ name: workflowName, nodes: state.nodes, edges: state.edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.nodes && data.edges) {
          useStore.getState().setNodes(data.nodes);
          useStore.getState().setEdges(data.edges);
          if (data.name) setWorkflowName(data.name);
        }
      } catch (err) {
        console.error("Import failed:", err);
      }
    };
    input.click();
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#0a0a09] overflow-hidden">
      
      {/* Save Toast */}
      {showSaveToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-green-500/90 text-white px-4 py-2 rounded-xl shadow-lg">
          <Check size={16} />
          <span className="text-sm font-medium">Workflow saved!</span>
        </div>
      )}

      {/* ── Static Top Header ── */}
      <header className="h-12 shrink-0 flex items-center justify-between px-3 border-b border-[#1E1E2E] bg-[#0a0a09] z-50">
        {/* Left: Logo + Name */}
        <div className="flex items-center gap-2">
          <Link href="/editor" className="w-8 h-8 bg-zinc-900 border border-[#1E1E2E] rounded-lg flex items-center justify-center text-white hover:bg-zinc-800 transition-colors" title="Back to Editor">
            <div className="w-3 h-3 bg-[#6C63FF] rounded-sm" />
          </Link>
          
          {isEditingName ? (
            <input
              autoFocus
              className="bg-zinc-900 border border-[#6C63FF] rounded-lg px-3 py-1 text-sm font-medium text-white focus:outline-none"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setIsEditingName(false); }}
            />
          ) : (
            <button 
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors group"
              title="Click to rename"
            >
              <span className="text-sm font-medium text-white">{workflowName}</span>
              <ChevronDown size={12} className="text-gray-600 group-hover:text-[#6C63FF] transition-colors" />
            </button>
          )}

          {lastSavedAt && (
            <span className="text-[10px] text-gray-600">
              Saved {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isSaving} variant="outline" size="sm" className="h-8 gap-1.5 text-xs bg-zinc-900 border-[#1E1E2E] text-gray-300 hover:text-white hover:bg-zinc-800 rounded-lg">
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span className="font-medium">{isSaving ? "Saving..." : "Save"}</span>
          </Button>
          <button onClick={handleExportJSON} className="w-8 h-8 bg-zinc-900 border border-[#1E1E2E] rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Export JSON">
            <Download size={14} />
          </button>
          <button onClick={handleImportJSON} className="w-8 h-8 bg-zinc-900 border border-[#1E1E2E] rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Import JSON">
            <Upload size={14} />
          </button>

          <button 
            onClick={() => {
              import('@/lib/executor').then(({ executeWorkflow }) => {
                const state = useStore.getState();
                const hasSelected = state.nodes.some(n => n.selected);
                executeWorkflow(state.nodes, state.edges, workflowId || id, hasSelected ? 'selected' : 'full');
              });
            }}
            className="flex items-center gap-1.5 bg-[#6C63FF] hover:bg-[#5a52d5] text-white rounded-lg px-4 py-1.5 transition-colors text-xs"
          >
            <Play size={13} />
            <span className="font-medium">
              {useStore(s => s.nodes.some(n => n.selected)) ? "Run Selected" : "Run Workflow"}
            </span>
          </button>
          <div className="ml-1">
            <UserButton />
          </div>
        </div>
      </header>

      {/* ── Main: Left Sidebar | Canvas | Right Sidebar ── */}
      <ReactFlowProvider>
        <main className="flex flex-1 w-full overflow-hidden">
          <LeftSidebar />

          <div className="flex-1 relative h-full">
            <WorkflowCanvas />
            
            <div className="absolute bottom-6 left-4 flex items-center gap-2 z-50">
              <button onClick={() => useStore.getState().undo()} className="w-9 h-9 bg-zinc-900/90 border border-[#1E1E2E] rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <Undo size={15} />
              </button>
              <button onClick={() => useStore.getState().redo()} className="w-9 h-9 bg-zinc-900/90 border border-[#1E1E2E] rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <Redo size={15} />
              </button>
            </div>
          </div>

          <RightSidebar />
        </main>
      </ReactFlowProvider>
    </div>
  );
}
