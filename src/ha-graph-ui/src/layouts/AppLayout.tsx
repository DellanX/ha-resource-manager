import React, { useState, useEffect } from 'react';
import { Home, Settings, Clock, Activity, Info } from 'lucide-react';
import type { ViewState } from '../types';

interface ToastMessage {
  id: string;
  message: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onNavigateHome: () => void;
}

export function AppLayout({ children, currentView, onNavigateHome }: AppLayoutProps) {
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      const newToast = { id: Math.random().toString(36).substr(2, 9), message: customEvent.detail.message };
      
      setToasts((prev) => [...prev, newToast]);
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter(t => t.id !== newToast.id));
      }, 10000);
    };

    window.addEventListener('ha-toast', handleToast);
    return () => window.removeEventListener('ha-toast', handleToast);
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header className="glass-panel" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid var(--panel-border)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={onNavigateHome}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              background: currentView === 'dashboard' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              border: 'none',
              padding: '8px 12px'
            }}
          >
            <Home size={20} />
            <span style={{ fontSize: '18px', fontWeight: 600 }}>ERP Monitor</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Global Mode Switcher */}
          <div className="glass-panel" style={{ display: 'flex', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            <button 
              onClick={() => setIsLiveMode(true)}
              style={{ 
                background: isLiveMode ? 'var(--accent-color)' : 'transparent', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                border: 'none'
              }}
            >
              <Activity size={16} /> Live
            </button>
            <button 
              onClick={() => setIsLiveMode(false)}
              style={{ 
                background: !isLiveMode ? 'var(--accent-color)' : 'transparent', 
                color: 'white',
                border: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px' 
              }}
            >
              <Clock size={16} /> History
            </button>
          </div>
          <button style={{ padding: '8px', borderRadius: '50%', background: 'transparent' }}>
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {children}
      </main>

      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <div key={toast.id} className="glass-panel" style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            animation: 'slideUp 0.3s ease forwards'
          }}>
            <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} color="var(--accent-color)" />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{toast.message}</span>
            </div>
            {/* The shrinking progress bar */}
            <div style={{ 
              position: 'absolute', bottom: 0, left: 0, height: '3px', background: 'var(--accent-color)',
              animation: 'progressShrink 10s linear forwards'
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}
