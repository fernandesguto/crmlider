
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, LeadStatus, Property } from '../types';
import { Phone, Mail, Clock, Search, Plus, Edit, X, Save, Trash2, Filter, MapPin, BedDouble, Bath, Square, MessageCircle, Share2, ChevronDown, User, FileText, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const Leads: React.FC = () => {
  const context: any = useApp();
  
  const leads: any[] = context.leads || [];
  const properties: any[] = context.properties || [];
  const { addLead, updateLead, deleteLead, updateLeadInterestStatus, currentAgency } = context;

  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [propertyFilter, setPropertyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
  const [viewProperty, setViewProperty] = useState<any | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any | null>(null);
  
  const [formData, setFormData] = useState<any>({
    name: '', email: '', phone: '', type: 'Buyer', source: 'WhatsApp',
    status: LeadStatus.NEW, interestedInPropertyIds: [], interests: [], notes: ''
  });

  const leadSources = ['Indicação', 'Site', 'Instagram', 'Facebook', 'Google Ads', 'Facebook Ads', 'WhatsApp', 'Passante/Loja', 'Outros'];

  // Reset da página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, propertyFilter, typeFilter, sourceFilter, itemsPerPage]);

  const getInterestStatus = (lead: any, propId: string) => {
      const interest = lead.interests?.find((i: any) => i.propertyId === propId);
      return interest?.status || lead.status || LeadStatus.NEW;
  };

  const filteredLeads = leads
    .filter((lead: any) => {
        const matchesSearch = (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (lead.phone || '').includes(searchTerm);
        
        const matchesStatus = !statusFilter || 
            (lead.interests?.some((i: any) => i.status === statusFilter)) ||
            (lead.status === statusFilter);
        
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

  // Lógica de fatiamento para paginação
  const totalItems = filteredLeads.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  const clearFilters = () => {
      setSearchTerm(''); setStatusFilter(''); setPropertyFilter(''); setTypeFilter(''); setSourceFilter('');
      setCurrentPage(1);
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
      setFormData({ 
          name: '', email: '', phone: '', type: 'Buyer', source: 'WhatsApp',
          status: LeadStatus.NEW, interestedInPropertyIds: [], interests: [], notes: '' 
      });
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
      if (!propertyId) return;
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
    <div className="p-4 md:p-8 h-screen overflow-y-auto bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div><h1 className="text-2xl md:text-3xl font-bold text-slate-800">Gerenciamento de Leads</h1><p className="text-slate-500 text-sm md:text-base">Acompanhe potenciais clientes e controle o funil de vendas</p></div>
        <button onClick={handleOpenCreate} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-blue-500/20 font-bold"><Plus size={20} /> <span>Novo Lead</span></button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input type="text" placeholder="Nome ou telefone..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block w-full p-2.5 outline-none" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="">Todos os Perfis</option><option value="Buyer">Comprador</option><option value="Seller">Proprietário</option></select>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block w-full p-2.5 outline-none" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}><option value="">Todas Origens</option>{leadSources.map(src => <option key={src} value={src}>{src}</option>)}</select>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block w-full p-2.5 outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">Todos Status</option>{Object.values(LeadStatus).map(status => <option key={status} value={status}>{status}</option>)}</select>
            <div className="flex gap-2"><button onClick={clearFilters} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition font-bold text-sm py-2.5">Limpar</button></div>
        </div>
        <div className="mt-3 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{totalItems} leads encontrados</div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Mostrar:</span>
                <select 
                    value={itemsPerPage} 
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg p-1 outline-none"
                >
                    <option value={5}>5</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {paginatedLeads.map((lead: any) => {
          const interestedIn = lead.interestedInPropertyIds || [];
          const isNewLead = lead.status === LeadStatus.NEW && interestedIn.length === 0;
          return (
            <div key={lead.id} className={`rounded-2xl shadow-sm border p-4 md:p-6 flex flex-col lg:flex-row justify-between items-start group transition-all hover:shadow-md gap-4 ${isNewLead ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                <div className="flex-1 w-full min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <div className="flex items-center gap-3 w-full">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${lead.type === 'Buyer' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}><User size={20} /></div>
                            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                                <h3 className="text-lg font-bold text-slate-800 truncate">{lead.name}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap ${lead.type === 'Buyer' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>{lead.type === 'Buyer' ? 'Comprador' : 'Proprietário'}</span>
                                {lead.source && <span className="flex items-center text-[10px] font-bold px-2 py-0.5 rounded border text-slate-500 bg-slate-50 border-slate-200 uppercase tracking-wider whitespace-nowrap"><Share2 size={10} className="mr-1" /> {lead.source}</span>}
                                {lead.phone && <span className="flex items-center text-[10px] font-bold px-2 py-0.5 rounded border text-slate-500 bg-slate-50 border-slate-200 uppercase tracking-wider whitespace-nowrap"><Phone size={10} className="mr-1" /> {lead.phone}</span>}
                            </div>
                        </div>
                    </div>
                    {interestedIn.length > 0 && (
                        <div className="mt-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest px-1">Interesses e Negociações</span>
                            <div className="flex flex-wrap gap-2">
                                {getInterestedProperties(interestedIn).map((p: any) => {
                                    const status = getInterestStatus(lead, p.id);
                                    return (
                                        <div key={p.id} onClick={() => setViewProperty(p)} className="flex items-stretch text-xs bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 cursor-pointer transition w-full sm:w-auto">
                                            <div className="px-3 py-2 flex items-center flex-1 min-w-0 border-r border-slate-100 gap-3"><div className="w-8 h-8 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0"><img src={p.images?.[0]} alt="" className="w-full h-full object-cover" /></div><span className="truncate font-bold text-slate-700">{p.title}</span></div>
                                            <div className={`px-4 py-2 font-bold flex items-center whitespace-nowrap ${getStatusColor(status)}`}>{status}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0 flex-wrap lg:flex-col lg:items-end">
                    {lead.phone && <a href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} target="_blank" className="w-full lg:w-48 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition flex items-center justify-center shadow-lg shadow-green-500/20 text-sm font-bold"><MessageCircle size={18} className="mr-2"/> WhatsApp</a>}
                    <div className="flex gap-2 w-full lg:w-auto justify-end lg:mt-6">
                        <button onClick={() => handleOpenEdit(lead)} className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition border border-slate-200 flex-shrink-0"><Edit size={20} /></button>
                        <button onClick={() => handleDeleteClick(lead)} className="p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition border border-slate-200 flex-shrink-0"><Trash2 size={20} /></button>
                    </div>
                </div>
            </div>
          );
        })}
      </div>

      {/* CONTROLES DE PAGINAÇÃO */}
      {totalPages > 1 && (
        <div className="mt-8 mb-20 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2">
                <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <ChevronLeft size={24} />
                </button>
                
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (totalPages > 7 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                            if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-slate-400">...</span>;
                            return null;
                        }
                        return (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-12 h-12 rounded-xl font-bold text-base transition ${currentPage === page ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Página {currentPage} de {totalPages}
            </div>
        </div>
      )}

       {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={24}/></button>
            <h2 className="text-2xl font-bold mb-8 text-slate-900 flex items-center"><div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mr-4">{isEditing ? <Edit size={24} /> : <Plus size={24} />}</div>{isEditing ? 'Editar Lead' : 'Novo Lead'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2"><label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label><input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Nome do cliente" /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">Email</label><input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="exemplo@email.com" /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">Telefone / WhatsApp</label><input required value={formData.phone || ''} onChange={e => { let val = e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2'); setFormData({...formData, phone: val}); }} maxLength={15} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="(00) 00000-0000" /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">Perfil do Cliente</label><select value={formData.type || 'Buyer'} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"><option value="Buyer">Comprador / Locatário</option><option value="Seller">Proprietário / Locador</option></select></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">Meio de Entrada (Origem)</label><select required value={formData.source || ''} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"><option value="">Selecione a origem...</option>{leadSources.map(src => <option key={src} value={src}>{src}</option>)}</select></div>
              </div>
              <div className="border-t border-slate-100 pt-6">
                 <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center"><Building2 className="mr-2 text-blue-500" size={18} /> Vincular Imóveis de Interesse</label>
                 <div className="relative mb-4">
                    <button type="button" onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)} className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm flex items-center justify-between shadow-sm"><span className="text-slate-500 font-medium">+ Adicionar imóvel à lista...</span><ChevronDown size={18} className="text-slate-400"/></button>
                    {isPropertyDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                            {properties.filter((p: any) => !(formData.interestedInPropertyIds || []).includes(p.id)).map((p: any) => (
                                <div key={p.id} onClick={() => { addPropertyInterest(p.id); setIsPropertyDropdownOpen(false); }} className="flex items-center gap-4 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition group"><div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0"><img src={p.images?.[0]} alt="" className="w-full h-full object-cover" /></div><div className="flex flex-col min-w-0"><span className="text-sm font-bold text-slate-700 truncate">{p.title}</span><span className="text-xs text-blue-600 font-bold">{formatCurrency(p.price || 0)}</span></div></div>
                            ))}
                        </div>
                    )}
                 </div>
                 {formData.interestedInPropertyIds && formData.interestedInPropertyIds.length > 0 ? (
                     <div className="space-y-3">
                         {getInterestedProperties(formData.interestedInPropertyIds).map((p: any) => {
                             const interest = (formData.interests || []).find((i: any) => i.propertyId === p.id) || { status: LeadStatus.NEW };
                             return (
                                 <div key={p.id} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between shadow-sm">
                                     <div className="flex items-center gap-3 flex-1 overflow-hidden"><div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0"><img src={p.images?.[0]} alt="" className="w-full h-full object-cover" /></div><span className="font-bold text-slate-700 truncate text-sm">{p.title}</span></div>
                                     <div className="flex items-center space-x-3 ml-4"><select value={interest.status} onChange={(e) => updateInterestStatusInForm(p.id, e.target.value)} className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500">{Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}</select><button type="button" onClick={() => removePropertyInterest(p.id)} className="text-slate-400 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button></div>
                                 </div>
                             )
                         })}
                     </div>
                 ) : <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">Clique acima para vincular imóveis.</p>}
              </div>
              <div className="border-t border-slate-100 pt-6"><label className="block text-sm font-bold text-slate-800 mb-2">Observações</label><textarea rows={4} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" placeholder="Perfil, preferências, etc..." /></div>
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100"><button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition font-bold">Cancelar</button><button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center space-x-2 shadow-lg shadow-blue-500/20"><Save size={20} /><span>{isEditing ? 'Atualizar Lead' : 'Salvar Lead'}</span></button></div>
            </form>
          </div>
        </div>
      )}
      {viewProperty && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                  <div className="relative h-56 bg-slate-200"><img src={viewProperty.images?.[0]} className="w-full h-full object-cover" alt="" /><button onClick={() => setViewProperty(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"><X size={20} /></button></div>
                  <div className="p-6"><h3 className="text-xl font-bold text-slate-800 mb-2">{viewProperty.title}</h3><p className="text-2xl font-black text-blue-600 mb-6">{formatCurrency(viewProperty.price || 0)}</p><button onClick={() => setViewProperty(null)} className="w-full bg-slate-100 py-2.5 rounded-xl font-bold transition">Fechar</button></div>
              </div>
          </div>
      )}
      <ConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={confirmDelete} title="Excluir Lead" message={`Tem certeza que deseja excluir?`} confirmText="Sim, Excluir" isDestructive />
    </div>
  );
};
