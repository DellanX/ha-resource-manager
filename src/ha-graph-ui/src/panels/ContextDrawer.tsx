import { useState, useEffect } from 'react';
import { X, Settings, Database, Activity, Code2, Waypoints, Info, MoreHorizontal, ArrowLeft } from 'lucide-react';
import type { Node, Edge } from 'reactflow';

interface ContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: Node | null;
  edges?: Edge[];
  onUpdateNodeData?: (id: string, data: any) => void;
}

export function ContextDrawer({ isOpen, onClose, selectedNode, edges, onUpdateNodeData }: ContextDrawerProps) {
  const [activeTab, setActiveTab] = useState<'live'|'config'>('live');
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [overrideValue, setOverrideValue] = useState<number>(0);
  const [configItemId, setConfigItemId] = useState<string | null>(null);

  // Reset local state when selected node changes
  useEffect(() => {
    setIsEditingOverride(false);
    setConfigItemId(null);
    if (selectedNode) setOverrideValue(selectedNode.data.value);
  }, [selectedNode]);

  if (!isOpen) return null;

  let ingress = 0;
  let egress = 0;
  
  if (selectedNode && edges) {
    ingress = edges.filter(e => e.target === selectedNode.id).reduce((s, e) => s + (e.data?.flowVolume || 0), 0);
    egress = edges.filter(e => e.source === selectedNode.id).reduce((s, e) => s + (e.data?.flowVolume || 0), 0);
  }
  
  const netFlow = ingress - egress;
  let etaText = "Standing by";
  
  if (selectedNode && selectedNode.type === 'storage') {
    if (netFlow !== 0) {
      // 1. Absolute Max Capacity
      const maxAbs = selectedNode.data.maxCapacity || 100;
      
      // 2. Absolute Current Capacity
      const currentAbs = selectedNode.data.unit === '%' 
        ? maxAbs * (selectedNode.data.value / 100) 
        : selectedNode.data.value;

      const formatTime = (totalHours: number) => {
        const h = Math.floor(Math.abs(totalHours));
        const m = Math.floor((Math.abs(totalHours) - h) * 60);
        const s = Math.floor(((Math.abs(totalHours) - h) * 60 - m) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      };

      if (netFlow > 0) {
        const remainingAbs = maxAbs - currentAbs;
        const hours = remainingAbs / netFlow;
        etaText = `Full in ~${formatTime(hours)}`;
      } else {
        const hours = currentAbs / Math.abs(netFlow);
        etaText = `Empty in ~${formatTime(hours)}`;
      }
    }
  }

  // Derive the ingress/egress rate string natively from physical capacity units (e.g. kWh -> kW, Ah -> A)
  const rateUnit = selectedNode?.data.capacityUnit ? selectedNode.data.capacityUnit.replace(/h$/i, '') : 'units/h';

  const valueLabel = selectedNode?.type === 'storage' ? 'Optimistic Estimate' : 
                     selectedNode?.type === 'producer' ? 'Live Output' : 'Live Draw';

  return (
    <div style={{
      position: 'absolute',
      right: isOpen ? 0 : '-400px',
      top: 0,
      bottom: 0,
      width: '380px',
      background: 'rgba(20, 20, 22, 0.95)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid var(--panel-border)',
      transition: 'right 0.3s ease',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '24px 24px 0', borderBottom: '1px solid var(--panel-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontWeight: 500 }}>
            {selectedNode ? selectedNode.data.label : 'Node Settings'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', padding: '8px' }}>
            <X size={20} />
          </button>
        </div>
        
        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '-1px' }}>
          <button 
            onClick={() => setActiveTab('live')}
            style={{ 
              background: 'transparent', border: 'none', borderRadius: 0, padding: '8px 16px',
              borderBottom: activeTab === 'live' ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: activeTab === 'live' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'live' ? 600 : 400
            }}
          >
            Live State
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            style={{ 
              background: 'transparent', border: 'none', borderRadius: 0, padding: '8px 16px',
              borderBottom: activeTab === 'config' ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: activeTab === 'config' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'config' ? 600 : 400
            }}
          >
            Configuration
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
        {!selectedNode ? (
          <p style={{ color: 'var(--text-secondary)' }}>Select a node to view its configuration.</p>
        ) : configItemId && selectedNode.data.inventory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {(() => {
              const item = selectedNode.data.inventory.find((i: any) => i.id === configItemId);
              if (!item) return null;
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => setConfigItemId(null)} 
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <h4 style={{ margin: 0, fontSize: '18px' }}>{item.name} Configuration</h4>
                  </div>
                  
                  <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current Quantity</label>
                      <input 
                        type="number" 
                        defaultValue={item.quantity} 
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Target Quantity</label>
                      <input 
                        type="number" 
                        defaultValue={item.targetQuantity || ''} 
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} 
                        placeholder="Optional target"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Home Assistant Entity ID</label>
                      <input 
                        type="text" 
                        defaultValue={item.entityId || ''} 
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontFamily: 'monospace' }} 
                        placeholder="e.g. sensor.beans"
                      />
                    </div>
                    
                    <button 
                      className="primary" 
                      onClick={() => setConfigItemId(null)}
                      style={{ padding: '10px', marginTop: '8px', width: '100%' }}
                    >
                      Save Configuration
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        ) : activeTab === 'live' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Shopping List / Recipe Checkout UI */}
            {(selectedNode.type === 'producer' || selectedNode.type === 'consumer') && selectedNode.data.inventory && (
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: `1px solid var(--color-${selectedNode.data.type})` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Database size={18} color={`var(--color-${selectedNode.data.type})`} />
                  <h4 style={{ margin: 0, fontWeight: 500 }}>{selectedNode.type === 'producer' ? 'Checkout Action' : 'Requirements List'}</h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {selectedNode.data.inventory.map((item: any) => (
                     <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.name}</span>
                       <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                         <input type="number" defaultValue={item.quantity} style={{ width: '60px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', color: '#fff', padding: '6px', borderRadius: '6px', textAlign: 'right' }} />
                         <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '30px' }}>{item.unit}</span>
                       </div>
                     </div>
                  ))}
                </div>
                <button 
                  className="primary" 
                  style={{ width: '100%', padding: '10px', background: `var(--color-${selectedNode.data.type})`, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                     window.dispatchEvent(new CustomEvent('ha-toast', { detail: { message: `Executed Action: ${selectedNode.data.label}!` } }));
                     onClose();
                  }}
                >
                  Confirm Execution
                </button>
              </div>
            )}

            {/* Status Section */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Activity size={18} color="var(--text-secondary)" />
                <h4 style={{ margin: 0, fontWeight: 500 }}>Live State</h4>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{selectedNode.data.inventory ? 'Inventory Type' : valueLabel}</span>
                <strong style={{ fontSize: '18px', color: `var(--color-${selectedNode.data.type})` }}>
                  {selectedNode.data.inventory ? 'Nested Structure' : `${selectedNode.data.value} ${selectedNode.data.unit}`}
                </strong>
              </div>
              
              {selectedNode.type === 'storage' && !selectedNode.data.inventory && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ingress Rate</span>
                    <span>{ingress} {rateUnit}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Egress Rate</span>
                    <span>{egress} {rateUnit}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Estimated Time</span>
                      <div className="custom-tooltip-container">
                        <Info size={14} color="var(--text-secondary)" />
                        <div className="custom-tooltip-text">
                          ETA is calculated using absolute capacity ({selectedNode.data.maxCapacity} {selectedNode.data.capacityUnit}) and current net flow rate.
                        </div>
                      </div>
                    </div>
                    <strong style={{ color: netFlow !== 0 ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                      {etaText}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Type Specific Context Actions */}
            {selectedNode.type === 'storage' && (
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Database size={18} color="var(--text-secondary)" />
                  <h4 style={{ margin: 0, fontWeight: 500 }}>Inventory / Storage</h4>
                </div>

                {selectedNode.data.inventory ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                    {selectedNode.data.inventory.map((item: any) => {
                      const isLow = item.targetQuantity !== undefined && item.quantity < item.targetQuantity;
                      const isWarn = item.targetQuantity !== undefined && !isLow && item.quantity <= item.targetQuantity * 1.2;
                      const badgeColor = isLow ? '#f44336' : isWarn ? '#ffeb3b' : `var(--color-${selectedNode.data.type})`;

                      return (
                      <div 
                        key={item.id} 
                        style={{ 
                          background: 'rgba(255,255,255,0.05)', 
                          aspectRatio: '1/1',
                          borderRadius: '8px', 
                          border: '1px solid var(--panel-border)', 
                          display: 'flex', 
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          position: 'relative',
                          padding: '4px',
                          textAlign: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Hover/Absolute "..." Settings Button */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfigItemId(item.id); }}
                          style={{ position: 'absolute', top: '4px', left: '4px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
                          title="Configure Item"
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {/* Linked Entity Icon (Top Right) */}
                        {item.entityId && (
                          <div style={{ position: 'absolute', top: '4px', right: '4px' }}>
                            {item.entityType === 'counter' ? <Activity size={10} color="#ff9800" /> : <Code2 size={10} color="#4caf50" />}
                          </div>
                        )}

                        <span style={{ fontSize: '11px', fontWeight: 500, lineHeight: 1.2, width: '100%', wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {item.name}
                        </span>
                        
                        {/* Quantity Badge (Bottom Right) */}
                        <div style={{ 
                          position: 'absolute', 
                          bottom: '4px', 
                          right: '4px', 
                          background: badgeColor, 
                          color: isWarn ? '#000' : '#fff', 
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 4px',
                          borderRadius: '4px'
                        }}>
                          x{item.quantity}
                        </div>
                      </div>
                    )})}
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      Manually reconcile physical volume drift.
                    </p>
                    {isEditingOverride ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input 
                          type="number" 
                          value={overrideValue} 
                          onChange={(e) => setOverrideValue(Number(e.target.value))}
                          style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }} 
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="primary" 
                            onClick={() => {
                              if (onUpdateNodeData && selectedNode) {
                                onUpdateNodeData(selectedNode.id, { value: overrideValue });
                                window.dispatchEvent(new CustomEvent('ha-toast', { detail: { message: `Updated ${selectedNode.data.label} to ${overrideValue} ${selectedNode.data.unit}` } }));
                              }
                              setIsEditingOverride(false);
                            }}
                            style={{ flex: 1, padding: '8px 16px' }}
                          >Save</button>
                          <button onClick={() => setIsEditingOverride(false)} style={{ flex: 1, padding: '8px 16px' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ flex: 1 }}>Sync & Verify</button>
                        <button className="primary" style={{ flex: 1 }} onClick={() => setIsEditingOverride(true)}>Set Override</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          // Configuration Tab Content
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Entity Binding */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Waypoints size={18} color="var(--text-secondary)" />
                <h4 style={{ margin: 0, fontWeight: 500 }}>Home Assistant Entities</h4>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                The underlying state objects tied this node diagram.
              </p>
              
              {selectedNode.data.entities && selectedNode.data.entities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedNode.data.entities.map((ent: string) => (
                    <div key={ent} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Code2 size={14} color="var(--accent-color)" /> {ent}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No exact entities bound. Data is simulated or aggregated.
                </div>
              )}
            </div>

            {/* Actuator Configuration */}
            {selectedNode.data.actuator && (
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Settings size={18} color="var(--text-secondary)" />
                  <h4 style={{ margin: 0, fontWeight: 500 }}>Actuator Settings</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Type</span>
                  <strong style={{ fontSize: '14px', textTransform: 'capitalize' }}>{selectedNode.data.actuator.type}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Initial State</span>
                  <strong style={{ fontSize: '14px' }}>{selectedNode.data.actuator.state ? 'On/Open' : 'Off/Closed'}</strong>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
