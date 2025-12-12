import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    // A ordem aqui garante que .tsx seja carregado antes de qualquer outra coisa,
    // mas como deletamos o conteúdo dos .jsx, o Vite será obrigado a usar o .tsx
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
  },
  define: {
    'process.env': {}
  },
  server: {
    historyApiFallback: true
  }
});