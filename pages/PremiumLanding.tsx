
import React, { useState, useEffect } from 'react';
/* Added TrendingUp and CheckCircle to lucide-react imports */
import { Building2, Sparkles, Zap, BarChart3, Globe, Smartphone, ArrowRight, Check, Bot, LayoutDashboard, ShieldCheck, Trophy, Layers, Target, Play, BrainCircuit, Star, ChevronRight, MessageSquare, ZapIcon, TrendingUp, CheckCircle } from 'lucide-react';

export const PremiumLanding: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleStart = () => {
        window.location.href = 'index.html';
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-purple-500 selection:text-white overflow-x-hidden font-sans">
            {/* Efeitos de Luz de Fundo (Glows) */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Navbar Ultra-Glass */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-white/5 ${isScrolled ? 'py-4 bg-slate-950/80 backdrop-blur-xl' : 'py-8 bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <img src="https://assets.zyrosite.com/A1azoVg7xQilMZ9l/logo-d5YUILB2aPsLX5jf.png" alt="CRM Líder" className="h-8 w-auto brightness-200" />
                    </div>
                    
                    <div className="hidden md:flex items-center space-x-10">
                        <a href="#solucoes" className="text-sm font-medium text-slate-400 hover:text-white transition">Soluções</a>
                        <a href="#ia" className="text-sm font-medium text-slate-400 hover:text-white transition">Inteligência Artificial</a>
                        <a href="#precos" className="text-sm font-medium text-slate-400 hover:text-white transition">Planos</a>
                    </div>

                    <div className="flex items-center space-x-6">
                        <button onClick={handleStart} className="text-sm font-bold text-slate-300 hover:text-white transition">Login</button>
                        <button onClick={handleStart} className="bg-white text-slate-950 px-6 py-2.5 rounded-full text-sm font-black hover:bg-purple-400 hover:text-white transition-all shadow-lg shadow-white/5 transform hover:scale-105 active:scale-95">
                            Começar Grátis
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section: The Future is Here */}
            <section className="relative pt-48 pb-32 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-10 animate-fade-in backdrop-blur-md">
                        <Sparkles size={16} className="text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">Inteligência Artificial de Próxima Geração</span>
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] mb-10">
                        Sua imobiliária com <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">Poder de IA.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
                        O CRM Líder não apenas organiza seus dados, ele os transforma em vendas. Use IA generativa para encontrar o match perfeito entre imóveis e clientes em segundos.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
                        <button onClick={handleStart} className="w-full sm:w-auto bg-purple-600 text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-purple-500 transition shadow-2xl shadow-purple-600/40 flex items-center justify-center group">
                            Testar Agora <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-white/10 transition flex items-center justify-center backdrop-blur-md">
                            <Play className="mr-2 fill-current" size={18} /> Ver Demo
                        </button>
                    </div>

                    {/* Floating Dashboard Preview */}
                    <div className="relative max-w-5xl mx-auto group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden bg-slate-900 aspect-video">
                            <img 
                                src="https://assets.zyrosite.com/A1azoVg7xQilMZ9l/note-0RfRdmE3GgeVJNkO.png" 
                                alt="Interface CRM Líder" 
                                className="w-full h-auto opacity-90 group-hover:opacity-100 transition duration-700"
                            />
                        </div>
                        
                        {/* Widgets de IA Flutuantes */}
                        <div className="absolute -left-12 top-1/4 bg-slate-900/90 border border-white/10 p-5 rounded-2xl shadow-2xl hidden lg:block backdrop-blur-xl animate-bounce duration-[5000ms]">
                            <div className="flex items-center space-x-4">
                                <div className="bg-purple-500/20 text-purple-400 p-3 rounded-xl"><BrainCircuit size={24}/></div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Análise de Match</p>
                                    <p className="font-bold text-white text-lg">94% Otimizado</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -right-12 bottom-1/4 bg-slate-900/90 border border-white/10 p-5 rounded-2xl shadow-2xl hidden lg:block backdrop-blur-xl animate-bounce duration-[4000ms]">
                            <div className="flex items-center space-x-4">
                                <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-xl"><TrendingUp size={24}/></div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">VGV do Mês</p>
                                    <p className="font-bold text-white text-lg">R$ 5.8M</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bento Grid: Features as Blocks of Power */}
            <section id="solucoes" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
                        <div className="max-w-2xl">
                            <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">O que faz do Líder <br/> o #1 do Mercado?</h2>
                            <p className="text-slate-400 text-lg font-medium">Arquitetura moderna feita para corretores que não aceitam perder tempo.</p>
                        </div>
                        <div className="flex items-center space-x-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 font-bold text-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span>Sistema em Tempo Real</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {/* Gestão Completa */}
                        <div className="md:col-span-2 lg:col-span-2 bg-white/5 border border-white/10 rounded-[3rem] p-10 hover:bg-white/[0.07] transition group overflow-hidden relative">
                            <div className="relative z-10">
                                <Building2 size={40} className="text-blue-400 mb-8" />
                                <h3 className="text-3xl font-bold mb-4">Gestão de Portfólio</h3>
                                <p className="text-slate-400 leading-relaxed mb-6">Cadastro detalhado, controle de proprietários e fichas técnicas prontas para envio imediato.</p>
                                <div className="flex -space-x-2">
                                    {[1,2,3,4].map(i => <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-10 h-10 rounded-full border-4 border-slate-900 shadow-xl" alt=""/>)}
                                    <div className="w-10 h-10 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-[10px] font-bold">+200</div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile First */}
                        <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 border border-white/10 rounded-[3rem] p-10 flex flex-col justify-between group">
                            <Smartphone size={32} className="text-purple-400" />
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Mobile Nativo</h3>
                                <p className="text-slate-400 text-sm">Acesse sua imobiliária do iPhone, Android ou Tablet com 100% de fluidez.</p>
                            </div>
                        </div>

                        {/* Leads Power */}
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col justify-between group">
                            <LayoutDashboard size={32} className="text-emerald-400" />
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Funil Dinâmico</h3>
                                <p className="text-slate-400 text-sm">Controle seus leads por etapas e nunca mais perca um fechamento por falta de retorno.</p>
                            </div>
                        </div>

                        {/* IA Highlight Horizontal */}
                        <div id="ia" className="md:col-span-3 lg:col-span-4 bg-gradient-to-r from-slate-900 to-purple-900/30 border border-purple-500/20 rounded-[4rem] p-12 flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                            
                            <div className="flex-1 relative z-10">
                                <div className="bg-purple-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-8 inline-block">Consultor IA Integrado</div>
                                <h3 className="text-4xl md:text-5xl font-black mb-6">Deixe a IA vender por você.</h3>
                                <p className="text-slate-300 text-lg mb-10 max-w-xl leading-relaxed">Nossa inteligência analisa o perfil de consumo de cada lead e cruza com seu estoque para entregar oportunidades de ouro automaticamente.</p>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex items-center space-x-3 text-white font-bold"><CheckCircle className="text-purple-400" size={20}/> <span>Matchmaking IA</span></div>
                                    <div className="flex items-center space-x-3 text-white font-bold"><CheckCircle className="text-purple-400" size={20}/> <span>Copywriting Persuasivo</span></div>
                                    <div className="flex items-center space-x-3 text-white font-bold"><CheckCircle className="text-purple-400" size={20}/> <span>Chat Jurídico/Técnico</span></div>
                                    <div className="flex items-center space-x-3 text-white font-bold"><CheckCircle className="text-purple-400" size={20}/> <span>Recuperação de Leads</span></div>
                                </div>
                            </div>

                            <div className="flex-shrink-0 relative z-10 w-full lg:w-[400px]">
                                <div className="bg-white/5 border border-white/20 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Bot size={24}/></div>
                                        <div className="text-left"><p className="text-xs font-black text-purple-400 uppercase tracking-widest">Líder IA</p><p className="text-sm font-bold text-white">Análise de Oportunidade</p></div>
                                    </div>
                                    <div className="bg-slate-950/80 p-5 rounded-2xl mb-6 border border-white/5">
                                        <p className="text-sm text-slate-300 italic leading-relaxed">
                                            "Identifiquei que o cliente *Ricardo Oliveira* tem 92% de interesse no imóvel *Ref #432*. Deseja que eu envie uma proposta personalizada via WhatsApp agora?"
                                        </p>
                                    </div>
                                    <button className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black text-sm hover:bg-purple-400 hover:text-white transition-all shadow-xl">Sim, Enviar Proposta</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof: Premium Brands */}
            <div className="py-24 border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12">Tecnologia de Classe Mundial</p>
                    <div className="flex flex-wrap justify-center items-center gap-20 opacity-20 grayscale hover:opacity-50 transition-all duration-1000">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/f/ff/Logo_de_Google_Gemini.svg" className="h-8" alt="Gemini" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Logo_of_Supabase.svg" className="h-8" alt="Supabase" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" className="h-10" alt="React" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" className="h-5" alt="Tailwind" />
                    </div>
                </div>
            </div>

            {/* Pricing: The Exclusive Plan */}
            <section id="precos" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-6xl font-black mb-6">Investimento Único.</h2>
                        <p className="text-slate-400 text-lg font-medium">Toda a inteligência do CRM Líder por um valor que cabe no seu crescimento.</p>
                    </div>

                    <div className="flex justify-center">
                        <div className="w-full max-w-[480px] bg-gradient-to-b from-white/[0.08] to-transparent border border-white/20 rounded-[4rem] p-12 shadow-2xl relative group overflow-hidden">
                            {/* Chip Popular */}
                            <div className="absolute top-0 right-0 bg-white text-slate-950 px-8 py-2 rounded-bl-[2rem] font-black text-[10px] uppercase tracking-widest">Plano Full IA</div>
                            
                            <div className="mb-12">
                                <p className="text-purple-400 font-black uppercase text-xs tracking-widest mb-6">Assinatura Mensal</p>
                                <div className="flex items-baseline">
                                    <span className="text-7xl font-black tracking-tighter">R$ 69,90</span>
                                    <span className="text-slate-500 font-bold ml-2">/mês</span>
                                </div>
                            </div>

                            <ul className="space-y-6 mb-12">
                                {[
                                    'Consultor IA (Gemini 2.5) Sem Limites',
                                    'Cadastro Ilimitado de Imóveis',
                                    'Dashboard Financeiro Profissional',
                                    'Site Imobiliário Exclusivo',
                                    'Gestão de Equipe (até 4 Corretores)',
                                    'Suporte Prioritário por WhatsApp'
                                ].map((benefit, i) => (
                                    <li key={i} className="flex items-start space-x-4">
                                        <div className="bg-purple-50/20 text-purple-400 p-1 rounded-full flex-shrink-0 mt-0.5"><Check size={16} strokeWidth={4} /></div>
                                        <span className="text-slate-300 font-medium leading-tight">{benefit}</span>
                                    </li>
                                ))}
                            </ul>

                            <button onClick={handleStart} className="w-full bg-white text-slate-950 py-6 rounded-3xl font-black text-xl hover:bg-purple-400 hover:text-white transition-all shadow-2xl shadow-white/5 group-hover:scale-[1.03]">
                                Começar Agora
                            </button>
                            <p className="text-center text-[10px] text-slate-500 mt-8 font-bold uppercase tracking-[0.2em]">Sem Fidelidade • Cancele quando quiser</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Final: Dark Luxury */}
            <section className="py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[5rem] p-20 text-center relative overflow-hidden shadow-2xl border border-white/10">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <h2 className="text-5xl md:text-7xl font-black mb-12 relative z-10 leading-tight">Chegou a hora de <br/> ser o Líder.</h2>
                        <button onClick={handleStart} className="bg-white text-slate-950 px-16 py-8 rounded-full font-black text-2xl hover:bg-purple-400 hover:text-white transition-all shadow-2xl relative z-10 transform hover:rotate-2">
                            Criar Minha Conta Grátis
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-20">
                        <div className="max-w-xs">
                            <img src="https://assets.zyrosite.com/A1azoVg7xQilMZ9l/logo-d5YUILB2aPsLX5jf.png" className="h-10 mb-8 brightness-200" alt="Logo" />
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                Transformando corretores comuns em especialistas de elite através da Inteligência Artificial.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
                            <div>
                                <h4 className="font-black text-[10px] uppercase text-white tracking-[0.3em] mb-8">Plataforma</h4>
                                <ul className="space-y-4 text-sm text-slate-500 font-bold">
                                    <li><a href="#" className="hover:text-purple-400 transition">Imóveis</a></li>
                                    <li><a href="#" className="hover:text-purple-400 transition">Leads</a></li>
                                    <li><a href="#" className="hover:text-purple-400 transition">Financeiro</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-black text-[10px] uppercase text-white tracking-[0.3em] mb-8">Empresa</h4>
                                <ul className="space-y-4 text-sm text-slate-500 font-bold">
                                    <li><a href="#" className="hover:text-purple-400 transition">Sobre</a></li>
                                    <li><a href="#" className="hover:text-purple-400 transition">Preços</a></li>
                                    <li><a href="#" className="hover:text-purple-400 transition">Suporte</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-black text-[10px] uppercase text-white tracking-[0.3em] mb-8">Legal</h4>
                                <ul className="space-y-4 text-sm text-slate-500 font-bold">
                                    <li><a href="#" className="hover:text-purple-400 transition">Termos</a></li>
                                    <li><a href="#" className="hover:text-purple-400 transition">Privacidade</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
                        <p>&copy; {new Date().getFullYear()} CRM LÍDER. THE NEXT ERA OF REAL ESTATE.</p>
                        <div className="flex space-x-8 mt-6 md:mt-0">
                            <a href="#" className="hover:text-white transition">Instagram</a>
                            <a href="#" className="hover:text-white transition">LinkedIn</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
