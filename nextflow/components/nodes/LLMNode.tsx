import { Handle, Position, NodeProps, useReactFlow, useNodeConnections } from "@xyflow/react";
import { Brain, Play } from "lucide-react";
import NodeWrapper from "./NodeWrapper";
import { useStore } from "@/lib/store";
import { useState, useEffect } from "react";
import Uppy from '@uppy/core';
import Transloadit from '@uppy/transloadit';
import Dashboard from '@uppy/react/dashboard';

import '@uppy/core/css/style.min.css';
import '@uppy/dashboard/css/style.min.css';

export default function LLMNode(props: NodeProps) {
  const { id, data, selected } = props;
  const { updateNodeData } = useReactFlow();

  // Check if inputs are connected to hide manual inputs
  const systemPromptConnections = useNodeConnections({ handleType: 'target', handleId: 'system_prompt' });
  const userMessageConnections = useNodeConnections({ handleType: 'target', handleId: 'user_message' });

  const hasSystemPrompt = systemPromptConnections.length > 0;
  const hasUserMessage = userMessageConnections.length > 0;

  const isExecuting = useStore((state) => state.executingNodeIds.has(id));

  const imageConnections = useNodeConnections({ handleType: 'target', handleId: 'images' });
  const hasImageConnection = imageConnections.length > 0;

  const [uppy, setUppy] = useState<Uppy | null>(null);

  useEffect(() => {
    if (!data?.imageUrl && !uppy && !hasImageConnection) {
      const u = new Uppy({
        restrictions: {
          maxNumberOfFiles: 1,
          allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        }
      });

      u.use(Transloadit, {
        assemblyOptions: {
          params: {
            auth: { key: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY || '' },
            steps: {
              export: {
                use: ":original",
                robot: "/image/resize",
                width: 2000,
                height: 2000,
                resize_strategy: "fit"
              }
            }
          },
        },
        waitForEncoding: true
      });

      u.on('transloadit:complete', (assembly) => {
        const resultUrl = assembly.results?.['export']?.[0]?.ssl_url || assembly.results?.[':original']?.[0]?.ssl_url;
        if (resultUrl) {
          updateNodeData(id, { imageUrl: resultUrl });
        }
      });

      setUppy(u);
    }

    return () => {
      if (uppy) uppy.destroy();
    };
  }, [id, data?.imageUrl, updateNodeData, hasImageConnection]);

  const runNode = async () => {
    import('@/lib/executor').then(({ executeWorkflow }) => {
      const state = useStore.getState();
      executeWorkflow(state.nodes, state.edges, state.workflowId || "new", 'single', id);
    });
  };

  return (
    <NodeWrapper id={id} title="LLM" icon={<Brain size={16} className="text-[#6C63FF]" />} selected={selected}>
      <div className="flex flex-col gap-3">
        <select
          className="bg-[#0a0a09] text-white border border-[#333] rounded-md p-2 text-sm focus:outline-none focus:border-[#6C63FF]"
          value={(data?.model as string) || "nvidia/nemotron-nano-12b-v2-vl:free"}
          onChange={(e) => updateNodeData(id, { model: e.target.value })}
        >
          <option value="nvidia/nemotron-nano-12b-v2-vl:free">Nemotron Nano 12B v2 VL (Free)</option>
          <option value="openai/gpt-oss-120b:free">gpt-oss-120b (free)</option>
          <option value="google/gemini-pro-1.5-exp:free">Gemini Pro 1.5 Exp (Free Vision)</option>
        </select>

        <div className="relative flex flex-col gap-1">
          <Handle type="target" position={Position.Left} id="system_prompt" className="w-3 h-3 bg-zinc-400 border-2 border-[#1E1E2E] !absolute !-left-5 !top-[26px] !-translate-y-1/2" />
          <label className="text-xs text-gray-400">System Prompt</label>
          <textarea
            className="nodrag bg-[#0a0a09] text-white border border-[#333] rounded-md p-2 text-sm focus:outline-none focus:border-[#6C63FF] resize-y min-h-[60px]"
            value={(data?.systemPrompt as string) || ""}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
            placeholder="Optional system instructions..."
          />
        </div>

        <div className="relative flex flex-col gap-1">
          <Handle type="target" position={Position.Left} id="user_message" className="w-3 h-3 bg-zinc-400 border-2 border-[#1E1E2E] !absolute !-left-5 !top-[26px] !-translate-y-1/2" />
          <label className="text-xs text-gray-400">User Message *</label>
          <textarea
            className="nodrag bg-[#0a0a09] text-white border border-[#333] rounded-md p-2 text-sm focus:outline-none focus:border-[#6C63FF] resize-y min-h-[60px]"
            value={(data?.userMessage as string) || ""}
            onChange={(e) => updateNodeData(id, { userMessage: e.target.value })}
            placeholder="Required message..."
          />
        </div>

        <div className="relative flex flex-col gap-1 mt-1">
          <Handle type="target" position={Position.Left} id="images" className="w-3 h-3 bg-zinc-400 border-2 border-[#1E1E2E] !absolute !-left-5 !top-[14px] !-translate-y-1/2" />
          <label className="text-xs text-gray-400">Image (Optional)</label>

          {!hasImageConnection ? (
            <>
              {Boolean(data?.imageUrl) ? (
                <div className="flex flex-col gap-2 mt-1">
                  <img
                    src={data.imageUrl as string}
                    alt="Uploaded"
                    className="w-full h-auto max-h-[150px] object-cover rounded-md border border-[#333]"
                  />
                  <button
                    onClick={() => updateNodeData(id, { imageUrl: null })}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div className="uppy-dark-theme-override nodrag mt-1">
                  {uppy ? (
                    <Dashboard
                      uppy={uppy}
                      hideUploadButton={false}
                      width="100%"
                      height={120}
                      proudlyDisplayPoweredByUppy={false}
                      theme="dark"
                    />
                  ) : (
                    <div className="h-[120px] flex items-center justify-center text-xs text-gray-500 bg-[#0a0a09] border border-[#333] rounded-md">
                      Loading uploader...
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-gray-500 italic py-2">Image provided via connection.</div>
          )}
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

        {Boolean(data?.result) && (
          <div className="mt-2 p-3 bg-[#0a0a09] border border-[#333] rounded-md max-h-[200px] overflow-y-auto">
            <p className="text-sm text-gray-300 break-words whitespace-pre-wrap">
              {data.result as string}
            </p>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="text"
        className="w-3 h-3 bg-[#6C63FF] border-2 border-[#1E1E2E]"
      />
    </NodeWrapper>
  );
}
