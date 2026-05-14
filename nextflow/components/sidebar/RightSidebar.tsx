"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface NodeExec {
  id: string;
  nodeId: string;
  nodeType: string;
  status: string;
  executionTime: number | null;
  error: string | null;
}

interface RunItem {
  id: string;
  scope: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  executions: NodeExec[];
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof CheckCircle2; label: string }> = {
  success: { color: "text-green-400", bg: "bg-green-500/15", icon: CheckCircle2, label: "Success" },
  failed: { color: "text-red-400", bg: "bg-red-500/15", icon: XCircle, label: "Failed" },
  running: { color: "text-amber-400", bg: "bg-amber-500/15", icon: Loader2, label: "Running" },
  partial: { color: "text-orange-400", bg: "bg-orange-500/15", icon: AlertCircle, label: "Partial" },
};

const NODE_ICONS: Record<string, string> = {
  llm: "🧠",
  crop: "✂️",
  "extract-frame": "🎞️",
};

export default function RightSidebar() {
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const workflowId = useStore((s) => s.workflowId);

  const fetchRuns = async () => {
    if (!workflowId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/runs`);
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch (err) {
      console.error("Failed to fetch runs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [workflowId]);

  // Re-fetch after execution completes
  const isExecuting = useStore((s) => s.isExecuting);
  useEffect(() => {
    if (!isExecuting) {
      const timer = setTimeout(fetchRuns, 2000);
      return () => clearTimeout(timer);
    }
  }, [isExecuting]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <aside className="w-[260px] border-l border-[#1E1E2E] bg-[#0f0f14] text-white flex flex-col h-full overflow-hidden shrink-0">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1E1E2E] flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Run History</h2>
        {workflowId && (
          <button onClick={fetchRuns} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-zinc-800 transition-colors" title="Refresh History">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        )}
      </div>

      {/* Runs List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-gray-600" />
          </div>
        )}

        {!loading && !workflowId && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-xs text-gray-600">Save workflow to see history</p>
          </div>
        )}

        {!loading && workflowId && runs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Clock size={24} className="text-gray-700 mb-2" />
            <p className="text-xs text-gray-600">No runs yet</p>
          </div>
        )}

        <div className="flex flex-col">
          {runs.map((run, idx) => {
            const config = STATUS_CONFIG[run.status] || STATUS_CONFIG.running;
            const StatusIcon = config.icon;
            const isExpanded = expandedRun === run.id;

            return (
              <div key={run.id} className="border-b border-[#1E1E2E]/50">
                <button
                  onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-zinc-900/30 transition-colors text-left"
                >
                  {isExpanded ? (
                    <ChevronDown size={12} className="text-gray-600 shrink-0" />
                  ) : (
                    <ChevronRight size={12} className="text-gray-600 shrink-0" />
                  )}

                  <StatusIcon
                    size={14}
                    className={`${config.color} shrink-0 ${run.status === "running" ? "animate-spin" : ""}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-gray-300">Run #{runs.length - idx}</span>
                      <span className={`text-[10px] px-1 py-0.5 rounded ${config.bg} ${config.color}`}>
                        {run.scope}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-600">
                      {formatDate(run.startedAt)} {formatTime(run.startedAt)}
                      {run.duration ? ` · ${formatDuration(run.duration)}` : ""}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-2 flex flex-col gap-0.5">
                    {run.executions.length === 0 ? (
                      <p className="text-[10px] text-gray-600 pl-6">No execution data</p>
                    ) : (
                      run.executions.map((exec) => {
                        const execConfig = STATUS_CONFIG[exec.status] || STATUS_CONFIG.running;
                        const ExecIcon = execConfig.icon;
                        return (
                          <div key={exec.id} className="flex items-center gap-1.5 pl-6 py-1 rounded text-[10px]">
                            <span className="w-4 text-center">{NODE_ICONS[exec.nodeType] || "⚙️"}</span>
                            <ExecIcon size={10} className={`${execConfig.color} shrink-0 ${exec.status === "running" ? "animate-spin" : ""}`} />
                            <span className="text-gray-400 flex-1 truncate">{exec.nodeType}</span>
                            {exec.executionTime && <span className="text-gray-600">{formatDuration(exec.executionTime)}</span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
