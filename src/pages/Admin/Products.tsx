import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye,
  Star,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { getProducts } from '../../services/firebaseService';
import { Product } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import { db } from '../../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), { active: !currentStatus });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !currentStatus } : p));
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">Product Management</h1>
            <p className="text-xs text-taupe tracking-widest uppercase">Manage your jewelry collection</p>
          </div>
          <Link to="/admin/products/add" className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Add New Piece
          </Link>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe/40" size={18} />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-rose-gold/10 rounded-2xl text-sm focus:outline-none focus:border-rose-gold/30 transition-all"
            />
          </div>
          <button className="px-6 py-3 bg-white border border-rose-gold/10 rounded-2xl text-sm font-medium text-taupe flex items-center gap-2 hover:border-rose-gold/30 transition-all">
            <Filter size={18} />
            Filters
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-[2.5rem] border border-rose-gold/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-gray/30 border-b border-warm-gray">
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Product</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Category</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Price</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Status</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Featured</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-gray">
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8 h-20 bg-white"></td>
                    </tr>
                  ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-warm-gray/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-warm-gray shrink-0">
                            <img src={product.thumbnailImage} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-deep-taupe">{product.name}</p>
                            <p className="text-[10px] text-taupe uppercase tracking-widest">ID: {product.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-taupe uppercase tracking-widest">{product.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-rose-gold">
                          {product.priceOnRequest ? 'On Request' : formatPrice(product.price)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleStatus(product.id, product.active)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                            product.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                          )}
                        >
                          {product.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {product.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <Star 
                          size={16} 
                          className={cn("transition-colors", product.featured ? "text-rose-gold fill-rose-gold" : "text-taupe/20")} 
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/product/${product.slug}`} target="_blank" className="p-2 text-taupe hover:text-rose-gold hover:bg-rose-gold-light/30 rounded-lg transition-all">
                            <Eye size={18} />
                          </Link>
                          <Link to={`/admin/products/edit/${product.id}`} className="p-2 text-taupe hover:text-rose-gold hover:bg-rose-gold-light/30 rounded-lg transition-all">
                            <Edit2 size={18} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-taupe hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-taupe italic">
                      No products found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
