import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo (development/production)
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // Na Vercel, 'base' deve ser '/' ou removido para deploy na raiz.
    // 'base: "./"' é usado apenas para GitHub Pages ou pastas relativas.
    base: '/',
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
    },
    define: {
      // Injeta a API_KEY no process.env para o client-side (conforme requisitos do Gemini SDK)
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Stub para evitar erros de 'process is not defined' em algumas bibliotecas
      'process.env': {} 
    },
    server: {
      historyApiFallback: true
    }
  };
});