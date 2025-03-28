
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import ClientesPage from '@/components/admin/ClientesPage';
import OrdenesPage from '@/components/admin/OrdenesPage';
import FotografiasPage from '@/components/admin/FotografiasPage';
import AjustesPage from '@/components/admin/AjustesPage';

const AdminPanel = () => {
  return (
    <AuthProvider>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/ordenes" element={<OrdenesPage />} />
          <Route path="/fotografias" element={<FotografiasPage />} />
          <Route path="/ajustes" element={<AjustesPage />} />
        </Routes>
      </AdminLayout>
    </AuthProvider>
  );
};

export default AdminPanel;
