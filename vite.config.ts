import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo (development/production)
  // Usamos '.' para o diretório atual para evitar erros de tipagem com process.cwd() caso @types/node falte
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    // Usar caminho relativo ('./') permite que o app funcione na raiz ou em subpastas da hospedagem
    base: './',
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
    },
    define: {
      // Injeta a API_KEY no process.env para o client-side
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Mantém NODE_ENV correto
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      // Vite lida com history fallback automaticamente em dev
    }
  };
});