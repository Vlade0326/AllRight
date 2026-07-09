import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppPage } from './pages/AppPage';
import './styles.css';
import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppPage />
  </StrictMode>,
);
