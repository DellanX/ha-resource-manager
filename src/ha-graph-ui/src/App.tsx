import { useState, useEffect } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { DashboardView } from './views/DashboardView';
import { HubGraphView } from './views/HubGraphView';
import type { ViewState } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activeHubId, setActiveHubId] = useState<string | null>(null);

  const handleNavigateToHub = (hubId: string) => {
    setActiveHubId(hubId);
    setCurrentView('hubGraph');
  };

  const handleNavigateToDashboard = () => {
    setActiveHubId(null);
    setCurrentView('dashboard');
  };

  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent<{ hubId: string }>;
      handleNavigateToHub(customEvent.detail.hubId);
    };
    window.addEventListener('ha-navigate', handleNav);
    return () => window.removeEventListener('ha-navigate', handleNav);
  }, []);

  return (
    <AppLayout 
      currentView={currentView} 
      onNavigateHome={handleNavigateToDashboard}
    >
      {currentView === 'dashboard' ? (
        <DashboardView onSelectHub={handleNavigateToHub} />
      ) : (
        <HubGraphView hubId={activeHubId} />
      )}
    </AppLayout>
  );
}

export default App;
