import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  reconnectEdge,
} from '@xyflow/react';

// Define the shape of our state
export type WorkflowState = {
  nodes: Node[];
  edges: Edge[];
  selectedNodes: Set<string>;
  isExecuting: boolean;
  executingNodeIds: Set<string>;
  workflowId: string | null;
  workflowName: string;
  isSaving: boolean;
  lastSavedAt: Date | null;
  
  // History for undo/redo
  history: { nodes: Node[]; edges: Edge[] }[];
  future: { nodes: Node[]; edges: Edge[] }[];

  // Actions
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onReconnect: (oldEdge: Edge, newConnection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  setWorkflowName: (name: string) => void;
  
  // Save/Load
  saveWorkflow: () => Promise<void>;
  loadWorkflow: (id: string) => Promise<void>;
  
  // Execution state actions
  setIsExecuting: (isExecuting: boolean) => void;
  addExecutingNode: (nodeId: string) => void;
  removeExecutingNode: (nodeId: string) => void;
  clearExecutingNodes: () => void;
  
  // Undo/Redo actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
};

// Type compatibility mapping
const validConnections: Record<string, string[]> = {
  text: ['system_prompt', 'user_message', 'timestamp', 'x_percent', 'y_percent', 'width_percent', 'height_percent'],
  image: ['images', 'image_url'],
  video: ['video_url'],
  output: ['user_message', 'system_prompt'],
};

export const useStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodes: new Set(),
  isExecuting: false,
  executingNodeIds: new Set(),
  workflowId: null,
  workflowName: 'Untitled',
  isSaving: false,
  lastSavedAt: null,
  
  history: [],
  future: [],

  onNodesChange: (changes: NodeChange[]) => {
    set((state) => {
      // Only push history for certain change types like remove or add, or drag stop
      // For simplicity in this implementation, we might trigger history manually
      return {
        nodes: applyNodeChanges(changes, state.nodes),
      };
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection: Connection) => {
    set((state) => {
      state.pushHistory();
      // Include handles in the ID to prevent collisions when multiple edges
      // connect the same source-target pair via different handle types
      const edgeId = `e${connection.source}:${connection.sourceHandle}-${connection.target}:${connection.targetHandle}`;
      const newEdge = { 
        ...connection, 
        id: edgeId,
        animated: true,
        style: { stroke: '#6C63FF', strokeWidth: 2, strokeDasharray: '5, 5' }
      };
      return {
        edges: addEdge(newEdge as Edge, state.edges),
      };
    });
  },

  onReconnect: (oldEdge: Edge, newConnection: Connection) => {
    set((state) => {
      state.pushHistory();
      return {
        edges: reconnectEdge(oldEdge, newConnection, state.edges),
      };
    });
  },

  setNodes: (nodes: Node[]) => set({ nodes }),
  setEdges: (edges: Edge[]) => set({ edges }),
  setWorkflowName: (name: string) => set({ workflowName: name }),
  
  addNode: (node: Node) => {
    set((state) => {
      state.pushHistory();
      return { nodes: [...state.nodes, node] };
    });
  },

  saveWorkflow: async () => {
    const state = get();
    set({ isSaving: true });
    try {
      if (state.workflowId) {
        // Update existing workflow
        const res = await fetch(`/api/workflows/${state.workflowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: state.workflowName,
            nodes: state.nodes,
            edges: state.edges,
          }),
        });
        if (!res.ok) throw new Error('Failed to save');
      } else {
        // Create new workflow
        const res = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: state.workflowName,
            nodes: state.nodes,
            edges: state.edges,
          }),
        });
        if (!res.ok) throw new Error('Failed to create');
        const data = await res.json();
        set({ workflowId: data.workflow.id });
      }
      set({ lastSavedAt: new Date() });
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      set({ isSaving: false });
    }
  },

  loadWorkflow: async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const wf = data.workflow;
      const deduplicatedNodes = (wf.nodes as Node[]).filter((node, index, self) => 
        index === self.findIndex((t) => t.id === node.id)
      );

      set({
        workflowId: wf.id,
        workflowName: wf.name,
        nodes: deduplicatedNodes,
        edges: wf.edges as Edge[],
        history: [],
        future: [],
      });
    } catch (err) {
      console.error('Load failed:', err);
    }
  },

  setIsExecuting: (isExecuting: boolean) => set({ isExecuting }),
  
  addExecutingNode: (nodeId: string) => {
    set((state) => {
      const newSet = new Set(state.executingNodeIds);
      newSet.add(nodeId);
      return { executingNodeIds: newSet };
    });
  },
  
  removeExecutingNode: (nodeId: string) => {
    set((state) => {
      const newSet = new Set(state.executingNodeIds);
      newSet.delete(nodeId);
      return { executingNodeIds: newSet };
    });
  },
  
  clearExecutingNodes: () => set({ executingNodeIds: new Set() }),

  pushHistory: () => {
    set((state) => ({
      history: [...state.history, { nodes: state.nodes, edges: state.edges }],
      future: [], // clear future on new action
    }));
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      
      return {
        nodes: previous.nodes,
        edges: previous.edges,
        history: newHistory,
        future: [{ nodes: state.nodes, edges: state.edges }, ...state.future],
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      
      return {
        nodes: next.nodes,
        edges: next.edges,
        history: [...state.history, { nodes: state.nodes, edges: state.edges }],
        future: newFuture,
      };
    });
  },
}));
