
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, LeadStatus, Property } from '../types';
import { Phone, Mail, Clock, Search, Plus, Edit, X, Save, Trash2, Filter, MapPin, BedDouble, Bath, Square, MessageCircle, Share2, ChevronDown } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const Leads: React.FC = () => {
  const context = useApp() as any; // Cast para any resolve o erro de cascata do unknown
  
  const leads: any[] = context.leads || [];
  const properties: any[] = context.properties || [];
  const { addLead, updateLead, deleteLead, updateLeadInterestStatus, currentAgency } = context;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [propertyFilter, setPropertyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
  const [viewProperty, setViewProperty] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any | null>(null);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    phone: '',
    type: 'Buyer',
    source: '',
    status: LeadStatus.NEW,
    interestedInPropertyIds: [],
    interests: [],
    notes: ''
  });

  const leadSources = [
      'Indicação', 'Site', 'Instagram', 'Facebook', 'Google Ads', 'Facebook Ads', 'WhatsApp', 'Passante/Loja', 'Outros'
  ];

  const getInterestStatus = (lead: any, propId: string) => {
      const interest = lead.interests?.find((i: any) => i.propertyId === propId);
      return interest?.status || lead.status || LeadStatus.NEW;
  };

  const filteredLeads = leads
    .filter((lead: any) => {
        const matchesSearch = (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || (lead.interests?.some((i: any) => i.status === statusFilter)) || (lead.status === statusFilter);
        const interestedIn = lead.interestedInPropertyIds || [];
        const matchesProperty = !propertyFilter || interestedIn.includes(propertyFilter);
        const matchesType = !typeFilter || lead.type === typeFilter;
        const matchesSource = !sourceFilter || lead.source === sourceFilter;
        return matchesSearch && matchesStatus && matchesProperty && matchesType && matchesSource;
    })
    .sort((a: any, b: any) => {
        if (a.status === LeadStatus.NEW && b.status !== LeadStatus.NEW) return -1;
        if (a.status !== LeadStatus.NEW && b.status === LeadStatus.NEW) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  const clearFilters = () => {
      setSearchTerm(''); setStatusFilter(''); setPropertyFilter(''); setTypeFilter(''); setSourceFilter('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case LeadStatus.NEW: return 'bg-green-100 text-green-700 border-green-200';
      case LeadStatus.CONTACTED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case LeadStatus.VISITING: return 'bg-purple-100 text-purple-700 border-purple-200';
      case LeadStatus.NEGOTIATION: return 'bg-orange-100 text-orange-700 border-orange-200';
      case LeadStatus.CLOSED: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case LeadStatus.LOST: return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleOpenCreate = () => {
      setFormData({ name: '', email: '', phone: '', type: 'Buyer', source: '', status: LeadStatus.NEW, interestedInPropertyIds: [], interests: [], notes: '' });
      setIsEditing(false); setShowModal(true); setIsPropertyDropdownOpen(false);
  };

  const handleOpenEdit = (lead: any) => {
      setFormData({ ...lead, interests: lead.interests || [] });
      setIsEditing(true); setShowModal(true); setIsPropertyDropdownOpen(false);
  };

  const handleDeleteClick = (lead: any) => {
      setLeadToDelete(lead); setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if (leadToDelete) await deleteLead(leadToDelete.id);
      setDeleteModalOpen(false); setLeadToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    if (isEditing && formData.id) {
        await updateLead(formData);
    } else {
        await addLead({ ...formData, id: Date.now().toString(), createdAt: new Date().toISOString(), agencyId: currentAgency?.id || '' });
    }
    setShowModal(false);
  };

  const addPropertyInterest = (propertyId: string) => {
      const interested = formData.interestedInPropertyIds || [];
      if (!interested.includes(propertyId)) {
          const newInterests = [...(formData.interests || []), { propertyId, status: LeadStatus.NEW, updatedAt: new Date().toISOString() }];
          setFormData({ ...formData, interestedInPropertyIds: [...interested, propertyId], interests: newInterests });
      }
  };

  const removePropertyInterest = (propertyId: string) => {
      setFormData({ 
          ...formData, 
          interestedInPropertyIds: (formData.interestedInPropertyIds || []).filter((id: any) => id !== propertyId),
          interests: (formData.interests || []).filter((i: any) => i.propertyId !== propertyId)
      });
  };

  const updateInterestStatusInForm = (propId: string, newStatus: string) => {
      const currentInterests = [...(formData.interests || [])];
      const idx = currentInterests.findIndex((i: any) => i.propertyId === propId);
      if (idx >= 0) currentInterests[idx] = { ...currentInterests[idx], status: newStatus, updatedAt: new Date().toISOString() };
      setFormData({ ...formData, interests: currentInterests });
  };

  const getInterestedProperties = (ids: string[]) => properties.filter(p => ids.includes(p.id));
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="p-4 md:p-8 h-screen overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div><h1 className="text-2xl md:text-3xl font-bold text-slate-800">Gerenciamento de Leads</h1><p className="text-slate-500 text-sm md:text-base">Acompanhe potenciais clientes e vendas</p></div>
        <button onClick={handleOpenCreate} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition shadow-md"><Plus size={20} /> <span>Novo Lead</span></button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-500"><Search className="text-slate-400 mr-2" size={18} /><input type="text" placeholder="Buscar por nome..." className="w-full bg-transparent py-2.5 outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <select className="bg-slate-50 border border-slate-300 text-sm rounded-lg p-2.5 outline-none" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="">Todos os Tipos</option><option value="Buyer">Comprador</option><option value="Seller">Proprietário</option></select>
            <select className="bg-slate-50 border border-slate-300 text-sm rounded-lg p-2.5 outline-none" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}><option value="">Todas Origens</option>{leadSources.map(src => <option key={src} value={src}>{src}</option>)}</select>
            <select className="bg-slate-50 border border-slate-300 text-sm rounded-lg p-2.5 outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">Todos Status</option>{Object.values(LeadStatus).map(status => <option key={status} value={status}>{status}</option>)}</select>
            {(searchTerm || statusFilter || propertyFilter || typeFilter || sourceFilter) && <button onClick={clearFilters} className="flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 rounded-lg transition text-sm py-2.5"><X size={16} /> <span>Limpar</span></button>}
        </div>
      </div>
      <div className="space-y-4">
        {filteredLeads.map((lead: any) => {
          const interestedIn = lead.interestedInPropertyIds || [];
          return (
            <div key={lead.id} className={`rounded-xl shadow-sm border p-4 md:p-6 flex flex-col lg:flex-row justify-between items-start group transition-all ${lead.status === LeadStatus.NEW && interestedIn.length === 0 ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200'}`}>
                <div className="flex-1 w-full min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2"><h3 className="text-lg font-bold text-slate-800 truncate">{lead.name}</h3><span className={`px-2 py-0.5 rounded text-xs font-semibold ${lead.type === 'Buyer' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>{lead.type === 'Buyer' ? 'Comprador' : 'Proprietário'}</span></div>
                    <div className="flex flex-col sm:flex-row gap-4 text-sm text-slate-500 mb-3"><div className="flex items-center space-x-1 truncate"><Mail size={14} /> <span>{lead.email || 'Sem email'}</span></div><div className="flex items-center space-x-1"><Phone size={14} /> <span>{lead.phone || 'Sem fone'}</span></div></div>
                    {interestedIn.length > 0 && <div className="mt-4"><div className="flex flex-wrap gap-2">{getInterestedProperties(interestedIn).map((p: any) => { const status = getInterestStatus(lead, p.id); return ( <div key={p.id} onClick={() => setViewProperty(p)} className="flex items-stretch text-xs bg-white border border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-sm transition"><div className="px-2 py-1.5 flex items-center gap-2 border-r border-slate-100"><img src={p.images?.[0] || 'https://via.placeholder.com/100'} className="w-8 h-8 rounded object-cover" alt="" /><span className="truncate max-w-[150px]">{p.title}</span></div><div className={`px-3 py-2 font-bold ${getStatusColor(status)}`}>{status}</div></div> ); })}</div></div>}
                </div>
                <div className="flex items-center gap-2 w-full lg:w-auto mt-4 lg:mt-0 justify-end">
                    {lead.phone && <a href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} target="_blank" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center"><MessageCircle size={16} className="mr-2"/> WhatsApp</a>}
                    <button onClick={() => handleOpenEdit(lead)} className="p-2 text-slate-400 hover:text-blue-600 border rounded-lg"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteClick(lead)} className="p-2 text-slate-400 hover:text-red-600 border rounded-lg"><Trash2 size={18} /></button>
                </div>
            </div>
          );
        })}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400"><X size={24}/></button>
            <h2 className="text-xl font-bold mb-6 text-slate-900">{isEditing ? 'Editar Lead' : 'Novo Lead'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Nome Completo</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3" /></div>
                  <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3" /></div>
                  <div><label className="block text-sm font-medium mb-1">Telefone</label><input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3" /></div>
              </div>
              <div className="border-t pt-4">
                 <label className="block text-sm font-bold mb-2">Interesses</label>
                 <button type="button" onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)} className="w-full border p-2.5 rounded-lg flex justify-between text-sm"><span>+ Adicionar Imóvel...</span><ChevronDown size={16}/></button>
                 {isPropertyDropdownOpen && <div className="bg-white border rounded-xl mt-1 max-h-40 overflow-y-auto">{properties.filter(p => !formData.interestedInPropertyIds?.includes(p.id)).map(p => <div key={p.id} onClick={() => { addPropertyInterest(p.id); setIsPropertyDropdownOpen(false); }} className="p-2 hover:bg-slate-50 cursor-pointer text-sm border-b">{p.title}</div>)}</div>}
                 <div className="mt-2 space-y-2">{getInterestedProperties(formData.interestedInPropertyIds || []).map((p: any) => { const interest = (formData.interests || []).find((i: any) => i.propertyId === p.id) || {}; return ( <div key={p.id} className="bg-slate-50 p-2 rounded-lg flex items-center justify-between border text-sm"><span>{p.title}</span><div className="flex gap-2"><select value={interest.status || LeadStatus.NEW} onChange={(e) => updateInterestStatusInForm(p.id, e.target.value)} className="border rounded text-xs p-1">{Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}</select><button type="button" onClick={() => removePropertyInterest(p.id)} className="text-red-500"><X size={16}/></button></div></div> ); })}</div>
              </div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-600">Cancelar</button><button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg">Salvar</button></div>
            </form>
          </div>
        </div>
      )}
      {viewProperty && <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-xl w-full max-w-lg overflow-hidden"><div className="h-56 bg-slate-200"><img src={viewProperty.images?.[0]} className="w-full h-full object-cover" alt="" /></div><div className="p-6"><h3 className="text-xl font-bold mb-4">{viewProperty.title}</h3><p className="text-2xl font-bold text-blue-600 mb-6">{formatCurrency(viewProperty.price || 0)}</p><button onClick={() => setViewProperty(null)} className="w-full bg-slate-100 py-2 rounded-lg">Fechar</button></div></div></div>}
      <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Excluir Lead" message="Deseja excluir permanentemente?" confirmText="Excluir" />
    </div>
  );
};
