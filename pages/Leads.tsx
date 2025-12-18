
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, LeadStatus, Property } from '../types';
import { Phone, Mail, Clock, Search, Plus, Edit, X, Save, Trash2, Filter, MapPin, BedDouble, Bath, Square, MessageCircle, Share2, ChevronDown } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const Leads: React.FC = () => {
  const context = useApp();
  const { addLead, updateLead, deleteLead, updateLeadInterestStatus, currentAgency } = context;
  
  // Garantia de tipagem estrita para evitar erro 'unknown' no build da Vercel
  const leads: Lead[] = (context.leads as Lead[]) || [];
  const properties: Property[] = (context.properties as Property[]) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [propertyFilter, setPropertyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
  const [viewProperty, setViewProperty] = useState<Property | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  
  const [formData, setFormData] = useState<Partial<Lead>>({
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
      'Indicação',
      'Site',
      'Instagram',
      'Facebook',
      'Google Ads',
      'Facebook Ads',
      'WhatsApp',
      'Passante/Loja',
      'Outros'
  ];

  const getInterestStatus = (lead: Lead, propId: string): LeadStatus => {
      const interest = lead.interests?.find(i => i.propertyId === propId);
      return interest?.status || lead.status || LeadStatus.NEW;
  };

  const filteredLeads: Lead[] = leads
    .filter(lead => {
        const leadName = lead.name || '';
        const leadEmail = lead.email || '';
        const matchesSearch = leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            leadEmail.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = !statusFilter || 
            (lead.interests?.some(i => i.status === statusFilter)) ||
            (lead.status === statusFilter);
        
        const interestedIn = lead.interestedInPropertyIds || [];
        const matchesProperty = !propertyFilter || interestedIn.includes(propertyFilter);
        const matchesType = !typeFilter || lead.type === typeFilter;
        const matchesSource = !sourceFilter || lead.source === sourceFilter;

        return matchesSearch && matchesStatus && matchesProperty && matchesType && matchesSource;
    })
    .sort((a, b) => {
        const aIsNew = a.status === LeadStatus.NEW;
        const bIsNew = b.status === LeadStatus.NEW;

        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;

        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  const clearFilters = () => {
      setSearchTerm('');
      setStatusFilter('');
      setPropertyFilter('');
      setTypeFilter('');
      setSourceFilter('');
  };

  const getStatusColor = (status: LeadStatus) => {
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
          name: '', email: '', phone: '', type: 'Buyer', source: '',
          status: LeadStatus.NEW, interestedInPropertyIds: [], interests: [], notes: '' 
      });
      setIsEditing(false);
      setShowModal(true);
      setIsPropertyDropdownOpen(false);
  };

  const handleOpenEdit = (lead: Lead) => {
      setFormData({ 
          ...lead,
          interests: lead.interests || [] 
      });
      setIsEditing(true);
      setShowModal(true);
      setIsPropertyDropdownOpen(false);
  };

  const handleDeleteClick = (lead: Lead) => {
      setLeadToDelete(lead);
      setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if (leadToDelete) {
          await deleteLead(leadToDelete.id);
      }
      setDeleteModalOpen(false);
      setLeadToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (isEditing && formData.id) {
        await updateLead(formData as Lead);
    } else {
        await addLead({
            id: Date.now().toString(),
            name: formData.name!,
            email: formData.email || '',
            phone: formData.phone || '',
            type: formData.type as 'Buyer' | 'Seller' || 'Buyer',
            source: formData.source || 'Indicação',
            status: formData.status as LeadStatus || LeadStatus.NEW,
            interestedInPropertyIds: formData.interestedInPropertyIds || [],
            interests: formData.interests || [],
            notes: formData.notes || '',
            createdAt: new Date().toISOString(),
            agencyId: currentAgency?.id || ''
        });
    }
    setShowModal(false);
  };

  const addPropertyInterest = (propertyId: string) => {
      if (!propertyId) return;
      
      const interested = formData.interestedInPropertyIds || [];
      const alreadyHas = interested.includes(propertyId);
      if (!alreadyHas) {
          const newInterests = [...(formData.interests || [])];
          newInterests.push({ propertyId, status: LeadStatus.NEW, updatedAt: new Date().toISOString() });

          setFormData(prev => ({
              ...prev,
              interestedInPropertyIds: [...(prev.interestedInPropertyIds || []), propertyId],
              interests: newInterests
          }));
      }
  };

  const removePropertyInterest = (propertyId: string) => {
      setFormData(prev => ({
          ...prev,
          interestedInPropertyIds: (prev.interestedInPropertyIds || []).filter(id => id !== propertyId),
          interests: (prev.interests || []).filter(i => i.propertyId !== propertyId)
      }));
  };

  const updateInterestStatusInForm = (propId: string, newStatus: string) => {
      const currentInterests = formData.interests ? [...formData.interests] : [];
      const existingIndex = currentInterests.findIndex(i => i.propertyId === propId);

      if (existingIndex >= 0) {
          currentInterests[existingIndex] = { 
              ...currentInterests[existingIndex], 
              status: newStatus as LeadStatus, 
              updatedAt: new Date().toISOString() 
          };
      } else {
          currentInterests.push({ 
              propertyId: propId, 
              status: newStatus as LeadStatus, 
              updatedAt: new Date().toISOString() 
          });
      }
      
      setFormData(prev => ({ ...prev, interests: currentInterests }));
  };

  const getInterestedProperties = (ids: string[]): Property[] => {
    return properties.filter(p => ids.includes(p.id));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="p-4 md:p-8 h-screen overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Gerenciamento de Leads</h1>
           <p className="text-slate-500 text-sm md:text-base">Acompanhe potenciais clientes e vendas</p>
        </div>
        <button onClick={handleOpenCreate} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition shadow-md">
          <Plus size={20} /> <span>Novo Lead</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-4">
        <div className="flex items-center space-x-2 mb-3 text-slate-500 font-bold uppercase text-xs tracking-wider">
            <Filter size={14} /> <span>Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                <Search className="text-slate-400 mr-2 flex-shrink-0" size={18} />
                <input
                type="text"
                placeholder="Buscar por nome..."
                className="w-full bg-transparent py-2.5 outline-none text-sm text-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <select
                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
            >
                <option value="">Todos os Tipos</option>
                <option value="Buyer">Comprador</option>
                <option value="Seller">Proprietário</option>
            </select>

            <select
                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
            >
                <option value="">Todas Origens</option>
                {leadSources.map(src => (
                    <option key={src} value={src}>{src}</option>
                ))}
            </select>

            <select
                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="">Todos Status</option>
                {Object.values(LeadStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>

            {(searchTerm || statusFilter || propertyFilter || typeFilter || sourceFilter) && (
                <button 
                    onClick={clearFilters}
                    className="flex items-center justify-center space-x-2 text-red-500 hover:bg-red-50 rounded-lg transition font-medium text-sm py-2.5 border border-transparent hover:border-red-200"
                >
                    <X size={16} /> <span>Limpar</span>
                </button>
            )}
        </div>
        <div className="mt-3 text-right text-xs text-slate-400">
            {filteredLeads.length} leads encontrados
        </div>
      </div>

      <div className="space-y-4">
        {filteredLeads.map((lead: Lead) => {
          const interestedIn = lead.interestedInPropertyIds || [];
          const hasInterests = interestedIn.length > 0;
          const isNewLead = lead.status === LeadStatus.NEW && !hasInterests;
          
          return (
            <div 
                key={lead.id} 
                className={`rounded-xl shadow-sm border p-4 md:p-6 flex flex-col lg:flex-row justify-between items-start group transition-all hover:shadow-md gap-4 
                ${isNewLead ? 'bg-green-50 border-green-300 shadow-green-100 ring-1 ring-green-100' : 'bg-white border-slate-200'}`}
            >
                <div className="flex-1 w-full min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            {isNewLead && <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">Novo</span>}
                            <h3 className="text-lg font-bold text-slate-800 truncate">{lead.name}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {lead.source && (
                                <span className="flex items-center text-xs font-medium px-2 py-0.5 rounded border text-slate-600 bg-slate-50 border-slate-200">
                                    <Share2 size={10} className="mr-1" /> {lead.source}
                                </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${lead.type === 'Buyer' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                            {lead.type === 'Buyer' ? 'Comprador' : 'Proprietário'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-slate-500 mb-3">
                        <div className="flex items-center space-x-1 truncate"><Mail size={14} className="flex-shrink-0" /> <span className="truncate">{lead.email || 'Sem email'}</span></div>
                        <div className="flex items-center space-x-1"><Phone size={14} className="flex-shrink-0" /> <span>{lead.phone || 'Sem fone'}</span></div>
                        <div className="flex items-center space-x-1"><Clock size={14} className="flex-shrink-0" /> <span>{new Date(lead.createdAt || 0).toLocaleDateString()}</span></div>
                    </div>
                    
                    {interestedIn.length > 0 && (
                        <div className="mt-4">
                            <span className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Interesses e Negociações</span>
                            <div className="flex flex-wrap gap-2">
                                {getInterestedProperties(interestedIn).map((p: Property) => {
                                    const status = getInterestStatus(lead, p.id);
                                    return (
                                        <div 
                                            key={p.id} 
                                            onClick={() => setViewProperty(p)}
                                            className="flex items-stretch text-xs bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-sm cursor-pointer transition w-full sm:w-auto sm:max-w-[320px]"
                                        >
                                            <div className="px-2 py-1.5 flex items-center flex-1 min-w-0 border-r border-slate-100 gap-2">
                                                <div className="w-8 h-8 bg-slate-200 rounded overflow-hidden flex-shrink-0 border border-slate-100">
                                                    <img src={p.images?.[0] || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="truncate font-medium text-slate-700" title={p.title}>{p.title}</span>
                                            </div>
                                            <div className={`px-3 py-2 font-bold flex items-center whitespace-nowrap ${getStatusColor(status)}`}>
                                                {status}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0 flex-wrap lg:flex-col lg:items-end">
                    {lead.phone && (
                        <a 
                            href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full lg:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center shadow-sm text-sm font-bold mb-2"
                            title="Conversar no WhatsApp"
                        >
                            <MessageCircle size={16} className="mr-2"/> WhatsApp
                        </a>
                    )}

                    <div className="flex gap-2 w-full lg:w-auto justify-end">
                        <button 
                            onClick={() => handleOpenEdit(lead)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition border border-slate-200 flex-shrink-0"
                            title="Editar Lead"
                        >
                            <Edit size={18} />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(lead)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-slate-200 flex-shrink-0"
                            title="Excluir Lead"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
          );
        })}
      </div>

       {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24}/></button>
            
            <h2 className="text-xl font-bold mb-6 text-slate-900 flex items-center">
                {isEditing ? <Edit size={24} className="mr-2 text-blue-600" /> : <Plus size={24} className="mr-2 text-blue-600" />}
                {isEditing ? 'Editar Lead' : 'Novo Lead'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input 
                        required 
                        value={formData.name || ''} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="Nome do cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400 font-normal text-xs">(Opcional)</span></label>
                    <input 
                        type="email"
                        value={formData.email || ''} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="cliente@email.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                    <input 
                        value={formData.phone || ''} 
                        onChange={e => {
                            let val = e.target.value
                                .replace(/\D/g, '')
                                .replace(/^(\d{2})(\d)/, '($1) $2')
                                .replace(/(\d)(\d{4})$/, '$1-$2');
                            setFormData({...formData, phone: val});
                        }}
                        maxLength={15} 
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Cliente</label>
                    <select 
                        value={formData.type || 'Buyer'} 
                        onChange={e => setFormData({...formData, type: e.target.value as any})} 
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="Buyer">Comprador</option>
                        <option value="Seller">Proprietário</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Origem do Lead</label>
                    <select 
                        value={formData.source || ''} 
                        onChange={e => setFormData({...formData, source: e.target.value})} 
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Selecione...</option>
                        {leadSources.map(src => (
                            <option key={src} value={src}>{src}</option>
                        ))}
                    </select>
                  </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                 <label className="block text-sm font-bold text-slate-800 mb-2">Imóveis e Negociações</label>
                 
                 <div className="flex items-center space-x-2 mb-3 relative">
                    <div className="flex-1 relative">
                        <button
                            type="button"
                            onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)}
                            className="w-full bg-white text-slate-700 border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm flex items-center justify-between"
                        >
                            <span className="text-slate-500">+ Adicionar Imóvel à lista...</span>
                            <ChevronDown size={16} className="text-slate-400"/>
                        </button>
                        
                        {isPropertyDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                {properties
                                    .filter(p => !(formData.interestedInPropertyIds || []).includes(p.id))
                                    .map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => {
                                            addPropertyInterest(p.id);
                                            setIsPropertyDropdownOpen(false);
                                        }}
                                        className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition group"
                                    >
                                        <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                                            <img src={p.images?.[0] || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition">{p.title}</span>
                                            <span className="text-xs text-slate-500 font-mono">
                                                {formatCurrency(p.price || 0)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                 </div>

                 {formData.interestedInPropertyIds && formData.interestedInPropertyIds.length > 0 ? (
                     <div className="space-y-2">
                         {getInterestedProperties(formData.interestedInPropertyIds).map((p: Property) => {
                             const interest = (formData.interests || []).find(i => i.propertyId === p.id) || { status: LeadStatus.NEW };
                             
                             return (
                                 <div key={p.id} className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center justify-between shadow-sm">
                                     <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                         <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                                            <img src={p.images?.[0] || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover" />
                                         </div>
                                         <span className="font-medium text-slate-700 truncate text-sm">{p.title}</span>
                                     </div>
                                     <div className="flex items-center space-x-2 ml-4">
                                         <select
                                            value={interest.status}
                                            onChange={(e) => updateInterestStatusInForm(p.id, e.target.value)}
                                            className="text-xs bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                                         >
                                             {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                         <button 
                                            type="button"
                                            onClick={() => removePropertyInterest(p.id)}
                                            className="text-slate-400 hover:text-red-500 transition p-1"
                                         >
                                             <X size={16} />
                                         </button>
                                     </div>
                                 </div>
                             )
                         })}
                     </div>
                 ) : (
                     <p className="text-sm text-slate-400 italic">Nenhum imóvel selecionado.</p>
                 )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                  <label className="block text-sm font-bold text-slate-800 mb-2">Observações Internas</label>
                  <textarea 
                    rows={4}
                    value={formData.notes || ''}
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

      {viewProperty && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="relative h-56 bg-slate-200">
                      <img src={viewProperty.images?.[0] || 'https://via.placeholder.com/600'} alt={viewProperty.title} className="w-full h-full object-cover" />
                      <button 
                          onClick={() => setViewProperty(null)} 
                          className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition"
                      >
                          <X size={20} />
                      </button>
                      <div className="absolute bottom-3 left-3 flex gap-2">
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow">{viewProperty.type}</span>
                          <span className="bg-white/90 text-slate-800 text-xs font-bold px-2 py-1 rounded shadow font-mono">#{viewProperty.code}</span>
                      </div>
                  </div>
                  <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-800 leading-tight mb-1">{viewProperty.title}</h3>
                      <p className="text-sm text-slate-500 flex items-center mb-4"><MapPin size={14} className="mr-1"/> {viewProperty.neighborhood}, {viewProperty.city}</p>
                      
                      <div className="flex items-center justify-between text-slate-600 text-sm py-4 border-y border-slate-100 mb-4">
                          <span className="flex items-center"><BedDouble size={16} className="mr-1 text-blue-500"/> {viewProperty.bedrooms}</span>
                          <span className="flex items-center"><Bath size={16} className="mr-1 text-blue-500"/> {viewProperty.bathrooms}</span>
                          <span className="flex items-center"><Square size={16} className="mr-1 text-blue-500"/> {viewProperty.area}m²</span>
                      </div>

                      <p className="text-2xl font-bold text-blue-600 mb-4">{formatCurrency(viewProperty.price || 0)}</p>
                      
                      <div className="flex justify-end">
                          <button onClick={() => setViewProperty(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium transition">
                              Fechar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Lead"
        message={`Tem certeza que deseja excluir o lead ${leadToDelete?.name}?`}
        confirmText="Excluir"
        isDestructive
      />
    </div>
  );
};
