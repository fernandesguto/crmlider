import React, { useState } from 'react';
import { Database, Save, AlertCircle } from 'lucide-react';
import { saveCredentials } from '../services/supabaseClient';

export const SetupModal: React.FC = () => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && key) {
      saveCredentials(url, key);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Database size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Conectar ao Supabase</h1>
          <p className="text-slate-500 mt-2">
            Para começar, precisamos conectar seu app ao banco de dados.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Como pegar essas chaves?</p>
                <ol className="list-decimal pl-4 space-y-1">
                    <li>Crie um projeto em <a href="https://supabase.com" target="_blank" className="underline">supabase.com</a></li>
                    <li>Vá em <strong>Settings</strong> (ícone de engrenagem) {'>'} <strong>API</strong></li>
                    <li>Copie a <strong>Project URL</strong> e a <strong>Anon / Public Key</strong></li>
                </ol>
            </div>
        </div>

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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition mt-4"
          >
            <Save size={20} />
            <span>Salvar e Conectar</span>
          </button>
        </form>
      </div>
    </div>
  );
};