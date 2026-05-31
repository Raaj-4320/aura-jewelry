import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { 
  Gem, 
  TrendingUp, 
  ArrowUpRight, 
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { getAdminProducts } from '../../services/firebaseService';
import { Product } from '../../types';
import { formatPrice } from '../../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    featuredProducts: 0,
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoadError('');
      try {
        const products = await getAdminProducts();
        if (products) {
          setStats(prev => ({
            ...prev,
            totalProducts: products.length,
            activeProducts: products.filter(p => p.active).length,
            featuredProducts: products.filter(p => p.featured).length,
          }));
          setRecentProducts(products.slice(0, 5));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load dashboard products.';
        console.error('ADMIN_DASHBOARD_LOAD_FAILED', message);
        setLoadError(message);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total Products', value: stats.totalProducts, icon: Gem, color: 'rose-gold', trend: 'Live', up: true },
    { name: 'In-stock Products', value: stats.activeProducts, icon: TrendingUp, color: 'rose-gold', trend: 'Live', up: true },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">Dashboard Overview</h1>
            <p className="text-xs text-taupe tracking-widest uppercase">Welcome back to your boutique management</p>
          </div>

        </div>

        {/* Stats Grid */}
        {loadError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-5 py-4 text-sm">
            Dashboard product stats could not be loaded from Firestore. {loadError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statCards.map((stat, idx) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-rose-gold/10 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-gold-light/30 flex items-center justify-center text-rose-gold">
                  <stat.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${stat.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  <ArrowUpRight size={12} />
                  {stat.trend}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-taupe uppercase tracking-widest">{stat.name}</p>
                <p className="text-3xl font-light text-deep-taupe">{stat.value ?? '—'}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div>
          {/* Recent Products */}
          <div className="bg-white rounded-3xl border border-rose-gold/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-warm-gray">
              <h3 className="text-sm font-semibold text-deep-taupe uppercase tracking-widest">Recent Products</h3>
            </div>
            <div className="divide-y divide-warm-gray">
              {recentProducts.map((product) => (
                <div key={product.id} className="p-4 flex items-center justify-between hover:bg-warm-gray/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-warm-gray">
                      <img src={product.thumbnailImage} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-deep-taupe">{product.name}</p>
                      <p className="text-[10px] text-taupe uppercase tracking-widest">{product.category} • {formatPrice(product.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${product.quantity > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {product.quantity > 0 ? 'In stock' : 'Stockout'}
                    </span>
                    <ChevronRight size={16} className="text-taupe/40" />
                  </div>
                </div>
              ))}
              {recentProducts.length === 0 && (
                <div className="p-12 text-center text-taupe italic text-sm">No products added yet.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
