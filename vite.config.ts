
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: './', 
    build: {
      outDir: 'build', // Alterado de 'dist' para 'build' para evitar conflito com arquivo existente
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
    }
  };
});
