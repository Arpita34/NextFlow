import { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { X } from "lucide-react";
import { useReactFlow } from "@xyflow/react";

interface NodeWrapperProps {
  id: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  selected?: boolean;
  className?: string;
}

export default function NodeWrapper({ id, title, icon, children, selected, className = "" }: NodeWrapperProps) {
  const isExecuting = useStore((state) => state.executingNodeIds.has(id));
  const { deleteElements } = useReactFlow();

  const glowClass = isExecuting ? "animate-pulse shadow-[0_0_15px_rgba(108,99,255,0.7)]" : "";
  const borderClass = selected ? "border-[#6C63FF]" : "border-[#0a0a09]";

  return (
    <div 
      className={`group relative rounded-xl bg-[#1E1E2E] border ${borderClass} shadow-xl ${glowClass} ${className || "min-w-[280px]"}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#0a0a09] bg-[#1a1a24] rounded-t-xl">
        <div className="flex items-center gap-2 text-white font-medium">
          {icon}
          <span>{title}</span>
        </div>
        <button 
          onClick={() => deleteElements({ nodes: [{ id }] })}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-all rounded hover:bg-zinc-800"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="p-4 flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
}
