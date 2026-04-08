import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Edge,
  type Node,
  type Connection,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Plus } from 'lucide-react';

import { ResourceNode }       from '../components/nodes/ResourceNode';
import { ProducerNode }       from '../components/nodes/ProducerNode';
import { ConsumerNode }       from '../components/nodes/ConsumerNode';
import { StorageNode }        from '../components/nodes/StorageNode';
import { AnimatedFlowEdge }   from '../components/edges/AnimatedFlowEdge';
import { ContextDrawer }      from '../panels/ContextDrawer';
import { AddNodeDialog }      from '../components/AddNodeDialog';
import { CanvasContextMenu }  from '../components/CanvasContextMenu';
import { mockHubGraphs }      from '../data/mockData';

const nodeTypes = {
  resourceNode: ResourceNode,
  // Legacy backups — kept until ResourceNode is fully validated
  producer: ProducerNode,
  consumer: ConsumerNode,
  storage:  StorageNode,
};

const edgeTypes = {
  animatedFlow: AnimatedFlowEdge,
};

interface HubGraphViewProps {
  hubId: string | null;
}

// Inner component has access to useReactFlow (must be inside <ReactFlow>)
function GraphControls({
  onFitView,
}: { onFitView: (fn: () => void) => void }) {
  const { fitView } = useReactFlow();
  useEffect(() => { onFitView(fitView); }, [fitView, onFitView]);
  return null;
}

export function HubGraphView({ hubId }: HubGraphViewProps) {
  const graphData = hubId
    ? (mockHubGraphs[hubId] ?? { nodes: [], edges: [] })
    : { nodes: [], edges: [] };

  const [nodes, setNodes, onNodesChange] = useNodesState(graphData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData.edges);

  // Drawer state
  const [isDrawerOpen,  setIsDrawerOpen]  = useState(false);
  const [drawerMode,    setDrawerMode]    = useState<'node' | 'edge'>('node');
  const [selectedNode,  setSelectedNode]  = useState<Node | null>(null);
  const [selectedEdge,  setSelectedEdge]  = useState<Edge | null>(null);

  // Add node dialog
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Canvas context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // fitView ref — populated by GraphControls child
  const fitViewRef = useRef<(() => void) | null>(null);
  const handleFitView = useCallback((fn: () => void) => { fitViewRef.current = fn; }, []);

  // Sync graph data when hub changes
  useEffect(() => {
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
    setIsDrawerOpen(false);
    setSelectedNode(null);
    setSelectedEdge(null);
    setContextMenu(null);
  }, [hubId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge({ ...params, type: 'animatedFlow', animated: true, data: { flowVolume: 0 } }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setDrawerMode('node');
    setIsDrawerOpen(true);
    setContextMenu(null);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setDrawerMode('edge');
    setIsDrawerOpen(true);
    setContextMenu(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const onPaneContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Position relative to the container
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  // Keep drawer node in sync after data updates
  const handleUpdateNodeData = useCallback((id: string, newData: any) => {
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n)
    );
    setSelectedNode((prev) =>
      prev && prev.id === id ? { ...prev, data: { ...prev.data, ...newData } } : prev
    );
  }, []);

  const handleUpdateEdgeData = useCallback((id: string, newData: any) => {
    setEdges((eds) =>
      eds.map((e) => e.id === id ? { ...e, data: { ...e.data, ...newData } } : e)
    );
    setSelectedEdge((prev) =>
      prev && prev.id === id ? { ...prev, data: { ...prev.data, ...newData } } : prev
    );
  }, []);

  // Switch drawer to a specific edge (from Connections list)
  const handleSelectEdge = useCallback((edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;
    setSelectedEdge(edge);
    setSelectedNode(null);
    setDrawerMode('edge');
    setIsDrawerOpen(true);
  }, [edges]);

  // Add a new node from the dialog
  const handleAddNode = useCallback((nodeData: any) => {
    const id = `node_${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'resourceNode',
      // Place in a visible region, slightly randomised to avoid stacking
      position: { x: 200 + Math.random() * 150, y: 150 + Math.random() * 150 },
      data: nodeData,
    };
    setNodes((nds) => [...nds, newNode]);
    setShowAddDialog(false);
    // Select the new node immediately
    setSelectedNode(newNode);
    setDrawerMode('node');
    setIsDrawerOpen(true);
  }, [setNodes]);

  if (!hubId) {
    return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>No Hub Selected</div>;
  }

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 65px)', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background gap={24} size={2} color="var(--panel-border)" />
        <Controls />
        <GraphControls onFitView={handleFitView} />
      </ReactFlow>

      {/* ── Context drawer ── */}
      <ContextDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={drawerMode}
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        nodes={nodes}
        edges={edges}
        onUpdateNodeData={handleUpdateNodeData}
        onUpdateEdgeData={handleUpdateEdgeData}
        onSelectEdge={handleSelectEdge}
      />

      {/* ── Canvas right-click context menu ── */}
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAddNode={() => setShowAddDialog(true)}
          onFitView={() => fitViewRef.current?.()}
        />
      )}

      {/* ── FAB: Add Node ── */}
      <button
        onClick={() => setShowAddDialog(true)}
        title="Add Node"
        style={{
          position: 'absolute',
          bottom: 88, // above the ReactFlow Controls
          right: 16,
          width: 48, height: 48,
          borderRadius: '50%',
          background: 'var(--accent-color)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 10,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.6)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        }}
      >
        <Plus size={22} />
      </button>

      {/* ── Add Node Dialog ── */}
      <AddNodeDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddNode}
      />
    </div>
  );
}
