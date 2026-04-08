import React, { useState } from 'react';
import { Handle, Position, useReactFlow, useStore, type NodeProps } from 'reactflow';
import { Icon } from '@mdi/react';
import { mdiLightningBolt, mdiWater, mdiPackageVariant, mdiFire, mdiPower, mdiDatabase, mdiChevronUp, mdiChevronDown, mdiAlert } from '@mdi/js';
import type { ResourceType } from '../../types';

export function StorageNode({ id, data }: NodeProps) {
  // Simple bar fill math
  const maxCap = 100;
  const fillPercentage = Math.min(100, Math.max(0, (data.value / maxCap) * 100));

  const [actuatorState, setActuatorState] = useState(data.actuator?.state || false);
  const { setNodes } = useReactFlow();

  const handleActuatorClick = (e: React.MouseEvent) => {
    if (!data.actuator) return;
    e.stopPropagation();
    const newState = !actuatorState;
    setActuatorState(newState);

    setNodes((nds) => nds.map(n => 
      n.id === id ? { ...n, data: { ...n.data, actuator: { ...n.data.actuator, state: newState } } } : n
    ));

    window.dispatchEvent(new CustomEvent('ha-toast', { 
      detail: { message: `Requested ${data.label} to turn ${newState ? 'ON' : 'OFF'}` } 
    }));
  };
  
  const getIconPath = (type: ResourceType) => {
    if (data.customIcon) return data.customIcon;
    if (data.actuator) return mdiPower;
    switch (type) {
      case 'electric': return mdiLightningBolt;
      case 'water': return mdiWater;
      case 'gas': return mdiFire;
      case 'stock': return mdiPackageVariant;
      default: return mdiDatabase;
    }
  };

  const isInteractive = !!data.actuator;
  const iconColor = (isInteractive && !actuatorState) ? 'var(--text-secondary)' : `var(--color-${data.type})`;

  const edges = useStore((s) => s.edges);
  const ingress = edges.filter(e => e.target === id).reduce((acc, e) => acc + (e.data?.flowVolume || 0), 0);
  const egress = edges.filter(e => e.source === id).reduce((acc, e) => acc + (e.data?.flowVolume || 0), 0);
  const netFlow = ingress - egress;

  let etaText = '';
  if (data.type !== 'stock' && netFlow !== 0) {
      const maxAbs = data.maxCapacity || 100;
      const currentAbs = data.unit === '%' ? maxAbs * (data.value / 100) : data.value;

      const formatTime = (totalHours: number) => {
        const h = Math.floor(Math.abs(totalHours));
        const m = Math.floor((Math.abs(totalHours) - h) * 60);
        const s = Math.floor(((Math.abs(totalHours) - h) * 60 - m) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      };

      if (netFlow > 0) {
        const remainingAbs = maxAbs - currentAbs;
        const hours = remainingAbs / netFlow;
        etaText = `~${formatTime(hours)}`;
      } else {
        const hours = currentAbs / Math.abs(netFlow);
        etaText = `~${formatTime(hours)}`;
      }
  }

  let hasWarnings = false;
  let hasSevereWarnings = false;
  let warnItems: any[] = [];
  let severeItems: any[] = [];

  if (data.inventory) {
    data.inventory.forEach((item: any) => {
      if (item.targetQuantity !== undefined) {
        if (item.quantity < item.targetQuantity) {
          hasSevereWarnings = true;
          severeItems.push(item);
        } else if (item.quantity <= item.targetQuantity * 1.2) {
          hasWarnings = true;
          warnItems.push(item);
        }
      }
    });
  }

  return (
    <div className="glass-panel" style={{
      padding: '16px',
      borderRadius: '12px',
      minWidth: '200px',
      minHeight: '130px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      borderTop: `4px solid ${iconColor}`,
      opacity: (isInteractive && !actuatorState) ? 0.7 : 1,
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ border: 'none', background: iconColor, width: '10px', height: '10px' }} />
      <Handle type="source" position={Position.Right} style={{ border: 'none', background: iconColor, width: '10px', height: '10px' }} />
      
      {/* Absolute Top-Right Warning */}
      {data.inventory && (hasWarnings || hasSevereWarnings) && (
        <div className="custom-tooltip-container" style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', color: hasSevereWarnings ? '#f44336' : '#ffeb3b' }}>
          <Icon path={mdiAlert} size={0.8} color={hasSevereWarnings ? '#f44336' : '#ffeb3b'} />
          <div className="custom-tooltip-text" style={{ whiteSpace: 'pre-line', textAlign: 'left', minWidth: '150px', zIndex: 9999, top: '24px', left: 'auto', right: 0, transform: 'none' }}>
            {severeItems.length > 0 && <strong style={{ color: '#f44336', display: 'block', marginBottom: '4px' }}>Low Stock:</strong>}
            {severeItems.map((i, idx) => <span key={idx} style={{display:'block'}}>• {i.name} ({i.quantity}/{i.targetQuantity})</span>)}
            {warnItems.length > 0 && <strong style={{ color: '#ffeb3b', display: 'block', marginTop: severeItems.length > 0 ? '8px' : 0, marginBottom: '4px' }}>Nearing Target:</strong>}
            {warnItems.map((i, idx) => <span key={idx} style={{display:'block'}}>• {i.name} ({i.quantity}/{i.targetQuantity})</span>)}
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div 
          onClick={handleActuatorClick}
          style={{ 
            padding: '6px', 
            borderRadius: '8px', 
            background: (isInteractive && !actuatorState) ? 'rgba(255,255,255,0.05)' : `var(--color-${data.type}-glow)`,
            cursor: isInteractive ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <Icon path={getIconPath(data.type)} size={1} color={iconColor} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{data.label}</h4>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Storage</span>
        </div>
      </div>

      {/* Progress Bar Container - Hidden for Stock */}
      {!data.inventory && (
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ 
            height: '100%', 
            width: `${fillPercentage}%`, 
            background: `var(--color-${data.type})`,
            boxShadow: `0 0 8px var(--color-${data.type})`
          }} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{data.inventory ? 'Contents' : 'Capacity'}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
            {data.inventory ? `${data.inventory.length} Categories` : `${data.value} ${data.unit}`}
          </strong>
          {data.type !== 'stock' && netFlow !== 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: netFlow > 0 ? '#4caf50' : '#f44336' }}>
              <Icon path={netFlow > 0 ? mdiChevronUp : mdiChevronDown} size={0.6} />
              <span style={{ fontSize: '12px', fontWeight: 500, fontFamily: 'monospace' }}>{etaText}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
