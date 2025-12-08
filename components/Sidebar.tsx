
import React from 'react';
import { LayoutDashboard, Building2, Users, CheckSquare, LogOut, UserCircle, Settings, Globe, Key, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ViewState, LeadStatus } from '../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentView, setCurrentView, currentUser, currentAgency, logout, leads } = useApp();

  // Safety check
  if (!currentUser) return null;

  // Conta leads com status 'Novo'
  const newLeadsCount = leads ? leads.filter(l => l.status === LeadStatus.NEW).length : 0;

  const NavItem = ({ view, icon: Icon, label, badge }: { view: ViewState, icon: any, label: string, badge?: number }) => (
    <button
      onClick={() => {
          setCurrentView(view);
          onClose(); // Fecha o menu no mobile ao clicar
      }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
        currentView === view ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            currentView === view ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
        }`}>
            {badge}
        </span>
      )}
    </button>
  );

  const handleLogout = (e: React.MouseEvent) => {
      e.preventDefault();
      logout();
  }

  return (
    <>
        {/* Overlay para Mobile */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
                onClick={onClose}
            />
        )}

        {/* Sidebar Container */}
        <div className={`
            fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-30 transition-transform duration-300 ease-in-out w-64
            ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0
        `}>
            {/* Header Sidebar */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-center min-h-[88px] max-h-[88px] relative">
                {currentAgency?.logoUrl ? (
                    <img 
                        src={currentAgency.logoUrl} 
                        alt={currentAgency.name} 
                        className="max-h-16 w-auto max-w-full object-contain block" 
                    />
                ) : (
                    <div className="flex items-center justify-center space-x-2 w-full">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="text-white" size={20} />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">ImobERP</h1>
                    </div>
                )}
                
                {/* Botão Fechar Mobile */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
                <NavItem view="PROPERTIES" icon={Building2} label="Imóveis" />
                <NavItem view="RENTALS" icon={Key} label="Locações" />
                <NavItem view="LEADS" icon={Users} label="Leads & Clientes" badge={newLeadsCount} />
                <NavItem view="TASKS" icon={CheckSquare} label="Tarefas" />
                <NavItem view="USERS" icon={UserCircle} label="Equipe" />
                <NavItem view="SETTINGS" icon={Settings} label="Configurações" />
                
                <div className="pt-4 mt-4 border-t border-slate-100">
                    <button
                    onClick={() => { setCurrentView('PUBLIC'); onClose(); }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors duration-200"
                    >
                    <Globe size={20} />
                    <span className="font-medium">Ver Site Público</span>
                    </button>
                </div>
            </nav>

            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center space-x-2 px-1">
                <img
                    src={currentUser.avatarUrl}
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.role}</p>
                </div>
                
                <div className="flex space-x-1">
                    <button 
                        type="button"
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition p-2 rounded-lg ml-auto" 
                        title="Sair do Sistema"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
                </div>
            </div>
        </div>
    </>
  );
};
