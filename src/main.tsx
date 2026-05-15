import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { testConnection } from './services/firebaseService';
import { logError, logSystem } from './utils/logger';
import { StoreSettingsProvider } from './contexts/StoreSettingsContext';

testConnection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreSettingsProvider>
      <App />
    </StoreSettingsProvider>
  </StrictMode>,
);

logSystem('app_loaded', { path: window.location.pathname, search: window.location.search, userAgent: navigator.userAgent });
window.addEventListener('error', (e) => logError('global_error', e.error || e.message, { source: e.filename }));
window.addEventListener('unhandledrejection', (e) => logError('unhandled_promise_rejection', e.reason));
