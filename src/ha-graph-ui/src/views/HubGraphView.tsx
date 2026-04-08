import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  type Edge,
  type Node,
  type Connection,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ProducerNode } from '../components/nodes/ProducerNode';
import { ConsumerNode } from '../components/nodes/ConsumerNode';
import { StorageNode } from '../components/nodes/StorageNode';
import { AnimatedFlowEdge } from '../components/edges/AnimatedFlowEdge';
import { ContextDrawer } from '../panels/ContextDrawer';
import { mockHubGraphs } from '../data/mockData';

const nodeTypes = {
  producer: ProducerNode,
  consumer: ConsumerNode,
  storage: StorageNode,
};

const edgeTypes = {
  animatedFlow: AnimatedFlowEdge,
};

interface HubGraphViewProps {
  hubId: string | null;
}

export function HubGraphView({ hubId }: HubGraphViewProps) {
  const graphData = hubId ? (mockHubGraphs[hubId] || { nodes: [], edges: [] }) : { nodes: [], edges: [] };
  
  const [nodes, setNodes, onNodesChange] = useNodesState(graphData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData.edges);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Re-synchronize data when hubId changes
  useEffect(() => {
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
  }, [hubId]);

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge({ ...params, type: 'animatedFlow', animated: true }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsDrawerOpen(true);
  }, []);

  if (!hubId) return <div>No Hub Selected</div>;

  return (
    <div style={{ width: '100vw', height: 'calc(100vh - 65px)', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background gap={24} size={2} color="var(--panel-border)" />
        <Controls />
      </ReactFlow>

      <ContextDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        selectedNode={selectedNode} 
        edges={edges}
        onUpdateNodeData={(id, newData) => {
          setNodes((nds) => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n));
          if (selectedNode && selectedNode.id === id) {
            setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...newData } } : null);
          }
        }}
      />
    </div>
  );
}
