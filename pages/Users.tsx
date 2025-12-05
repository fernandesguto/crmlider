import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserCircle, Mail, Shield, Plus, X, Edit } from 'lucide-react';
import { User } from '../types';

export const Users: React.FC = () => {
  const { users, currentUser, createAgencyUser, updateUser } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State para criar e editar
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
      name: '',
      email: '',
      password: '',
      role: 'Broker'
  });

  const isAdmin = currentUser?.role === 'Admin';

  const openCreateModal = () => {
      setFormData({ name: '', email: '', password: '', role: 'Broker' });
      setIsEditing(false);
      setShowModal(true);
  };

  const openEditModal = (user: User) => {
      setFormData({ 
          id: user.id,
          name: user.name, 
          email: user.email, 
          password: user.password, 
          role: user.role 
      });
      setIsEditing(true);
      setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      
      let success = false;
      if (isEditing && formData.id) {
          // Precisamos do objeto completo User, então fundimos com o original se necessário, 
          // mas como temos o ID, o AppContext sabe o que fazer (ou o DB).
          // No DB service, ele usa o ID para update.
          // Porém o type precisa bater.
          // Vamos buscar o usuário original para garantir campos como avatarUrl, agencyId
          const original = users.find(u => u.id === formData.id);
          if (original) {
              success = await updateUser({
                  ...original,
                  name: formData.name!,
                  email: formData.email!,
                  password: formData.password!,
                  role: formData.role!
              });
          }
      } else {
          success = await createAgencyUser(formData);
      }
      
      if (success) {
          setShowModal(false);
      } else {
          alert('Erro ao salvar usuário.');
      }
      setIsSaving(false);
  };

  return (
    <div className="p-8 h-screen overflow-y-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Equipe</h1>
            <p className="text-slate-500">Corretores e Administradores cadastrados</p>
        </div>
        {isAdmin && (
            <button 
                onClick={openCreateModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition"
            >
                <Plus size={20} />
                <span>Adicionar Membro</span>
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between group">
            <div className="flex items-center space-x-4">
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
            {isAdmin && (
                <button 
                    onClick={() => openEditModal(user)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                >
                    <Edit size={18} />
                </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal Adicionar/Editar Usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
                <button 
                    onClick={() => setShowModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>
                
                <h2 className="text-xl font-bold mb-6 text-slate-900">
                    {isEditing ? 'Editar Usuário' : 'Novo Membro da Equipe'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                        <input 
                            required 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Acesso</label>
                        <input 
                            required 
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                        <input 
                            required 
                            type="text" // Visualização direta para admin
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Permissão</label>
                        <select 
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value as 'Admin' | 'Broker'})}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2"
                        >
                            <option value="Broker">Corretor (Broker)</option>
                            <option value="Admin">Administrador</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button 
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSaving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Usuário')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};