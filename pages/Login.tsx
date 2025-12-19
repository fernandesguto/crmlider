
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, LogIn, AlertCircle, PlusCircle, Briefcase, Lock, CheckCircle, ArrowLeft, Phone, CreditCard } from 'lucide-react';
import { clearCredentials, isHardcoded } from '../services/supabaseClient';

export const Login: React.FC = () => {
  const { login, registerAgency, isLoading, setCurrentView, authTab, setAuthTab } = useApp();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(authTab || 'login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regAgencyName, setRegAgencyName] = useState('');
  const [regAdminName, setRegAdminName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState('');
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincroniza o tab local com o do contexto na montagem
  useEffect(() => {
    if (authTab) setActiveTab(authTab);
  }, [authTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsTrialExpired(false);
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = await login(email, password);
    
    if (!result.success) {
        if (result.message === 'PERÍODO DE TESTE EXPIRADO') {
            setError('Seu período de teste de 7 dias chegou ao fim.');
            setIsTrialExpired(true);
        } else {
            setError(result.message || 'E-mail ou senha incorretos.');
        }
        setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsTrialExpired(false);
      setSuccessMsg('');
      setIsSubmitting(true);
      
      const result = await registerAgency(regAgencyName, regAdminName, regEmail, regPhone, regPassword);
      
      if (!result.success) {
          setError(result.message || 'Erro ao criar imobiliária. Tente novamente.');
          setIsSubmitting(false);
      } else {
          setSuccessMsg(result.message || 'Cadastro realizado!');
          setIsSubmitting(false);
      }
  };

  const handleSubscribe = () => {
      window.location.href = 'https://pay.hotmart.com/L103469151O';
  };

  const handleResetConfig = () => {
      if(confirm('Tem certeza? Isso desconectará o Supabase.')) {
          clearCredentials();
      }
  };

  if (isLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
             <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-slate-600">Iniciando sistema...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-10 text-center relative">
            <button 
                onClick={() => setCurrentView('LANDING')}
                className="absolute top-4 left-4 text-slate-400 hover:text-white transition flex items-center text-xs"
            >
                <ArrowLeft size={14} className="mr-1" /> Home
            </button>
            
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                    CRM <span className="text-blue-500">Líder</span>
                </h1>
            </div>
            
            <p className="text-blue-200 mt-2 text-sm font-medium">Plataforma Multi-Imobiliárias</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => { setActiveTab('login'); setAuthTab('login'); setError(''); setIsTrialExpired(false); setSuccessMsg(''); }}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center space-x-2 transition ${activeTab === 'login' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <LogIn size={18} /> <span>Entrar</span>
            </button>
            <button 
                onClick={() => { setActiveTab('register'); setAuthTab('register'); setError(''); setIsTrialExpired(false); setSuccessMsg(''); }}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center space-x-2 transition ${activeTab === 'register' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <PlusCircle size={18} /> <span>Nova Imobiliária</span>
            </button>
        </div>
        
        <div className="p-8">
            {error && (
                <div className={`border px-4 py-3 rounded-lg mb-6 flex flex-col items-center text-sm ${isTrialExpired ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    <div className="flex items-center w-full">
                        <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                        {error}
                    </div>
                    {isTrialExpired && (
                        <button 
                            onClick={handleSubscribe}
                            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-lg flex items-center justify-center transition shadow-lg shadow-green-600/20 animate-bounce"
                        >
                            <CreditCard size={18} className="mr-2" /> Assinar Plano Agora
                        </button>
                    )}
                </div>
            )}

            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center text-sm">
                    <CheckCircle size={16} className="mr-2 flex-shrink-0" />
                    {successMsg}
                </div>
            )}

            {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail</label>
                        <input 
                            type="email" 
                            required
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                            <input 
                                type="password" 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center transition disabled:opacity-70 shadow-md shadow-blue-500/20"
                    >
                        {isSubmitting ? 'Entrando...' : 'Acessar Painel'}
                    </button>
                </form>
            ) : (
                <>
                    {successMsg ? (
                        <div className="text-center py-4">
                            <p className="text-slate-600 mb-4">{successMsg}</p>
                            <p className="text-sm text-slate-500 mb-6">Agora você pode fazer login e aproveitar seu período de teste.</p>
                            <button 
                                onClick={() => { setActiveTab('login'); setAuthTab('login'); }}
                                className="text-blue-600 font-bold hover:underline"
                            >
                                Voltar para Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome da Imobiliária</label>
                                <div className="relative">
                                    <Briefcase size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                    <input 
                                        required
                                        value={regAgencyName}
                                        onChange={(e) => setRegAgencyName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Ex: Imóveis do Sul"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome do Administrador</label>
                                <input 
                                    required
                                    value={regAdminName}
                                    onChange={(e) => setRegAdminName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Seu nome completo"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail</label>
                                    <input 
                                        type="email"
                                        required
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="email@..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">WhatsApp</label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                        <input 
                                            required
                                            value={regPhone}
                                            onChange={(e) => {
                                                let val = e.target.value
                                                    .replace(/\D/g, '')
                                                    .replace(/^(\d{2})(\d)/, '($1) $2')
                                                    .replace(/(\d)(\d{4})$/, '$1-$2');
                                                setRegPhone(val);
                                            }}
                                            className="w-full pl-9 pr-3 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="(00) 0..."
                                            maxLength={15}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Senha</label>
                                <input 
                                    type="password"
                                    required
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Crie uma senha segura"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center transition disabled:opacity-70 shadow-md shadow-green-500/20"
                            >
                                {isSubmitting ? 'Criando...' : 'Iniciar Teste Grátis (7 Dias)'}
                            </button>
                        </form>
                    )}
                </>
            )}

            {!isHardcoded() && (
                <div className="mt-8 text-center">
                    <button 
                        onClick={handleResetConfig}
                        className="text-xs text-slate-400 hover:text-red-500 underline"
                    >
                        Configurações do Banco de Dados
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
