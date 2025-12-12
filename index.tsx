import React from 'react';
import ReactDOM from 'react-dom/client';
// Importação explícita com extensão .tsx para ignorar o arquivo App.jsx antigo
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("Sistema iniciado (Index TSX)");
} catch (error) {
  console.error("Erro fatal:", error);
  rootElement.innerHTML = `<div style="color:red; padding:20px;">Erro crítico ao iniciar: ${error}</div>`;
}