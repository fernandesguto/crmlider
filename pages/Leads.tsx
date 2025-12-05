import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, LeadStatus, Property } from '../types';
import { Phone, Mail, Clock, Home, Search, Plus } from 'lucide-react';

export const Leads: React.FC = () => {
  const { leads, addLead, updateLeadStatus, properties } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({ name: '', email: '', phone: '', type: 'Buyer', interestedInPropertyIds: [] });

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

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLead.name && newLead.email) {
      addLead({
        id: Date.now().toString(),
        name: newLead.name!,
        email: newLead.email!,
        phone: newLead.phone || '',
        type: newLead.type as 'Buyer' | 'Seller' || 'Buyer',
        status: LeadStatus.NEW,
        interestedInPropertyIds: newLead.interestedInPropertyIds || [],
        notes: '',
        createdAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setNewLead({ name: '', email: '', phone: '', type: 'Buyer', interestedInPropertyIds: [] });
    }
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
        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <Plus size={20} /> <span>Novo Lead</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-4 flex items-center">
        <Search className="text-slate-400 mr-3" size={20} />
        <input
          type="text"
          placeholder="Buscar leads por nome ou email..."
          className="flex-1 outline-none text-slate-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredLeads.map(lead => (
          <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-bold text-slate-800">{lead.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${lead.type === 'Buyer' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                  {lead.type === 'Buyer' ? 'Comprador' : 'Proprietário'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(lead.status)}`}>
                  {lead.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <div className="flex items-center space-x-1"><Mail size={14} /> <span>{lead.email}</span></div>
                <div className="flex items-center space-x-1"><Phone size={14} /> <span>{lead.phone}</span></div>
                <div className="flex items-center space-x-1"><Clock size={14} /> <span>{new Date(lead.createdAt).toLocaleDateString()}</span></div>
              </div>
              
              {/* Interested Properties */}
              {lead.interestedInPropertyIds.length > 0 && (
                <div className="mt-3 flex items-center space-x-2 overflow-x-auto">
                  <span className="text-xs font-medium text-slate-500 flex items-center"><Home size={12} className="mr-1"/> Interesse:</span>
                  {getInterestedProperties(lead.interestedInPropertyIds).map(p => (
                     <span key={p.id} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded truncate max-w-[150px]">
                       {p.title}
                     </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <select
                value={lead.status}
                onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              >
                {Object.values(LeadStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

       {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Adicionar Lead</h2>
            <form onSubmit={handleAddLead} className="space-y-4">
              <input required placeholder="Nome" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full border rounded p-2" />
              <input required placeholder="Email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full border rounded p-2" />
              <input placeholder="Telefone" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full border rounded p-2" />
              <select value={newLead.type} onChange={e => setNewLead({...newLead, type: e.target.value as any})} className="w-full border rounded p-2">
                <option value="Buyer">Comprador</option>
                <option value="Seller">Proprietário</option>
              </select>
              <div>
                <label className="text-sm font-medium text-slate-700">Interesse em (Selecione ID):</label>
                <select 
                   className="w-full border rounded p-2 mt-1" 
                   onChange={(e) => {
                      if(e.target.value) setNewLead({...newLead, interestedInPropertyIds: [e.target.value]})
                   }}
                >
                    <option value="">Nenhum imóvel específico</option>
                    {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
