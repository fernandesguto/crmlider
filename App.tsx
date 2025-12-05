import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { Leads } from './pages/Leads';
import { Tasks } from './pages/Tasks';
import { PublicPage } from './pages/PublicPage';
import { Users } from './pages/Users';
import { Login } from './pages/Login';
import { SetupModal } from './components/SetupModal';
import { checkConfiguration } from './services/supabaseClient';

const MainLayout: React.FC = () => {
  const { currentView, currentUser } = useApp();

  if (!currentUser) {
      return <Login />;
  }

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
  // Estado local para saber se está configurado
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
      // Verifica configuração ao montar
      const configured = checkConfiguration();
      setIsConfigured(configured);
      setChecking(false);
  }, []);

  const handleConfigurationSuccess = () => {
      setIsConfigured(true);
  };

  if (checking) return null;

  // Se não estiver configurado, mostra o modal
  if (!isConfigured) {
    return <SetupModal onSuccess={handleConfigurationSuccess} />;
  }

  // Se estiver configurado, carrega o contexto da aplicação (que vai pedir Login se necessário)
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;