
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, BrainCircuit, User, Building2, ArrowRight, MessageCircle, RefreshCw, AlertCircle, Percent, Clock, CheckCircle, XCircle, AlertTriangle, Search, Bot, BookOpen, Lock, ChevronDown, ChevronUp, MapPin, DollarSign, X, Filter, Settings2, PenTool, Copy, Check, FileText, TrendingUp, Share2, Wand2, Zap, Send } from 'lucide-react';
import { findOpportunities, analyzeStaleLeads, askRealEstateAgent, isAiConfigured, getDebugInfo, generateMarketingCopy, MarketingCopyResult } from '../services/geminiService';
import { AiMatchOpportunity, Lead, Property, LeadStatus, AiStaleLeadOpportunity } from '../types';

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

    // Chat State
    const [chatQuery, setChatQuery] = useState('');
    const [chatResponse, setChatResponse] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    
    // Marketing Generator State
    const [marketingPropertyId, setMarketingPropertyId] = useState('');
    const [marketingResults, setMarketingResults] = useState<MarketingCopyResult[]>([]);
    const [isMarketingLoading, setIsMarketingLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Novo estado para o dropdown customizado
    const dropdownRef = useRef<HTMLDivElement>(null); // Ref para fechar ao clicar fora

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
                // Dia diferente, reseta
                setQuestionsUsed(0);
                localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify({ date: today, count: 0 }));
            } else {
                setQuestionsUsed(savedData.count || 0);
            }
        };
        checkChatLimit();

        // Fechar dropdown ao clicar fora
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);

    }, [currentUser]);

    const handleTargetLeadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTargetLeadId(e.target.value);
        if (e.target.value) setTargetPropertyId(''); // Mutual exclusive
    };

    const handleTargetPropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTargetPropertyId(e.target.value);
        if (e.target.value) setTargetLeadId(''); // Mutual exclusive
    };

    const handleRunAnalysis = async () => {
        if (isApiKeyMissing) {
            alert("Erro: API Key não configurada. Verifique o painel de diagnóstico na tela.");
            return;
        }

        const isManualRun = targetLeadId || targetPropertyId;
        
        if (!canRunToday && !isSuperAdmin && !isManualRun) return;

        setIsLoading(true);
        try {
            let leadsToAnalyze = leads;
            let propertiesToAnalyze = properties;

            if (targetLeadId) {
                leadsToAnalyze = leads.filter(l => l.id === targetLeadId);
            } else if (targetPropertyId) {
                propertiesToAnalyze = properties.filter(p => p.id === targetPropertyId);
            }

            const promises: Promise<any>[] = [findOpportunities(leadsToAnalyze, propertiesToAnalyze)];
            
            if (!isManualRun) {
                promises.push(analyzeStaleLeads(leads));
            }

            const results = await Promise.all(promises);
            const matches = results[0];
            const staleLeads = results[1];

            const sortedMatches = matches
                .sort((a: AiMatchOpportunity, b: AiMatchOpportunity) => b.matchScore - a.matchScore)
                .map((m: AiMatchOpportunity) => ({ ...m, status: 'pending' as const }));
            
            setAiOpportunities(sortedMatches);

            if (staleLeads) {
                setAiStaleLeads(staleLeads);
            }
            
            if (!isManualRun) {
                const today = new Date().toLocaleDateString('pt-BR');
                localStorage.setItem(STORAGE_KEY_RUN, today);
                setCanRunToday(false);
            }

            setActiveTab('matches');

        } catch (error) {
            console.error("Erro ao gerar análises", error);
            alert("Não foi possível realizar a análise completa no momento.");
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
            } else {
                alert("Lead sem telefone válido.");
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
            alert("Você atingiu o limite de 3 perguntas por dia. Volte amanhã!");
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
            setChatResponse('Desculpe, não consegui processar sua pergunta agora.');
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleGenerateMarketing = async () => {
        if (!marketingPropertyId) {
            alert("Selecione um imóvel primeiro.");
            return;
        }
        const property = properties.find(p => p.id === marketingPropertyId);
        if (!property) return;

        setIsMarketingLoading(true);
        setMarketingResults([]); // Limpa resultados anteriores
        try {
            const results = await generateMarketingCopy(property);
            if (!results || results.length === 0) {
                throw new Error("Nenhum texto gerado");
            }
            setMarketingResults(results);
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar textos. Verifique sua conexão ou tente outro imóvel.");
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

    const groupedMatches = (aiOpportunities || [])
        .filter(opp => opp.status !== 'dismissed') 
        .reduce((groups, opp) => {
            const leadId = opp.leadId;
            if (!groups[leadId]) {
                groups[leadId] = [];
            }
            groups[leadId].push(opp);
            return groups;
        }, {} as Record<string, AiMatchOpportunity[]>);

    const hasMatches = Object.keys(groupedMatches).length > 0;
    const safeAiStaleLeads = (aiStaleLeads || []) as AiStaleLeadOpportunity[];
    const hasStale = safeAiStaleLeads.length > 0;
    const hasAnyResults = (aiOpportunities || []).length > 0 || hasStale;
    const questionsRemaining = MAX_QUESTIONS_PER_DAY - questionsUsed;

    const getWhatsAppLink = (lead: Lead | undefined, property: Property | undefined) => {
        if (!lead?.phone || !property) return null;
        const phone = lead.phone.replace(/\D/g, '');
        if (phone.length < 10) return null;
        
        const firstName = lead.name.split(' ')[0];
        const message = `Olá ${firstName}! Tudo bem? Apareceu uma excelente oportunidade para você. Encontramos um imóvel no seu perfil: *${property.title}* em ${property.neighborhood}. Gostaria de ver as fotos?`;
        return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    }

    const isManualRun = !!(targetLeadId || targetPropertyId);
    const isDisabled = isApiKeyMissing || isLoading || (!isSuperAdmin && !canRunToday && hasAnyResults && !isManualRun);
    
    let buttonLabel = 'Executar Análise IA';
    if (isApiKeyMissing) buttonLabel = 'IA Desativada';
    else if (isLoading) buttonLabel = 'Analisando...';
    else if (targetLeadId) buttonLabel = 'Encontrar Imóveis';
    else if (targetPropertyId) buttonLabel = 'Encontrar Clientes';
    else if (!isSuperAdmin && !canRunToday && hasAnyResults) buttonLabel = 'Análise de Hoje Concluída';
    else if (hasAnyResults) buttonLabel = 'Gerar Novamente';

    // Helper para o dropdown customizado
    const activeProperties = properties.filter(p => p.status === 'Active');
    const selectedMarketingProp = activeProperties.find(p => p.id === marketingPropertyId);

    return (
        <div className="p-4 md:p-8 h-screen overflow-y-auto bg-slate-50">
            {isApiKeyMissing && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
                        <div className="flex-1">
                            <h3 className="text-amber-800 font-bold">Diagnóstico de API Key</h3>
                            <p className="text-amber-700 text-sm mt-1">
                                O sistema não detectou a chave da Inteligência Artificial.
                            </p>
                            <div className="mt-3 bg-white/60 p-3 rounded text-xs font-mono text-amber-900 border border-amber-200 shadow-sm">
                                <p className="mb-1"><strong>Status das Variáveis:</strong></p>
                                <p>VITE_API_KEY detectada? {debugInfo?.viteEnv ? '✅ SIM' : '❌ NÃO'}</p>
                                <p>process.env.API_KEY detectada? {debugInfo?.processEnv ? '✅ SIM' : '❌ NÃO'}</p>
                                <p className="mt-1">Comprimento da chave lida: {debugInfo?.keyLength || 0} caracteres</p>
                            </div>
                            <p className="text-amber-700 text-xs mt-3">
                                <strong>Solução (Vercel):</strong> Vá em Settings {'>'} Environment Variables. Adicione <code>VITE_API_KEY</code>. Depois vá em Deployments e clique em <strong>Redeploy</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center">
                    <Sparkles className="mr-3 text-purple-600" size={32} />
                    Consultor IA
                </h1>
                <p className="text-slate-500 text-sm md:text-base mt-1">
                    Inteligência para encontrar oportunidades, recuperar clientes e criar marketing.
                </p>
            </div>

            <div className="flex space-x-4 mb-6 border-b border-slate-200 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('matches')}
                    className={`pb-3 px-4 font-bold text-sm transition relative whitespace-nowrap ${activeTab === 'matches' ? 'text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Oportunidades ({Object.keys(groupedMatches).length} clientes)
                    {activeTab === 'matches' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('stale')}
                    className={`pb-3 px-4 font-bold text-sm transition relative whitespace-nowrap ${activeTab === 'stale' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Recuperação de Leads ({safeAiStaleLeads.length})
                    {activeTab === 'stale' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('marketing')}
                    className={`pb-3 px-4 font-bold text-sm transition relative whitespace-nowrap flex items-center ${activeTab === 'marketing' ? 'text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Gerador de Textos
                    {activeTab === 'marketing' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`pb-3 px-4 font-bold text-sm transition relative whitespace-nowrap flex items-center ${activeTab === 'chat' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Tira-Dúvidas Imobiliário
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${questionsRemaining === 0 && !isSuperAdmin ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isSuperAdmin ? '∞' : `${questionsUsed}/${MAX_QUESTIONS_PER_DAY}`}
                    </span>
                    {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                </button>
            </div>

            {/* TAB: OPORTUNIDADES (Matches) */}
            {activeTab === 'matches' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    {/* Painel de Controle de Busca */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                <Zap className="mr-2 text-purple-600" size={20} />
                                Configurar Busca
                            </h2>
                            {!targetLeadId && !targetPropertyId && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
                                    Modo: Varredura Geral
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-col lg:flex-row gap-4 items-end">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                                {/* Opção 1: Cliente */}
                                <div className={`relative p-3 rounded-xl border-2 transition ${targetLeadId ? 'border-purple-500 bg-purple-50' : 'border-slate-100 bg-slate-50'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            <User size={14} className="mr-1"/> 1. Por Cliente
                                        </label>
                                        {targetLeadId && <CheckCircle size={14} className="text-purple-600"/>}
                                    </div>
                                    <div className="relative">
                                        <select 
                                            className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 appearance-none text-slate-700"
                                            value={targetLeadId}
                                            onChange={handleTargetLeadChange}
                                        >
                                            <option value="">Selecione para focar...</option>
                                            {leads.map(l => (
                                                <option key={l.id} value={l.id}>{l.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                                        {targetLeadId && (
                                            <button onClick={() => setTargetLeadId('')} className="absolute right-8 top-3 text-slate-400 hover:text-red-500">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 leading-tight">Encontra imóveis ideais para este cliente específico.</p>
                                </div>

                                {/* Opção 2: Imóvel */}
                                <div className={`relative p-3 rounded-xl border-2 transition ${targetPropertyId ? 'border-purple-500 bg-purple-50' : 'border-slate-100 bg-slate-50'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            <Building2 size={14} className="mr-1"/> 2. Por Imóvel
                                        </label>
                                        {targetPropertyId && <CheckCircle size={14} className="text-purple-600"/>}
                                    </div>
                                    <div className="relative">
                                        <select 
                                            className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 appearance-none text-slate-700"
                                            value={targetPropertyId}
                                            onChange={handleTargetPropertyChange}
                                        >
                                            <option value="">Selecione para focar...</option>
                                            {properties.filter(p => p.status === 'Active').map(p => (
                                                <option key={p.id} value={p.id}>{p.title}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                                        {targetPropertyId && (
                                            <button onClick={() => setTargetPropertyId('')} className="absolute right-8 top-3 text-slate-400 hover:text-red-500">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 leading-tight">Encontra leads compradores para este imóvel.</p>
                                </div>
                            </div>

                            {/* Opção 3: Botão de Ação (Geral ou Específico) */}
                            <button 
                                onClick={handleRunAnalysis}
                                disabled={isDisabled} 
                                className={`
                                    h-[84px] px-6 rounded-xl font-bold shadow-lg transition flex flex-col items-center justify-center w-full lg:w-48 whitespace-nowrap flex-shrink-0
                                    ${isDisabled 
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                        : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/30 transform hover:-translate-y-1'
                                    }
                                `}
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="mb-1 animate-spin" size={24} />
                                        <span className="text-sm">Analisando...</span>
                                    </>
                                ) : (
                                    <>
                                        {targetLeadId || targetPropertyId ? <Search size={24} className="mb-1" /> : <BrainCircuit size={24} className="mb-1" />}
                                        <span className="text-sm">{buttonLabel}</span>
                                        {!targetLeadId && !targetPropertyId && <span className="text-[10px] font-normal opacity-70">Opção 3: Varredura Completa</span>}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Estados Vazios */}
                    {!hasAnyResults && !isLoading && (canRunToday || isSuperAdmin) && (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200 border-dashed opacity-75">
                            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                                <Sparkles size={32} className="text-purple-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">Aguardando Análise</h3>
                            <p className="text-slate-500 text-center max-w-sm text-sm">
                                Selecione uma das 3 opções acima para iniciar a inteligência artificial.
                            </p>
                        </div>
                    )}

                    {/* Resultados */}
                    {hasMatches && !isLoading && (
                        <div className="grid grid-cols-1 gap-8 animate-in fade-in">
                            {Object.entries(groupedMatches).map(([leadId, opportunities]: [string, AiMatchOpportunity[]]) => {
                                const lead = getLead(leadId);
                                if (!lead) return null;

                                return (
                                    <div key={leadId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Cliente</p>
                                                    <h3 className="text-xl font-bold text-slate-800">{lead.name}</h3>
                                                    <div className="flex items-center text-sm text-slate-500 mt-1">
                                                        <span className="flex items-center mr-3"><MessageCircle size={14} className="mr-1"/> {lead.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                                <span className="text-purple-600 font-bold">{opportunities.length}</span> <span className="text-slate-600 text-sm">sugestões de imóvel</span>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {opportunities.map((opp, idx) => {
                                                const property = getProperty(opp.propertyId);
                                                const status = opp.status || 'pending';
                                                const waLink = getWhatsAppLink(lead, property);
                                                
                                                if (!property) return null;

                                                return (
                                                    <div key={`${opp.propertyId}-${idx}`} className="p-6 hover:bg-slate-50/50 transition">
                                                        <div className="flex flex-col lg:flex-row gap-6">
                                                            <div className="flex gap-4 w-full lg:w-1/3">
                                                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 bg-slate-100">
                                                                    <img 
                                                                        src={property.images?.[0] || 'https://via.placeholder.com/400'} 
                                                                        alt={property.title} 
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0 py-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{property.type}</span>
                                                                        {opp.matchScore >= 90 && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center"><Percent size={10} className="mr-1"/> {opp.matchScore}% Match</span>}
                                                                    </div>
                                                                    <h4 className="font-bold text-slate-800 text-sm sm:text-base leading-tight mb-1 truncate">{property.title}</h4>
                                                                    <p className="text-slate-500 text-xs sm:text-sm flex items-center mb-2"><MapPin size={12} className="mr-1"/> {property.neighborhood}</p>
                                                                    <p className="text-blue-600 font-bold text-base sm:text-lg">{formatCurrency(property.price)}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 lg:border-l lg:border-slate-100 lg:pl-6 flex flex-col justify-center">
                                                                <p className="text-xs font-bold text-purple-600 uppercase mb-2 flex items-center">
                                                                    <Sparkles size={12} className="mr-1" /> Motivo da Sugestão
                                                                </p>
                                                                <p className="text-sm text-slate-600 italic bg-purple-50/50 p-3 rounded-lg border border-purple-50">
                                                                    "{opp.reason}"
                                                                </p>
                                                            </div>

                                                            <div className="w-full lg:w-48 flex flex-col justify-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                                                                {status === 'accepted' ? (
                                                                    <div className="w-full bg-green-50 border border-green-200 text-green-700 py-3 rounded-lg flex flex-col items-center justify-center text-center animate-in zoom-in">
                                                                        <CheckCircle size={24} className="mb-1"/>
                                                                        <span className="text-xs font-bold uppercase">Enviado</span>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        {waLink ? (
                                                                            <a 
                                                                                href={waLink}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={() => handleAcceptOpportunity(opp)}
                                                                                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center text-sm no-underline"
                                                                            >
                                                                                <MessageCircle size={16} className="mr-2" /> Oferecer
                                                                            </a>
                                                                        ) : (
                                                                            <button 
                                                                                onClick={() => alert("O lead não possui telefone cadastrado ou inválido.")}
                                                                                className="w-full py-2.5 bg-slate-200 text-slate-400 font-bold rounded-lg cursor-not-allowed flex items-center justify-center text-sm"
                                                                            >
                                                                                <MessageCircle size={16} className="mr-2" /> Sem Telefone
                                                                            </button>
                                                                        )}
                                                                        
                                                                        <button 
                                                                            onClick={() => handleDismissOpportunity(opp.leadId, opp.propertyId)}
                                                                            className="w-full py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium rounded-lg transition text-sm"
                                                                        >
                                                                            Descartar
                                                                        </button>
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

            {/* TAB: STALE LEADS (Recuperação) */}
            {activeTab === 'stale' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {safeAiStaleLeads.length > 0 ? (
                            safeAiStaleLeads.map((opp, idx) => {
                                const lead = getLead(opp.leadId);
                                if (!lead) return null;
                                const isUrgent = opp.daysInactive > 30;

                                return (
                                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    <AlertTriangle size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800">{lead.name}</h3>
                                                    <p className="text-xs text-slate-500 font-medium">{opp.currentStatus}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded border ${isUrgent ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                {opp.daysInactive} dias off
                                            </span>
                                        </div>

                                        <div className="bg-slate-50 p-3 rounded-lg mb-4 flex-1">
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Análise da IA</p>
                                            <p className="text-sm text-slate-600 italic">"{opp.analysis}"</p>
                                        </div>

                                        <button 
                                            onClick={() => handleReactivateLead(lead.id, opp.reactivationMessage)}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center shadow-sm"
                                        >
                                            <MessageCircle size={18} className="mr-2"/> Reativar no WhatsApp
                                        </button>
                                        <p className="text-[10px] text-slate-400 text-center mt-2">
                                            Clique para abrir a mensagem sugerida
                                        </p>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} className="text-green-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700">Tudo em dia!</h3>
                                <p className="text-slate-500 text-sm mt-1">Nenhum lead parado encontrado recentemente.</p>
                                <button onClick={handleRunAnalysis} className="mt-4 text-blue-600 font-bold hover:underline text-sm">
                                    Forçar nova análise
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: MARKETING GENERATOR */}
            {activeTab === 'marketing' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
                        
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
                            <div className="relative w-full max-w-lg" ref={dropdownRef}>
                                {/* Trigger do Dropdown */}
                                <div 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pl-4 pr-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition shadow-sm cursor-pointer flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Building2 className={`text-slate-400 flex-shrink-0 ${selectedMarketingProp ? 'hidden' : 'block'}`} size={18} />
                                        {selectedMarketingProp ? (
                                            <>
                                                {selectedMarketingProp.images?.[0] && (
                                                    <img src={selectedMarketingProp.images[0]} className="w-8 h-8 rounded object-cover flex-shrink-0 border border-slate-200" alt="" />
                                                )}
                                                <div className="flex flex-col truncate">
                                                    <span className="font-bold text-sm truncate">{selectedMarketingProp.title}</span>
                                                    <span className="text-xs text-slate-500 font-mono">#{selectedMarketingProp.code}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-slate-500">Selecione um Imóvel...</span>
                                        )}
                                    </div>
                                    <ChevronDown size={16} className="text-slate-400 flex-shrink-0 ml-2" />
                                </div>

                                {/* Lista do Dropdown */}
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                        {activeProperties.length > 0 ? (
                                            activeProperties.map(p => (
                                                <div 
                                                    key={p.id} 
                                                    onClick={() => {
                                                        setMarketingPropertyId(p.id);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition"
                                                >
                                                    <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                                                        <img src={p.images?.[0] || 'https://via.placeholder.com/100'} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 truncate">{p.title}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">#{p.code}</span>
                                                            <span className="text-xs text-slate-500 truncate">{p.neighborhood}</span>
                                                        </div>
                                                    </div>
                                                    {marketingPropertyId === p.id && <Check size={16} className="text-green-600 mr-1" />}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-slate-500 text-sm">Nenhum imóvel ativo.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                onClick={handleGenerateMarketing}
                                disabled={!marketingPropertyId || isMarketingLoading || isApiKeyMissing}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 whitespace-nowrap min-w-[180px]"
                            >
                                {isMarketingLoading ? <RefreshCw className="animate-spin mr-2" size={20}/> : <Wand2 className="mr-2" size={20}/>}
                                {isMarketingLoading ? 'Gerando...' : 'Gerar 5 Textos'}
                            </button>
                        </div>

                        {marketingResults.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in zoom-in-95">
                                {marketingResults.map((result, index) => (
                                    <div key={index} className="bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm hover:shadow-md transition group overflow-hidden">
                                        <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center">
                                                <span className="text-lg mr-2">{(result.emojis || '📝').split(' ')[0]}</span> 
                                                {result.tone}
                                            </span>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => copyToClipboard(result.text, index)}
                                                    className={`p-1.5 rounded-lg transition ${copiedIndex === index ? 'bg-green-100 text-green-700' : 'bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'}`}
                                                    title="Copiar"
                                                >
                                                    {copiedIndex === index ? <Check size={16} /> : <Copy size={16} />}
                                                </button>
                                                <button 
                                                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(result.text)}`, '_blank')}
                                                    className="p-1.5 rounded-lg bg-white text-slate-400 hover:text-green-600 hover:bg-green-50 border border-slate-200 transition"
                                                    title="WhatsApp"
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-5 text-sm text-slate-700 leading-relaxed flex-1 whitespace-pre-wrap font-sans">
                                            {result.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-slate-500 font-medium">Nenhum texto gerado ainda.</h3>
                                <p className="text-slate-400 text-sm mt-1">Selecione um imóvel acima e clique em "Gerar 5 Textos".</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: CHAT (Tira-Dúvidas) */}
            {activeTab === 'chat' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px] md:h-[calc(100vh-240px)]">
                        
                        {/* Input Area (Moved to Top) */}
                        <div className="p-4 bg-white border-b border-slate-100">
                            <form onSubmit={handleChatSubmit} className="relative">
                                <input 
                                    type="text" 
                                    value={chatQuery}
                                    onChange={(e) => setChatQuery(e.target.value)}
                                    placeholder="Ex: Quais documentos preciso para financiar um imóvel usado?"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl py-4 pl-5 pr-14 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition shadow-sm"
                                    disabled={isChatLoading}
                                />
                                <button 
                                    type="submit" 
                                    disabled={!chatQuery.trim() || isChatLoading}
                                    className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                            <p className="text-center text-xs text-slate-400 mt-2">
                                A IA pode cometer erros. Verifique informações críticas.
                            </p>
                        </div>

                        {/* Chat Content */}
                        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6">
                            {/* Intro Message */}
                            <div className="flex items-start max-w-3xl">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                                    <Bot size={16} />
                                </div>
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-slate-700 text-sm leading-relaxed">
                                    <p>Olá! Sou sua IA especializada. Posso ajudar com:</p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
                                        <li>Dúvidas sobre documentação (ITBI, Escritura, Registro)</li>
                                        <li>Estratégias para fechar com clientes difíceis</li>
                                        <li>Análise de mercado baseada nos seus imóveis cadastrados</li>
                                        <li>Sugestões de financiamento (MCMV, SBPE)</li>
                                    </ul>
                                </div>
                            </div>

                            {/* User Question */}
                            {chatQuery && chatResponse && (
                                <div className="flex items-start justify-end max-w-3xl ml-auto">
                                    <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm text-sm leading-relaxed">
                                        {chatQuery}
                                    </div>
                                    <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center flex-shrink-0 ml-3 mt-1">
                                        <User size={16} />
                                    </div>
                                </div>
                            )}

                            {/* AI Answer */}
                            {chatResponse && (
                                <div className="flex items-start max-w-3xl">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                                        <Bot size={16} />
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                        {chatResponse}
                                    </div>
                                </div>
                            )}

                            {isChatLoading && (
                                <div className="flex items-center text-slate-400 text-sm ml-12">
                                    <RefreshCw className="animate-spin mr-2" size={16} />
                                    Consultando base de conhecimento...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
