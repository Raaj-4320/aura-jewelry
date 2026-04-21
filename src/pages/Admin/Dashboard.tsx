import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { 
  Gem, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { getProducts } from '../../services/firebaseService';
import { Product } from '../../types';
import { formatPrice } from '../../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    featuredProducts: 0,
    whatsappClicks: 124, // Mock
    wishlistAdds: 89, // Mock
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const products = await getProducts();
      if (products) {
        setStats(prev => ({
          ...prev,
          totalProducts: products.length,
          activeProducts: products.filter(p => p.active).length,
          featuredProducts: products.filter(p => p.featured).length,
        }));
        setRecentProducts(products.slice(0, 5));
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { name: 'Total Products', value: stats.totalProducts, icon: Gem, color: 'rose-gold', trend: '+12%', up: true },
    { name: 'Active Listing', value: stats.activeProducts, icon: TrendingUp, color: 'rose-gold', trend: '+5%', up: true },
    { name: 'WhatsApp Inquiries', value: stats.whatsappClicks, icon: MessageCircle, color: 'rose-gold', trend: '+24%', up: true },
    { name: 'Wishlist Adds', value: stats.wishlistAdds, icon: Users, color: 'rose-gold', trend: '-2%', up: false },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">Dashboard Overview</h1>
            <p className="text-xs text-taupe tracking-widest uppercase">Welcome back to your boutique management</p>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-white border border-rose-gold/10 rounded-xl text-xs font-medium text-taupe hover:border-rose-gold/30 transition-all">
              Export Report
            </button>
            <button className="px-4 py-2 bg-rose-gold text-white rounded-xl text-xs font-medium shadow-md shadow-rose-gold/20 hover:bg-opacity-90 transition-all">
              Generate Analytics
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.trend}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-taupe uppercase tracking-widest">{stat.name}</p>
                <p className="text-3xl font-light text-deep-taupe">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Products */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-rose-gold/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-warm-gray flex justify-between items-center">
              <h3 className="text-sm font-semibold text-deep-taupe uppercase tracking-widest">Recent Products</h3>
              <button className="text-xs text-rose-gold hover:underline">View All</button>
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
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${product.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {product.active ? 'Active' : 'Inactive'}
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

          {/* Activity Feed */}
          <div className="bg-white rounded-3xl border border-rose-gold/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-warm-gray">
              <h3 className="text-sm font-semibold text-deep-taupe uppercase tracking-widest">Recent Activity</h3>
            </div>
            <div className="p-6 space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blush flex items-center justify-center text-rose-gold shrink-0">
                    <Clock size={14} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-deep-taupe leading-relaxed">
                      <span className="font-bold">Admin</span> updated price for <span className="font-bold">Rose Gold Ring</span>
                    </p>
                    <p className="text-[10px] text-taupe uppercase tracking-widest">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
