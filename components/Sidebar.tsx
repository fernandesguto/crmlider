import React from 'react';
import { LayoutDashboard, Building2, Users, CheckSquare, Globe, LogOut, UserCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ViewState } from '../types';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, currentUser } = useApp();

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
        currentView === view ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6 border-b border-slate-100 flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Building2 className="text-white" size={20} />
        </div>
        <h1 className="text-xl font-bold text-slate-800">ImobERP</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
        <NavItem view="PROPERTIES" icon={Building2} label="Imóveis" />
        <NavItem view="LEADS" icon={Users} label="Leads & Clientes" />
        <NavItem view="TASKS" icon={CheckSquare} label="Tarefas" />
        <NavItem view="USERS" icon={UserCircle} label="Usuários" />
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => setCurrentView('PUBLIC_SITE')}
          className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition mb-4"
        >
          <Globe size={18} />
          <span>Ver Site Público</span>
        </button>

        <div className="flex items-center space-x-3 px-2">
          <img
            src={currentUser.avatarUrl}
            alt="User"
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{currentUser.name}</p>
            <p className="text-xs text-slate-500 truncate">{currentUser.role}</p>
          </div>
          <button className="text-slate-400 hover:text-red-500">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
