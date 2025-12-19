
import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { Leads } from './pages/Leads';
import { Tasks } from './pages/Tasks';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Rentals } from './pages/Rentals';
import { Sales } from './pages/Sales';
import { CommissionManager } from './pages/CommissionManager';
import { PublicPage } from './pages/PublicPage';
import { SuperAdmin } from './pages/SuperAdmin';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { SetupModal } from './components/SetupModal';
import { checkConfiguration } from './services/supabaseClient';
import { NotificationModal } from './components/NotificationModal';
import { AiMatching } from './pages/AiMatching';
import { Menu, Building2 } from 'lucide-react';
import { Lead, Property } from './types';

const ThemeController = () => {
    const { themeColor, darkMode } = useApp();

    useEffect(() => {
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
        }
        
        const darken = (hex: string, amount: number = 20) => {
            const rgb = hexToRgb(hex);
            if (!rgb) return hex;
            const r = Math.max(0, rgb.r - amount);
            const g = Math.max(0, rgb.g - amount);
            const b = Math.max(0, rgb.b - amount);
            return `rgb(${r},${g},${b})`;
        }

        const darkColor = darken(themeColor);

        const styles = `
            :root { --primary: ${themeColor}; --primary-dark: ${darkColor}; }
            .bg-blue-600 { background-color: var(--primary) !important; }
            .hover\\:bg-blue-700:hover { background-color: var(--primary-dark) !important; }
            .text-blue-600 { color: var(--primary) !important; }
            .border-blue-600 { border-color: var(--primary) !important; }
            .ring-blue-500:focus { --tw-ring-color: var(--primary) !important; }
            .bg-blue-50 { background-color: ${themeColor}15 !important; }
            .border-blue-100 { border-color: ${themeColor}30 !important; }
            .text-blue-700 { color: var(--primary-dark) !important; }
            ${darkMode ? `
                body { background-color: #0f172a !important; color: #e2e8f0 !important; }
                .bg-white { background-color: #1e293b !important; color: #f8fafc !important; }
                .bg-slate-50 { background-color: #0f172a !important; }
                .text-slate-900, .text-slate-800 { color: #f8fafc !important; }
                .text-slate-600, .text-slate-500 { color: #94a3b8 !important; }
                .border-slate-200, .border-slate-300, .border-slate-100 { border-color: #334155 !important; }
                .hover\\:bg-slate-100:hover { background-color: #334155 !important; }
                input, select, textarea { background-color: #1e293b !important; border-color: #475569 !important; color: white !important; }
            ` : ''}
        `;

        const styleId = 'imob-theme-styles';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        styleEl.innerHTML = styles;

    }, [themeColor, darkMode]);

    return null;
}

const MainLayout: React.FC = () => {
  const { currentView, currentUser, notificationTask, notificationLead, dismissNotification, toggleTaskCompletion, leads, properties, setCurrentView, currentAgency } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (currentView === 'LANDING') return <LandingPage />;

  if (!currentUser) {
      if (currentView === 'PUBLIC') return <><ThemeController /><PublicPage /></>;
      return <Login />;
  }

  if (currentView === 'PUBLIC') {
      return (
          <>
            <ThemeController />
            <PublicPage />
          </>
      )
  }

  const taskLead = notificationTask && notificationTask.leadId ? (leads as Lead[]).find(l => l.id === notificationTask.leadId) : undefined;
  const leadPropertyInterest = notificationLead && notificationLead.interestedInPropertyIds?.length > 0 
      ? (properties as Property[]).find(p => p.id === notificationLead.interestedInPropertyIds[0]) 
      : undefined;

  const handleDismiss = () => {
      dismissNotification();
      if (notificationLead) {
          setCurrentView('LEADS');
      }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 transition-colors duration-200 flex-col md:flex-row">
      <ThemeController />
      
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center space-x-2">
                {currentAgency?.logoUrl ? (
                    <img src={currentAgency.logoUrl} className="h-8 w-auto object-contain" alt="Logo" />
                ) : (
                    <div className="flex items-center text-blue-600">
                        <Building2 size={24} />
                        <span className="font-bold ml-2 text-slate-800">ImobERP</span>
                    </div>
                )}
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
          </button>
      </div>

      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      <main className="flex-1 md:ml-64 w-full">
        {currentView === 'DASHBOARD' && <Dashboard />}
        {currentView === 'PROPERTIES' && <Properties />}
        {currentView === 'RENTALS' && <Rentals />}
        {currentView === 'SALES' && <Sales />}
        {currentView === 'COMMISSIONS' && <CommissionManager />}
        {currentView === 'LEADS' && <Leads />}
        {currentView === 'TASKS' && <Tasks />}
        {currentView === 'USERS' && <Users />}
        {currentView === 'SETTINGS' && <Settings />}
        {currentView === 'SUPER_ADMIN' && <SuperAdmin />}
        {currentView === 'AI_MATCHING' && <AiMatching />}
      </main>

      {notificationTask && (
          <NotificationModal 
              task={notificationTask} 
              relatedLead={taskLead}
              onDismiss={dismissNotification}
              onComplete={toggleTaskCompletion}
          />
      )}

      {notificationLead && !notificationTask && (
          <NotificationModal 
              lead={notificationLead} 
              relatedProperty={leadPropertyInterest}
              onDismiss={handleDismiss}
          />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
      const configured = checkConfiguration();
      setIsConfigured(configured);
      setChecking(false);
      console.log("Sistema TSX carregado com sucesso.");
  }, []);

  const handleConfigurationSuccess = () => setIsConfigured(true);

  if (checking) return null;
  if (!isConfigured) return <SetupModal onSuccess={handleConfigurationSuccess} />;

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
