import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, LogIn, AlertCircle, PlusCircle, Briefcase, Lock } from 'lucide-react';
import { clearCredentials, isHardcoded } from '../services/supabaseClient';

export const Login: React.FC = () => {
  const { login, registerAgency, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regAgencyName, setRegAgencyName] = useState('');
  const [regAdminName, setRegAdminName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Login agora passa email e senha
    const success = await login(email, password);
    
    if (!success) {
        setError('E-mail ou senha incorretos.');
        setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsSubmitting(true);
      
      const result = await registerAgency(regAgencyName, regAdminName, regEmail, regPassword);
      
      if (!result.success) {
          setError(result.message || 'Erro ao criar imobiliária. Tente novamente.');
          setIsSubmitting(false);
      }
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
        <div className="bg-slate-900 p-8 text-center relative">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4 text-white shadow-lg">
                <Building2 size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">ImobERP</h1>
            <p className="text-blue-200 mt-2 text-sm">Plataforma Multi-Imobiliárias</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center space-x-2 transition ${activeTab === 'login' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <LogIn size={18} /> <span>Entrar</span>
            </button>
            <button 
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center space-x-2 transition ${activeTab === 'register' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <PlusCircle size={18} /> <span>Nova Imobiliária</span>
            </button>
        </div>
        
        <div className="p-8">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center text-sm">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                    {error}
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
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail Admin</label>
                        <input 
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="admin@imoveisdosul.com"
                        />
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
                        {isSubmitting ? 'Criando...' : 'Criar Conta e Entrar'}
                    </button>
                </form>
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