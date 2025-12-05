import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { Leads } from './pages/Leads';
import { Tasks } from './pages/Tasks';
import { PublicPage } from './pages/PublicPage';
import { Users } from './pages/Users';

const MainLayout: React.FC = () => {
  const { currentView } = useApp();

  // If Public Page is selected, render without sidebar layout
  if (currentView === 'PUBLIC_SITE') {
    return <PublicPage />;
  }

  // Admin/ERP Layout
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64">
        {currentView === 'DASHBOARD' && <Dashboard />}
        {currentView === 'PROPERTIES' && <Properties />}
        {currentView === 'LEADS' && <Leads />}
        {currentView === 'TASKS' && <Tasks />}
        {currentView === 'USERS' && <Users />}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
