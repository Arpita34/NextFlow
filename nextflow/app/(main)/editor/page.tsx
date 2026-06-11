"use client";

import { Plus, Search, EyeOff, Blocks, Workflow, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface WorkflowItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: { runs: number };
}

export default function EditorDashboard() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch("/api/workflows");
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this workflow?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filtered = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full h-full bg-[#0a0a09] text-white">
      
      {/* Hero Section */}
      <div className="w-full relative py-10 sm:py-16 px-5 sm:px-12 lg:px-20 border-b border-[#1E1E2E] bg-gradient-to-br from-[#1a1a24] to-[#0a0a09] overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:gap-6 max-w-2xl">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
              <Blocks size={20} className="sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-medium tracking-tight">Node Editor</h1>
          </div>
          
          <p className="text-sm sm:text-lg text-gray-300">
            Nodes is the most powerful way to operate Krea. Connect every tool and model into complex automated pipelines.
          </p>

          <Link href="/workflow/new" className="inline-flex w-fit items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors mt-1 sm:mt-2 text-sm sm:text-base">
            New Workflow
            <span className="text-xl leading-none">&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Projects Section */}
      <div className="flex-1 p-5 sm:p-12 lg:px-20 flex flex-col gap-6 sm:gap-8">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          {/* Tab buttons — scrollable on mobile */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
            <button className="shrink-0 px-3 sm:px-4 py-2 bg-[#1E1E2E] text-white rounded-md text-sm font-medium">Projects</button>
            <button className="shrink-0 px-3 sm:px-4 py-2 text-gray-400 hover:text-white rounded-md text-sm font-medium transition-colors">Apps</button>
            <button className="shrink-0 px-3 sm:px-4 py-2 text-gray-400 hover:text-white rounded-md text-sm font-medium transition-colors">Examples</button>
            <button className="shrink-0 px-3 sm:px-4 py-2 text-gray-400 hover:text-white rounded-md text-sm font-medium transition-colors">Templates</button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-52 md:w-64 bg-[#1a1a24] border border-[#1E1E2E] rounded-md py-2 pl-8 pr-4 text-sm focus:outline-none focus:border-[#6C63FF] text-white"
              />
            </div>
            <select className="bg-[#1a1a24] border border-[#1E1E2E] rounded-md py-2 px-2 sm:px-3 text-sm text-gray-300 focus:outline-none focus:border-[#6C63FF] appearance-none shrink-0">
              <option>Last viewed</option>
              <option>Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          
          {/* New Workflow Card */}
          <Link href="/workflow/new" className="flex flex-col gap-2 sm:gap-3 group">
            <div className="aspect-[4/3] bg-[#1a1a24] rounded-xl border border-[#1E1E2E] flex items-center justify-center group-hover:border-[#6C63FF] transition-colors">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-black">
                <Plus size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <span className="font-medium text-sm sm:text-base">New Workflow</span>
          </Link>

          {/* Loading State */}
          {loading && (
            <div className="aspect-[4/3] bg-[#1a1a24] rounded-xl border border-[#1E1E2E] flex items-center justify-center col-span-2">
              <Loader2 size={24} className="animate-spin text-gray-500" />
            </div>
          )}

          {/* Saved Workflows from DB */}
          {filtered.map((wf) => (
            <Link key={wf.id} href={`/workflow/${wf.id}`} className="flex flex-col gap-2 sm:gap-3 group relative">
              <div className="aspect-[4/3] bg-zinc-800 rounded-xl overflow-hidden border border-[#1E1E2E] group-hover:border-[#6C63FF] transition-colors p-4 flex items-center justify-center">
                <Workflow size={36} className="sm:w-12 sm:h-12 text-[#6C63FF] opacity-50" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate text-sm sm:text-base">{wf.name}</span>
                  <button 
                    onClick={(e) => handleDelete(wf.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all shrink-0"
                    disabled={deletingId === wf.id}
                  >
                    {deletingId === wf.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Edited {formatTimeAgo(wf.updatedAt)}</span>
                  {wf._count.runs > 0 && (
                    <span className="text-xs text-[#6C63FF]">{wf._count.runs} runs</span>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {/* Empty State */}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
              <Workflow size={48} className="mb-4 opacity-30" />
              <p className="text-sm text-center">{searchQuery ? "No workflows match your search" : "No saved workflows yet. Create one!"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
