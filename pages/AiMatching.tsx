
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, BrainCircuit, User, Building2, ArrowRight, MessageCircle, RefreshCw, AlertCircle, Percent, Clock, CheckCircle, XCircle, AlertTriangle, Search, Bot, BookOpen, Lock, ChevronDown, ChevronUp, MapPin, DollarSign, X, Filter } from 'lucide-react';
import { findOpportunities, analyzeStaleLeads, askRealEstateAgent } from '../services/geminiService';
import { AiMatchOpportunity, Lead, Property, LeadStatus, AiStaleLeadOpportunity } from '../types';

export const AiMatching: React.FC = () => {
    const { leads, properties, updateLeadInterestStatus, currentUser, aiOpportunities, setAiOpportunities, aiStaleLeads, setAiStaleLeads, isSuperAdmin } = useApp();
    
    const [isLoading, setIsLoading] = useState(false);
    const [canRunToday, setCanRunToday] = useState(true);
    const [activeTab, setActiveTab] = useState<'matches' | 'stale' | 'chat'>('matches');

    // Analysis Filters
    const [targetLeadId, setTargetLeadId] = useState('');
    const [targetPropertyId, setTargetPropertyId] = useState('');

    // Chat State
    const [chatQuery, setChatQuery] = useState('');
    const [chatResponse, setChatResponse] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    
    // Chat Limit State
    const MAX_QUESTIONS_PER_DAY = 3;
    const [questionsUsed, setQuestionsUsed] = useState(0);

    const STORAGE_KEY_RUN = `imob_ai_last_run_${currentUser?.id}`;
    const STORAGE_KEY_CHAT = `imob_ai_chat_limit_${currentUser?.id}`;

    useEffect(() => {
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
        // Permite rodar se for Super Admin OU se ainda não rodou hoje OU se for uma análise específica (manual)
        const isManualRun = targetLeadId || targetPropertyId;
        
        if (!canRunToday && !isSuperAdmin && !isManualRun) return;

        setIsLoading(true);
        try {
            // Filtragem inteligente baseada nos seletores
            let leadsToAnalyze = leads;
            let propertiesToAnalyze = properties;

            if (targetLeadId) {
                leadsToAnalyze = leads.filter(l => l.id === targetLeadId);
                // Analisa contra todos os imóveis
            } else if (targetPropertyId) {
                propertiesToAnalyze = properties.filter(p => p.id === targetPropertyId);
                // Analisa contra todos os leads
            }

            // Se for análise global, roda stale leads também. Se for específica, foca apenas em opportunities.
            const promises: Promise<any>[] = [findOpportunities(leadsToAnalyze, propertiesToAnalyze)];
            
            if (!isManualRun) {
                promises.push(analyzeStaleLeads(leads));
            }

            const results = await Promise.all(promises);
            const matches = results[0];
            const staleLeads = results[1]; // Pode ser undefined se for manual run

            // Processa Matches
            const sortedMatches = matches
                .sort((a: AiMatchOpportunity, b: AiMatchOpportunity) => b.matchScore - a.matchScore)
                .map((m: AiMatchOpportunity) => ({ ...m, status: 'pending' as const }));
            
            // Se for manual, substituimos ou adicionamos? Vamos substituir a view atual para focar no resultado.
            setAiOpportunities(sortedMatches);

            if (staleLeads) {
                setAiStaleLeads(staleLeads);
            }
            
            if (!isManualRun) {
                const today = new Date().toLocaleDateString('pt-BR');
                localStorage.setItem(STORAGE_KEY_RUN, today);
                setCanRunToday(false);
            }

            // Troca para tab de matches se tiver resultados
            setActiveTab('matches');

        } catch (error) {
            console.error("Erro ao gerar análises", error);
            alert("Não foi possível realizar a análise completa no momento.");
        } finally {
            setIsLoading(false);
        }
    };

    // Ação ao clicar no link do WhatsApp: Apenas atualiza o estado, pois o link 'href' abre a janela
    const handleAcceptOpportunity = async (opp: AiMatchOpportunity) => {
        // Toca som
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});

        // Atualiza UI imediatamente para "Enviado"
        const updatedOpps = aiOpportunities.map(o => 
            (o.leadId === opp.leadId && o.propertyId === opp.propertyId) 
            ? { ...o, status: 'accepted' as const } 
            : o
        );
        setAiOpportunities(updatedOpps);

        // Atualiza Banco de Dados em background (marca imóvel como interesse Novo)
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
        
        // Permite se for Super Admin OU se ainda tiver perguntas
        if (!isSuperAdmin && questionsUsed >= MAX_QUESTIONS_PER_DAY) {
            alert("Você atingiu o limite de 3 perguntas por dia. Volte amanhã!");
            return;
        }

        setIsChatLoading(true);
        setChatResponse('');
        
        try {
            const answer = await askRealEstateAgent(chatQuery);
            setChatResponse(answer);
            
            // Incrementa contador
            const newCount = questionsUsed + 1;
            setQuestionsUsed(newCount);
            
            // Salva no localStorage
            const today = new Date().toLocaleDateString('pt-BR');
            localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify({ date: today, count: newCount }));

        } catch (e) {
            setChatResponse('Desculpe, não consegui processar sua pergunta agora.');
        } finally {
            setIsChatLoading(false);
        }
    };

    const getLead = (id: string): Lead | undefined => leads.find(l => l.id === id);
    const getProperty = (id: string): Property | undefined => properties.find(p => p.id === id);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    // Group Opportunities by Lead ID
    const groupedMatches = (aiOpportunities || [])
        .filter(opp => opp.status !== 'dismissed') // Filter out dismissed from view
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
    
    const hasAnyResults = (aiOpportunities || []).length > 0 || hasStale; // Check raw array for 'hasAny' to control button state
    
    const questionsRemaining = MAX_QUESTIONS_PER_DAY - questionsUsed;

    const getWhatsAppLink = (lead: Lead | undefined, property: Property | undefined) => {
        if (!lead?.phone || !property) return null;
        const phone = lead.phone.replace(/\D/g, '');
        if (phone.length < 10) return null;
        
        const firstName = lead.name.split(' ')[0];
        const message = `Olá ${firstName}! Tudo bem? Apareceu uma excelente oportunidade para você. Encontramos um imóvel no seu perfil: *${property.title}* em ${property.neighborhood}. Gostaria de ver as fotos?`;
        return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    }

    // Determine button state and label
    const isManualRun = !!(targetLeadId || targetPropertyId);
    const isDisabled = isLoading || (!isSuperAdmin && !canRunToday && hasAnyResults && !isManualRun);
    
    let buttonLabel = 'Executar Análise IA';
    if (isLoading) buttonLabel = 'Analisando...';
    else if (targetLeadId) buttonLabel = 'Encontrar Imóveis para Cliente';
    else if (targetPropertyId) buttonLabel = 'Encontrar Clientes para Imóvel';
    else if (!isSuperAdmin && !canRunToday && hasAnyResults) buttonLabel = 'Análise de Hoje Concluída';
    else if (hasAnyResults) buttonLabel = 'Gerar Novamente';

    return (
        <div className="p-4 md:p-8 h-screen overflow-y-auto bg-slate-50">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center">
                        <Sparkles className="mr-3 text-purple-600" size={32} />
                        Consultor IA
                    </h1>
                    <p className="text-slate-500 text-sm md:text-base mt-1">
                        Inteligência para encontrar oportunidades, recuperar clientes e tirar dúvidas.
                    </p>
                </div>
                
                <div className="w-full xl:w-auto bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end md:items-center">
                    
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        {/* Seletor de Cliente */}
                        <div className="relative w-full md:w-64">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Focar em um Cliente</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                                <select 
                                    className={`w-full pl-9 pr-8 py-2 bg-slate-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 appearance-none ${targetLeadId ? 'border-purple-300 bg-purple-50 text-purple-700 font-medium' : 'border-slate-300 text-slate-600'}`}
                                    value={targetLeadId}
                                    onChange={handleTargetLeadChange}
                                >
                                    <option value="">Todos os Clientes</option>
                                    {leads.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                                {targetLeadId && (
                                    <button onClick={() => setTargetLeadId('')} className="absolute right-8 top-2.5 text-slate-400 hover:text-red-500">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Divisor Visual (apenas MD+) */}
                        <div className="hidden md:flex items-center justify-center pt-5">
                            <span className="text-slate-300 text-xs font-bold">OU</span>
                        </div>

                        {/* Seletor de Imóvel */}
                        <div className="relative w-full md:w-64">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Focar em um Imóvel</label>
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                                <select 
                                    className={`w-full pl-9 pr-8 py-2 bg-slate-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 appearance-none ${targetPropertyId ? 'border-purple-300 bg-purple-50 text-purple-700 font-medium' : 'border-slate-300 text-slate-600'}`}
                                    value={targetPropertyId}
                                    onChange={handleTargetPropertyChange}
                                >
                                    <option value="">Todos os Imóveis</option>
                                    {properties.filter(p => p.status === 'Active').map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                                {targetPropertyId && (
                                    <button onClick={() => setTargetPropertyId('')} className="absolute right-8 top-2.5 text-slate-400 hover:text-red-500">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col items-end">
                        <button 
                            onClick={handleRunAnalysis}
                            disabled={isDisabled} 
                            className={`
                                px-6 py-2.5 rounded-xl font-bold shadow-lg transition flex items-center justify-center w-full md:w-auto whitespace-nowrap h-[42px]
                                ${isDisabled 
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/30'
                                }
                            `}
                        >
                            {isLoading ? (
                                <RefreshCw className="mr-2 animate-spin" size={20} />
                            ) : !isManualRun && !isSuperAdmin && !canRunToday && hasAnyResults ? (
                                <Clock className="mr-2" size={20} />
                            ) : (
                                <BrainCircuit className="mr-2" size={20} />
                            )}
                            {buttonLabel}
                        </button>
                    </div>
                </div>
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

            {/* TAB: TIRA-DÚVIDAS (CHAT) */}
            {activeTab === 'chat' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10 mb-6">
                        <div className="text-center max-w-2xl mx-auto mb-8">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Especialista Imobiliário IA</h2>
                            <p className="text-slate-500">
                                Tire suas dúvidas sobre documentação, financiamento (MCMV, SBPE), taxas de mercado ou leis.
                            </p>
                            <p className="text-xs text-slate-400 mt-2 font-semibold uppercase tracking-wider">
                                {isSuperAdmin ? 'Acesso Ilimitado (Super Admin)' : `Limite Diário: ${questionsRemaining} perguntas restantes`}
                            </p>
                        </div>

                        <form onSubmit={handleChatSubmit} className="max-w-3xl mx-auto relative mb-8">
                            <input 
                                type="text" 
                                value={chatQuery}
                                onChange={(e) => setChatQuery(e.target.value)}
                                placeholder={questionsRemaining > 0 || isSuperAdmin ? "Ex: Quais documentos necessários para financiamento Caixa?" : "Limite diário atingido. Volte amanhã."}
                                disabled={(!isSuperAdmin && questionsRemaining === 0) || isChatLoading}
                                className={`w-full pl-6 pr-14 py-4 rounded-xl border shadow-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition
                                    ${!isSuperAdmin && questionsRemaining === 0 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-900'}
                                `}
                            />
                            <button 
                                type="submit" 
                                disabled={isChatLoading || !chatQuery.trim() || (!isSuperAdmin && questionsRemaining === 0)}
                                className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-4 flex items-center justify-center hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isChatLoading ? <RefreshCw className="animate-spin" size={20}/> : (!isSuperAdmin && questionsRemaining === 0) ? <Lock size={20}/> : <Search size={20}/>}
                            </button>
                        </form>

                        {chatResponse && (
                            <div className="max-w-3xl mx-auto bg-slate-50 rounded-xl p-6 border border-slate-200 animate-in fade-in zoom-in-95">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-1">
                                        <Bot size={20} />
                                    </div>
                                    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {chatResponse}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {!chatResponse && !isChatLoading && (questionsRemaining > 0 || isSuperAdmin) && (
                            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                                <button onClick={() => setChatQuery("Quais documentos para o Minha Casa Minha Vida?")} className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-left text-sm text-slate-600">
                                    <span className="font-bold block text-slate-800 mb-1">🏡 Financiamento</span>
                                    Documentos para MCMV?
                                </button>
                                <button onClick={() => setChatQuery("Qual a diferença entre ITBI e Registro?")} className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-left text-sm text-slate-600">
                                    <span className="font-bold block text-slate-800 mb-1">📄 Documentação</span>
                                    Diferença ITBI x Registro?
                                </button>
                                <button onClick={() => setChatQuery("Dicas para quebrar objeção de preço alto.")} className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition text-left text-sm text-slate-600">
                                    <span className="font-bold block text-slate-800 mb-1">💡 Vendas</span>
                                    Objeção de preço alto?
                                </button>
                            </div>
                        )}

                        {!isSuperAdmin && questionsRemaining === 0 && !chatResponse && (
                            <div className="max-w-3xl mx-auto text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                                <Lock size={32} className="mx-auto text-slate-400 mb-2" />
                                <h3 className="text-lg font-bold text-slate-600">Limite Diário Atingido</h3>
                                <p className="text-slate-500 text-sm">Você poderá fazer novas perguntas a partir de amanhã.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tela Inicial (Apenas para abas de Match/Stale se vazias e sem execução hoje) */}
            {activeTab !== 'chat' && !hasAnyResults && !isLoading && (canRunToday || isSuperAdmin) && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200 border-dashed">
                    <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                        <Sparkles size={48} className="text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Descubra onde estão suas vendas</h3>
                    <p className="text-slate-500 text-center max-w-md mb-8">
                        Selecione um cliente ou imóvel acima para uma análise focada, ou rode uma análise geral para cruzar todos os perfis.
                    </p>
                    <button onClick={handleRunAnalysis} className="text-purple-600 font-bold hover:underline">
                        Iniciar Análise Agora
                    </button>
                </div>
            )}

            {/* Tela Sem Resultados Pós-Execução (Apenas para Match/Stale) */}
            {activeTab !== 'chat' && !hasAnyResults && !isLoading && !canRunToday && !isSuperAdmin && !isManualRun && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={40} className="text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600">Tudo em dia!</h3>
                    <p className="text-slate-500 max-w-md text-center mt-2">
                        A IA analisou seus dados e não encontrou leads parados ou novas combinações óbvias no momento. Bom trabalho!
                    </p>
                </div>
            )}

            {/* Loading State (Match/Stale) */}
            {activeTab !== 'chat' && isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="h-6 w-32 bg-slate-200 rounded"></div>
                                <div className="h-6 w-12 bg-slate-200 rounded"></div>
                            </div>
                            <div className="h-40 bg-slate-100 rounded-xl mb-4"></div>
                            <div className="h-4 w-full bg-slate-200 rounded mb-2"></div>
                            <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB: OPORTUNIDADES (Matches Grouped by Lead) */}
            {activeTab === 'matches' && hasMatches && !isLoading && (
                <div className="grid grid-cols-1 gap-8 animate-in fade-in">
                    {Object.entries(groupedMatches).map(([leadId, opportunities]: [string, AiMatchOpportunity[]]) => {
                        const lead = getLead(leadId);
                        if (!lead) return null;

                        return (
                            <div key={leadId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                {/* Lead Header */}
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

                                {/* Properties List */}
                                <div className="divide-y divide-slate-100">
                                    {opportunities.map((opp, idx) => {
                                        const property = getProperty(opp.propertyId);
                                        const status = opp.status || 'pending';
                                        const waLink = getWhatsAppLink(lead, property);
                                        
                                        if (!property) return null;

                                        return (
                                            <div key={`${opp.propertyId}-${idx}`} className="p-6 hover:bg-slate-50/50 transition">
                                                <div className="flex flex-col lg:flex-row gap-6">
                                                    {/* Property Image & Basic Info */}
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

                                                    {/* AI Reasoning */}
                                                    <div className="flex-1 lg:border-l lg:border-slate-100 lg:pl-6 flex flex-col justify-center">
                                                        <p className="text-xs font-bold text-purple-600 uppercase mb-2 flex items-center">
                                                            <Sparkles size={12} className="mr-1" /> Motivo da Sugestão
                                                        </p>
                                                        <p className="text-sm text-slate-600 italic bg-purple-50/50 p-3 rounded-lg border border-purple-50">
                                                            "{opp.reason}"
                                                        </p>
                                                    </div>

                                                    {/* Actions */}
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

            {/* TAB: STALE LEADS (Recuperação) */}
            {activeTab === 'stale' && hasStale && !isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                    {safeAiStaleLeads.map((item, idx) => {
                        const lead = getLead(item.leadId);
                        if (!lead) return null;

                        return (
                            <div key={`stale-${item.leadId}`} className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden flex flex-col hover:shadow-md transition">
                                <div className="bg-amber-50 border-b border-amber-100 p-4 flex justify-between items-center">
                                    <div className="flex items-center text-amber-800 font-bold text-sm">
                                        <AlertTriangle size={16} className="mr-2" />
                                        Atenção Necessária
                                    </div>
                                    <span className="text-xs bg-white text-amber-800 px-2 py-1 rounded border border-amber-200 font-mono font-bold">
                                        {item.daysInactive} dias parado
                                    </span>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 flex-shrink-0">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{lead.name}</h3>
                                            <p className="text-xs text-slate-500 uppercase font-bold bg-slate-100 inline-block px-1.5 rounded mt-1">
                                                Status: {item.currentStatus}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Análise da IA</p>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            {item.analysis}
                                        </p>
                                    </div>

                                    <div className="mb-6 flex-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Sugestão de Mensagem</p>
                                        <div className="text-sm text-slate-700 italic bg-green-50 p-3 rounded-lg border border-green-100 relative">
                                            "{item.reactivationMessage}"
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleReactivateLead(lead.id, item.reactivationMessage)}
                                        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition flex items-center justify-center shadow-lg shadow-green-500/20"
                                    >
                                        <MessageCircle size={18} className="mr-2" /> Reativar Contato
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};
