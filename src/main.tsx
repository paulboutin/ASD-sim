import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { SimulationProvider } from './state/SimulationContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <SimulationProvider>
        <App />
      </SimulationProvider>
    </HashRouter>
  </StrictMode>,
);
