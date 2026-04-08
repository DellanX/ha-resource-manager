import { useState, useEffect } from 'react';
import {
  X, Settings, Database, Activity, Code2, Waypoints, Info,
  MoreHorizontal, ArrowLeft, Plus, Trash2, ArrowRight, ArrowLeftRight,
} from 'lucide-react';
import type { Node, Edge } from 'reactflow';

interface ContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** 'node' = node selected; 'edge' = edge selected */
  mode: 'node' | 'edge';
  selectedNode?: Node | null;
  selectedEdge?: Edge | null;
  /** All nodes in the graph — needed for label lookups */
  nodes?: Node[];
  edges?: Edge[];
  onUpdateNodeData?: (id: string, data: any) => void;
  onUpdateEdgeData?: (id: string, data: any) => void;
  /** Switch the drawer to show a specific edge */
  onSelectEdge?: (edgeId: string) => void;
}

// ─── tiny helpers ───────────────────────────────────────────────────────────

function EntityList({
  entities,
  draft,
  setDraft,
  onAdd,
  onRemove,
}: {
  entities: string[];
  draft: string;
  setDraft: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {entities.map((ent, idx) => (
        <div key={idx} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,0,0,0.25)', padding: '8px 12px',
          borderRadius: 8,
        }}>
          <Code2 size={13} color="var(--accent-color)" style={{ flexShrink: 0 }} />
          <code style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{ent}</code>
          <button
            onClick={() => onRemove(idx)}
            style={{ background: 'transparent', border: 'none', padding: 2, cursor: 'pointer', color: '#f44336', display: 'flex' }}
            title="Remove entity"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <input
          type="text"
          value={draft}
          placeholder="sensor.example_entity"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onAdd(); }}
          style={{
            flex: 1, padding: '7px 10px', borderRadius: 7, fontSize: 12,
            background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)',
            color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace',
          }}
        />
        <button
          onClick={onAdd}
          style={{
            padding: '7px 12px', borderRadius: 7, cursor: 'pointer',
            background: 'var(--accent-color)', border: 'none', color: '#fff', display: 'flex',
          }}
          title="Add entity"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main drawer ─────────────────────────────────────────────────────────────

export function ContextDrawer({
  isOpen, onClose, mode,
  selectedNode, selectedEdge,
  nodes, edges,
  onUpdateNodeData, onUpdateEdgeData, onSelectEdge,
}: ContextDrawerProps) {

  const [activeTab,        setActiveTab]        = useState<'live' | 'config'>('live');
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [overrideValue,    setOverrideValue]    = useState<number>(0);
  const [configItemId,     setConfigItemId]     = useState<string | null>(null);

  // Entity editing state — node
  const [nodeEntityDraft, setNodeEntityDraft] = useState('');
  const [nodeEntities,    setNodeEntities]    = useState<string[]>([]);

  // Entity editing state — edge
  const [edgeEntityDraft, setEdgeEntityDraft] = useState('');
  const [edgeEntities,    setEdgeEntities]    = useState<string[]>([]);

  // Reset local state whenever selection changes
  useEffect(() => {
    setActiveTab('live');
    setIsEditingOverride(false);
    setConfigItemId(null);
    setNodeEntityDraft('');
    setEdgeEntityDraft('');
    if (selectedNode) {
      setOverrideValue(selectedNode.data.value ?? 0);
      setNodeEntities(selectedNode.data.entities ?? []);
    }
    if (selectedEdge) {
      setEdgeEntities(selectedEdge.data?.entities ?? []);
    }
  }, [selectedNode, selectedEdge]);

  if (!isOpen) return null;

  // ── Derived values ────────────────────────────────────────────────────────

  // Capabilities (support both new & legacy node types)
  const caps = selectedNode?.data.capabilities ?? {
    canProduce: selectedNode?.type === 'producer',
    canConsume:  selectedNode?.type === 'consumer',
    canStore:    selectedNode?.type === 'storage',
  };
  const resourceType = selectedNode?.data.resourceType ?? selectedNode?.data.type ?? 'electric';

  // Flow totals for node
  let ingress = 0, egress = 0;
  if (selectedNode && edges) {
    ingress = edges.filter((e) => e.target === selectedNode.id).reduce((s, e) => s + (e.data?.flowVolume ?? 0), 0);
    egress  = edges.filter((e) => e.source === selectedNode.id).reduce((s, e) => s + (e.data?.flowVolume ?? 0), 0);
  }
  const netFlow = ingress - egress;

  // ETA for storage
  let etaText = 'Standing by';
  if (selectedNode && caps.canStore && netFlow !== 0) {
    const maxAbs     = selectedNode.data.maxCapacity ?? 100;
    const currentAbs = selectedNode.data.unit === '%'
      ? maxAbs * (selectedNode.data.value / 100)
      : selectedNode.data.value;
    const fmt = (h: number) => {
      const hh = Math.floor(Math.abs(h));
      const mm = Math.floor((Math.abs(h) - hh) * 60);
      const ss = Math.floor(((Math.abs(h) - hh) * 60 - mm) * 60);
      return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    };
    etaText = netFlow > 0
      ? `Full in ~${fmt((maxAbs - currentAbs) / netFlow)}`
      : `Empty in ~${fmt(currentAbs / Math.abs(netFlow))}`;
  }

  const rateUnit = selectedNode?.data.capacityUnit
    ? selectedNode.data.capacityUnit.replace(/h$/i, '')
    : 'units/h';

  // Connections list (all edges touching the selected node)
  const nodeEdges = selectedNode
    ? (edges ?? []).filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  // Edge source/target labels
  const sourceNode = nodes?.find((n) => n.id === selectedEdge?.source);
  const targetNode = nodes?.find((n) => n.id === selectedEdge?.target);

  // ── Entity helpers ────────────────────────────────────────────────────────

  const addNodeEntity = () => {
    if (!nodeEntityDraft.trim()) return;
    const updated = [...nodeEntities, nodeEntityDraft.trim()];
    setNodeEntities(updated);
    setNodeEntityDraft('');
    if (onUpdateNodeData && selectedNode) onUpdateNodeData(selectedNode.id, { entities: updated });
  };
  const removeNodeEntity = (idx: number) => {
    const updated = nodeEntities.filter((_, i) => i !== idx);
    setNodeEntities(updated);
    if (onUpdateNodeData && selectedNode) onUpdateNodeData(selectedNode.id, { entities: updated });
  };

  const addEdgeEntity = () => {
    if (!edgeEntityDraft.trim()) return;
    const updated = [...edgeEntities, edgeEntityDraft.trim()];
    setEdgeEntities(updated);
    setEdgeEntityDraft('');
    if (onUpdateEdgeData && selectedEdge)
      onUpdateEdgeData(selectedEdge.id, { ...(selectedEdge.data ?? {}), entities: updated });
  };
  const removeEdgeEntity = (idx: number) => {
    const updated = edgeEntities.filter((_, i) => i !== idx);
    setEdgeEntities(updated);
    if (onUpdateEdgeData && selectedEdge)
      onUpdateEdgeData(selectedEdge.id, { ...(selectedEdge.data ?? {}), entities: updated });
  };

  // ── Drawer title ─────────────────────────────────────────────────────────

  const drawerTitle = mode === 'edge'
    ? `${sourceNode?.data.label ?? selectedEdge?.source} → ${targetNode?.data.label ?? selectedEdge?.target}`
    : (selectedNode?.data.label ?? 'Node Settings');

  const drawerSubtitle = mode === 'edge'
    ? `Flow: ${selectedEdge?.data?.flowVolume ?? '—'} units/h`
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      position: 'absolute', right: isOpen ? 0 : '-420px',
      top: 0, bottom: 0, width: 390,
      background: 'rgba(18,18,20,0.97)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid var(--panel-border)',
      transition: 'right 0.3s ease',
      zIndex: 100,
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ─── Header ─── */}
      <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--panel-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ margin: 0, fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {drawerTitle}
            </h3>
            {drawerSubtitle && (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{drawerSubtitle}</span>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', padding: 6, cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs — only in node mode */}
        {mode === 'node' && (
          <div style={{ display: 'flex', gap: 4, marginBottom: '-1px' }}>
            {(['live', 'config'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'transparent', border: 'none', borderRadius: 0,
                  padding: '8px 14px',
                  borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
                }}
              >
                {tab === 'live' ? 'Live State' : 'Configuration'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Body ─── */}
      <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ═══ EDGE MODE ═══════════════════════════════════════════════════ */}
        {mode === 'edge' && selectedEdge && (() => {
          const edgeResourceType = selectedEdge.data?.resourceType
            ?? sourceNode?.data.resourceType
            ?? sourceNode?.data.type
            ?? 'electric';
          return (
            <>
              {/* Flow Info */}
              <div className="glass-panel" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <ArrowLeftRight size={16} color="var(--text-secondary)" />
                  <h4 style={{ margin: 0, fontWeight: 500 }}>Flow Details</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>From</span>
                    <strong style={{ fontSize: 13 }}>{sourceNode?.data.label ?? selectedEdge.source}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>To</span>
                    <strong style={{ fontSize: 13 }}>{targetNode?.data.label ?? selectedEdge.target}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Flow Volume</span>
                    <strong style={{ fontSize: 18, color: `var(--color-${edgeResourceType})` }}>
                      {selectedEdge.data?.flowVolume ?? '—'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Edge entities */}
              <div className="glass-panel" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Waypoints size={16} color="var(--text-secondary)" />
                  <h4 style={{ margin: 0, fontWeight: 500 }}>HA Entities</h4>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                  Sensors that represent this flow in Home Assistant.
                </p>
                <EntityList
                  entities={edgeEntities}
                  draft={edgeEntityDraft}
                  setDraft={setEdgeEntityDraft}
                  onAdd={addEdgeEntity}
                  onRemove={removeEdgeEntity}
                />
              </div>
            </>
          );
        })()}

        {/* ═══ NODE MODE — no node selected ═══ */}
        {mode === 'node' && !selectedNode && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Select a node to view its details.</p>
        )}

        {/* ═══ NODE MODE — deep item config ═══ */}
        {mode === 'node' && selectedNode && configItemId && selectedNode.data.inventory && (() => {
          const item = selectedNode.data.inventory.find((i: any) => i.id === configItemId);
          if (!item) return null;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setConfigItemId(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, display: 'flex' }}
                >
                  <ArrowLeft size={17} />
                </button>
                <h4 style={{ margin: 0, fontSize: 16 }}>{item.name} Config</h4>
              </div>
              <div className="glass-panel" style={{ padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Current Quantity', value: item.quantity, type: 'number' },
                  { label: 'Target Quantity',  value: item.targetQuantity ?? '', type: 'number', placeholder: 'Optional' },
                  { label: 'HA Entity ID',     value: item.entityId ?? '',        type: 'text',   placeholder: 'sensor.example', mono: true },
                ].map((f) => (
                  <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{f.label}</label>
                    <input
                      type={f.type} defaultValue={f.value}
                      placeholder={(f as any).placeholder}
                      style={{
                        padding: '8px 10px', borderRadius: 6,
                        border: '1px solid var(--panel-border)',
                        background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none',
                        fontFamily: (f as any).mono ? 'monospace' : 'inherit', fontSize: 13,
                      }}
                    />
                  </div>
                ))}
                <button className="primary" onClick={() => setConfigItemId(null)} style={{ padding: '10px', marginTop: 4 }}>
                  Save Configuration
                </button>
              </div>
            </div>
          );
        })()}

        {/* ═══ NODE MODE — LIVE TAB ═══ */}
        {mode === 'node' && selectedNode && !configItemId && activeTab === 'live' && (
          <>
            {/* Shopping / recipe checkout (producer/consumer with inventory) */}
            {(caps.canProduce || caps.canConsume) && selectedNode.data.inventory && (
              <div className="glass-panel" style={{ padding: 16, borderRadius: 12, border: `1px solid var(--color-${resourceType})` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Database size={16} color={`var(--color-${resourceType})`} />
                  <h4 style={{ margin: 0, fontWeight: 500 }}>
                    {caps.canProduce && !caps.canConsume ? 'Checkout Action' : 'Requirements List'}
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {selectedNode.data.inventory.map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input type="number" defaultValue={item.quantity} style={{ width: 60, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', color: '#fff', padding: 6, borderRadius: 6, textAlign: 'right' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 30 }}>{item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="primary"
                  style={{ width: '100%', padding: 10, background: `var(--color-${resourceType})`, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('ha-toast', { detail: { message: `Executed: ${selectedNode.data.label}!` } }));
                    onClose();
                  }}
                >
                  Confirm Execution
                </button>
              </div>
            )}

            {/* Live state panel */}
            <div className="glass-panel" style={{ padding: 16, borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Activity size={16} color="var(--text-secondary)" />
                <h4 style={{ margin: 0, fontWeight: 500 }}>Live State</h4>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {selectedNode.data.inventory ? 'Inventory Type' : caps.canStore ? 'Capacity' : caps.canProduce ? 'Output' : 'Draw'}
                </span>
                <strong style={{ fontSize: 18, color: `var(--color-${resourceType})` }}>
                  {selectedNode.data.inventory ? 'Nested Structure' : `${selectedNode.data.value} ${selectedNode.data.unit}`}
                </strong>
              </div>

              {/* Storage ingress/egress/ETA */}
              {caps.canStore && !selectedNode.data.inventory && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Ingress Rate', value: `${ingress} ${rateUnit}` },
                    { label: 'Egress Rate',  value: `${egress} ${rateUnit}`  },
                  ].map((r) => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.label}</span>
                      <span style={{ fontSize: 13 }}>{r.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Estimated Time</span>
                      <div className="custom-tooltip-container">
                        <Info size={13} color="var(--text-secondary)" />
                        <div className="custom-tooltip-text">
                          ETA uses absolute capacity ({selectedNode.data.maxCapacity} {selectedNode.data.capacityUnit}) and current net flow.
                        </div>
                      </div>
                    </div>
                    <strong style={{ color: netFlow !== 0 ? 'var(--accent-color)' : 'var(--text-secondary)', fontSize: 13 }}>
                      {etaText}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Storage inventory grid */}
            {caps.canStore && selectedNode.data.inventory && (
              <div className="glass-panel" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Database size={16} color="var(--text-secondary)" />
                  <h4 style={{ margin: 0, fontWeight: 500 }}>Inventory</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                  {selectedNode.data.inventory.map((item: any) => {
                    const isLow  = item.targetQuantity !== undefined && item.quantity < item.targetQuantity;
                    const isWarn = item.targetQuantity !== undefined && !isLow && item.quantity <= item.targetQuantity * 1.2;
                    const badgeColor = isLow ? '#f44336' : isWarn ? '#ffeb3b' : `var(--color-${resourceType})`;
                    return (
                      <div key={item.id} style={{
                        background: 'rgba(255,255,255,0.05)', aspectRatio: '1/1',
                        borderRadius: 8, border: '1px solid var(--panel-border)',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                        position: 'relative', padding: 4, textAlign: 'center',
                      }}>
                        <button onClick={(e) => { e.stopPropagation(); setConfigItemId(item.id); }}
                          style={{ position: 'absolute', top: 3, left: 3, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
                          <MoreHorizontal size={13} />
                        </button>
                        {item.entityId && (
                          <div style={{ position: 'absolute', top: 3, right: 3 }}>
                            <Code2 size={9} color="#4caf50" />
                          </div>
                        )}
                        <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.2, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {item.name}
                        </span>
                        <div style={{ position: 'absolute', bottom: 3, right: 3, background: badgeColor, color: isWarn ? '#000' : '#fff', fontSize: 9, fontWeight: 700, padding: '1px 3px', borderRadius: 3 }}>
                          x{item.quantity}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Storage override (non-inventory) */}
            {caps.canStore && !selectedNode.data.inventory && (
              <div className="glass-panel" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Database size={16} color="var(--text-secondary)" />
                  <h4 style={{ margin: 0, fontWeight: 500 }}>Storage Override</h4>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                  Manually reconcile physical volume drift.
                </p>
                {isEditingOverride ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input type="number" value={overrideValue} onChange={(e) => setOverrideValue(Number(e.target.value))}
                      style={{ padding: 8, borderRadius: 6, border: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="primary" onClick={() => {
                        if (onUpdateNodeData && selectedNode) {
                          onUpdateNodeData(selectedNode.id, { value: overrideValue });
                          window.dispatchEvent(new CustomEvent('ha-toast', { detail: { message: `Updated ${selectedNode.data.label} to ${overrideValue} ${selectedNode.data.unit}` } }));
                        }
                        setIsEditingOverride(false);
                      }} style={{ flex: 1, padding: 8 }}>Save</button>
                      <button onClick={() => setIsEditingOverride(false)} style={{ flex: 1, padding: 8 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ flex: 1 }}>Sync & Verify</button>
                    <button className="primary" style={{ flex: 1 }} onClick={() => setIsEditingOverride(true)}>Set Override</button>
                  </div>
                )}
              </div>
            )}

            {/* Connections list */}
            {nodeEdges.length > 0 && (
              <div className="glass-panel" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Waypoints size={16} color="var(--text-secondary)" />
                  <h4 style={{ margin: 0, fontWeight: 500 }}>Connections</h4>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.08)', padding: '2px 7px', borderRadius: 20 }}>
                    {nodeEdges.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {nodeEdges.map((edge) => {
                    const isOutgoing  = edge.source === selectedNode.id;
                    const otherNodeId = isOutgoing ? edge.target : edge.source;
                    const otherNode   = nodes?.find((n) => n.id === otherNodeId);
                    const otherLabel  = otherNode?.data.label ?? otherNodeId;
                    return (
                      <button
                        key={edge.id}
                        onClick={() => onSelectEdge?.(edge.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%', padding: '10px 12px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--panel-border)',
                          borderRadius: 8, cursor: 'pointer',
                          color: 'var(--text-primary)', fontSize: 13,
                          transition: 'all 0.15s ease', textAlign: 'left',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
                      >
                        {isOutgoing
                          ? <ArrowRight size={13} color="#66bb6a" />
                          : <ArrowLeft  size={13} color="#42a5f5" />}
                        <span style={{ flex: 1 }}>{otherLabel}</span>
                        {edge.data?.flowVolume !== undefined && (
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            {edge.data.flowVolume}
                          </span>
                        )}
                        <ArrowRight size={12} color="var(--text-secondary)" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ NODE MODE — CONFIG TAB ═══ */}
        {mode === 'node' && selectedNode && !configItemId && activeTab === 'config' && (
          <>
            {/* HA Entities — editable */}
            <div className="glass-panel" style={{ padding: 16, borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Waypoints size={16} color="var(--text-secondary)" />
                <h4 style={{ margin: 0, fontWeight: 500 }}>Home Assistant Entities</h4>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                State objects tied to this node in HA.
              </p>
              <EntityList
                entities={nodeEntities}
                draft={nodeEntityDraft}
                setDraft={setNodeEntityDraft}
                onAdd={addNodeEntity}
                onRemove={removeNodeEntity}
              />
            </div>

            {/* Capabilities — interactive toggles */}
            <div className="glass-panel" style={{ padding: 16, borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Settings size={16} color="var(--text-secondary)" />
                <h4 style={{ margin: 0, fontWeight: 500 }}>Capabilities</h4>
              </div>
              {caps.canStore && (
                <p style={{ fontSize: 11, color: '#42a5f5', margin: '0 0 12px', background: 'rgba(66,165,245,0.1)', padding: '6px 10px', borderRadius: 6 }}>
                  ℹ Storage automatically implies Producer &amp; Consumer.
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([
                  { key: 'canProduce' as const, label: 'Producer', desc: 'Emits / generates resource', color: '#66bb6a' },
                  { key: 'canConsume' as const, label: 'Consumer', desc: 'Draws / uses resource',     color: '#ff7043' },
                  { key: 'canStore'   as const, label: 'Storage',  desc: 'Buffers / stores resource', color: '#42a5f5' },
                ]).map((c) => {
                  const enabled = caps[c.key];
                  return (
                    <button
                      key={c.key}
                      onClick={() => {
                        if (!onUpdateNodeData || !selectedNode) return;
                        onUpdateNodeData(selectedNode.id, {
                          capabilities: { ...caps, [c.key]: !enabled },
                        });
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        cursor: 'pointer', textAlign: 'left',
                        background: enabled ? `${c.color}14` : 'rgba(255,255,255,0.03)',
                        border: enabled ? `1px solid ${c.color}55` : '1px solid var(--panel-border)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Toggle pill */}
                      <div style={{
                        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                        background: enabled ? c.color : 'rgba(255,255,255,0.12)',
                        position: 'relative', transition: 'background 0.2s ease',
                      }}>
                        <div style={{
                          position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%',
                          background: '#fff', transition: 'left 0.2s ease',
                          left: enabled ? 19 : 3,
                        }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: enabled ? c.color : 'var(--text-primary)' }}>{c.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actuator */}
            {selectedNode.data.actuator && (
              <div className="glass-panel" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Settings size={16} color="var(--text-secondary)" />
                  <h4 style={{ margin: 0, fontWeight: 500 }}>Actuator</h4>
                </div>
                {[
                  { label: 'Type',          value: selectedNode.data.actuator.type },
                  { label: 'Initial State', value: selectedNode.data.actuator.state ? 'On/Open' : 'Off/Closed' },
                ].map((r) => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.label}</span>
                    <strong style={{ fontSize: 13, textTransform: 'capitalize' }}>{r.value}</strong>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
