import { Handle, Position, NodeProps, useReactFlow, useNodeConnections } from "@xyflow/react";
import { Frame, Play } from "lucide-react";
import NodeWrapper from "./NodeWrapper";
import { useStore } from "@/lib/store";

export default function ExtractFrameNode(props: NodeProps) {
  const { id, data, selected } = props;
  const { updateNodeData } = useReactFlow();

  const timestampConnections = useNodeConnections({ handleType: 'target', handleId: 'timestamp' });
  const isExecuting = useStore((state) => state.executingNodeIds.has(id));

  const runNode = async () => {
    import('@/lib/executor').then(({ executeWorkflow }) => {
      const state = useStore.getState();
      executeWorkflow(state.nodes, state.edges, state.workflowId || "new", 'single', id);
    });
  };

  return (
    <NodeWrapper id={id} title="Extract Frame" icon={<Frame size={16} className="text-[#6C63FF]" />} selected={selected}>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="video_url" 
        className="w-3 h-3 bg-[#6C63FF] border-2 border-[#1E1E2E]" 
        style={{ top: '3.5rem' }}
      />

      <div className="flex flex-col gap-3">
          <div className="relative flex flex-col gap-1 text-sm">
            <Handle type="target" position={Position.Left} id="timestamp" className="w-3 h-3 bg-zinc-400 border-2 border-[#1E1E2E] !absolute !-left-5 !top-[26px] !-translate-y-1/2" />
            <label className="text-gray-400">Timestamp (sec or %)</label>
            <input 
              type="text" 
              className="nodrag w-full bg-[#0a0a09] border border-[#333] rounded px-2 py-1 focus:border-[#6C63FF] outline-none" 
              value={(data?.timestamp as string) ?? "0"}
              onChange={(e) => updateNodeData(id, { timestamp: e.target.value })}
              placeholder="e.g. 5 or 50%"
            />
          </div>

        {Boolean(data?.resultImageUrl) && (
          <div className="mt-2">
            <img 
              src={data.resultImageUrl as string} 
              alt="Extracted Frame" 
              className="w-full max-h-[200px] object-contain rounded-md border border-[#333]"
            />
          </div>
        )}

        <button
          onClick={runNode}
          disabled={isExecuting}
          className="flex items-center justify-center gap-2 bg-[#6C63FF] text-white rounded-md py-2 mt-2 text-sm font-medium hover:bg-[#5a52d5] disabled:opacity-50 transition-colors"
        >
          {isExecuting ? (
            <span className="animate-pulse">Running...</span>
          ) : (
            <>
              <Play size={14} />
              Run Node
            </>
          )}
        </button>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        id="image"
        className="w-3 h-3 bg-[#6C63FF] border-2 border-[#1E1E2E]"
      />
    </NodeWrapper>
  );
}
