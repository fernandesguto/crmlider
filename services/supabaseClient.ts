import { createClient } from '@supabase/supabase-js';

// Tenta pegar as chaves do armazenamento local do navegador
const storedUrl = localStorage.getItem('imob_supabase_url');
const storedKey = localStorage.getItem('imob_supabase_key');

// Verifica se está configurado de forma robusta
export const isConfigured = !!(storedUrl && storedUrl.length > 5 && storedKey && storedKey.length > 10);

// Se não tiver configurado, usamos valores "dummy" válidos sintaticamente para o app não quebrar na inicialização.
// O SetupModal vai impedir o usuário de usar o app até colocar as chaves reais.
// No entanto, se o usuário estiver na tela de Setup, o createClient será chamado com esses valores.
// É importante que eles sejam strings não-vazias para evitar erro de constructor URL.
const SUPABASE_URL = storedUrl || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = storedKey || 'placeholder-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Função auxiliar para salvar as credenciais
export const saveCredentials = (url: string, key: string) => {
  if (!url || !key) return;
  localStorage.setItem('imob_supabase_url', url.trim());
  localStorage.setItem('imob_supabase_key', key.trim());
  window.location.reload(); // Recarrega para aplicar a nova conexão
};

export const clearCredentials = () => {
    localStorage.removeItem('imob_supabase_url');
    localStorage.removeItem('imob_supabase_key');
    // Remove também a sessão do usuário
    localStorage.removeItem('imob_user_id');
    window.location.reload();
}