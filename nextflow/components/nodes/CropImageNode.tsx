import { Handle, Position, NodeProps, useReactFlow, useNodeConnections } from "@xyflow/react";
import { Crop, Play } from "lucide-react";
import NodeWrapper from "./NodeWrapper";
import { useStore } from "@/lib/store";

export default function CropImageNode(props: NodeProps) {
  const { id, data, selected } = props;
  const { updateNodeData } = useReactFlow();

  const xConnections = useNodeConnections({ handleType: 'target', handleId: 'x_percent' });
  const yConnections = useNodeConnections({ handleType: 'target', handleId: 'y_percent' });
  const wConnections = useNodeConnections({ handleType: 'target', handleId: 'width_percent' });
  const hConnections = useNodeConnections({ handleType: 'target', handleId: 'height_percent' });
  const isExecuting = useStore((state) => state.executingNodeIds.has(id));

  const runNode = async () => {
    import('@/lib/executor').then(({ executeWorkflow }) => {
      const state = useStore.getState();
      executeWorkflow(state.nodes, state.edges, state.workflowId || "new", 'single', id);
    });
  };

  return (
    <NodeWrapper id={id} title="Crop Image" icon={<Crop size={16} className="text-[#6C63FF]" />} selected={selected}>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="image_url" 
        className="w-3 h-3 bg-[#6C63FF] border-2 border-[#1E1E2E]" 
        style={{ top: '3.5rem' }}
      />

      <div className="flex flex-col gap-2">
          <div className="relative flex justify-between items-center text-sm">
            <Handle type="target" position={Position.Left} id="x_percent" className="w-3 h-3 bg-zinc-400 border-2 border-[#1E1E2E] !absolute !-left-5 !top-1/2 !-translate-y-1/2" />
            <span className="text-gray-400">X %</span>
            <input 
              type="number" 
              className="nodrag w-16 bg-[#0a0a09] border border-[#333] rounded px-2 py-1 text-right focus:border-[#6C63FF] outline-none" 
              value={(data?.x_percent as number) ?? 0}
              onChange={(e) => updateNodeData(id, { x_percent: Number(e.target.value) })}
            />
          </div>
          <div className="relative flex justify-between items-center text-sm">
            <Handle type="target" position={Position.Left} id="y_percent" className="w-3 h-3 bg-zinc-400 border-2 border-[#1E1E2E] !absolute !-left-5 !top-1/2 !-translate-y-1/2" />
            <span className="text-gray-400">Y %</span>
            <input 
              type="number" 
              className="nodrag w-16 bg-[#0a0a09] border border-[#333] rounded px-2 py-1 text-right focus:border-[#6C63FF] outline-none" 
              value={(data?.y_percent as number) ?? 0}
              onChange={(e) => updateNodeData(id, { y_percent: Number(e.target.value) })}
            />
          </div>
          <div className="relative flex justify-between items-center text-sm">
            <Handle type="target" position={Position.Left} id="width_percent" className="w-3 h-3 bg-zinc-400 border-2 border-[#1E1E2E] !absolute !-left-5 !top-1/2 !-translate-y-1/2" />
            <span className="text-gray-400">Width %</span>
            <input 
              type="number" 
              className="nodrag w-16 bg-[#0a0a09] border border-[#333] rounded px-2 py-1 text-right focus:border-[#6C63FF] outline-none" 
              value={(data?.width_percent as number) ?? 100}
              onChange={(e) => updateNodeData(id, { width_percent: Number(e.target.value) })}
            />
          </div>
          <div className="relative flex justify-between items-center text-sm">
            <Handle type="target" position={Position.Left} id="height_percent" className="w-3 h-3 bg-zinc-400 border-2 border-[#1E1E2E] !absolute !-left-5 !top-1/2 !-translate-y-1/2" />
            <span className="text-gray-400">Height %</span>
            <input 
              type="number" 
              className="nodrag w-16 bg-[#0a0a09] border border-[#333] rounded px-2 py-1 text-right focus:border-[#6C63FF] outline-none" 
              value={(data?.height_percent as number) ?? 100}
              onChange={(e) => updateNodeData(id, { height_percent: Number(e.target.value) })}
            />
          </div>

        {Boolean(data?.resultImageUrl) && (
          <div className="mt-2">
            <img 
              src={data.resultImageUrl as string} 
              alt="Cropped" 
              className="w-full max-h-[200px] object-contain rounded-md border border-[#333]"
            />
          </div>
        )}

        <div className="relative flex justify-end items-center text-sm mt-3 pt-2 border-t border-[#333]">
          <span className="text-gray-400 mr-2">Cropped Image</span>
          <Handle 
            type="source" 
            position={Position.Right} 
            id="image"
            className="w-3 h-3 bg-[#6C63FF] border-2 border-[#1E1E2E] !absolute !-right-5 !top-1/2 !-translate-y-1/2"
          />
        </div>

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
    </NodeWrapper>
  );
}
