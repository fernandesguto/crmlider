import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, LeadStatus, Property } from '../types';
import { Phone, Mail, Clock, Home, Search, Plus, Edit, X, Save, Trash2 } from 'lucide-react';

export const Leads: React.FC = () => {
  const { leads, addLead, updateLead, updateLeadStatus, properties, currentAgency } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    email: '',
    phone: '',
    type: 'Buyer',
    status: LeadStatus.NEW,
    interestedInPropertyIds: [],
    notes: ''
  });

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.NEW: return 'bg-blue-100 text-blue-700';
      case LeadStatus.CONTACTED: return 'bg-yellow-100 text-yellow-700';
      case LeadStatus.VISITING: return 'bg-purple-100 text-purple-700';
      case LeadStatus.NEGOTIATION: return 'bg-orange-100 text-orange-700';
      case LeadStatus.CLOSED: return 'bg-green-100 text-green-700';
      case LeadStatus.LOST: return 'bg-slate-100 text-slate-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleOpenCreate = () => {
      setFormData({ 
          name: '', email: '', phone: '', type: 'Buyer', 
          status: LeadStatus.NEW, interestedInPropertyIds: [], notes: '' 
      });
      setIsEditing(false);
      setShowModal(true);
  };

  const handleOpenEdit = (lead: Lead) => {
      setFormData({ ...lead });
      setIsEditing(true);
      setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (isEditing && formData.id) {
        // Update
        await updateLead(formData as Lead);
    } else {
        // Create
        addLead({
            id: Date.now().toString(),
            name: formData.name!,
            email: formData.email!,
            phone: formData.phone || '',
            type: formData.type as 'Buyer' | 'Seller' || 'Buyer',
            status: formData.status as LeadStatus || LeadStatus.NEW,
            interestedInPropertyIds: formData.interestedInPropertyIds || [],
            notes: formData.notes || '',
            createdAt: new Date().toISOString(),
            agencyId: currentAgency?.id || ''
        });
    }
    setShowModal(false);
  };

  const addPropertyInterest = (propertyId: string) => {
      if (!propertyId) return;
      if (!formData.interestedInPropertyIds?.includes(propertyId)) {
          setFormData(prev => ({
              ...prev,
              interestedInPropertyIds: [...(prev.interestedInPropertyIds || []), propertyId]
          }));
      }
  };

  const removePropertyInterest = (propertyId: string) => {
      setFormData(prev => ({
          ...prev,
          interestedInPropertyIds: prev.interestedInPropertyIds?.filter(id => id !== propertyId)
      }));
  };

  const getInterestedProperties = (ids: string[]) => {
    return properties.filter(p => ids.includes(p.id));
  };

  return (
    <div className="p-8 h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Gerenciamento de Leads</h1>
           <p className="text-slate-500">Acompanhe potenciais clientes e vendas</p>
        </div>
        <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <Plus size={20} /> <span>Novo Lead</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-4 flex items-center">
        <Search className="text-slate-400 mr-3" size={20} />
        <input
          type="text"
          placeholder="Buscar leads por nome ou email..."
          className="flex-1 outline-none text-slate-900 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredLeads.map(lead => (
          <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center group">
            <div className="flex-1 w-full">
              <div className="flex justify-between md:justify-start items-center space-x-3 mb-2">
                <h3 className="text-lg font-bold text-slate-800">{lead.name}</h3>
                <div className="flex space-x-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${lead.type === 'Buyer' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                    {lead.type === 'Buyer' ? 'Comprador' : 'Proprietário'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(lead.status)}`}>
                    {lead.status}
                    </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <div className="flex items-center space-x-1"><Mail size={14} /> <span>{lead.email}</span></div>
                <div className="flex items-center space-x-1"><Phone size={14} /> <span>{lead.phone}</span></div>
                <div className="flex items-center space-x-1"><Clock size={14} /> <span>{new Date(lead.createdAt).toLocaleDateString()}</span></div>
              </div>
              
              {/* Resumo de Interesses */}
              {lead.interestedInPropertyIds.length > 0 && (
                <div className="mt-3 flex items-center space-x-2 overflow-x-auto">
                  <span className="text-xs font-medium text-slate-500 flex items-center flex-shrink-0"><Home size={12} className="mr-1"/> Interesse:</span>
                  {getInterestedProperties(lead.interestedInPropertyIds).map(p => (
                     <span key={p.id} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded truncate max-w-[150px]">
                       {p.title}
                     </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 md:mt-0 flex items-center space-x-3 w-full md:w-auto justify-end">
              <select
                value={lead.status}
                onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              >
                {Object.values(LeadStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              
              <button 
                onClick={() => handleOpenEdit(lead)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Editar Lead"
              >
                <Edit size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

       {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24}/></button>
            
            <h2 className="text-xl font-bold mb-6 text-slate-900 flex items-center">
                {isEditing ? <Edit size={24} className="mr-2 text-blue-600" /> : <Plus size={24} className="mr-2 text-blue-600" />}
                {isEditing ? 'Editar Lead' : 'Novo Lead'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input 
                        required 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Nome do cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input 
                        required 
                        type="email"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="cliente@email.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                    <input 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Cliente</label>
                    <select 
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value as any})} 
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="Buyer">Comprador</option>
                        <option value="Seller">Proprietário</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status Atual</label>
                    <select 
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value as any})} 
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {Object.values(LeadStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                  </div>
              </div>

              {/* Imóveis de Interesse */}
              <div className="border-t border-slate-100 pt-4">
                 <label className="block text-sm font-bold text-slate-800 mb-2">Imóveis de Interesse</label>
                 
                 <div className="flex items-center space-x-2 mb-3">
                    <select 
                       className="flex-1 bg-white text-slate-900 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                       onChange={(e) => {
                          addPropertyInterest(e.target.value);
                          e.target.value = ""; // Reset select
                       }}
                    >
                        <option value="">+ Adicionar Imóvel à lista...</option>
                        {properties
                            .filter(p => !formData.interestedInPropertyIds?.includes(p.id))
                            .map(p => (
                            <option key={p.id} value={p.id}>{p.title} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p.price)}</option>
                        ))}
                    </select>
                 </div>

                 {formData.interestedInPropertyIds && formData.interestedInPropertyIds.length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                         {getInterestedProperties(formData.interestedInPropertyIds).map(p => (
                             <div key={p.id} className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-lg text-sm flex items-center shadow-sm">
                                 <Home size={14} className="mr-1.5 opacity-70" />
                                 <span className="mr-2 font-medium">{p.title}</span>
                                 <button 
                                    type="button"
                                    onClick={() => removePropertyInterest(p.id)}
                                    className="text-blue-400 hover:text-red-500 transition"
                                 >
                                     <X size={16} />
                                 </button>
                             </div>
                         ))}
                     </div>
                 ) : (
                     <p className="text-sm text-slate-400 italic">Nenhum imóvel selecionado.</p>
                 )}
              </div>

              {/* Observações */}
              <div className="border-t border-slate-100 pt-4">
                  <label className="block text-sm font-bold text-slate-800 mb-2">Observações Internas</label>
                  <textarea 
                    rows={4}
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed"
                    placeholder="Escreva detalhes sobre o perfil do cliente, horários de visita, preferências..."
                  />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center space-x-2"
                >
                    <Save size={18} />
                    <span>{isEditing ? 'Atualizar Lead' : 'Salvar Lead'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};