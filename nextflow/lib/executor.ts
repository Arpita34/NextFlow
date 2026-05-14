import { Edge, Node } from '@xyflow/react';
import { useStore } from './store';

export async function executeWorkflow(nodes: Node[], edges: Edge[], workflowId: string, scope: 'full' | 'selected' | 'single' = 'full', targetNodeId?: string) {
  const store = useStore.getState();

  const selectedNodeIds = scope === 'single' && targetNodeId 
    ? [targetNodeId] 
    : nodes.filter(n => n.selected).map(n => n.id);

  if (scope !== 'full' && selectedNodeIds.length === 0) {
    console.warn("No nodes selected to run");
    return;
  }
  
  // 1. Create a WorkflowRun
  let runId: string;
  try {
    const res = await fetch('/api/workflows/run', {
      method: 'POST',
      body: JSON.stringify({ workflowId, scope }),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    runId = data.runId;
  } catch (err) {
    console.error("Failed to initialize run", err);
    return;
  }

  store.setIsExecuting(true);
  store.clearExecutingNodes();

  // 2. Build Adjacency List and In-Degree Map
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach(n => {
    adjList.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  edges.forEach(e => {
    if (!adjList.has(e.source) || !inDegree.has(e.target)) return; // Ignore dangling edges
    adjList.get(e.source)!.push(e.target);
    inDegree.set(e.target, inDegree.get(e.target)! + 1);
  });

  // 3. Kahn's Algorithm to group into levels
  const levels: string[][] = [];
  let queue: string[] = [];

  // Initial queue with nodes having 0 in-degree
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(nodeId);
  }

  while (queue.length > 0) {
    levels.push([...queue]);
    const nextQueue: string[] = [];

    for (const nodeId of queue) {
      const neighbors = adjList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
        if (inDegree.get(neighbor) === 0) {
          nextQueue.push(neighbor);
        }
      }
    }
    queue = nextQueue;
  }

  // Check for cycles (if total nodes in levels != total nodes)
  const sortedCount = levels.reduce((acc, level) => acc + level.length, 0);
  if (sortedCount !== nodes.length) {
    console.error("Cycle detected in DAG. Cannot execute.");
    window.alert("Cycle detected in your workflow! Please make sure your connections don't form a loop (e.g. A connects back to A).");
    store.setIsExecuting(false);
    return;
  }

  // 4. Execute concurrently based on dependencies
  const nodePromises = new Map<string, Promise<void>>();

  const executeNode = async (nodeId: string) => {
    // Wait for all predecessors to finish first
    const incomingEdges = edges.filter(e => e.target === nodeId);
    const deps = incomingEdges.map(e => e.source);
    await Promise.all(deps.map(depId => nodePromises.get(depId)));

    // If this node is not in scope, just return (its promise resolves, allowing downstream to continue if needed)
    if (scope !== 'full' && !selectedNodeIds.includes(nodeId)) {
      return;
    }

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    store.addExecutingNode(nodeId);

    // Map node types to their API routes
    let apiRoute = '';
    let payload: any = { nodeId, runId, ...node.data };

    // Gather inputs from incoming edges by looking at the latest state
    const currentNodes = useStore.getState().nodes;
    
    incomingEdges.forEach(edge => {
      const sourceNode = currentNodes.find(n => n.id === edge.source);
      if (!sourceNode) return;

      let sourceValue: any = null;
      
      if (sourceNode.type === 'uploadImageNode') {
        sourceValue = sourceNode.data.imageUrl;
      } else if (sourceNode.type === 'uploadVideoNode') {
        sourceValue = sourceNode.data.videoUrl;
      } else if (sourceNode.type === 'cropImageNode' || sourceNode.type === 'extractFrameNode') {
        sourceValue = sourceNode.data.resultImageUrl;
      } else if (sourceNode.type === 'textNode') {
        sourceValue = sourceNode.data.text;
      } else if (sourceNode.type === 'llmNode') {
        sourceValue = sourceNode.data.result;
      }

      console.log(`Edge: ${sourceNode.type}(${edge.sourceHandle}) → ${node.type}(${edge.targetHandle}) | value: ${sourceValue ? 'present' : 'null'}`);

      if (sourceValue) {
        if (edge.targetHandle === 'images') {
          payload.imageUrls = payload.imageUrls || [];
          if (!payload.imageUrls.includes(sourceValue)) {
            payload.imageUrls.push(sourceValue);
          }
        } else if (edge.targetHandle === 'user_message') {
          payload.userMessage = sourceValue;
        } else if (edge.targetHandle === 'system_prompt') {
          payload.systemPrompt = sourceValue;
        } else if (edge.targetHandle === 'image_url') {
          payload.imageUrl = sourceValue;
        } else if (edge.targetHandle === 'video_url') {
          payload.videoUrl = sourceValue;
        }

        // Fallback: if an image source connects to a crop node but didn't match any handle above,
        // still set imageUrl so the crop task has something to work with
        if (node.type === 'cropImageNode' && !payload.imageUrl && (sourceNode.type === 'uploadImageNode' || sourceNode.type === 'cropImageNode')) {
          payload.imageUrl = sourceValue;
        }
        // Same fallback for extract frame + video
        if (node.type === 'extractFrameNode' && !payload.videoUrl && sourceNode.type === 'uploadVideoNode') {
          payload.videoUrl = sourceValue;
        }
      }
    });

    if (node.type === 'llmNode' && payload.imageUrl) {
      payload.imageUrls = payload.imageUrls || [];
      if (!payload.imageUrls.includes(payload.imageUrl)) {
        payload.imageUrls.push(payload.imageUrl);
      }
    }

    switch (node.type) {
      case 'llmNode':
        apiRoute = '/api/nodes/llm';
        break;
      case 'cropImageNode':
        apiRoute = '/api/nodes/crop';
        break;
      case 'extractFrameNode':
        apiRoute = '/api/nodes/extract-frame';
        break;
      // Text, UploadImage, UploadVideo nodes usually don't have heavy backend processing,
      // they just hold state. We can skip calling APIs for them, or call a generic mock API.
      default:
        // Simulate 1s wait for client-only nodes
        await new Promise(r => setTimeout(r, 1000));
        store.removeExecutingNode(nodeId);
        return;
    }

    if (apiRoute) {
      try {
        const res = await fetch(apiRoute, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));

        // We wait for Trigger.dev task to complete using polling (max 5 min)
        let isComplete = false;
        const pollStart = Date.now();
        const POLL_TIMEOUT = 300_000; // 5 minutes
        let lastLog = Date.now();

        while (!isComplete) {
          if (Date.now() - pollStart > POLL_TIMEOUT) {
            console.error(`Node ${nodeId} timed out after 5 minutes`);
            throw new Error("Task timed out after 5 minutes");
          }
          // Log progress every 10s so the user knows it's still running
          if (Date.now() - lastLog > 10_000) {
            console.log(`Node ${nodeId} still processing... (${Math.round((Date.now() - pollStart)/1000)}s elapsed)`);
            lastLog = Date.now();
          }
          await new Promise(r => setTimeout(r, 2000));
          const statusRes = await fetch(`/api/runs/${runId}/status`);
          const statusData = await statusRes.json();
          
          // Find our execution
          const execution = statusData.executions?.find((ex: any) => ex.nodeId === nodeId);
          if (execution && (execution.status === 'success' || execution.status === 'failed')) {
            isComplete = true;
            
            // Update node data with result
            const updatedNodes = useStore.getState().nodes.map(n => {
              if (n.id === nodeId) {
                return { ...n, data: { ...n.data, result: execution.outputs?.result, resultImageUrl: execution.outputs?.resultImageUrl } };
              }
              return n;
            });
            useStore.getState().setNodes(updatedNodes);

            if (execution.status === 'failed') throw new Error(execution.error || "Task failed");
          }
        }
      } catch (err) {
        console.error(`Failed executing node ${nodeId}`, err);
      }
    }

    store.removeExecutingNode(nodeId);
  };

  // Start execution for all nodes
  nodes.forEach(node => {
    nodePromises.set(node.id, executeNode(node.id));
  });

  // Wait for the entire graph to finish executing
  await Promise.all(nodePromises.values());

  store.setIsExecuting(false);
  console.log("Workflow execution complete");
}
