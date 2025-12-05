import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- ÁREA DE CONFIGURAÇÃO FIXA (HARDCODED) ---
// Cole suas chaves dentro das aspas abaixo.
// Exemplo: const HARDCODED_URL = "https://seu-projeto.supabase.co";
const HARDCODED_URL: string = "https://awrfaunmdqatvdkembjm.supabase.co"; 
const HARDCODED_KEY: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cmZhdW5tZHFhdHZka2VtYmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTEwNjIsImV4cCI6MjA4MDMyNzA2Mn0.-79q_D7caHzK29hku_uS7t7AX-E9I6tqRq7zLvmSgOs"; 
// ---------------------------------------------

// Variável para armazenar a instância real do cliente
let supabaseInstance: SupabaseClient | null = null;

// Funções auxiliares de leitura com prioridade para chaves fixas
const getUrl = () => {
    if (HARDCODED_URL && HARDCODED_URL.startsWith('http')) return HARDCODED_URL;
    return localStorage.getItem('imob_supabase_url');
};

const getKey = () => {
    if (HARDCODED_KEY && HARDCODED_KEY.length > 10) return HARDCODED_KEY;
    return localStorage.getItem('imob_supabase_key');
};

// Verifica se as chaves estão hardcoded no código
export const isHardcoded = (): boolean => {
    return !!(HARDCODED_URL && HARDCODED_KEY);
};

// Verifica se está configurado
export const checkConfiguration = (): boolean => {
    const url = getUrl();
    const key = getKey();
    return !!(url && key);
};

// --- PROXY CLIENT ---
export const supabase = new Proxy({} as SupabaseClient, {
    get: (target, prop) => {
        // Se ainda não inicializou, inicializa agora
        if (!supabaseInstance) {
             const url = getUrl() || 'https://placeholder.supabase.co';
             const key = getKey() || 'placeholder-key';
             supabaseInstance = createClient(url, key);
        }
        // Encaminha a chamada para a instância real
        return (supabaseInstance as any)[prop];
    }
});

// Tenta conectar com as credenciais fornecidas para validar se funcionam
export const validateCredentials = async (url: string, key: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const cleanUrl = url.trim().replace(/\/$/, ""); // Remove barra final
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