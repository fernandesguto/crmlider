import React from 'react';
import { useApp } from '../context/AppContext';
import { UserCircle, Mail, Shield } from 'lucide-react';

export const Users: React.FC = () => {
  const { users } = useApp();

  return (
    <div className="p-8 h-screen overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Equipe</h1>
        <p className="text-slate-500">Corretores e Administradores cadastrados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
            <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100" />
            <div>
              <h3 className="font-bold text-lg text-slate-800">{user.name}</h3>
              <div className="flex items-center text-slate-500 text-sm mt-1">
                <Mail size={12} className="mr-1" />
                {user.email}
              </div>
              <div className="flex items-center text-slate-500 text-sm mt-1">
                <Shield size={12} className="mr-1" />
                <span className={user.role === 'Admin' ? 'text-blue-600 font-semibold' : ''}>{user.role}</span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Mock Add User Button */}
        <button className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 transition cursor-not-allowed" title="Funcionalidade em desenvolvimento">
           <UserCircle size={40} className="mb-2" />
           <span className="font-medium">Adicionar Membro</span>
        </button>
      </div>
    </div>
  );
};
