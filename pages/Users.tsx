import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Shield, Plus, X, Edit, Trash2, Users as UsersIcon } from 'lucide-react';
import { User } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

export const Users: React.FC = () => {
  const { users, currentUser, createAgencyUser, updateUser, deleteUser } = useApp();
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

  // State para modal de delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const isAdmin = currentUser?.role === 'Admin';
  
  // Limite: 1 Admin + 3 Corretores = 4 Usuários no total
  const MAX_USERS_PER_AGENCY = 4;
  const isLimitReached = users.length >= MAX_USERS_PER_AGENCY;

  const openCreateModal = () => {
      if (isLimitReached) {
          alert("Número de corretores máximo já foi cadastrado.\n\nSeu plano permite até 3 corretores adicionais.");
          return;
      }
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

  const handleDeleteClick = (user: User) => {
      setUserToDelete(user);
      setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if (userToDelete) {
          const result = await deleteUser(userToDelete.id);
          if (!result.success) {
              // Mantém o alert apenas para o erro de feedback do servidor
              alert(result.message);
          }
      }
      setDeleteModalOpen(false);
      setUserToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      
      let result: { success: boolean; message?: string } = { success: false, message: '' };
      if (isEditing && formData.id) {
          const original = users.find(u => u.id === formData.id);
          if (original) {
              result = await updateUser({
                  ...original,
                  name: formData.name!,
                  email: formData.email!,
                  password: formData.password!,
                  role: formData.role!
              });
          }
      } else {
          result = await createAgencyUser(formData);
      }
      
      if (result.success) {
          setShowModal(false);
      } else {
          alert(result.message || 'Erro ao salvar usuário.');
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
            <div className="flex items-center space-x-4">
                <div className={`text-sm font-medium px-3 py-1 rounded-full border ${isLimitReached ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    <span className="font-bold">{users.length}</span> / {MAX_USERS_PER_AGENCY} Usuários
                </div>
                <button 
                    onClick={openCreateModal}
                    disabled={isLimitReached}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition shadow-sm ${
                        isLimitReached 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    title={isLimitReached ? "Limite de usuários atingido" : "Adicionar membro"}
                >
                    <Plus size={20} />
                    <span>Adicionar Membro</span>
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {users.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between group transition hover:shadow-md">
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
                <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition">
                    <button 
                        onClick={() => openEditModal(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar"
                    >
                        <Edit size={18} />
                    </button>
                    {/* Não permitir deletar a si mesmo */}
                    {user.id !== currentUser?.id && (
                        <button 
                            onClick={() => handleDeleteClick(user)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Excluir"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            )}
          </div>
        ))}
        
        {/* Placeholder Card se houver espaço */}
        {!isLimitReached && isAdmin && (
            <button 
                onClick={openCreateModal}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition cursor-pointer h-[124px]"
            >
                <Plus size={32} className="mb-2 opacity-50" />
                <span className="text-sm font-medium">Adicionar vaga</span>
            </button>
        )}
      </div>

      {/* Modal Adicionar/Editar Usuário */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
                <button 
                    onClick={() => setShowModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>
                
                <h2 className="text-xl font-bold mb-6 text-slate-900 flex items-center">
                    <UsersIcon className="mr-2 text-blue-600" size={24} />
                    {isEditing ? 'Editar Usuário' : 'Novo Membro da Equipe'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                        <input 
                            required 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Acesso</label>
                        <input 
                            required 
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                        <input 
                            required 
                            type="text" // Visualização direta para admin
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Permissão</label>
                        <select 
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value as 'Admin' | 'Broker'})}
                            className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="Broker">Corretor (Broker)</option>
                            <option value="Admin">Administrador</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button 
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                            {isSaving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Usuário')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Modal de Confirmação para Usuários */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Usuário"
        message={`Tem certeza que deseja remover o usuário ${userToDelete?.name}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir Usuário"
        isDestructive
      />
    </div>
  );
};