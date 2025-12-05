import React, { useState, useEffect } from 'react';
import { Database, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { saveCredentials, validateCredentials } from '../services/supabaseClient';

interface SetupModalProps {
    onSuccess: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ onSuccess }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Tenta carregar valores antigos se existirem, para facilitar edição
  useEffect(() => {
      const savedUrl = localStorage.getItem('imob_supabase_url');
      const savedKey = localStorage.getItem('imob_supabase_key');
      if (savedUrl) setUrl(savedUrl);
      if (savedKey) setKey(savedKey);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('testing');
    setErrorMessage('');

    // Validação básica
    if (!url || !key) {
        setStatus('error');
        setErrorMessage('Preencha todos os campos.');
        return;
    }

    // Validação real de conexão
    const result = await validateCredentials(url, key);

    if (result.success) {
        setStatus('success');
        saveCredentials(url, key);
        
        // Pequeno delay para usuário ver o sucesso visualmente
        setTimeout(() => {
            onSuccess();
        }, 800);
    } else {
        setStatus('error');
        setErrorMessage(result.error || 'Falha ao conectar. Verifique os dados.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Database size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Conectar ao Supabase</h1>
          <p className="text-slate-500 mt-2">
            Configure seu banco de dados para começar.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Como conectar:</p>
                <ol className="list-decimal pl-4 space-y-1">
                    <li>Acesse seu projeto em <strong>supabase.com</strong></li>
                    <li>Vá em <strong>Settings</strong> &gt; <strong>API</strong></li>
                    <li>Copie a <strong>Project URL</strong> e a <strong>Anon / Public Key</strong></li>
                </ol>
            </div>
        </div>

        {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-center">
                <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                {errorMessage}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project URL</label>
            <input
              required
              type="url"
              placeholder="https://seu-projeto.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">API Key (Anon / Public)</label>
            <input
              required
              type="text"
              placeholder="eyJh..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
          
          <button
            type="submit"
            disabled={status === 'testing' || status === 'success'}
            className={`w-full font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition mt-4 ${
                status === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70'
            }`}
          >
            {status === 'testing' ? (
                <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Testando conexão...</span>
                </>
            ) : status === 'success' ? (
                <>
                    <CheckCircle size={20} />
                    <span>Conectado com Sucesso!</span>
                </>
            ) : (
                <>
                    <Save size={20} />
                    <span>Salvar e Conectar</span>
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};