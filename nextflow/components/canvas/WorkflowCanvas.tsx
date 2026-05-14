"use client";

import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';

import TextNode from '../nodes/TextNode';
import UploadImageNode from '../nodes/UploadImageNode';
import UploadVideoNode from '../nodes/UploadVideoNode';
import LLMNode from '../nodes/LLMNode';
import CropImageNode from '../nodes/CropImageNode';
import ExtractFrameNode from '../nodes/ExtractFrameNode';

const nodeTypes = {
  textNode: TextNode,
  uploadImageNode: UploadImageNode,
  uploadVideoNode: UploadVideoNode,
  llmNode: LLMNode,
  cropImageNode: CropImageNode,
  extractFrameNode: ExtractFrameNode,
};

const getId = () => `dndnode_${Math.random().toString(36).substring(2, 9)}`;

export default function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    addNode,
  } = useStore(useShallow((state) => ({
    nodes: state.nodes,
    edges: state.edges,
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
    onReconnect: state.onReconnect,
    addNode: state.addNode,
  })));

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode],
  );

  const isValidConnection = useCallback(
    (connection: any) => {
      // Prevent self-connection
      if (connection.source === connection.target) return false;

      // Prevent cycles using a simple DFS
      const targetNode = nodes.find((node) => node.id === connection.target);
      if (!targetNode) return false;

      const hasCycle = (nodeId: string, visited = new Set<string>()): boolean => {
        if (visited.has(nodeId)) return false;
        visited.add(nodeId);

        const outgoers = edges
          .filter((e) => e.source === nodeId)
          .map((e) => e.target);

        for (const outgoerId of outgoers) {
          if (outgoerId === connection.source) return true;
          if (hasCycle(outgoerId, visited)) return true;
        }
        return false;
      };

      return !hasCycle(targetNode.id);
    },
    [nodes, edges]
  );

  return (
    <div className="absolute inset-0 w-full h-full" ref={reactFlowWrapper} onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#333" />
        <MiniMap 
          nodeColor="#6C63FF" 
          maskColor="rgba(0,0,0,0.8)"
          style={{ backgroundColor: '#111118', border: '1px solid #1E1E2E', borderRadius: '8px' }}
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
}
