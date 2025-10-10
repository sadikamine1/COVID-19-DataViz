import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Menu from './pages/Menu';
import DiagnosticPage from './pages/DiagnosticPage';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing');
createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter basename={(import.meta as any).env?.BASE_URL || '/'}>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        <Route path="/covid" element={<App forcedDisease="covid" />} />
        <Route path="/flu" element={<App forcedDisease="flu" />} />
        <Route path="/measles" element={<App forcedDisease="measles" />} />
        <Route path="/malaria" element={<App forcedDisease="malaria" />} />
        <Route path="/tuberculosis" element={<App forcedDisease="tuberculosis" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
