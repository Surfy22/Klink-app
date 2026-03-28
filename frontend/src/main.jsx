import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AdminPage from './pages/AdminPage';
import NotFound from './pages/NotFound';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/table/:barId/:tableId"     element={<App />} />
        <Route path="/admin/:barId/:password"    element={<AdminPage />} />
        <Route path="*"                          element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
