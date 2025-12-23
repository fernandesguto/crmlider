
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, MessageCircle, User, Smartphone, Building2, MapPin, Check, Save, MessageSquare, Plus, X, ChevronDown } from 'lucide-react';
import { Lead, LeadStatus, Property, LeadInterest } from '../types';

export const Conversations: React.FC = () => {
    const { leads, properties, updateLead, updateLeadInterestStatus } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    
    // Estados para vincular novo imóvel
    const [isAddingProperty, setIsAddingProperty] = useState(false);
    const [propertySearch, setPropertySearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredLeads = useMemo(() => {
        return leads
            .filter(l => 
                (l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                l.phone.includes(searchTerm)) && 
                l.phone.length > 5
            )
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [leads, searchTerm]);

    const selectedLead = useMemo(() => leads.find(l => l.id === selectedLeadId), [leads, selectedLeadId]);
    
    const interestedProperties = useMemo(() => {
        if (!selectedLead) return [];
        return properties.filter(p => (selectedLead.interestedInPropertyIds || []).includes(p.id));
    }, [selectedLead, properties]);

    const availableProperties = useMemo(() => {
        if (!selectedLead) return [];
        return properties.filter(p => 
            p.status === 'Active' && 
            !(selectedLead.interestedInPropertyIds || []).includes(p.id) &&
            (p.title.toLowerCase().includes(propertySearch.toLowerCase()) || p.code?.toString().includes(propertySearch))
        ).slice(0, 5);
    }, [selectedLead, properties, propertySearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsAddingProperty(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openWhatsApp = (lead: Lead) => {
        const phone = lead.phone.replace(/\D/g, '');
        const url = `https://web.whatsapp.com/send?phone=55${phone}`;
        const width = 500;
        const height = 800;
        const left = window.screen.width - width - 10;
        const top = 50;
        window.open(url, 'whatsapp_workspace', `width=${width},height=${height},left=${left},top=${top},status=no,location=no,toolbar=no,menubar=no`);
    };

    const handleUpdateInterestNote = async (propertyId: string, note: string) => {
        if (!selectedLead) return;
        
        setIsSaving(propertyId);
        const currentInterests = [...(selectedLead.interests || [])];
        const interestIndex = currentInterests.findIndex(i => i.propertyId === propertyId);
        
        if (interestIndex >= 0) {
            currentInterests[interestIndex] = { 
                ...currentInterests[interestIndex], 
                notes: note,
                updatedAt: new Date().toISOString()
            };
        } else {
            currentInterests.push({
                propertyId,
                status: LeadStatus.NEW,
                updatedAt: new Date().toISOString(),
                notes: note
            });
        }

        await updateLead({
            ...selectedLead,
            interests: currentInterests
        });
        
        setTimeout(() => setIsSaving(null), 1000);
    };

    const handleAddInterest = async (propertyId: string) => {
        if (!selectedLead) return;
        await updateLeadInterestStatus(selectedLead.id, propertyId, LeadStatus.NEW);
        setIsAddingProperty(false);
        setPropertySearch('');
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case LeadStatus.NEW: return 'bg-green-100 text-green-700 border-green-200';
            case LeadStatus.CONTACTED: return 'bg-blue-50 text-blue-700 border-blue-200';
            case LeadStatus.VISITING: return 'bg-purple-50 text-purple-700 border-purple-200';
            case LeadStatus.NEGOTIATION: return 'bg-orange-50 text-orange-700 border-orange-200';
            case LeadStatus.CLOSED: return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case LeadStatus.LOST: return 'bg-slate-100 text-slate-500 border-slate-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="h-screen flex bg-[#f0f2f5] overflow-hidden">
            {/* Coluna 1: Lista de Leads */}
            <div className="w-80 md:w-[400px] bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
                <div className="p-4 bg-[#f0f2f5] flex justify-between items-center h-16">
                    <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center text-slate-600">
                        <User size={24} />
                    </div>
                    <div className="flex space-x-4 text-slate-500 font-bold text-sm uppercase tracking-tight">
                        Negociações
                    </div>
                </div>

                <div className="p-3 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Pesquisar cliente..." 
                            className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] border-none rounded-lg text-sm outline-none focus:ring-0 transition"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                    {filteredLeads.map(lead => (
                        <div 
                            key={lead.id} 
                            onClick={() => setSelectedLeadId(lead.id)}
                            className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-all hover:bg-[#f5f6f6] flex items-center space-x-3 ${selectedLeadId === lead.id ? 'bg-[#ebebeb]' : ''}`}
                        >
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0 font-bold border border-blue-50">
                                {lead.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-semibold text-slate-800 truncate text-[15px]">{lead.name}</h3>
                                    <span className="text-[11px] text-slate-400">{new Date(lead.createdAt).toLocaleDateString([], {day:'2-digit', month:'2-digit'})}</span>
                                </div>
                                <p className="text-[13px] text-slate-500 truncate">
                                    {lead.phone}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Coluna 2: Detalhes das Negociações */}
            <div className="flex-1 flex flex-col bg-[#e5ddd5] relative">
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>

                {selectedLead ? (
                    <div className="flex flex-col h-full relative z-10">
                        {/* Header */}
                        <div className="h-16 bg-[#f0f2f5] border-b border-slate-200 px-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center text-slate-600 font-bold">
                                    {selectedLead.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-800 text-[15px]">{selectedLead.name}</h2>
                                    <p className="text-[11px] text-green-600 font-bold flex items-center uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                                        CRM Ativo
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => openWhatsApp(selectedLead)}
                                className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2 rounded-full font-black text-xs flex items-center transition shadow-md"
                            >
                                <Smartphone className="mr-2" size={16} />
                                ABRIR WHATSAPP
                            </button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Esquerda: Lista de Negociações */}
                            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                                <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                                            <MessageSquare size={14} className="mr-1.5 text-blue-600" />
                                            Negociações por Imóvel
                                        </h3>
                                        
                                        <div className="relative" ref={dropdownRef}>
                                            <button 
                                                onClick={() => setIsAddingProperty(!isAddingProperty)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full font-bold text-xs flex items-center transition shadow-sm"
                                            >
                                                <Plus size={14} className="mr-1" /> VINCULAR IMÓVEL
                                            </button>
                                            
                                            {isAddingProperty && (
                                                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
                                                    <div className="relative mb-3">
                                                        <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                                                        <input 
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Buscar por título ou código..."
                                                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={propertySearch}
                                                            onChange={e => setPropertySearch(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        {availableProperties.map(p => (
                                                            <button 
                                                                key={p.id}
                                                                onClick={() => handleAddInterest(p.id)}
                                                                className="w-full text-left p-2 hover:bg-slate-50 rounded-lg border-b border-slate-50 last:border-0 flex items-center space-x-3 transition"
                                                            >
                                                                <img src={p.images?.[0]} className="w-8 h-8 rounded object-cover" alt="" />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-xs font-bold text-slate-800 truncate">{p.title}</p>
                                                                    <p className="text-[10px] text-slate-500">REF #{p.code}</p>
                                                                </div>
                                                                <Plus size={14} className="text-blue-500" />
                                                            </button>
                                                        ))}
                                                        {availableProperties.length === 0 && (
                                                            <p className="text-center text-[10px] text-slate-400 py-4 italic">Nenhum imóvel disponível para vincular.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {interestedProperties.length > 0 ? (
                                        <div className="space-y-6">
                                            {interestedProperties.map(p => {
                                                const interest = selectedLead.interests?.find(i => i.propertyId === p.id);
                                                const currentStatus = interest?.status || LeadStatus.NEW;
                                                
                                                return (
                                                    <div key={p.id} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <img src={p.images?.[0]} className="w-12 h-12 rounded-lg object-cover" alt="" />
                                                                <div>
                                                                    <h4 className="font-bold text-slate-800 text-sm">{p.title}</h4>
                                                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">REF #{p.code} • {formatCurrency(p.price)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex flex-col items-end">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Etapa da Negociação</label>
                                                                    <select 
                                                                        value={currentStatus}
                                                                        onChange={(e) => updateLeadInterestStatus(selectedLead.id, p.id, e.target.value as LeadStatus)}
                                                                        className={`text-[10px] font-bold px-2 py-1.5 rounded border outline-none transition w-36 shadow-sm ${getStatusStyle(currentStatus)}`}
                                                                    >
                                                                        {Object.values(LeadStatus).map(s => (
                                                                            <option key={s} value={s}>{s}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="p-4 bg-white/50">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Histórico de Observações / Feedback</label>
                                                                <div className="flex items-center text-[10px] text-slate-400 font-bold">
                                                                    <MapPin size={10} className="mr-1"/> {p.neighborhood}, {p.city}
                                                                </div>
                                                            </div>
                                                            <div className="relative">
                                                                <textarea 
                                                                    defaultValue={interest?.notes || ''}
                                                                    onBlur={(e) => handleUpdateInterestNote(p.id, e.target.value)}
                                                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition h-24 resize-none shadow-inner"
                                                                    placeholder="Registre aqui o que o cliente achou, propostas feitas, pontos de dúvida..."
                                                                />
                                                                {isSaving === p.id && (
                                                                    <div className="absolute right-3 bottom-3 text-green-500 flex items-center text-[10px] font-bold bg-white/90 px-2 py-1 rounded-full border border-green-100 shadow-sm">
                                                                        <Check size={12} className="mr-1"/> SALVO
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 opacity-40">
                                            <Building2 size={48} className="mx-auto mb-3 text-slate-400" />
                                            <p className="text-sm font-bold text-slate-500 mb-1">Nenhum imóvel vinculado.</p>
                                            <p className="text-xs text-slate-400">Clique em "Vincular Imóvel" acima para iniciar.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Direita: Perfil do Lead */}
                            <div className="w-80 md:w-96 bg-white border-l border-slate-200 p-6 overflow-y-auto hidden lg:block">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Ficha do Cliente</h3>
                                
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                        <p className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-widest">Perfil Principal</p>
                                        <p className="text-base font-bold text-slate-800">{selectedLead.type === 'Buyer' ? 'Comprador / Locatário' : 'Vendedor / Proprietário'}</p>
                                        <div className="flex items-center mt-2 text-xs text-slate-500 bg-white/50 w-fit px-2 py-1 rounded-lg border border-blue-50">
                                            Origem: {selectedLead.source || 'Indireta'}
                                        </div>
                                    </div>

                                    <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <User size={14} className="text-yellow-700" />
                                            <p className="text-[10px] font-black text-yellow-700 uppercase tracking-widest">Notas Gerais do Lead</p>
                                        </div>
                                        <p className="text-xs text-yellow-900 leading-relaxed italic bg-white/30 p-3 rounded-xl border border-yellow-50">
                                            {selectedLead.notes || "Sem anotações no momento."}
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <div className="flex flex-col space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                                                <span>Total de Negociações</span>
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{interestedProperties.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                                                <span>Cadastrado em</span>
                                                <span>{new Date(selectedLead.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl border border-slate-100">
                            <Building2 size={40} className="text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Gestão de Negociações</h2>
                        <p className="text-slate-500 max-w-sm text-sm">
                            Selecione um cliente ao lado para gerenciar cada interesse individualmente e registrar o progresso das negociações.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
