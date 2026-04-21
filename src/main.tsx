import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { testConnection } from './services/firebaseService';
import { StoreSettingsProvider } from './contexts/StoreSettingsContext';

testConnection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreSettingsProvider>
      <App />
    </StoreSettingsProvider>
  </StrictMode>,
);
