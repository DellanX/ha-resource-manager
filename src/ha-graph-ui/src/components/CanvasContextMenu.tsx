import React, { useEffect, useRef } from 'react';
import { PlusCircle, Maximize2, LayoutGrid } from 'lucide-react';

interface CanvasContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAddNode: () => void;
  onFitView: () => void;
}

export function CanvasContextMenu({ x, y, onClose, onAddNode, onFitView }: CanvasContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    {
      icon: <PlusCircle size={15} />,
      label: 'Add Node',
      onClick: () => { onAddNode(); onClose(); },
      disabled: false,
    },
    {
      icon: <Maximize2 size={15} />,
      label: 'Fit View',
      onClick: () => { onFitView(); onClose(); },
      disabled: false,
    },
    {
      icon: <LayoutGrid size={15} />,
      label: 'Auto Layout',
      onClick: () => {},
      disabled: true,
    },
  ];

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: y,
        left: x,
        zIndex: 150,
        background: 'rgba(20,20,24,0.97)',
        border: '1px solid var(--panel-border)',
        borderRadius: 10,
        padding: '6px 0',
        minWidth: 180,
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i === 2 && (
            <div style={{ height: 1, background: 'var(--panel-border)', margin: '4px 0' }} />
          )}
          <button
            onClick={item.disabled ? undefined : item.onClick}
            disabled={item.disabled}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 16px',
              background: 'transparent', border: 'none',
              fontSize: 13, fontWeight: 500,
              color: item.disabled ? 'var(--text-secondary)' : 'var(--text-primary)',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.45 : 1,
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => { if (!item.disabled) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {item.icon} {item.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
