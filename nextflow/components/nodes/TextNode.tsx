import { Handle, Position, NodeProps } from "@xyflow/react";
import { Type } from "lucide-react";
import NodeWrapper from "./NodeWrapper";
import { useStore } from "@/lib/store";
import { useReactFlow } from "@xyflow/react";

export default function TextNode(props: NodeProps) {
  const { id, data, selected } = props;
  const { updateNodeData } = useReactFlow();

  const onChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { text: evt.target.value });
  };

  return (
    <NodeWrapper id={id} title="Text" icon={<Type size={16} className="text-[#6C63FF]" />} selected={selected}>
      <textarea
        className="w-full bg-[#0a0a09] text-white border border-[#333] rounded-md p-2 text-sm focus:outline-none focus:border-[#6C63FF] resize-y min-h-[80px]"
        value={(data?.text as string) || ""}
        onChange={onChange}
        placeholder="Enter text..."
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="text"
        className="w-3 h-3 bg-[#6C63FF] border-2 border-[#1E1E2E]"
      />
    </NodeWrapper>
  );
}
