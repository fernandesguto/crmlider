import React from 'react';
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
import { isConfigured } from './services/supabaseClient';

const MainLayout: React.FC = () => {
  const { currentView, currentUser } = useApp();

  // Se o usuário não estiver logado, mostra a tela de Login
  // A exceção é se ele estiver tentando ver a página pública (opcional, aqui mantivemos o login fechado para o sistema)
  // Mas vamos permitir ver a Public Page mesmo sem login se o ViewState for PUBLIC_SITE (acessado via URL ou botão externo imaginário, mas aqui controlamos via estado)
  // Como o estado reseta no refresh, vamos forçar login primeiro.
  
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
  // Se não estiver configurado (URL e Key não encontrados), exibe o modal de setup
  if (!isConfigured) {
    return <SetupModal />;
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;