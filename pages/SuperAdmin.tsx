
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as DB from '../services/db';
import { Agency, User, Property } from '../types';
import { ShieldAlert, Building2, Users, Search, Trash2, Edit, Save, X, Activity, BarChart3, Home, Lock, Unlock, CheckCircle, Clock, Phone, Calendar, ExternalLink, LogIn } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const SuperAdmin: React.FC = () => {
    const { isSuperAdmin, setAgency, setCurrentView } = useApp();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'agencies' | 'users'>('agencies');
    
    // Data
    const [allAgencies, setAllAgencies] = useState<Agency[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allProperties, setAllProperties] = useState<Property[]>([]);

    // Edit User Modal
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'agency' | 'user', id: string, name: string } | null>(null);

    // Filter
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isSuperAdmin) {
            loadGlobalData();
        }
    }, [isSuperAdmin]);

    const loadGlobalData = async () => {
        setLoading(true);
        try {
            const agencies = await DB.getAll<Agency>('agencies');
            const users = await DB.getAll<User>('users');
            const properties = await DB.getAll<Property>('properties');
            
            setAllAgencies(agencies);
            setAllUsers(users);
            setAllProperties(properties);
        } catch (e) {
            console.error("Erro ao carregar dados globais", e);
        } finally {
            setLoading(false);
        }
    };

    const handleEnterAgency = (agency: Agency) => {
        setAgency(agency);
        setCurrentView('DASHBOARD');
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setNewPassword('');
        setShowEditModal(true);
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;
        try {
            await DB.updateItem('users', { 
                ...editingUser, 
                password: newPassword || editingUser.password 
            });
            alert('Usuário atualizado com sucesso!');
            setShowEditModal(false);
            loadGlobalData(); // Reload
        } catch (e) {
            alert('Erro ao atualizar usuário.');
        }
    };

    const handleDeleteClick = (type: 'agency' | 'user', id: string, name: string) => {
        setItemToDelete({ type, id, name });
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            if (itemToDelete.type === 'agency') {
                await DB.deleteItem('agencies', itemToDelete.id);
            } else {
                await DB.deleteItem('users', itemToDelete.id);
            }
            loadGlobalData();
        } catch (e: any) {
            alert(`Erro ao excluir: ${e.message}`);
        }
        setDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const toggleAgencyApproval = async (agency: Agency) => {
        try {
            const newStatus = !agency.isApproved;
            await DB.updateItem('agencies', { id: agency.id, isApproved: newStatus });
            // Atualiza localmente
            setAllAgencies(prev => prev.map(a => a.id === agency.id ? { ...a, isApproved: newStatus } : a));
        } catch (e) {
            alert('Erro ao atualizar status da agência.');
        }
    };

    // --- COMPUTED DATA ---
    
    // Stats Gerais
    const totalAgencies = allAgencies.length;
    const totalUsers = allUsers.length;
    const totalProperties = allProperties.length;
    const totalLogins = allUsers.reduce((acc, u) => acc + (u.loginCount || 0), 0);

    // Filtros
    const filteredAgencies = allAgencies.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredUsers = allUsers.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getAgencyAdminPhone = (agencyId: string) => {
        const admin = allUsers.find(u => u.agencyId === agencyId && u.role === 'Admin');
        return admin?.phone || 'N/A';
    };

    if (!isSuperAdmin) {
        return (
            <div className="p-8 h-screen flex flex-col items-center justify-center text-center">
                <ShieldAlert size={64} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800">Acesso Negado</h1>
                <p className="text-slate-500">Esta área é restrita ao Super Administrador.</p>
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Carregando dados globais...</div>;
    }

    return (
        <div className="p-8 h-screen overflow-y-auto bg-slate-50">
            <div className="mb-8 border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <ShieldAlert className="mr-3 text-red-600" size={32} />
                    Painel Master
                </h1>
                <p className="text-slate-500 mt-1">Gestão global de todas as imobiliárias e usuários do sistema.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                    <div className="bg-blue-100 text-blue-600 p-4 rounded-full"><Building2 size={24}/></div>
                    <div><p className="text-sm text-slate-500">Agências</p><h3 className="text-2xl font-bold text-slate-800">{totalAgencies}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                    <div className="bg-purple-100 text-purple-600 p-4 rounded-full"><Users size={24}/></div>
                    <div><p className="text-sm text-slate-500">Usuários</p><h3 className="text-2xl font-bold text-slate-800">{totalUsers}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                    <div className="bg-green-100 text-green-600 p-4 rounded-full"><Home size={24}/></div>
                    <div><p className="text-sm text-slate-500">Imóveis</p><h3 className="text-2xl font-bold text-slate-800">{totalProperties}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
                    <div className="bg-amber-100 text-amber-600 p-4 rounded-full"><Activity size={24}/></div>
                    <div><p className="text-sm text-slate-500">Total Logins</p><h3 className="text-2xl font-bold text-slate-800">{totalLogins}</h3></div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-100 flex items-center justify-between p-2 bg-slate-50">
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => setActiveTab('agencies')}
                            className={`px-6 py-3 rounded-lg text-sm font-bold transition flex items-center ${activeTab === 'agencies' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Building2 size={16} className="mr-2"/> Agências
                        </button>
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-3 rounded-lg text-sm font-bold transition flex items-center ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Users size={16} className="mr-2"/> Usuários Globais
                        </button>
                    </div>
                    
                    <div className="relative mr-4">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'agencies' ? (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Agência</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Contato Admin</th>
                                    <th className="px-6 py-3">Data Cadastro</th>
                                    <th className="px-6 py-3">Usuários/Imóveis</th>
                                    <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAgencies.map(agency => {
                                    const agencyUsers = allUsers.filter(u => u.agencyId === agency.id).length;
                                    const agencyProps = allProperties.filter(p => p.agencyId === agency.id).length;
                                    const isApproved = agency.isApproved;
                                    
                                    return (
                                        <tr key={agency.id} className="hover:bg-slate-50 group">
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                <button 
                                                    onClick={() => handleEnterAgency(agency)}
                                                    className="flex items-center space-x-3 hover:bg-slate-100 p-2 -ml-2 rounded-lg w-full text-left transition group border border-transparent hover:border-slate-200"
                                                    title="Clique para acessar o Dashboard desta Agência"
                                                >
                                                    {agency.logoUrl ? <img src={agency.logoUrl} className="w-10 h-10 object-contain rounded bg-slate-100 p-1" alt={agency.name}/> : <Building2 size={40} className="text-slate-300"/>}
                                                    <div className="flex flex-col">
                                                        <span className="group-hover:text-blue-600 transition font-bold text-base flex items-center">
                                                            {agency.name}
                                                            <LogIn size={14} className="ml-2 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity"/>
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-mono">{agency.id.substring(0,8)}...</span>
                                                    </div>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isApproved ? (
                                                    <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                                        <CheckCircle size={12} className="mr-1"/> Aprovado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                                        <Clock size={12} className="mr-1"/> Teste Ativo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center text-slate-700 font-medium">
                                                    <Phone size={14} className="mr-1.5 text-green-600"/>
                                                    <a href={`https://wa.me/55${getAgencyAdminPhone(agency.id).replace(/\D/g, '')}`} target="_blank" className="hover:underline">
                                                        {getAgencyAdminPhone(agency.id)}
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <div className="flex items-center">
                                                    <Calendar size={14} className="mr-1.5 text-slate-400" />
                                                    {agency.createdAt ? new Date(agency.createdAt).toLocaleDateString('pt-BR') : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                <span className="font-bold">{agencyUsers}</span> usrs • <span className="font-bold">{agencyProps}</span> imóveis
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center space-x-2">
                                                    <button 
                                                        onClick={() => toggleAgencyApproval(agency)}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded flex items-center transition ${
                                                            isApproved 
                                                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                                            : 'bg-green-600 text-white hover:bg-green-700'
                                                        }`}
                                                        title={isApproved ? "Bloquear acesso" : "Liberar acesso definitivo"}
                                                    >
                                                        {isApproved ? <><Lock size={14} className="mr-1"/> Bloquear</> : <><Unlock size={14} className="mr-1"/> Liberar Acesso</>}
                                                    </button>
                                                    <button onClick={() => handleDeleteClick('agency', agency.id, agency.name)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"><Trash2 size={18}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Nome / Email</th>
                                    <th className="px-6 py-3">Telefone</th>
                                    <th className="px-6 py-3">Imobiliária</th>
                                    <th className="px-6 py-3">Função</th>
                                    <th className="px-6 py-3">Logins</th>
                                    <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map(user => {
                                    const agency = allAgencies.find(a => a.id === user.agencyId);
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                                                        <p className="text-xs text-slate-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{user.phone || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{agency?.name || 'Desconhecida'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-1 text-sm font-mono text-slate-600">
                                                    <BarChart3 size={14} className="text-blue-500"/>
                                                    <span>{user.loginCount || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleEditUser(user)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded transition mr-2" title="Editar Senha"><Edit size={18}/></button>
                                                <button onClick={() => handleDeleteClick('user', user.id, user.name)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition" title="Excluir Usuário"><Trash2 size={18}/></button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal Editar Usuário */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
                        <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Edit className="mr-2 text-blue-600" size={20}/> Editar Usuário</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome</label>
                                <input value={editingUser.name} disabled className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-slate-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                                <input value={editingUser.email} disabled className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-slate-500 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nova Senha</label>
                                <input 
                                    type="text" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Digite para alterar..."
                                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                                <p className="text-xs text-slate-400 mt-1">Deixe em branco para manter a atual.</p>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={handleSaveUser} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition flex items-center">
                                <Save size={18} className="mr-2"/> Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={`Excluir ${itemToDelete?.type === 'agency' ? 'Imobiliária' : 'Usuário'}`}
                message={`Tem certeza que deseja excluir ${itemToDelete?.name}? ${itemToDelete?.type === 'agency' ? 'Isso apagará TODOS os usuários e imóveis desta agência.' : ''} Esta ação é irreversível.`}
                confirmText="Sim, Excluir"
                isDestructive
            />
        </div>
    );
};
