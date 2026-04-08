import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { ResourceType, NodeCapabilities } from '../types';

interface AddNodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    label: string;
    resourceType: ResourceType;
    capabilities: NodeCapabilities;
    value: number;
    unit: string;
  }) => void;
}

const RESOURCE_OPTIONS: { type: ResourceType; label: string; color: string }[] = [
  { type: 'electric', label: 'Electric', color: 'var(--color-electric)' },
  { type: 'water',    label: 'Water',    color: 'var(--color-water)'    },
  { type: 'gas',      label: 'Gas',      color: 'var(--color-gas)'      },
  { type: 'stock',    label: 'Stock',    color: 'var(--color-stock)'    },
];

const DEFAULT_UNITS: Record<ResourceType, string> = {
  electric: 'kW',
  water:    'GPM',
  gas:      'CCF',
  stock:    'units',
};

export function AddNodeDialog({ isOpen, onClose, onAdd }: AddNodeDialogProps) {
  const [label,        setLabel]        = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('electric');
  const [canProduce,   setCanProduce]   = useState(false);
  const [canConsume,   setCanConsume]   = useState(true);
  const [canStore,     setCanStore]     = useState(false);

  if (!isOpen) return null;

  const isValid = label.trim().length > 0 && (canProduce || canConsume || canStore);

  const handleSubmit = () => {
    if (!isValid) return;
    onAdd({
      label:        label.trim(),
      resourceType,
      capabilities: { canProduce, canConsume, canStore },
      value:        0,
      unit:         DEFAULT_UNITS[resourceType],
    });
    // Reset
    setLabel(''); setResourceType('electric');
    setCanProduce(false); setCanConsume(true); setCanStore(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 200,
        }}
      />
      {/* Dialog */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 380, zIndex: 201,
        background: 'rgba(20,20,22,0.98)',
        border: '1px solid var(--panel-border)',
        borderRadius: 16,
        padding: 28,
        display: 'flex', flexDirection: 'column', gap: 20,
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>Add Node</h3>
          <button onClick={onClose} style={{ background: 'transparent', padding: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Label */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Label</label>
          <input
            autoFocus
            type="text"
            value={label}
            placeholder="e.g. Solar Array"
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            style={{
              padding: '9px 12px', borderRadius: 8, fontSize: 14,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--panel-border)',
              color: 'var(--text-primary)', outline: 'none',
            }}
          />
        </div>

        {/* Resource type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Resource Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {RESOURCE_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => setResourceType(opt.type)}
                style={{
                  padding: '8px 4px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  border: resourceType === opt.type ? `2px solid ${opt.color}` : '2px solid var(--panel-border)',
                  background: resourceType === opt.type ? `${opt.color}22` : 'rgba(255,255,255,0.04)',
                  color: resourceType === opt.type ? opt.color : 'var(--text-secondary)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Capabilities <span style={{ opacity: 0.6 }}>(select at least one)</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              { key: 'canProduce', label: 'Producer', desc: 'Emits / generates this resource',  color: '#66bb6a', checked: canProduce, set: setCanProduce },
              { key: 'canConsume', label: 'Consumer', desc: 'Draws / uses this resource',        color: '#ff7043', checked: canConsume, set: setCanConsume },
              { key: 'canStore',   label: 'Storage',  desc: 'Buffers / stores this resource',   color: '#42a5f5', checked: canStore,   set: setCanStore   },
            ] as const).map((cap) => (
              <label
                key={cap.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  background: cap.checked ? `${cap.color}14` : 'rgba(255,255,255,0.03)',
                  border: cap.checked ? `1px solid ${cap.color}55` : '1px solid var(--panel-border)',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={cap.checked}
                  onChange={(e) => (cap.set as React.Dispatch<React.SetStateAction<boolean>>)(e.target.checked)}
                  style={{ accentColor: cap.color, width: 15, height: 15 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: cap.checked ? cap.color : 'var(--text-primary)' }}>{cap.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{cap.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            cursor: isValid ? 'pointer' : 'not-allowed',
            background: isValid ? 'var(--accent-color)' : 'rgba(255,255,255,0.08)',
            color: isValid ? '#fff' : 'var(--text-secondary)',
            border: 'none', transition: 'all 0.15s ease',
          }}
        >
          <Plus size={16} /> Add Node
        </button>
      </div>
    </>
  );
}
