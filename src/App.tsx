import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/Admin/Products'));
const AdminAddProduct = lazy(() => import('./pages/Admin/AddProduct'));
const BulkImport = lazy(() => import('./pages/Admin/BulkImport'));
const AdminSettings = lazy(() => import('./pages/Admin/Settings'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-2 border-rose-gold/20 border-t-rose-gold rounded-full animate-spin"></div>
        <span className="text-xs tracking-[0.3em] uppercase text-taupe">Aura</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/shop" element={<Layout><Shop /></Layout>} />
          <Route path="/product/:slug" element={<Layout><ProductDetail /></Layout>} />
          <Route path="/wishlist" element={<Layout><Wishlist /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />

          {/* Admin Routes (Simplified for now, should add protection) */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/add" element={<AdminAddProduct />} />
          <Route path="/admin/products/edit/:id" element={<AdminAddProduct />} />
          <Route path="/admin/products/import" element={<BulkImport />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
