import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import { normalizeCategory, normalizeSubcategory } from '../../lib/utils';
import { CatalogCategories, getCatalogCategories, saveCatalogCategories } from '../../services/categoryService';
import { getAdminProducts } from '../../services/firebaseService';
import { logProduct, logUI } from '../../utils/logger';

export default function Categories() {
  const [catalog, setCatalog] = useState<CatalogCategories>({ categories: [], subcategories: [] });
  const [usage, setUsage] = useState({ categories: new Set<string>(), subcategories: new Set<string>() });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getCatalogCategories(), getAdminProducts()])
      .then(([nextCatalog, products]) => {
        setCatalog(nextCatalog);
        setUsage({
          categories: new Set(products.map((product) => normalizeCategory(product.category)).filter(Boolean)),
          subcategories: new Set(products.map((product) => normalizeSubcategory(product.subcategory)).filter(Boolean)),
        });
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to load categories.'))
      .finally(() => setLoading(false));
  }, []);

  const addCategory = () => setCatalog((current) => ({ ...current, categories: [...current.categories, { id: '', slug: '', name: '' }] }));
  const addSubcategory = () => setCatalog((current) => ({ ...current, subcategories: [...current.subcategories, { id: '', name: '' }] }));

  const removeCategory = (index: number) => {
    const category = catalog.categories[index];
    if (usage.categories.has(category.slug)) return toast.error('This category is used by products. Reassign those products before removing it.');
    setCatalog((current) => ({ ...current, categories: current.categories.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const removeSubcategory = (index: number) => {
    const subcategory = catalog.subcategories[index];
    if (usage.subcategories.has(subcategory.id)) return toast.error('This subcategory is used by products. Reassign those products before removing it.');
    setCatalog((current) => ({ ...current, subcategories: current.subcategories.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const next = await saveCatalogCategories(catalog);
      setCatalog(next);
      logProduct('catalog_categories_updated', { categories: next.categories.length, subcategories: next.subcategories.length });
      toast.success('Categories updated successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save categories.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-rose-gold" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">Categories</h1><p className="text-sm text-taupe mt-2">Manage storefront filters and product editor choices. Values used by products must be reassigned before removal.</p></div>
          <button onClick={save} disabled={saving} className="btn-primary flex items-center justify-center gap-2"><Save size={16} />{saving ? 'Saving…' : 'Save Categories'}</button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white p-6 rounded-3xl border space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-sm font-semibold uppercase tracking-widest">Categories</h2><button onClick={() => { addCategory(); logUI('category_add_clicked'); }} className="btn-secondary flex items-center gap-1"><Plus size={14} /> Add</button></div>
            {catalog.categories.map((category, index) => <div key={`${category.slug}-${index}`} className="flex gap-2"><input value={category.name} onChange={(e) => setCatalog((current) => ({ ...current, categories: current.categories.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item) }))} placeholder="Category name" className="flex-1 border rounded-xl px-3 py-2 text-sm" /><button onClick={() => removeCategory(index)} className="p-2 text-red-500" aria-label={`Remove ${category.name || 'category'}`}><Trash2 size={16} /></button></div>)}
          </section>
          <section className="bg-white p-6 rounded-3xl border space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-sm font-semibold uppercase tracking-widest">Subcategories</h2><button onClick={addSubcategory} className="btn-secondary flex items-center gap-1"><Plus size={14} /> Add</button></div>
            {catalog.subcategories.map((subcategory, index) => <div key={`${subcategory.id}-${index}`} className="flex gap-2"><input value={subcategory.name} onChange={(e) => setCatalog((current) => ({ ...current, subcategories: current.subcategories.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item) }))} placeholder="Subcategory name" className="flex-1 border rounded-xl px-3 py-2 text-sm" /><button onClick={() => removeSubcategory(index)} className="p-2 text-red-500" aria-label={`Remove ${subcategory.name || 'subcategory'}`}><Trash2 size={16} /></button></div>)}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
