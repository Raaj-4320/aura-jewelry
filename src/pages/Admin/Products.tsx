import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { deleteProduct, deleteProductsByIds, getAdminProducts, toggleProductActive } from '../../services/firebaseService';
import { Product } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

function resolveImage(product: any) {
  return product.thumbnailImage || product.image || product.imageSrc || product.galleryImages?.[0] || product.images?.[0]?.src || product.images?.[0]?.url || '';
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadError, setLoadError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0, failed: 0 });

  const fetchProducts = async () => {
    setLoading(true); setLoadError('');
    try { const data = await getAdminProducts(); setProducts(data || []); }
    catch (error) { const message = error instanceof Error ? error.message : 'Failed to load products from Firestore.'; setProducts([]); setLoadError(message); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, []);

  const filteredProducts = useMemo(() => products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase())), [products, searchQuery]);
  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try { await toggleProductActive(id, !currentStatus); setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: !currentStatus } : p))); toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`); }
    catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    try { await deleteProduct(id); setProducts((prev) => prev.filter((p) => p.id !== id)); setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; }); toast.success('Product deleted'); }
    catch { toast.error('Failed to delete product'); }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds) as string[];
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected products?`)) return;
    setDeletingBatch(true);
    try {
      const result = await deleteProductsByIds(ids, (info) => setBatchProgress(info));
      toast.success(`Deleted ${result.completed - result.failed}/${result.total} selected.`);
      setSelectedIds(new Set());
      await fetchProducts();
    } catch {
      toast.error('Bulk delete failed');
    } finally {
      setDeletingBatch(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div><h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">Product Management</h1></div>
          <Link to="/admin/products/add" className="btn-primary flex items-center gap-2"><Plus size={18} />Add New Piece</Link>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe/40" size={18} /><input type="text" placeholder="Search by name or category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-rose-gold/10 rounded-2xl text-sm" /></div>
          <Link to="/admin/products/import" className="btn-secondary">Go to Import</Link>
        </div>

        {selectedIds.size > 0 && (
          <div className="bg-white border rounded-2xl p-4 flex items-center justify-between">
            <p className="text-sm">{selectedIds.size} selected</p>
            <button onClick={handleBulkDelete} disabled={deletingBatch} className="btn-primary">Delete Selected</button>
          </div>
        )}
        {deletingBatch && <div className="text-sm text-taupe">Deleting {batchProgress.completed}/{batchProgress.total} ({Math.round((batchProgress.completed / Math.max(1, batchProgress.total)) * 100)}%) • Failed: {batchProgress.failed}</div>}

        {!loading && loadError && <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-5 py-4 text-sm">Products could not be loaded from Firestore. {loadError}</div>}

        <div className="bg-white rounded-[2rem] border border-rose-gold/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead><tr className="bg-warm-gray/30 border-b border-warm-gray"><th className="px-4 py-4"><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedIds((prev) => {
                if (allVisibleSelected) return new Set();
                const n = new Set(prev); filteredProducts.forEach((p) => n.add(p.id)); return n;
              })} /></th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Image</th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Product</th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Category/Type</th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Price</th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Status</th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-warm-gray">
                {loading ? [1, 2, 3].map((i) => <tr key={i}><td colSpan={7} className="px-6 py-8 animate-pulse" /></tr>) : filteredProducts.map((product: any) => {
                  const image = resolveImage(product);
                  const imageCount = Array.isArray(product.images) ? product.images.length : Array.isArray(product.galleryImages) ? product.galleryImages.length : 0;
                  return (
                    <tr key={product.id} className="hover:bg-warm-gray/10">
                      <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => setSelectedIds((prev) => { const n = new Set(prev); n.has(product.id) ? n.delete(product.id) : n.add(product.id); return n; })} /></td>
                      <td className="px-4 py-3"><div className="w-12 h-12 rounded-xl overflow-hidden bg-warm-gray">{image ? <img src={image} alt={product.name} className="w-full h-full object-cover" /> : null}</div>{imageCount > 1 && <p className="text-[10px] text-taupe mt-1">+{imageCount - 1} images</p>}</td>
                      <td className="px-4 py-3"><p className="text-sm font-semibold text-deep-taupe">{product.name || product.title}</p><p className="text-[10px] text-taupe uppercase">{product.id}</p></td>
                      <td className="px-4 py-3 text-xs text-taupe uppercase">{product.category || '-'} / {product.type || '-'}</td>
                      <td className="px-4 py-3"><span className="text-sm font-medium text-rose-gold">{product.priceOnRequest ? 'On Request' : formatPrice(product.price)}</span></td>
                      <td className="px-4 py-3"><button onClick={() => toggleStatus(product.id, product.active)} className={cn('flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase', product.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>{product.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}{product.active ? 'Active' : 'Inactive'}</button></td>
                      <td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><Link to={`/admin/products/edit/${product.id}`} className="p-2 text-taupe hover:text-rose-gold"><Edit2 size={18} /></Link><button onClick={() => handleDelete(product.id)} className="p-2 text-taupe hover:text-red-500"><Trash2 size={18} /></button></div></td>
                    </tr>
                  );
                })}
                {!loading && filteredProducts.length === 0 && <tr><td colSpan={7} className="px-6 py-16 text-center text-taupe italic">No products found matching your search.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
