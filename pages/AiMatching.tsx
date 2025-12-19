
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, BrainCircuit, User, Building2, ArrowRight, MessageCircle, RefreshCw, AlertCircle, Percent, Clock, CheckCircle, XCircle, AlertTriangle, Search, Bot, BookOpen, Lock, ChevronDown, ChevronUp, MapPin, DollarSign, X, Filter, Settings2, PenTool, Copy, Check, FileText, TrendingUp, Share2, Wand2, Zap, Send, Megaphone, Target, MessageSquare } from 'lucide-react';
import { findOpportunities, analyzeStaleLeads, askRealEstateAgent, isAiConfigured, getDebugInfo, generateMarketingStrategy, MarketingStrategyResult } from '../services/geminiService';
import { AiMatchOpportunity, Lead, Property, LeadStatus, AiRecoveryOpportunity } from '../types';

export const AiMatching: React.FC = () => {
    const { leads, properties, updateLeadInterestStatus, currentUser, aiOpportunities, setAiOpportunities, aiStaleLeads, setAiStaleLeads, isSuperAdmin } = useApp();
    
    const [isLoading, setIsLoading] = useState(false);
    const [canRunToday, setCanRunToday] = useState(true);
    const [activeTab, setActiveTab] = useState<'matches' | 'stale' | 'chat' | 'marketing'>('matches');
    const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    // Analysis Filters
    const [targetLeadId, setTargetLeadId] = useState('');
    const [targetPropertyId, setTargetPropertyId] = useState('');
    
    // Select Search States
    const [leadSearchTerm, setLeadSearchTerm] = useState('');
    const [propertySearchTerm, setPropertySearchTerm] = useState('');
    const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);
    const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);

    // Chat State
    const [chatQuery, setChatQuery] = useState('');
    const [chatResponse, setChatResponse] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    
    // Marketing Strategy State
    const [marketingPropertyId, setMarketingPropertyId] = useState('');
    const [marketingResult, setMarketingResult] = useState<MarketingStrategyResult | null>(null);
    const [isMarketingLoading, setIsMarketingLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const leadDropdownRef = useRef<HTMLDivElement>(null);
    const propertyDropdownRef = useRef<HTMLDivElement>(null);

    // Otimização de performance: Filtrar imóveis ativos apenas quando a lista de propriedades mudar
    const activeProperties = useMemo(() => properties.filter(p => p.status === 'Active'), [properties]);
    const selectedMarketingProp = useMemo(() => activeProperties.find(p => p.id === marketingPropertyId), [activeProperties, marketingPropertyId]);

    const filteredLeadsForSelect = useMemo(() => {
        return leads.filter(l => l.name.toLowerCase().includes(leadSearchTerm.toLowerCase()));
    }, [leads, leadSearchTerm]);

    const filteredPropertiesForSelect = useMemo(() => {
        return activeProperties.filter(p => 
            p.title.toLowerCase().includes(propertySearchTerm.toLowerCase()) ||
            (p.code?.toString().includes(propertySearchTerm))
        );
    }, [activeProperties, propertySearchTerm]);

    // Chat Limit State
    const MAX_QUESTIONS_PER_DAY = 3;
    const [questionsUsed, setQuestionsUsed] = useState(0);

    const STORAGE_KEY_RUN = `imob_ai_last_run_${currentUser?.id}`;
    const STORAGE_KEY_CHAT = `imob_ai_chat_limit_${currentUser?.id}`;

    useEffect(() => {
        const configured = isAiConfigured();
        setIsApiKeyMissing(!configured);
        setDebugInfo(getDebugInfo());

        const checkRunLimit = () => {
            const lastRun = localStorage.getItem(STORAGE_KEY_RUN);
            const today = new Date().toLocaleDateString('pt-BR');
            setCanRunToday(lastRun !== today);
        };
        checkRunLimit();

        const checkChatLimit = () => {
            const today = new Date().toLocaleDateString('pt-BR');
            const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY_CHAT) || '{}');
            
            if (savedData.date !== today) {
                setQuestionsUsed(0);
                localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify({ date: today, count: 0 }));
            } else {
                setQuestionsUsed(savedData.count || 0);
            }
        };
        checkChatLimit();

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setIsDropdownOpen(false);
            }
            if (leadDropdownRef.current && !leadDropdownRef.current.contains(target)) {
                setIsLeadDropdownOpen(false);
            }
            if (propertyDropdownRef.current && !propertyDropdownRef.current.contains(target)) {
                setIsPropertyDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);

    }, [currentUser]);

    const handleRunAnalysis = async () => {
        if (isApiKeyMissing) {
            alert("Erro: API Key não configurada.");
            return;
        }

        const isManualFilter = targetLeadId || targetPropertyId;
        // Se estivermos na aba de matches e houver filtros, rodamos apenas matches.
        // Mas se estivermos na aba de stale, SEMPRE rodamos stale.
        const shouldRunStale = activeTab === 'stale' || (activeTab === 'matches' && !isManualFilter);
        const shouldRunMatches = activeTab === 'matches';

        if (!canRunToday && !isSuperAdmin && !isManualFilter) return;

        setIsLoading(true);
        try {
            let leadsToAnalyze = leads;
            let propertiesToAnalyze = properties;

            if (targetLeadId) {
                leadsToAnalyze = leads.filter(l => l.id === targetLeadId);
            } else if (targetPropertyId) {
                propertiesToAnalyze = properties.filter(p => p.id === targetPropertyId);
            }

            const promises: Promise<any>[] = [];
            
            // Promise 0: Oportunidades
            if (shouldRunMatches) {
                promises.push(findOpportunities(leadsToAnalyze, propertiesToAnalyze));
            } else {
                promises.push(Promise.resolve(aiOpportunities));
            }

            // Promise 1: Recuperação
            if (shouldRunStale) {
                promises.push(analyzeStaleLeads(leads));
            } else {
                promises.push(Promise.resolve(aiStaleLeads));
            }

            const results = await Promise.all(promises);
            const matchesRaw = results[0];
            const staleLeadsRaw = results[1];

            if (shouldRunMatches) {
                const sortedMatches = Array.isArray(matchesRaw) 
                    ? [...matchesRaw]
                        .sort((a: AiMatchOpportunity, b: AiMatchOpportunity) => (b.matchScore || 0) - (a.matchScore || 0))
                        .map((m: AiMatchOpportunity) => ({ ...m, status: 'pending' as const }))
                    : [];
                setAiOpportunities(sortedMatches);
            }
            
            if (shouldRunStale) {
                const sortedStale = Array.isArray(staleLeadsRaw)
                    ? [...staleLeadsRaw].sort((a: AiRecoveryOpportunity, b: AiRecoveryOpportunity) => (b.daysInactive || 0) - (a.daysInactive || 0))
                    : [];
                setAiStaleLeads(sortedStale);
            }
            
            if (!isManualFilter) {
                const today = new Date().toLocaleDateString('pt-BR');
                localStorage.setItem(STORAGE_KEY_RUN, today);
                setCanRunToday(false);
            }
        } catch (error) {
            console.error("Erro ao gerar análises", error);
            alert("Ocorreu um erro ao processar os dados da IA. Tente novamente em instantes.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptOpportunity = async (opp: AiMatchOpportunity) => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});

        const updatedOpps = aiOpportunities.map(o => 
            (o.leadId === opp.leadId && o.propertyId === opp.propertyId) 
            ? { ...o, status: 'accepted' as const } 
            : o
        );
        setAiOpportunities(updatedOpps);
        await updateLeadInterestStatus(opp.leadId, opp.propertyId, LeadStatus.NEW);
    };

    const handleReactivateLead = (leadId: string, message: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (lead && lead.phone) {
            const phone = lead.phone.replace(/\D/g, '');
            if (phone.length >= 10) {
                const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
                window.open(url, '_blank');
            }
        }
    };

    const handleDismissOpportunity = (leadId: string, propertyId: string) => {
        const updatedOpps = aiOpportunities.map(o => 
            (o.leadId === leadId && o.propertyId === propertyId) 
            ? { ...o, status: 'dismissed' as const } 
            : o
        );
        setAiOpportunities(updatedOpps);
    };

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatQuery.trim()) return;
        
        if (!isSuperAdmin && questionsUsed >= MAX_QUESTIONS_PER_DAY) {
            alert("Você atingiu o limite de 3 perguntas por dia.");
            return;
        }

        setIsChatLoading(true);
        setChatResponse('');
        
        try {
            const answer = await askRealEstateAgent(chatQuery, leads, properties);
            setChatResponse(answer);
            const newCount = questionsUsed + 1;
            setQuestionsUsed(newCount);
            const today = new Date().toLocaleDateString('pt-BR');
            localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify({ date: today, count: newCount }));
        } catch (e) {
            setChatResponse('Desculpe, erro ao processar.');
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleGenerateMarketing = async () => {
        if (!marketingPropertyId) return;
        const property = properties.find(p => p.id === marketingPropertyId);
        if (!property) return;

        setIsMarketingLoading(true);
        setMarketingResult(null);
        try {
            const result = await generateMarketingStrategy(property);
            setMarketingResult(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsMarketingLoading(false);
        }
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const getLead = (id: string): Lead | undefined => leads.find(l => l.id === id);
    const getProperty = (id: string): Property | undefined => properties.find(p => p.id === id);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    const groupedMatches = useMemo(() => {
        return (aiOpportunities || [])
            .filter(opp => opp.status !== 'dismissed') 
            .reduce((groups, opp) => {
                const leadId = opp.leadId;
                if (!groups[leadId]) groups[leadId] = [];
                groups[leadId].push(opp);
                return groups;
            }, {} as Record<string, AiMatchOpportunity[]>);
    }, [aiOpportunities]);

    const safeAiStaleLeads = (aiStaleLeads || []) as AiRecoveryOpportunity[];
    const hasAnyResults = (aiOpportunities && aiOpportunities.length > 0) || safeAiStaleLeads.length > 0;
    const questionsRemaining = MAX_QUESTIONS_PER_DAY - questionsUsed;

    const getWhatsAppLink = (lead: Lead | undefined, property: Property | undefined) => {
        if (!lead?.phone || !property) return null;
        const phone = lead.phone.replace(/\D/g, '');
        if (phone.length < 10) return null;
        const firstName = lead.name.split(' ')[0];
        const message = `Olá ${firstName}! Tudo bem? Apareceu uma excelente oportunidade para você: *${property.title}* em ${property.neighborhood}. Gostaria de ver as fotos?`;
        return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    }

    const isDisabled = isApiKeyMissing || isLoading;
    let buttonLabel = 'Executar Análise IA';
    if (isApiKeyMissing) buttonLabel = 'IA Desativada';
    else if (isLoading) buttonLabel = 'Analisando...';

    return (
        <div className="p-4 md:p-8 h-screen overflow-y-auto bg-slate-50">
            {isApiKeyMissing && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
                        <div className="flex-1">
                            <h3 className="text-amber-800 font-bold">IA Desativada</h3>
                            <p className="text-amber-700 text-sm mt-1">Configure a VITE_API_KEY para usar estas funções.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center">
                    <Sparkles className="mr-3 text-purple-600" size={32} />
                    Consultor IA
                </h1>
                <p className="text-slate-500 text-sm md:text-base mt-1">Inteligência para vender mais e recuperar clientes.</p>
            </div>

            <div className="flex space-x-4 mb-6 border-b border-slate-200 overflow-x-auto">
                <button onClick={() => setActiveTab('matches')} className={`pb-3 px-4 font-bold text-sm transition relative whitespace-nowrap ${activeTab === 'matches' ? 'text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}>
                    Oportunidades
                    {activeTab === 'matches' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></div>}
                </button>
                <button onClick={() => setActiveTab('stale')} className={`pb-3 px-4 font-bold text-sm transition relative whitespace-nowrap ${activeTab === 'stale' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}>
                    Recuperação
                    {activeTab === 'stale' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600"></div>}
                </button>
                <button onClick={() => setActiveTab('marketing')} className={`pb-3 px-4 font-bold text-sm transition relative whitespace-nowrap flex items-center ${activeTab === 'marketing' ? 'text-green-600' : 'text-slate-500 hover:text-slate-700'}`}>
                    Marketing
                    {activeTab === 'marketing' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></div>}
                </button>
                <button onClick={() => setActiveTab('chat')} className={`pb-3 px-4 font-bold text-sm transition relative whitespace-nowrap flex items-center ${activeTab === 'chat' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                    Tira-Dúvidas
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${questionsRemaining === 0 && !isSuperAdmin ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isSuperAdmin ? '∞' : `${questionsUsed}/${MAX_QUESTIONS_PER_DAY}`}
                    </span>
                    {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                </button>
            </div>

            {activeTab === 'matches' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                        <div className="flex flex-col lg:flex-row gap-4 items-end">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                                <div className={`relative p-3 rounded-xl border-2 transition ${targetLeadId ? 'border-purple-500 bg-purple-50' : 'border-slate-100 bg-slate-50'}`} ref={leadDropdownRef}>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">1. Por Cliente</label>
                                    <div 
                                        onClick={() => setIsLeadDropdownOpen(!isLeadDropdownOpen)}
                                        className="w-full !bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer flex justify-between items-center h-[38px]"
                                    >
                                        <span className={targetLeadId ? '!text-slate-900 font-medium' : 'text-slate-400'}>
                                            {targetLeadId ? leads.find(l => l.id === targetLeadId)?.name : 'Selecione...'}
                                        </span>
                                        <ChevronDown size={14} className="text-slate-400" />
                                    </div>
                                    {isLeadDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 !bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                                            <div className="relative mb-2">
                                                <Search className="absolute left-2 top-2.5 text-slate-400" size={14} />
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    placeholder="Digitar nome..." 
                                                    className="w-full pl-8 pr-2 py-1.5 border border-slate-100 rounded text-sm outline-none focus:ring-2 focus:ring-purple-500 transition !bg-white !text-slate-900"
                                                    value={leadSearchTerm}
                                                    onChange={e => setLeadSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                {filteredLeadsForSelect.length > 0 ? filteredLeadsForSelect.map(l => (
                                                    <div 
                                                        key={l.id} 
                                                        onClick={() => { setTargetLeadId(l.id); setTargetPropertyId(''); setIsLeadDropdownOpen(false); setLeadSearchTerm(''); }}
                                                        className="px-2 py-2 hover:bg-purple-50 rounded cursor-pointer text-sm font-medium !text-slate-700 transition"
                                                    >
                                                        {l.name}
                                                    </div>
                                                )) : <div className="p-4 text-center text-slate-400 text-xs italic">Nenhum cliente encontrado.</div>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className={`relative p-3 rounded-xl border-2 transition ${targetPropertyId ? 'border-purple-500 bg-purple-50' : 'border-slate-100 bg-slate-50'}`} ref={propertyDropdownRef}>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">2. Por Imóvel</label>
                                    <div 
                                        onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)}
                                        className="w-full !bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer flex justify-between items-center h-[38px]"
                                    >
                                        <span className={targetPropertyId ? '!text-slate-900 font-medium' : 'text-slate-400'}>
                                            {targetPropertyId ? properties.find(p => p.id === targetPropertyId)?.title : 'Selecione...'}
                                        </span>
                                        <ChevronDown size={14} className="text-slate-400" />
                                    </div>
                                    {isPropertyDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 !bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                                            <div className="relative mb-2">
                                                <Search className="absolute left-2 top-2.5 text-slate-400" size={14} />
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    placeholder="Buscar imóvel por título ou código..." 
                                                    className="w-full pl-8 pr-2 py-1.5 border border-slate-100 rounded text-sm outline-none focus:ring-2 focus:ring-purple-500 transition !bg-white !text-slate-900"
                                                    value={propertySearchTerm}
                                                    onChange={e => setPropertySearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                {filteredPropertiesForSelect.length > 0 ? filteredPropertiesForSelect.map(p => (
                                                    <div 
                                                        key={p.id} 
                                                        onClick={() => { setTargetPropertyId(p.id); setTargetLeadId(''); setIsPropertyDropdownOpen(false); setPropertySearchTerm(''); }}
                                                        className="px-2 py-2 hover:bg-purple-50 rounded cursor-pointer flex items-center gap-3 transition border-b border-slate-50 last:border-0"
                                                    >
                                                        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                                                            <img src={p.images?.[0] || 'https://via.placeholder.com/50'} className="w-full h-full object-cover" alt="" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold !text-slate-800 truncate">{p.title}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">
                                                                    #{p.code?.toString().padStart(5, '0')}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{p.type}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )) : <div className="p-4 text-center text-slate-400 text-xs italic">Nenhum imóvel encontrado.</div>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={handleRunAnalysis} disabled={isDisabled} className={`h-[84px] px-6 rounded-xl font-bold shadow-lg transition flex flex-col items-center justify-center w-full lg:w-48 whitespace-nowrap ${isDisabled ? 'bg-slate-200 text-slate-400 shadow-none' : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/30 transform hover:-translate-y-1'}`}>
                                {isLoading ? <RefreshCw className="mb-1 animate-spin" size={24} /> : <BrainCircuit size={24} className="mb-1" />}
                                <span className="text-sm">{buttonLabel}</span>
                            </button>
                        </div>
                    </div>

                    {Object.entries(groupedMatches).length > 0 && !isLoading && (
                        <div className="grid grid-cols-1 gap-8">
                            {Object.entries(groupedMatches).map(([leadId, opportunities]: [string, AiMatchOpportunity[]]) => {
                                const lead = getLead(leadId);
                                if (!lead) return null;
                                return (
                                    <div key={leadId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm"><User size={24} /></div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-800">{lead.name}</h3>
                                                    <p className="text-sm text-slate-500">{lead.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {opportunities.map((opp, idx) => {
                                                const property = getProperty(opp.propertyId);
                                                if (!property) return null;
                                                const waLink = getWhatsAppLink(lead, property);
                                                return (
                                                    <div key={idx} className="p-6 hover:bg-slate-50/50 transition">
                                                        <div className="flex flex-col lg:flex-row gap-6">
                                                            <div className="flex gap-4 w-full lg:w-1/2">
                                                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 bg-slate-100 shadow-sm">
                                                                    <img src={property.images?.[0] || 'https://via.placeholder.com/400'} alt={property.title} className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{property.type}</span>
                                                                        {opp.matchScore >= 90 && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center"><Percent size={10} className="mr-1"/> {opp.matchScore}% Match</span>}
                                                                    </div>
                                                                    <h4 className="font-bold text-slate-800 text-sm md:text-base truncate flex items-center">
                                                                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mr-2 border border-slate-200 flex-shrink-0">
                                                                            #{property.code?.toString().padStart(5, '0')}
                                                                        </span>
                                                                        {property.title}
                                                                    </h4>
                                                                    <p className="text-blue-600 font-bold text-base mt-1">{formatCurrency(property.price)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 flex flex-col justify-center">
                                                                <p className="text-xs font-bold text-purple-600 uppercase mb-1">Motivo do Match</p>
                                                                <p className="text-sm text-slate-600 italic leading-relaxed">"{opp.reason}"</p>
                                                            </div>
                                                            <div className="w-full lg:w-48 flex flex-col justify-center gap-2">
                                                                {opp.status === 'accepted' ? (
                                                                    <div className="w-full bg-green-50 border border-green-200 text-green-700 py-3 rounded-lg text-center font-bold text-xs uppercase">Enviado</div>
                                                                ) : (
                                                                    <>
                                                                        {waLink ? <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={() => handleAcceptOpportunity(opp)} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center text-sm no-underline"><MessageCircle size={16} className="mr-2" /> Oferecer</a> : <button className="w-full py-2.5 bg-slate-200 text-slate-400 font-bold rounded-lg cursor-not-allowed text-sm">Sem WhatsApp</button>}
                                                                        <button onClick={() => handleDismissOpportunity(opp.leadId, opp.propertyId)} className="w-full py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium rounded-lg transition text-sm">Descartar</button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'stale' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800">Recuperação de Leads</h3>
                            <p className="text-slate-500 text-sm">A IA analisa leads sem interações recentes para sugerir reativações.</p>
                        </div>
                        <button onClick={handleRunAnalysis} disabled={isDisabled} className={`h-[84px] px-6 rounded-xl font-bold shadow-lg transition flex flex-col items-center justify-center w-full lg:w-48 whitespace-nowrap ${isDisabled ? 'bg-slate-200 text-slate-400 shadow-none' : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/30 transform hover:-translate-y-1'}`}>
                            {isLoading ? <RefreshCw className="mb-1 animate-spin" size={24} /> : <BrainCircuit size={24} className="mb-1" />}
                            <span className="text-sm">{buttonLabel}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {safeAiStaleLeads.length > 0 ? safeAiStaleLeads.map((opp, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${opp.daysInactive > 30 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}><AlertTriangle size={20} /></div>
                                        <div><h3 className="font-bold text-slate-800">{opp.name}</h3><p className="text-xs text-slate-500">{opp.info}</p></div>
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 rounded border bg-slate-50">{opp.daysInactive} dias off</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg mb-4 flex-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Análise</p>
                                    <p className="text-sm text-slate-600 italic">"{opp.analysis}"</p>
                                </div>
                                <button onClick={() => handleReactivateLead(opp.id, opp.suggestion)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center shadow-sm">
                                    <MessageCircle size={18} className="mr-2"/> Reativar no WhatsApp
                                </button>
                            </div>
                        )) : <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">Tudo em dia! Clique em Executar Análise para verificar.</div>}
                    </div>
                </div>
            )}

            {activeTab === 'marketing' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
                            <div className="relative w-full max-w-lg" ref={dropdownRef}>
                                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full !bg-white border border-slate-300 text-slate-900 rounded-xl pl-4 pr-4 py-3 outline-none transition shadow-sm cursor-pointer flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Building2 className={`text-slate-400 flex-shrink-0 ${selectedMarketingProp ? 'hidden' : 'block'}`} size={18} />
                                        {selectedMarketingProp ? (
                                            <>
                                                {selectedMarketingProp.images?.[0] && <img src={selectedMarketingProp.images[0]} className="w-8 h-8 rounded object-cover flex-shrink-0 border border-slate-200" alt="" />}
                                                <div className="flex flex-col truncate">
                                                    <span className="font-bold text-sm truncate">{selectedMarketingProp.title}</span>
                                                    <span className="text-xs text-slate-500 font-mono">#{selectedMarketingProp.code}</span>
                                                </div>
                                            </>
                                        ) : <span className="text-slate-500">Selecione um Imóvel...</span>}
                                    </div>
                                    <ChevronDown size={16} className="text-slate-400 flex-shrink-0 ml-2" />
                                </div>

                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 !bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                        {activeProperties.length > 0 ? activeProperties.map(p => (
                                            <div key={p.id} onClick={() => { setMarketingPropertyId(p.id); setIsDropdownOpen(false); }} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition">
                                                <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                                                    <img src={p.images?.[0] || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold !text-slate-800 truncate">{p.title}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">#{p.code}</span>
                                                        <span className="text-xs text-slate-500 truncate">{p.neighborhood}</span>
                                                    </div>
                                                </div>
                                                {marketingPropertyId === p.id && <Check size={16} className="text-green-600 mr-1" />}
                                            </div>
                                        )) : <div className="p-4 text-center text-slate-500 text-sm">Nenhum imóvel ativo.</div>}
                                    </div>
                                )}
                            </div>
                            
                            <button onClick={handleGenerateMarketing} disabled={!marketingPropertyId || isMarketingLoading || isApiKeyMissing} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center disabled:opacity-50 shadow-lg shadow-green-500/20 whitespace-nowrap min-w-[240px]">
                                {isMarketingLoading ? <RefreshCw className="animate-spin mr-2" size={20}/> : <Megaphone className="mr-2" size={20}/>}
                                {isMarketingLoading ? 'Gerando...' : 'Gerar estratégia de marketing'}
                            </button>
                        </div>

                        {marketingResult ? (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                {/* TEXTOS COMERCIAIS */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                        <FileText className="mr-2 text-green-600" size={20} /> Textos Comerciais
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {marketingResult.texts.map((item, index) => (
                                            <div key={index} className="bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm hover:shadow-md transition overflow-hidden">
                                                <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-700 uppercase">{item.tone}</span>
                                                    <button onClick={() => copyToClipboard(item.content, index)} className={`p-1.5 rounded-lg transition ${copiedIndex === index ? 'bg-green-100 text-green-700' : 'bg-white text-slate-400 hover:text-blue-600 border border-slate-200'}`}>{copiedIndex === index ? <Check size={16} /> : <Copy size={16} />}</button>
                                                </div>
                                                <div className="p-5 text-sm text-slate-700 leading-relaxed flex-1 whitespace-pre-wrap">{item.content}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ESTRATÉGIAS E PÚBLICO */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6">
                                        <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                                            <TrendingUp className="mr-2" size={20} /> Estratégias de Divulgação
                                        </h3>
                                        <ul className="space-y-3">
                                            {marketingResult.strategies.map((s, i) => (
                                                <li key={i} className="flex items-start text-sm text-blue-900 font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-3 flex-shrink-0"></div>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-purple-50/50 rounded-2xl border border-purple-100 p-6">
                                        <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                                            <Target className="mr-2" size={20} /> Público-Alvo Ideal
                                        </h3>
                                        <ul className="space-y-3">
                                            {marketingResult.targetAudience.map((t, i) => (
                                                <li key={i} className="flex items-start text-sm text-purple-900 font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-3 flex-shrink-0"></div>
                                                    {t}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* DICAS WHATSAPP */}
                                <div className="bg-green-50/30 rounded-2xl border border-green-100 p-6">
                                    <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                                        <MessageSquare className="mr-2" size={20} /> Dicas Comerciais para WhatsApp
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {marketingResult.whatsappTips.map((tip, i) => (
                                            <div key={i} className="bg-white border border-green-100 p-4 rounded-xl text-sm text-green-900 shadow-sm flex items-start">
                                                <span className="text-green-500 font-bold mr-3">{i+1}.</span>
                                                {tip}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-slate-400">
                                <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Selecione um imóvel e clique em "Gerar estratégia de marketing" para começar.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-240px)]">
                        <div className="p-4 bg-white border-b border-slate-100">
                            <form onSubmit={handleChatSubmit} className="relative">
                                <input type="text" value={chatQuery} onChange={(e) => setChatQuery(e.target.value)} placeholder="Tire sua dúvida imobiliária aqui..." className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-4 pl-5 pr-14 outline-none focus:ring-2 focus:ring-blue-500 transition !bg-white !text-slate-900" disabled={isChatLoading} />
                                <button type="submit" disabled={!chatQuery.trim() || isChatLoading} className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition disabled:opacity-50"><Send size={20} /></button>
                            </form>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6">
                            {chatResponse && (
                                <div className="flex items-start max-w-3xl">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-1"><Bot size={16} /></div>
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{chatResponse}</div>
                                </div>
                            )}
                            {isChatLoading && <div className="flex items-center text-slate-400 text-sm ml-12"><RefreshCw className="animate-spin mr-2" size={16} /> Analisando...</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
