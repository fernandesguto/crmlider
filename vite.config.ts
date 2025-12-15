
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo (development/production)
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    base: './',
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
    },
    define: {
      // Garante que o código antigo que usa process.env.API_KEY funcione
      // Se VITE_API_KEY existir, usa ele. Se API_KEY existir, usa ele.
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
    }
  };
});
