import React, { useState } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from 'reactflow';
import { Icon } from '@mdi/react';
import { mdiLightningBolt, mdiWater, mdiPackageVariant, mdiFire, mdiPower } from '@mdi/js';
import type { ResourceType } from '../../types';

export function ConsumerNode({ id, data }: NodeProps) {
  const [actuatorState, setActuatorState] = useState(data.actuator?.state || false);
  const { setNodes } = useReactFlow();
  
  const isInteractive = !!data.actuator;
  const isActive = data.actuator?.type === 'button' ? true : (data.actuator ? actuatorState : true);
  
  // Disable dynamic output metric dimming if it's just a button trigger
  const displayValue = data.actuator?.type === 'button' ? data.value : (!isActive ? 0 : data.value);

  const handleActuatorClick = (e: React.MouseEvent) => {
    if (!data.actuator) return;

    if (data.actuator.type === 'button') {
      // Let it bubble up to `reactflow` so it clicks the node wrapper and formally opens the Drawer natively
      return;
    }

    e.stopPropagation();

    const newState = !actuatorState;
    setActuatorState(newState);

    // Sync to global reactflow node database so edges can see it
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
      default: return mdiLightningBolt;
    }
  };

  const iconColor = isActive ? `var(--color-${data.type})` : 'var(--text-secondary)';
  
  return (
    <div className="glass-panel" style={{
      padding: '16px',
      borderRadius: '12px',
      minWidth: '200px',
      minHeight: '130px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      borderRight: `4px solid ${iconColor}`,
      opacity: isActive ? 1 : 0.7
    }}>
      <Handle type="target" position={Position.Left} style={{ border: 'none', background: iconColor, width: '10px', height: '10px' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div 
          onClick={handleActuatorClick}
          style={{ 
            padding: '8px', 
            borderRadius: '8px', 
            background: data.actuator?.type === 'button' ? `var(--color-${data.type})` : (!isActive ? 'rgba(255,255,255,0.05)' : `var(--color-${data.type}-glow)`),
            cursor: isInteractive ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.1s ease',
            color: data.actuator?.type === 'button' ? '#fff' : iconColor,
            boxShadow: data.actuator?.type === 'button' ? `0 4px 12px var(--color-${data.type}-glow)` : 'none',
          }}
          onMouseDown={(e) => {
            if (data.actuator?.type === 'button') {
              (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.9)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }
          }}
          onMouseUp={(e) => {
            if (data.actuator?.type === 'button') {
              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 12px var(--color-${data.type}-glow)`;
            }
          }}
          onMouseLeave={(e) => {
            if (data.actuator?.type === 'button') {
              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 12px var(--color-${data.type}-glow)`;
            }
          }}
        >
          <Icon path={getIconPath(data.type)} size={1.2} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{data.label}</h4>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Consumer</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Draw</span>
          <strong style={{ fontSize: '16px', color: isActive ? `var(--color-${data.type})` : 'var(--text-secondary)' }}>
            {displayValue} {data.unit}
          </strong>
        </div>
        {data.nestedHubId && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('ha-navigate', { detail: { hubId: data.nestedHubId } }));
            }}
            style={{
              marginTop: '10px', 
              padding: '6px', 
              fontSize: '11px', 
              fontWeight: 600,
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.06)', 
              color: 'var(--text-primary)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
            }}
          >
            Enter Sub-Hub →
          </button>
        )}
      </div>
    </div>
  );
}
