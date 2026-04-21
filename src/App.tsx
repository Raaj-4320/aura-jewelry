import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RequireAdmin from './components/RequireAdmin';
import InfoPage from './pages/InfoPage';

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
        <span className="text-xs tracking-[0.3em] uppercase text-taupe">Sviwa</span>
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
          <Route path="/account" element={<Layout><InfoPage title="Account" description="Sign in to access your account details and saved preferences." /></Layout>} />
          <Route path="/about" element={<Layout><InfoPage title="About Us" description="Sviwa Creation celebrates timeless luxury with curated jewelry crafted for modern elegance." /></Layout>} />
          <Route path="/contact" element={<Layout><InfoPage title="Contact" description="Reach Sviwa Creation on WhatsApp (+91 9510907017) or Instagram for product inquiries and styling assistance." /></Layout>} />
          <Route path="/shipping" element={<Layout><InfoPage title="Shipping Policy" description="We provide careful packaging and reliable shipping updates for every order inquiry handled via WhatsApp." /></Layout>} />
          <Route path="/care" element={<Layout><InfoPage title="Jewelry Care" description="Store jewelry in dry spaces, avoid harsh chemicals, and clean gently with a soft cloth to preserve brilliance." /></Layout>} />
          <Route path="/faq" element={<Layout><InfoPage title="FAQs" description="Find answers about sizing, materials, customization, and delivery timelines. Contact us for anything else." /></Layout>} />
          <Route path="/privacy" element={<Layout><InfoPage title="Privacy Policy" description="We only use essential information to respond to inquiries and manage your communication preferences securely." /></Layout>} />
          <Route path="/terms" element={<Layout><InfoPage title="Terms of Service" description="By using Sviwa Creation, you agree to our inquiry process, product information terms, and communication policies." /></Layout>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/admin/products/add" element={<RequireAdmin><AdminAddProduct /></RequireAdmin>} />
          <Route path="/admin/products/edit/:id" element={<RequireAdmin><AdminAddProduct /></RequireAdmin>} />
          <Route path="/admin/products/import" element={<RequireAdmin><BulkImport /></RequireAdmin>} />
          <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />
        </Routes>
      </Suspense>
    </Router>
  );
}
