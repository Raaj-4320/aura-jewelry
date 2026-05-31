import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import ThemedSelect from '../../components/ThemedSelect';
import ProductImageCarouselModal from '../../components/ProductImageCarouselModal';
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, Save, Loader2, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { deleteProduct, deleteProductsByIds, getAdminProducts, updateProduct } from '../../services/firebaseService';
import { Product } from '../../types';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { logDB, logProduct, logRoute, logUI } from '../../utils/logger';
import { useCatalogCategories } from '../../hooks/useCatalogCategories';


interface ProductRowDraft {
  name: string;
  category: string;
  subcategory: string;
  price: string;
  quantity: string;
}

function toRowDraft(product: Product): ProductRowDraft {
  return {
    name: product.name || '',
    category: product.category || '',
    subcategory: product.subcategory || '',
    price: String(product.price ?? 0),
    quantity: String(product.quantity ?? 0),
  };
}

function isDraftChanged(product: Product, draft: ProductRowDraft) {
  return draft.name.trim() !== (product.name || '') ||
    draft.category !== (product.category || '') ||
    draft.subcategory !== (product.subcategory || '') ||
    Number(draft.price) !== Number(product.price ?? 0) ||
    Number(draft.quantity) !== Number(product.quantity ?? 0);
}

function getProductImages(product: any) {
  const gallery = Array.isArray(product.galleryImages) ? product.galleryImages : [];
  const images = Array.isArray(product.images) ? product.images.map((image: any) => typeof image === 'string' ? image : image?.src || image?.url).filter(Boolean) : [];
  return [...new Set([product.thumbnailImage, product.mainImage, product.image, product.imageSrc, ...gallery, ...images].filter(Boolean))] as string[];
}

function resolveImage(product: any) { return getProductImages(product)[0] || ''; }

export default function Products() {
  const { categories, subcategories } = useCatalogCategories();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('stock') || 'all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [loadError, setLoadError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0, failed: 0 });
  const [rowDrafts, setRowDrafts] = useState<Record<string, ProductRowDraft>>({});
  const [savingRowIds, setSavingRowIds] = useState<Set<string>>(new Set());
  const [galleryProduct, setGalleryProduct] = useState<Product | null>(null);
  const savingRowIdsRef = useRef(new Set<string>());

  const fetchProducts = async () => {
    setLoading(true); setLoadError('');
    logProduct('products_table_loading');
    try { logDB('getAdminProducts_request_start'); const data = await getAdminProducts(); setProducts(data || []); logDB('getAdminProducts_request_success', { count: (data || []).length }); logProduct('products_table_loaded', { count: (data || []).length }); }
    catch (error) { const message = error instanceof Error ? error.message : 'Failed to load products from Firestore.'; setProducts([]); setLoadError(message); }
    finally { setLoading(false); }
  };
  useEffect(() => { logRoute('route_rendered', { page: 'AdminProducts', path: window.location.pathname }); logProduct('products_page_loaded'); fetchProducts(); }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const minimum = minPrice === '' ? null : Number(minPrice);
    const maximum = maxPrice === '' ? null : Number(maxPrice);
    return products
      .filter((product) => {
        const productCode = String(product.productCode || (product as any).sku || '');
        const searchable = [product.name, productCode, product.category, product.subcategory, String(product.price), String(product.quantity)].join(' ').toLowerCase();
        return (!query || searchable.includes(query)) &&
          (categoryFilter === 'all' || product.category === categoryFilter) &&
          (subcategoryFilter === 'all' || product.subcategory === subcategoryFilter) &&
          (statusFilter === 'all' || (statusFilter === 'in-stock' ? product.quantity > 0 : product.quantity <= 0)) &&
          (minimum === null || !Number.isFinite(minimum) || product.price >= minimum) &&
          (maximum === null || !Number.isFinite(maximum) || product.price <= maximum);
      })
      .sort((a, b) => {
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        return a.name.localeCompare(b.name);
      });
  }, [products, searchQuery, categoryFilter, subcategoryFilter, statusFilter, minPrice, maxPrice, sortBy]);
  useEffect(() => { logProduct('products_table_rendered', { total: products.length, visible: filteredProducts.length, inStock: products.filter(p=>p.quantity>0).length, stockout: products.filter(p=>p.quantity<=0).length, columns: ['checkbox','image','product','category/type','price','quantity','status','actions'] }); }, [products, filteredProducts.length]);
  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));



  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    try { await deleteProduct(id); setProducts((prev) => prev.filter((p) => p.id !== id)); setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; }); toast.success('Product deleted'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Failed to delete product'); }
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk delete failed');
    } finally {
      setDeletingBatch(false);
    }
  };

  const updateRowDraft = (product: Product, field: keyof ProductRowDraft, value: string) => {
    setRowDrafts((current) => ({ ...current, [product.id]: { ...(current[product.id] || toRowDraft(product)), [field]: value } }));
    logUI('products_inline_field_changed', { id: product.id, field });
  };

  const saveInlineProduct = async (product: Product) => {
    if (savingRowIdsRef.current.has(product.id)) return;
    const draft = rowDrafts[product.id] || toRowDraft(product);
    const name = draft.name.trim();
    const price = Number(draft.price);
    const quantity = Number(draft.quantity);
    if (!name) return toast.error('Product name is required.');
    if (!Number.isFinite(price) || price < 0) return toast.error('Enter a valid product price.');
    if (!Number.isInteger(quantity) || quantity < 0) return toast.error('Enter a valid whole-number quantity.');

    savingRowIdsRef.current.add(product.id);
    setSavingRowIds((current) => new Set(current).add(product.id));
    logProduct('products_inline_save_started', { id: product.id, fields: ['name', 'category', 'subcategory', 'price', 'quantity'] });
    try {
      await updateProduct(product.id, { name, title: name, category: draft.category, subcategory: draft.subcategory, price, quantity, inventoryQty: quantity, active: quantity > 0, status: quantity > 0 ? 'in-stock' : 'stockout', priceOnRequest: price <= 0 } as any);
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, name, category: draft.category, subcategory: draft.subcategory, price, quantity, active: quantity > 0, status: quantity > 0 ? 'in-stock' : 'stockout', priceOnRequest: price <= 0 } : item));
      setRowDrafts((current) => { const next = { ...current }; delete next[product.id]; return next; });
      logProduct('products_inline_save_success', { id: product.id });
      toast.success('Product details saved.');
    } catch (error) {
      logProduct('products_inline_save_failure', { id: product.id, message: error instanceof Error ? error.message : 'unknown' });
      toast.error(error instanceof Error ? error.message : 'Failed to save product details.');
    } finally {
      savingRowIdsRef.current.delete(product.id);
      setSavingRowIds((current) => { const next = new Set(current); next.delete(product.id); return next; });
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setSubcategoryFilter('all');
    setStatusFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('name-asc');
    logUI('products_filters_reset');
  };

  return (
    <AdminLayout>
      <ProductImageCarouselModal open={!!galleryProduct} images={galleryProduct ? getProductImages(galleryProduct) : []} title={galleryProduct?.name || 'Product'} onClose={() => setGalleryProduct(null)} />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div><h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">Product Management</h1></div>
          <Link to="/admin/products/add" className="btn-primary flex items-center gap-2"><Plus size={18} />Add New Piece</Link>
        </div>

        <section className="bg-white rounded-[2rem] border border-rose-gold/20 shadow-sm p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-grow"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe/70" size={18} /><input type="text" placeholder="Search name, code, category or price..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); logUI('products_search_changed', { query: e.target.value }); }} className="w-full pl-12 pr-4 py-3 bg-ivory border border-rose-gold/20 rounded-2xl text-sm outline-none focus:border-rose-gold" /></div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-deep-taupe"><SlidersHorizontal size={16} className="text-rose-gold" /> Filters & Sort</div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <ThemedSelect ariaLabel="Filter by category" value={categoryFilter} onChange={setCategoryFilter} options={[{ value: 'all', label: 'All categories' }, ...categories.map((category) => ({ value: category.slug, label: category.name }))]} />
            <ThemedSelect ariaLabel="Filter by subcategory" value={subcategoryFilter} onChange={setSubcategoryFilter} options={[{ value: 'all', label: 'All subcategories' }, ...subcategories.map((subcategory) => ({ value: subcategory.id, label: subcategory.name }))]} />
            <ThemedSelect ariaLabel="Filter by stock status" value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All statuses' }, { value: 'in-stock', label: 'In stock' }, { value: 'stockout', label: 'Stockout' }]} />
            <input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min price" className="rounded-xl border border-rose-gold/20 bg-ivory px-3 py-2 text-xs text-deep-taupe" />
            <input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max price" className="rounded-xl border border-rose-gold/20 bg-ivory px-3 py-2 text-xs text-deep-taupe" />
            <ThemedSelect ariaLabel="Sort products" value={sortBy} onChange={setSortBy} options={[{ value: 'name-asc', label: 'Name A–Z' }, { value: 'name-desc', label: 'Name Z–A' }, { value: 'price-asc', label: 'Price low–high' }, { value: 'price-desc', label: 'Price high–low' }, { value: 'newest', label: 'Newest first' }]} />
            <button onClick={resetFilters} className="flex items-center justify-center gap-2 rounded-xl border border-rose-gold/30 px-3 py-2 text-xs font-semibold text-taupe hover:bg-blush"><RotateCcw size={14} /> Reset</button>
          </div>
          <p className="text-xs text-taupe">Showing {filteredProducts.length} of {products.length} products</p>
        </section>

        {selectedIds.size > 0 && (
          <div className="bg-white border rounded-2xl p-4 flex items-center justify-between">
            <p className="text-sm">{selectedIds.size} selected</p>
            <button onClick={handleBulkDelete} disabled={deletingBatch} className="btn-primary">Delete Selected</button>
          </div>
        )}
        {deletingBatch && <div className="text-sm text-taupe">Deleting {batchProgress.completed}/{batchProgress.total} ({Math.round((batchProgress.completed / Math.max(1, batchProgress.total)) * 100)}%) • Failed: {batchProgress.failed}</div>}

        {!loading && loadError && <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-5 py-4 text-sm">Products could not be loaded from Firestore. {loadError}</div>}

        {loading && (
          <div className="bg-white border rounded-2xl p-6 text-sm text-taupe">Loading products…</div>
        )}

        {!loading && (
        <div className="bg-white rounded-[2rem] border border-rose-gold/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead><tr className="bg-warm-gray/30 border-b border-warm-gray"><th className="px-4 py-4"><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedIds((prev) => {
                if (allVisibleSelected) return new Set();
                const n = new Set(prev); filteredProducts.forEach((p) => n.add(p.id)); return n;
              })} /></th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Image</th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Product</th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Category/Type</th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Price</th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Qty</th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe">Status</th><th className="px-4 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-taupe text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-warm-gray">
                {loading ? [1, 2, 3].map((i) => <tr key={i}><td colSpan={8} className="px-6 py-8 animate-pulse" /></tr>) : filteredProducts.map((product: any) => {
                  const image = resolveImage(product);
                  const imageCount = getProductImages(product).length;
                  const draft = rowDrafts[product.id] || toRowDraft(product);
                  const dirty = isDraftChanged(product, draft);
                  const saving = savingRowIds.has(product.id);
                  return (
                    <tr key={product.id} className="hover:bg-warm-gray/10 align-top">
                      <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => setSelectedIds((prev) => { const n = new Set(prev); n.has(product.id) ? n.delete(product.id) : n.add(product.id); return n; })} /></td>
                      <td className="px-4 py-3"><button type="button" onClick={() => setGalleryProduct(product)} className="block text-left" aria-label={`View images for ${product.name}`}><div className="w-12 h-12 rounded-xl overflow-hidden bg-warm-gray ring-offset-2 transition hover:ring-2 hover:ring-rose-gold">{image ? <img src={image} alt={product.name} className="w-full h-full object-cover" /> : null}</div>{imageCount > 1 && <p className="text-[10px] text-taupe mt-1">+{imageCount - 1} images</p>}</button></td>
                      <td className="px-4 py-3"><div className="flex min-w-56 items-center gap-2"><input value={draft.name} onChange={(event) => updateRowDraft(product, 'name', event.target.value)} className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-deep-taupe hover:border-rose-gold/30 focus:border-rose-gold focus:bg-white outline-none" /><span className="shrink-0 rounded-full bg-blush px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-taupe">{product.productCode || product.sku || 'No code'}</span></div></td>
                      <td className="px-4 py-3"><div className="grid gap-2"><ThemedSelect ariaLabel={`Category for ${product.name}`} value={draft.category} onChange={(value) => updateRowDraft(product, 'category', value)} className="min-w-32" options={[...(draft.category && !categories.some((category) => category.slug === draft.category) ? [{ value: draft.category, label: draft.category }] : []), ...categories.map((category) => ({ value: category.slug, label: category.name }))]} /><ThemedSelect ariaLabel={`Subcategory for ${product.name}`} value={draft.subcategory} onChange={(value) => updateRowDraft(product, 'subcategory', value)} className="min-w-32" options={[{ value: '', label: 'No subcategory' }, ...(draft.subcategory && !subcategories.some((subcategory) => subcategory.id === draft.subcategory) ? [{ value: draft.subcategory, label: draft.subcategory }] : []), ...subcategories.map((subcategory) => ({ value: subcategory.id, label: subcategory.name }))]} /></div></td>
                      <td className="px-4 py-3"><input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => updateRowDraft(product, 'price', event.target.value)} className="w-28 rounded-lg border border-warm-gray bg-white px-2 py-1 text-sm font-medium text-rose-gold" /></td>
                      <td className="px-4 py-3"><input type="number" min="0" step="1" value={draft.quantity} onChange={(event) => updateRowDraft(product, 'quantity', event.target.value)} className="w-20 rounded-lg border border-warm-gray bg-white px-2 py-1 text-sm text-deep-taupe" /></td>
                      <td className="px-4 py-3"><span className={cn('flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase', product.quantity > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>{product.quantity > 0 ? <CheckCircle2 size={12} /> : <XCircle size={12} />}{product.quantity > 0 ? 'In stock' : 'Stockout'}</span></td>
                      <td className="px-4 py-3 text-right"><div className="flex justify-end gap-2">{dirty && <button onClick={() => saveInlineProduct(product)} disabled={saving} className="flex items-center gap-1 rounded-lg bg-rose-gold px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Save</button>}<Link to={`/admin/products/edit/${product.id}`} className="p-2 text-taupe hover:text-rose-gold" aria-label={`Edit ${product.name}`}><Edit2 size={18} /></Link><button onClick={() => handleDelete(product.id)} className="p-2 text-taupe hover:text-red-500" aria-label={`Delete ${product.name}`}><Trash2 size={18} /></button></div></td>
                    </tr>
                  );
                })}
                {!loading && filteredProducts.length === 0 && <tr><td colSpan={8} className="px-6 py-16 text-center text-taupe italic">No products found matching your search.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </AdminLayout>
  );
}
