
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, CheckCircle, BarChart3, Globe, Smartphone, ShieldCheck, ArrowRight, Star, Sparkles, Bot, RefreshCw, BrainCircuit } from 'lucide-react';

export const LandingPage: React.FC = () => {
    const { setCurrentView } = useApp();
    const [logoError, setLogoError] = useState(false);

    const handleLoginClick = () => {
        // Como o Login é renderizado se !currentUser e view != LANDING/PUBLIC, 
        // mudar para qualquer view que não seja essas forçará o Login a aparecer se não estiver logado.
        setCurrentView('DASHBOARD');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Navbar */}
            <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-blue-600">
                        {!logoError ? (
                            <img 
                                src="https://assets.zyrosite.com/A1azoVg7xQilMZ9l/logo-d5YUILB2aPsLX5jf.png" 
                                alt="CRM Líder" 
                                className="h-10 w-auto object-contain" 
                                onError={() => setLogoError(true)}
                            />
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Building2 size={32} />
                                <span className="text-2xl font-bold tracking-tight text-slate-900">CRM Líder</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={handleLoginClick}
                            className="text-slate-600 font-medium hover:text-blue-600 transition"
                        >
                            Fazer Login
                        </button>
                        <button 
                            onClick={handleLoginClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold transition shadow-lg shadow-blue-500/20"
                        >
                            Começar Grátis
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white -z-10" />
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
                            <Sparkles size={16} className="mr-2" />
                            O Primeiro CRM Imobiliário com Inteligência Artificial Integrada
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                            Venda mais imóveis com o poder da <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Inteligência Artificial</span>.
                        </h1>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                            Deixe que nossa IA encontre os melhores imóveis para seus clientes, tire dúvidas técnicas de mercado e recupere leads parados.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                onClick={handleLoginClick}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-xl shadow-blue-500/20 flex items-center justify-center"
                            >
                                Testar IA Agora <ArrowRight className="ml-2" />
                            </button>
                            <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center">
                                Ver Demonstração
                            </button>
                        </div>
                        <div className="mt-8 flex items-center space-x-4 text-sm text-slate-500">
                            <span className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-1"/> Parcele no cartão de crédito</span>
                            <span className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-1"/> Teste grátis de 3 dias</span>
                        </div>
                    </div>
                    <div className="relative">
                        {/* Imagem do App */}
                        <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 transform rotate-1 hover:rotate-0 transition duration-500 overflow-hidden">
                            <img 
                                src="https://assets.zyrosite.com/A1azoVg7xQilMZ9l/captura-de-tela-2025-12-17-171651-LjfexspyGldxjnMj.png" 
                                alt="Dashboard CRM Líder" 
                                className="rounded-xl w-full h-auto object-cover aspect-[4/3] shadow-inner"
                            />
                            
                            {/* Overlay de IA flutuante */}
                            <div className="absolute top-10 right-10 w-64 bg-white/90 backdrop-blur-md rounded-lg shadow-xl border border-purple-100 p-4 z-10 animate-in slide-in-from-bottom duration-1000">
                                <div className="flex items-center mb-2">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-2">
                                        <Bot size={16}/>
                                    </div>
                                    <p className="text-xs font-bold text-purple-600">Consultor IA</p>
                                </div>
                                <p className="text-xs text-slate-600 font-medium">Encontrei 3 imóveis perfeitos para o cliente Roberto. A probabilidade de fechamento é de 92%. Deseja enviar a oferta?</p>
                            </div>
                        </div>
                        
                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center space-x-3 animate-bounce">
                            <div className="bg-purple-100 p-2 rounded-full text-purple-600"><BrainCircuit fill="currentColor" size={20}/></div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">Tecnologia</p>
                                <p className="font-bold text-slate-900">IA Generativa 2.0</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* AI Spotlight Section */}
            <section className="py-20 bg-slate-50 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-purple-600 font-bold tracking-wide uppercase text-sm bg-purple-50 px-3 py-1 rounded-full border border-purple-100">Exclusividade CRM Líder</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-4 mb-4">
                            Sua imobiliária com um <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Cérebro Digital</span>
                        </h2>
                        <p className="text-lg text-slate-600">
                            Não é apenas um sistema de cadastro. Com um clique nossa IA encontra oportunidades, tirar dúvidas técnicas e fecha mais negócios para sua equipe.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1: Matchmaking */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-purple-100 hover:shadow-xl hover:border-purple-200 transition duration-300 relative group">
                            <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wider">Destaque</div>
                            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Matchmaking Automático</h3>
                            <p className="text-slate-600 leading-relaxed">
                                A IA cruza o perfil dos seus leads com seus imóveis e diz exatamente: <span className="font-semibold text-purple-700">"Ofereça o imóvel X para o cliente Y"</span>, criando argumentos de venda personalizados para fechar o negócio.
                            </p>
                        </div>

                        {/* Card 2: Consultor Especialista */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-blue-100 hover:shadow-xl hover:border-blue-200 transition duration-300 relative group">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition">
                                <Bot size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Consultor Especialista 24h</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Dúvidas sobre <span className="font-semibold text-blue-700">documentação, financiamento (MCMV, SBPE) ou leis</span>? Pergunte para nossa IA treinada no mercado imobiliário e receba respostas técnicas precisas na hora.
                            </p>
                        </div>

                        {/* Card 3: Recuperação de Leads */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-amber-100 hover:shadow-xl hover:border-amber-200 transition duration-300 relative group">
                            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition">
                                <RefreshCw size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Recuperação de Vendas</h3>
                            <p className="text-slate-600 leading-relaxed">
                                A IA verifica os leads parados e alerta o corretor para fazer negócio, sugerindo a melhor abordagem para retomar o contato.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">E tudo o que sua imobiliária já precisa</h2>
                        <p className="text-lg text-slate-600">Além da IA, entregamos a gestão completa que substitui planilhas e sistemas complexos.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', title: 'Gestão de Imóveis', desc: 'Cadastre fotos, características e proprietários. Gere apresentações em PDF prontas para enviar no WhatsApp.' },
                            { icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50', title: 'Site Imobiliário Próprio', desc: 'Seus imóveis aparecem automaticamente em um site público moderno e otimizado para seus clientes.' },
                            { icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50', title: 'Dashboard Financeiro', desc: 'Acompanhe comissões, VGV, funil de vendas e receitas de locação com gráficos claros.' },
                            { icon: Smartphone, color: 'text-orange-600', bg: 'bg-orange-50', title: '100% Mobile', desc: 'Acesse de qualquer lugar. O sistema funciona perfeitamente no seu celular ou tablet.' },
                            { icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50', title: 'Funil de Vendas', desc: 'Organize seus clientes por etapa de negociação. Nunca mais perca uma venda por falta de follow-up.' },
                            { icon: ShieldCheck, color: 'text-red-600', bg: 'bg-red-50', title: 'Controle de Equipe', desc: 'Gerencie até 4 corretores na equipe, defina permissões e acompanhe a performance de cada membro.' },
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition duration-300 group">
                                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition`}>
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para transformar seus resultados?</h2>
                            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                                Junte-se a corretores e imobiliárias que já estão vendendo mais com o CRM Líder. Sem taxas de implantação, sem fidelidade.
                            </p>
                            <ul className="space-y-4 mb-8">
                                {['Consultor IA Ilimitado', 'Matchmaking de Leads', 'Imóveis ilimitados', 'Site imobiliário incluso', 'Suporte prioritário'].map(item => (
                                    <li key={item} className="flex items-center space-x-3 text-slate-200">
                                        <CheckCircle className="text-green-400" size={20}/>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex justify-center">
                            <div className="bg-white text-slate-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full relative transform hover:-translate-y-2 transition duration-300">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                                    Melhor Oferta
                                </div>
                                <div className="text-center border-b border-slate-100 pb-6 mb-6">
                                    <p className="text-slate-500 font-bold uppercase tracking-wide mb-2">Plano Pro com IA</p>
                                    <div className="flex flex-col items-center justify-center text-slate-900">
                                        <span className="text-slate-400 line-through text-sm font-medium mb-[-5px]">De R$ 99,90</span>
                                        <div className="flex items-center justify-center">
                                            <span className="text-2xl font-bold mt-2">R$</span>
                                            <span className="text-6xl font-extrabold mx-1">39,90</span>
                                            <span className="text-slate-400 font-medium mt-4">/mês</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleLoginClick}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center"
                                >
                                    Assinar Agora
                                </button>
                                <p className="text-center text-xs text-slate-400 mt-4">7 dias de garantia incondicional.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-12 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2 text-slate-800 mb-4 md:mb-0">
                        {!logoError ? (
                            <img src="https://assets.zyrosite.com/A1azoVg7xQilMZ9l/logo-d5YUILB2aPsLX5jf.png" className="h-8 w-auto object-contain grayscale opacity-50" alt="Logo" />
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Building2 size={24} />
                                <span className="text-xl font-bold">CRM Líder</span>
                            </div>
                        )}
                    </div>
                    <p className="text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} CRM Líder. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
};
