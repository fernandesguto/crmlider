
import React, { useState, useEffect } from 'react';
import { Building2, Sparkles, Zap, BarChart3, Globe, Smartphone, ArrowRight, Check, Bot, LayoutDashboard, ShieldCheck, Trophy, Layers, Target, Play, BrainCircuit, Star, ChevronRight, MessageSquare, ZapIcon, TrendingUp, CheckCircle, FileDown, Users, MessageCircle, PieChart, Repeat, UserCheck, SearchCheck, AlertTriangle, Lightbulb, PenTool } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LandingPage: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const { setCurrentView, setAuthTab } = useApp();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleStart = () => {
        setAuthTab('login');
        setCurrentView('DASHBOARD');
    };

    const handlePurchase = () => {
        window.location.href = 'https://pay.hotmart.com/L103469151O';
    };

    const handleTrial = () => {
        setAuthTab('register');
        setCurrentView('DASHBOARD');
    };

    const handleViewDemoSite = () => {
        const url = new URL(window.location.href);
        url.search = '?mode=public';
        window.open(url.toString(), '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500 selection:text-white overflow-x-hidden font-sans">
            {/* Efeitos de Luz de Fundo (Glows) - Ajustados para tons de azul */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-600/20 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Navbar Ultra-Glass */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-white/5 ${isScrolled ? 'py-3 bg-slate-950/80 backdrop-blur-xl' : 'py-5 bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center">
                        <img 
                            src="https://assets.zyrosite.com/A1azoVg7xQilMZ9l/logo-d5YUILB2aPsLX5jf.png" 
                            alt="CRM Líder" 
                            className="h-14 md:h-20 w-auto brightness-200 transition-all duration-300" 
                        />
                    </div>
                    
                    <div className="flex items-center space-x-6">
                        <button onClick={handleStart} className="text-sm font-bold text-slate-300 hover:text-white transition">Login</button>
                        <button onClick={handlePurchase} className="bg-white text-slate-950 px-8 py-2.5 rounded-full text-sm font-black hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-white/5 transform hover:scale-105 active:scale-95">
                            Começar Agora
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-44 pb-16 px-6 text-center">
                <div className="max-w-6xl mx-auto">
                    <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8 animate-fade-in backdrop-blur-md">
                        <Sparkles size={16} className="text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Inteligência Artificial de Próxima Geração</span>
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] mb-8">
                        Sua imobiliária com <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400">Poder de IA.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        O CRM Líder transforma seus dados em vendas. Use IA generativa para encontrar o match perfeito entre imóveis e clientes em segundos.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
                        <button onClick={handleTrial} className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-blue-500 transition shadow-2xl shadow-blue-600/40 flex items-center justify-center group">
                            Testar Agora <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button onClick={handleTrial} className="text-blue-400 font-black hover:text-blue-300 transition text-lg bg-transparent border-none">
                            Teste 7 dias grátis
                        </button>
                    </div>

                    <div className="relative max-w-6xl mx-auto">
                        <div className="absolute top-8 -left-4 md:-left-16 z-20 max-w-[280px] md:max-w-[340px] animate-bounce hidden sm:block" style={{ animationDuration: '4s' }}>
                            <div className="bg-emerald-950/90 backdrop-blur-2xl border border-emerald-500/40 p-5 md:p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-l-8 border-l-emerald-500">
                                <div className="flex items-start space-x-3 text-left">
                                    <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 flex-shrink-0">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">IA Match Encontrado</p>
                                        <p className="text-xs md:text-sm text-emerald-50 font-semibold leading-relaxed">
                                            "O lead exige piscina e pátio para cachorro. Este imóvel é uma casa com piscina."
                                        </p>
                                        <div className="mt-3 flex items-center text-[10px] font-black text-emerald-400">
                                            <CheckCircle size={12} className="mr-1" /> Match de Perfil: 98%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-8 -right-4 md:-right-16 z-20 max-w-[280px] md:max-w-[340px] animate-bounce hidden sm:block" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                            <div className="bg-blue-950/90 backdrop-blur-2xl border border-blue-500/40 p-5 md:p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-l-8 border-l-blue-500">
                                <div className="flex items-start space-x-3 text-left">
                                    <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400 flex-shrink-0">
                                        <Target size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Sugestão do Consultor</p>
                                        <p className="text-xs md:text-sm text-blue-50 font-semibold leading-relaxed">
                                            "O lead procura apartamento no centro. Este imóvel atende a localização e tipologia."
                                        </p>
                                        <div className="mt-3 flex items-center text-[10px] font-black text-blue-400">
                                            <TrendingUp size={12} className="mr-1" /> Alta probabilidade de visita
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <img 
                                src="https://assets.zyrosite.com/A1azoVg7xQilMZ9l/note-0RfRdmE3GgeVJNkO.png" 
                                alt="Interface CRM Líder" 
                                className="w-full h-auto drop-shadow-[0_35px_35px_rgba(255,255,255,0.05)] transition duration-700"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CONSULTOR IA 2.0 - Ajustado para Azul */}
            <section className="py-12 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gradient-to-br from-blue-900/40 via-slate-900 to-sky-900/40 border border-white/10 rounded-[4rem] p-8 md:p-16 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Bot size={200} className="text-blue-500" />
                        </div>
                        
                        <div className="relative z-10 text-center lg:text-left">
                            <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-full mb-6">
                                <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Exclusivo: IA Generativa 2.0</span>
                            </div>
                            
                            <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">Consultor IA 2.0: <br/><span className="text-blue-400">O Cérebro do seu Negócio</span></h2>
                            
                            <p className="text-slate-300 text-lg md:text-xl max-w-3xl mb-8 leading-relaxed">
                                Nossa inteligência não apenas organiza, ela encontra o negócio. Através do processamento de linguagem natural e análise preditiva, o Líder faz o trabalho pesado por você:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition group/card">
                                    <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover/card:scale-110 transition-transform">
                                        <SearchCheck size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">Análise de Ativos</h3>
                                    <div className="bg-slate-950/50 p-4 rounded-2xl mb-4 border border-white/5">
                                        <p className="text-sm text-slate-300 italic">"Analisei os dados financeiros. Este imóvel tem o melhor custo-benefício do bairro para investidores."</p>
                                    </div>
                                    <p className="text-slate-400 leading-relaxed text-sm">O Consultor IA analisa o mercado em tempo real e sugere os imóveis perfeitos para cada perfil de investidor ou família, cruzando dados de rentabilidade e localização.</p>
                                </div>
                                
                                <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition group/card">
                                    <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-6 group-hover/card:scale-110 transition-transform">
                                        <AlertTriangle size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">Recuperação Crítica</h3>
                                    <div className="bg-red-950/20 p-4 rounded-2xl mb-4 border border-red-500/20">
                                        <p className="text-sm text-red-200 font-medium">"Crítico. Lead em negociação parado há 12 dias. Risco alto de perda para concorrente. Foque em eliminar a objeção final."</p>
                                    </div>
                                    <p className="text-slate-400 leading-relaxed text-sm">Não perca mais vendas por esquecimento. A IA monitora seu funil e avisa exatamente quando e como abordar leads que estão esfriando, sugerindo o texto ideal para reativá-los.</p>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-center lg:justify-start">
                                <button onClick={handlePurchase} className="flex items-center space-x-3 text-blue-400 font-black hover:text-blue-300 transition text-lg group">
                                    <span>Ver Consultor em ação</span>
                                    <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Bento */}
            <section id="solucoes" className="py-16 px-6 bg-slate-950/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl md:text-6xl font-black mb-4 leading-tight">Elite em cada Detalhe.</h2>
                        <p className="text-slate-400 text-xl font-medium">O único ecossistema que une dados imobiliários e IA Generativa.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* 1. IA Matching - Roxo trocado por Azul */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.08] transition group flex flex-col">
                            <BrainCircuit size={32} className="text-blue-400 mb-6" />
                            <h3 className="text-xl font-bold mb-3">Matching com IA</h3>
                            <p className="text-slate-400 text-sm leading-relaxed flex-1">Nossa IA analisa o perfil do lead e cruza instantaneamente com seu estoque, sugerindo a melhor oferta.</p>
                        </div>

                        {/* 2. Gráficos de Performance */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.08] transition group flex flex-col">
                            <BarChart3 size={32} className="text-emerald-400 mb-6" />
                            <h3 className="text-xl font-bold mb-3">Análise de VGV</h3>
                            <p className="text-slate-400 text-sm leading-relaxed flex-1">Gráficos dinâmicos de faturamento, comissões e performance de vendas para sua tomada de decisão.</p>
                        </div>

                        {/* 3. Funil de Vendas */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.08] transition group flex flex-col">
                            <TrendingUp size={32} className="text-blue-500 mb-6" />
                            <h3 className="text-xl font-bold mb-3">Funil Dinâmico</h3>
                            <p className="text-slate-400 text-sm leading-relaxed flex-1">Controle total da jornada do cliente, desde o primeiro contato até a assinatura do contrato.</p>
                        </div>

                        {/* 4. Interesses Detalhados */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.08] transition group flex flex-col">
                            <Target size={32} className="text-rose-400 mb-6" />
                            <h3 className="text-xl font-bold mb-3">Gestão de Interesses</h3>
                            <p className="text-slate-400 text-sm leading-relaxed flex-1">Saiba exatamente quais imóveis cada lead visitou ou demonstrou interesse, com histórico completo.</p>
                        </div>

                        {/* 5. Geração de PDF */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.08] transition group flex flex-col">
                            <FileDown size={32} className="text-amber-400 mb-6" />
                            <h3 className="text-xl font-bold mb-3">Fichas em PDF</h3>
                            <p className="text-slate-400 text-sm leading-relaxed flex-1">Gere fichas técnicas profissionais de qualquer imóvel com um clique para enviar via WhatsApp.</p>
                        </div>

                        {/* 6. Gestão de Equipe */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.08] transition group flex flex-col">
                            <Users size={32} className="text-cyan-400 mb-6" />
                            <h3 className="text-xl font-bold mb-3">Multi-Corretores</h3>
                            <p className="text-slate-400 text-sm leading-relaxed flex-1">Gerencie sua equipe, distribua leads e acompanhe a produtividade de cada corretor em tempo real.</p>
                        </div>

                        {/* 7. WhatsApp CRM */}
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.08] transition group flex flex-col">
                            <MessageCircle size={32} className="text-green-500 mb-6" />
                            <h3 className="text-xl font-bold mb-3">CRM WhatsApp</h3>
                            <p className="text-slate-400 text-sm leading-relaxed flex-1">Inicie conversas com mensagens personalizadas geradas pela IA para aumentar sua taxa de resposta.</p>
                        </div>

                        {/* 8. Site Público */}
                        <div 
                            onClick={handleViewDemoSite}
                            className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.08] transition group flex flex-col cursor-pointer border-blue-500/30"
                        >
                            <Globe size={32} className="text-sky-400 mb-6" />
                            <h3 className="text-xl font-bold mb-3 flex items-center">Site Exclusivo <ArrowRight size={16} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
                            <p className="text-slate-400 text-sm leading-relaxed flex-1">Sua imobiliária ganha um portal público automático para captar leads e exibir seu estoque online.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* IA Section Highlight - NOVO DESIGN FOCO EM TEXTOS E ESTRATÉGIA */}
            <section className="py-16 px-6">
                <div className="max-w-7xl mx-auto bg-gradient-to-br from-blue-900/30 to-slate-900 border border-blue-500/20 rounded-[4rem] p-12 md:p-16 flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <Sparkles size={400} className="text-blue-500 absolute -top-40 -left-40" />
                    </div>
                    
                    <div className="flex-1 relative z-10">
                        <div className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 inline-block">Inteligência Estratégica</div>
                        <h3 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Venda com <br/> Inteligência de Elite.</h3>
                        <p className="text-slate-300 text-lg mb-10 max-w-xl leading-relaxed">
                            Nossa IA não apenas descreve imóveis. Ela cria toda a sua estratégia comercial para cada unidade em estoque.
                        </p>
                        
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 mt-1">
                                    <PenTool size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Copywriting Profissional</h4>
                                    <p className="text-slate-400 text-sm">Gere anúncios irresistíveis e personalizados para portais e redes sociais em segundos.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 mt-1">
                                    <Lightbulb size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Dicas de Gatilhos de Venda</h4>
                                    <p className="text-slate-400 text-sm">Receba argumentos matadores sobre o imóvel para usar durante a visita e fechar o negócio.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400 mt-1">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Targeting de Público</h4>
                                    <p className="text-slate-400 text-sm">Saiba exatamente para qual perfil de cliente ofertar cada imóvel, otimizando seu tempo.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-[450px] relative z-10">
                         <div className="bg-slate-900/80 border border-white/20 backdrop-blur-3xl rounded-[3rem] p-8 shadow-2xl relative">
                            <div className="absolute -top-4 -right-4 bg-blue-600 text-white p-3 rounded-2xl shadow-xl animate-pulse">
                                <Zap size={24} />
                            </div>
                            
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Bot size={28}/></div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Especialista IA</p>
                                    <p className="text-base font-bold text-white">Estratégia Gerada</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-950/80 p-4 rounded-2xl border border-blue-500/20">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <PenTool size={14} className="text-blue-400" />
                                        <span className="text-[10px] font-bold text-blue-400 uppercase">Texto Comercial</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 italic leading-relaxed">
                                        "Viva o luxo no coração do bairro. Apartamento com vista panorâmica e acabamento em mármore..."
                                    </p>
                                </div>

                                <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/20">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Lightbulb size={14} className="text-emerald-400" />
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase">Dica de Venda</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 italic leading-relaxed">
                                        "Destaque a proximidade com o novo parque. Use o gatilho de valorização futura."
                                    </p>
                                </div>

                                <div className="bg-slate-950/80 p-4 rounded-2xl border border-purple-500/20">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Target size={14} className="text-purple-400" />
                                        <span className="text-[10px] font-bold text-purple-400 uppercase">Público Alvo</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 italic leading-relaxed">
                                        "Ideal para casais jovens com pet. Oferecer para leads que buscam praticidade e lazer."
                                    </p>
                                </div>
                            </div>
                            
                            <button onClick={handlePurchase} className="w-full mt-6 bg-white text-slate-950 py-4 rounded-2xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all shadow-xl flex items-center justify-center space-x-2">
                                <Sparkles size={18} />
                                <span>Ver Plano de Marketing</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="precos" className="py-16 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-4xl md:text-6xl font-black mb-4">Investimento Único.</h2>
                    <p className="text-slate-400 text-lg font-medium mb-12">Toda a inteligência do CRM Líder por um valor que cabe no seu crescimento.</p>

                    <div className="flex justify-center">
                        <div className="w-full max-w-[480px] bg-gradient-to-b from-white/[0.08] to-transparent border border-white/20 rounded-[4rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 bg-white text-slate-950 px-8 py-2 rounded-bl-[2rem] font-black text-[10px] uppercase tracking-widest">Plano Full IA</div>
                            
                            <div className="mb-10">
                                <p className="text-blue-400 font-black uppercase text-xs tracking-widest mb-4">Assinatura Mensal</p>
                                <div className="flex items-baseline justify-center">
                                    <span className="text-7xl font-black tracking-tighter">R$ 69,90</span>
                                    <span className="text-slate-500 font-bold ml-2">/mês</span>
                                </div>
                            </div>

                            <ul className="space-y-5 mb-10 text-left">
                                {[
                                    'Consultor IA (Gemini 3.0)',
                                    'Cadastro Ilimitado de Imóveis',
                                    'Dashboard Financeiro Profissional',
                                    'Site Imobiliário Exclusivo',
                                    'Gestão de Equipe (até 4 Usuários)',
                                    'Suporte Prioritário por WhatsApp'
                                ].map((benefit, i) => (
                                    <li key={i} className="flex items-start space-x-4">
                                        <div className="bg-blue-50/20 text-blue-400 p-1 rounded-full flex-shrink-0 mt-0.5"><Check size={16} strokeWidth={4} /></div>
                                        <span className="text-slate-300 font-medium leading-tight">{benefit}</span>
                                    </li>
                                ))}
                            </ul>

                            <button onClick={handlePurchase} className="w-full bg-white text-slate-950 py-6 rounded-3xl font-black text-xl hover:bg-blue-600 hover:text-white transition-all shadow-2xl shadow-white/5 group-hover:scale-[1.03]">
                                Começar Agora
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 text-center">
                <div className="max-w-7xl mx-auto">
                    <img src="https://assets.zyrosite.com/A1azoVg7xQilMZ9l/logo-d5YUILB2aPsLX5jf.png" className="h-14 mx-auto mb-6 brightness-200" alt="Logo" />
                    <p className="text-slate-500 text-sm font-medium">
                        &copy; {new Date().getFullYear()} CRM Líder. The next era of real estate.
                    </p>
                </div>
            </footer>
        </div>
    );
};
