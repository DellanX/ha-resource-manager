import { mockHubs } from '../data/mockData';
import type { ResourceType } from '../types';
import { Zap, Droplets, Flame, Package, AlertTriangle } from 'lucide-react';

interface DashboardViewProps {
  onSelectHub: (hubId: string) => void;
}

export function DashboardView({ onSelectHub }: DashboardViewProps) {
  
  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'electric': return <Zap color="var(--color-electric)" size={24} />;
      case 'water': return <Droplets color="var(--color-water)" size={24} />;
      case 'gas': return <Flame color="var(--color-gas)" size={24} />;
      case 'stock': return <Package color="var(--color-stock)" size={24} />;
    }
  };

  return (
    <div style={{ padding: '32px', height: '100%', overflowY: 'auto' }}>
      
      {/* High level macro summary */}
      <div className="glass-panel" style={{ 
        padding: '24px', 
        marginBottom: '32px', 
        display: 'flex', 
        justifyContent: 'space-around',
        borderRadius: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>Ingress Cost (24h)</p>
          <h2 style={{ margin: 0, fontSize: '32px', color: '#ef4444' }}>$12.40</h2>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>Egress/Value (24h)</p>
          <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--color-stock)' }}>-$3.98</h2>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>Net Cost (24h)</p>
          <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--text-primary)' }}>$8.42</h2>
        </div>
      </div>

      <h2 style={{ marginBottom: '24px', fontWeight: 500 }}>Resource Hubs</h2>
      
      {/* Hub Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        {mockHubs.map(hub => (
          <div 
            key={hub.id} 
            className="glass-card" 
            style={{ padding: '24px', cursor: 'pointer', position: 'relative' }}
            onClick={() => onSelectHub(hub.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '12px', 
                  background: `var(--color-${hub.primaryResource}-glow)` 
                }}>
                  {getResourceIcon(hub.primaryResource)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{hub.name}</h3>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {hub.primaryResource} Hub
                  </span>
                </div>
              </div>
              {hub.status === 'alert' && (
                <AlertTriangle color="#ef4444" size={24} />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Ingress</p>
                <p style={{ margin: 0, fontWeight: 600 }}>{hub.ingressTotal24h} {hub.unit}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Egress</p>
                <p style={{ margin: 0, fontWeight: 600 }}>{hub.egressTotal24h} {hub.unit}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
