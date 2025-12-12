import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Tenta pegar das variáveis de ambiente do Vite/Vercel primeiro
const ENV_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
const ENV_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Fallback hardcoded para demonstração (se as env vars não existirem)
const HARDCODED_URL: string = "https://awrfaunmdqatvdkembjm.supabase.co"; 
const HARDCODED_KEY: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cmZhdW5tZHFhdHZka2VtYmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTEwNjIsImV4cCI6MjA4MDMyNzA2Mn0.-79q_D7caHzK29hku_uS7t7AX-E9I6tqRq7zLvmSgOs"; 

let supabaseInstance: SupabaseClient | null = null;

const getUrl = () => {
    // 1. Prioridade: Variável de Ambiente (Deploy Vercel)
    if (ENV_URL) return ENV_URL;
    // 2. Hardcoded (Demo)
    if (HARDCODED_URL && HARDCODED_URL.startsWith('http')) return HARDCODED_URL;
    // 3. LocalStorage (Configuração Manual na tela de Login)
    return localStorage.getItem('imob_supabase_url');
};

const getKey = () => {
    if (ENV_KEY) return ENV_KEY;
    if (HARDCODED_KEY && HARDCODED_KEY.length > 10) return HARDCODED_KEY;
    return localStorage.getItem('imob_supabase_key');
};

export const isHardcoded = (): boolean => {
    return !!(HARDCODED_URL && HARDCODED_KEY) || !!(ENV_URL && ENV_KEY);
};

export const checkConfiguration = (): boolean => {
    const url = getUrl();
    const key = getKey();
    return !!(url && key);
};

export const supabase = new Proxy({} as SupabaseClient, {
    get: (target, prop) => {
        if (!supabaseInstance) {
             const url = getUrl() || 'https://placeholder.supabase.co';
             const key = getKey() || 'placeholder-key';
             supabaseInstance = createClient(url, key);
        }
        return (supabaseInstance as any)[prop];
    }
});

export const validateCredentials = async (url: string, key: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const cleanUrl = url.trim().replace(/\/$/, "");
        const cleanKey = key.trim();
        
        if (!cleanUrl.startsWith('http')) {
            return { success: false, error: 'A URL deve começar com https://' };
        }

        const tempClient = createClient(cleanUrl, cleanKey);
        
        const { error } = await tempClient.from('agencies').select('count', { count: 'exact', head: true });
        
        if (error) {
            if (error.message && (error.message.includes('fetch') || error.message.includes('apikey'))) {
                 return { success: false, error: `Erro de conexão: ${error.message}` };
            }
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || 'Erro desconhecido ao testar conexão.' };
    }
};

export const saveCredentials = (url: string, key: string) => {
  if (!url || !key) return;
  const cleanUrl = url.trim().replace(/\/$/, "");
  const cleanKey = key.trim();

  localStorage.setItem('imob_supabase_url', cleanUrl);
  localStorage.setItem('imob_supabase_key', cleanKey);
  
  supabaseInstance = createClient(cleanUrl, cleanKey);
};

export const clearCredentials = () => {
    localStorage.removeItem('imob_supabase_url');
    localStorage.removeItem('imob_supabase_key');
    localStorage.removeItem('imob_user_id');
    supabaseInstance = null;
    window.location.reload(); 
}