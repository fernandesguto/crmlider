
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PremiumLanding } from './pages/PremiumLanding';

const rootElement = document.getElementById('root-landing');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <PremiumLanding />
    </React.StrictMode>
  );
}
