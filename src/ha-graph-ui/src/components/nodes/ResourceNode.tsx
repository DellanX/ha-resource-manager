import React, { useState } from 'react';
import { Handle, Position, useReactFlow, useStore, type NodeProps } from 'reactflow';
import { Icon } from '@mdi/react';
import {
  mdiLightningBolt, mdiWater, mdiPackageVariant, mdiFire,
  mdiPower, mdiDatabase, mdiAlert, mdiChevronUp, mdiChevronDown,
} from '@mdi/js';
import type { ResourceType, NodeCapabilities } from '../../types';

// Capability chip definitions
const CAP_CHIPS: Record<string, { label: string; bg: string; color: string }> = {
  canProduce: { label: 'Producer', bg: 'rgba(76,175,80,0.18)',  color: '#66bb6a' },
  canConsume:  { label: 'Consumer', bg: 'rgba(255,112,67,0.18)', color: '#ff7043' },
  canStore:    { label: 'Storage',  bg: 'rgba(66,165,245,0.18)', color: '#42a5f5' },
};

function getDefaultIcon(resourceType: ResourceType) {
  switch (resourceType) {
    case 'electric': return mdiLightningBolt;
    case 'water':    return mdiWater;
    case 'gas':      return mdiFire;
    case 'stock':    return mdiPackageVariant;
    default:         return mdiDatabase;
  }
}

export function ResourceNode({ id, data }: NodeProps) {
  // Capability fallback for legacy node types
  const caps: NodeCapabilities = data.capabilities ?? {
    canProduce: false,
    canConsume: false,
    canStore: false,
  };
  const resourceType: ResourceType = data.resourceType ?? data.type ?? 'electric';

  const [actuatorState, setActuatorState] = useState<boolean>(data.actuator?.state ?? true);
  const { setNodes } = useReactFlow();

  // Edge-derived net flow (used for storage ETA)
  const edges = useStore((s) => s.edges);
  const ingress = edges.filter((e) => e.target === id).reduce((acc, e) => acc + (e.data?.flowVolume ?? 0), 0);
  const egress  = edges.filter((e) => e.source === id).reduce((acc, e) => acc + (e.data?.flowVolume ?? 0), 0);
  const netFlow = ingress - egress;

  // ETA (only meaningful for non-stock storage)
  let etaText = '';
  if (caps.canStore && resourceType !== 'stock' && netFlow !== 0) {
    const maxAbs     = data.maxCapacity ?? 100;
    const currentAbs = data.unit === '%' ? maxAbs * (data.value / 100) : data.value;
    const fmt = (h: number) => {
      const hh = Math.floor(Math.abs(h));
      const mm = Math.floor((Math.abs(h) - hh) * 60);
      const ss = Math.floor(((Math.abs(h) - hh) * 60 - mm) * 60);
      return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    };
    etaText = netFlow > 0
      ? `~${fmt((maxAbs - currentAbs) / netFlow)}`
      : `~${fmt(currentAbs / Math.abs(netFlow))}`;
  }

  // Inventory warnings
  let hasSevere = false, hasWarn = false;
  const severeItems: any[] = [], warnItems: any[] = [];
  if (data.inventory) {
    (data.inventory as any[]).forEach((item) => {
      if (item.targetQuantity !== undefined) {
        if (item.quantity < item.targetQuantity)              { hasSevere = true; severeItems.push(item); }
        else if (item.quantity <= item.targetQuantity * 1.2) { hasWarn   = true; warnItems.push(item);  }
      }
    });
  }

  // Actuator click
  const handleActuatorClick = (e: React.MouseEvent) => {
    if (!data.actuator) return;
    if (data.actuator.type === 'button') return; // bubble to node click → drawer
    e.stopPropagation();
    const next = !actuatorState;
    setActuatorState(next);
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, actuator: { ...n.data.actuator, state: next } } } : n)
    );
    window.dispatchEvent(new CustomEvent('ha-toast', {
      detail: { message: `Requested ${data.label} to turn ${next ? 'ON' : 'OFF'}` },
    }));
  };

  const isTurnedOff  = !!data.actuator && data.actuator.type !== 'button' && !actuatorState;
  const accentColor  = isTurnedOff ? 'var(--text-secondary)' : `var(--color-${resourceType})`;
  const iconPath     = data.customIcon ?? (data.actuator ? mdiPower : getDefaultIcon(resourceType));
  const fillPct      = Math.min(100, Math.max(0, data.value));

  // Handle presence rules:
  //   target (left)  → anything that can receive flow
  //   source (right) → anything that can emit flow
  //   storage implies both
  const hasTarget = caps.canConsume || caps.canStore;
  const hasSource = caps.canProduce || caps.canStore;

  // Directional borders: left = receives flow, right = emits flow, top = stores
  const borderStyle: React.CSSProperties = {
    ...(hasTarget ? { borderLeft:  `4px solid ${accentColor}` } : {}),
    ...(hasSource ? { borderRight: `4px solid ${accentColor}` } : {}),
    ...(caps.canStore ? { borderTop: `2px solid rgba(66,165,245,0.35)` } : {}),
  };

  // Chip display: canStore implies both produce & consume, so just show "Storage".
  // For pure non-storage nodes, show whichever explicit caps are set.
  const activeChips: { label: string; bg: string; color: string }[] = caps.canStore
    ? [CAP_CHIPS.canStore]
    : (Object.keys(CAP_CHIPS) as (keyof typeof CAP_CHIPS)[])
        .filter((k) => caps[k as keyof NodeCapabilities])
        .map((k) => CAP_CHIPS[k]);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '14px 16px',
        borderRadius: '12px',
        minWidth: '210px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        opacity: isTurnedOff ? 0.7 : 1,
        position: 'relative',
        ...borderStyle,
      }}
    >
      {/* ── Handles ── */}
      {hasTarget && (
        <Handle type="target" position={Position.Left}
          style={{ border: 'none', background: accentColor, width: 10, height: 10 }} />
      )}
      {hasSource && (
        <Handle type="source" position={Position.Right}
          style={{ border: 'none', background: accentColor, width: 10, height: 10 }} />
      )}

      {/* ── Inventory warning badge ── */}
      {data.inventory && (hasSevere || hasWarn) && (
        <div
          className="custom-tooltip-container"
          style={{ position: 'absolute', top: 10, right: 10, color: hasSevere ? '#f44336' : '#ffeb3b' }}
        >
          <Icon path={mdiAlert} size={0.75} color={hasSevere ? '#f44336' : '#ffeb3b'} />
          <div
            className="custom-tooltip-text"
            style={{ whiteSpace: 'pre-line', textAlign: 'left', minWidth: 150, zIndex: 9999, top: 22, left: 'auto', right: 0, transform: 'none' }}
          >
            {severeItems.length > 0 && <strong style={{ color: '#f44336', display: 'block', marginBottom: 4 }}>Low Stock:</strong>}
            {severeItems.map((i, x) => <span key={x} style={{ display: 'block' }}>• {i.name} ({i.quantity}/{i.targetQuantity})</span>)}
            {warnItems.length > 0 && <strong style={{ color: '#ffeb3b', display: 'block', marginTop: severeItems.length ? 6 : 0, marginBottom: 4 }}>Nearing Target:</strong>}
            {warnItems.map((i, x) => <span key={x} style={{ display: 'block' }}>• {i.name} ({i.quantity}/{i.targetQuantity})</span>)}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Icon / Actuator button */}
        <div
          onClick={handleActuatorClick}
          style={{
            padding: 7,
            borderRadius: 8,
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: data.actuator ? 'pointer' : 'default',
            background: data.actuator?.type === 'button'
              ? `var(--color-${resourceType})`
              : isTurnedOff ? 'rgba(255,255,255,0.05)' : `var(--color-${resourceType}-glow)`,
            boxShadow: data.actuator?.type === 'button' ? `0 4px 12px var(--color-${resourceType}-glow)` : 'none',
            transition: 'all 0.15s ease',
          }}
          onMouseDown={(e) => { if (data.actuator?.type === 'button') (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.9)'; }}
          onMouseUp={(e)   => { if (data.actuator?.type === 'button') (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
          onMouseLeave={(e)=> { if (data.actuator?.type === 'button') (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
        >
          <Icon
            path={iconPath}
            size={1}
            color={data.actuator?.type === 'button' ? '#fff' : accentColor}
          />
        </div>

        {/* Label + capability chips */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.label}
          </h4>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
            {activeChips.length > 1
              ? activeChips.map((chip) => (
                  <span key={chip.label} style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
                    padding: '1px 5px', borderRadius: 4,
                    background: chip.bg, color: chip.color,
                  }}>{chip.label}</span>
                ))
              : <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {activeChips.length === 1 ? activeChips[0].label : 'Node'}
                </span>
            }
          </div>
        </div>
      </div>

      {/* ── Storage progress bar ── */}
      {caps.canStore && !data.inventory && (
        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${fillPct}%`,
            background: accentColor, boxShadow: `0 0 6px ${accentColor}`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* ── Primary metric row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {caps.canStore
            ? (data.inventory ? 'Contents' : 'Capacity')
            : caps.canProduce ? 'Output' : 'Draw'}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <strong style={{ fontSize: 15, color: caps.canStore ? 'var(--text-primary)' : (isTurnedOff ? 'var(--text-secondary)' : accentColor) }}>
            {data.inventory
              ? `${data.inventory.length} Categories`
              : `${isTurnedOff ? 0 : data.value} ${data.unit}`}
          </strong>
          {caps.canStore && !data.inventory && etaText && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, color: netFlow > 0 ? '#4caf50' : '#f44336' }}>
              <Icon path={netFlow > 0 ? mdiChevronUp : mdiChevronDown} size={0.55} />
              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 500 }}>{etaText}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Hub navigation button ── */}
      {data.nestedHubId && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('ha-navigate', { detail: { hubId: data.nestedHubId } }));
          }}
          style={{
            padding: '5px 8px', fontSize: 11, fontWeight: 600,
            borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s ease',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseOut={(e)  => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
        >
          {caps.canConsume ? 'Open Sub-Hub ↓' : 'Go to Source ↑'}
        </button>
      )}
    </div>
  );
}
