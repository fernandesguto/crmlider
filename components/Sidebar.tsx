
import React from 'react';
import { LayoutDashboard, Building2, Users, CheckSquare, LogOut, UserCircle, Settings, Globe, Key, X, ShieldAlert, DollarSign, Sparkles, PieChart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ViewState, LeadStatus } from '../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentView, setCurrentView, currentUser, currentAgency, logout, leads, isSuperAdmin, pendingAgenciesCount } = useApp();

  if (!currentUser) return null;

  // Conta apenas leads com status NOVO que NÃO tenham imóveis de interesse vinculados
  const newLeadsCount = leads ? leads.filter(l => {
      const hasInterests = l.interestedInPropertyIds && l.interestedInPropertyIds.length > 0;
      return l.status === LeadStatus.NEW && !hasInterests;
  }).length : 0;

  const NavItem = ({ view, icon: Icon, label, badge, color }: { view: ViewState, icon: any, label: string, badge?: number, color?: string }) => (
    <button
      onClick={() => {
          setCurrentView(view);
          onClose(); 
      }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
        currentView === view ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
      } ${color ? color : ''}`}
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

  const handleOpenPublicSite = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('mode', 'public');
    window.open(url.toString(), '_blank');
    onClose();
  };

  return (
    <>
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
                onClick={onClose}
            />
        )}

        <div className={`
            fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-30 transition-transform duration-300 ease-in-out w-64
            ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0
        `}>
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
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">ImobERP</h1>
                            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">v2.1 (Online)</span>
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
                
                <button
                    onClick={() => { setCurrentView('AI_MATCHING'); onClose(); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${
                        currentView === 'AI_MATCHING' 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'text-purple-600 hover:bg-purple-50'
                    }`}
                >
                    <div className="flex items-center space-x-3">
                        <Sparkles size={20} className={currentView === 'AI_MATCHING' ? 'text-yellow-300' : 'text-purple-600'} />
                        <span className="font-medium">Consultor IA</span>
                    </div>
                </button>

                <NavItem view="PROPERTIES" icon={Building2} label="Imóveis" />
                <NavItem view="SALES" icon={DollarSign} label="Vendas" />
                <NavItem view="RENTALS" icon={Key} label="Locações" />
                <NavItem view="COMMISSIONS" icon={PieChart} label="Comissões" />
                <NavItem view="LEADS" icon={Users} label="Leads" badge={newLeadsCount} />
                <NavItem view="TASKS" icon={CheckSquare} label="Tarefas" />
                <NavItem view="USERS" icon={UserCircle} label="Equipe" />
                <NavItem view="SETTINGS" icon={Settings} label="Configurações" />
                
                {isSuperAdmin && (
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Administração</p>
                        <button
                            onClick={() => { setCurrentView('SUPER_ADMIN'); onClose(); }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
                                currentView === 'SUPER_ADMIN' ? 'bg-red-600 text-white shadow-md' : 'text-red-600 hover:bg-red-50'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <ShieldAlert size={20} />
                                <span className="font-medium">Painel Master</span>
                            </div>
                            {pendingAgenciesCount > 0 && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse ${
                                    currentView === 'SUPER_ADMIN' ? 'bg-white text-red-600' : 'bg-red-600 text-white'
                                }`}>
                                    {pendingAgenciesCount}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                <div className="pt-4 mt-4 border-t border-slate-100">
                    <button
                        onClick={handleOpenPublicSite}
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
