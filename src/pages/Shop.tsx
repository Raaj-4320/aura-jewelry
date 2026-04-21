import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Product } from '../types';
import { getDisplayProducts } from '../services/catalogService';
import ProductCard from '../components/ProductCard';
import { CATEGORIES, SUB_CATEGORIES } from '../constants';
import { cn, normalizeCategory, normalizeSubcategory } from '../lib/utils';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filters from URL
  const activeCategory = searchParams.get('category') || 'all';
  const activeSubCategory = searchParams.get('subcategory') || 'all';
  const sortBy = searchParams.get('sort') || 'newest';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await getDisplayProducts();
        setProducts(data || []);
      } catch (error) {
        console.error(error);
        setProducts([]);
        setLoadError(error instanceof Error ? error.message : 'Unable to load catalog');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter(p => normalizeCategory(p.category) === normalizeCategory(activeCategory));
    }

    // Subcategory filter
    if (activeSubCategory !== 'all') {
      result = result.filter(p => normalizeSubcategory(p.subcategory) === normalizeSubcategory(activeSubCategory));
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.name || '').toLowerCase().includes(query) || 
        (p.shortDescription || '').toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query)
      );
    }

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    }

    return result;
  }, [products, activeCategory, activeSubCategory, searchQuery, sortBy]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-ivory pb-20">
      {/* Header */}
      <div className="bg-blush py-20 px-6 text-center">
        <div className="max-w-7xl mx-auto space-y-4">
          <h1 className="text-4xl font-light text-deep-taupe uppercase tracking-[0.2em]">The Collection</h1>
          <p className="text-sm text-taupe font-light tracking-widest uppercase">
            {activeCategory === 'all' ? 'All Jewelry' : activeCategory.replace('-', ' ')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe/50" size={18} />
            <input
              type="text"
              placeholder="Search jewelry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-rose-gold/10 rounded-2xl text-sm focus:outline-none focus:border-rose-gold/40 transition-colors"
            />
          </div>

          {/* Filters Toggle & Sort */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all text-sm font-medium",
                isFilterOpen ? "bg-rose-gold text-white border-rose-gold" : "bg-white text-taupe border-rose-gold/10 hover:border-rose-gold/30"
              )}
            >
              <SlidersHorizontal size={18} />
              Filters
            </button>

            <div className="relative flex-1 md:flex-none">
              <select
                value={sortBy}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full appearance-none bg-white border border-rose-gold/10 px-6 py-3 rounded-2xl text-sm font-medium text-taupe focus:outline-none focus:border-rose-gold/40 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-taupe/50 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* Filter Drawer (Mobile/Desktop) */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="bg-white p-8 rounded-3xl border border-rose-gold/10 grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Categories */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold tracking-widest uppercase text-rose-gold">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateFilter('category', 'all')}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs transition-all",
                        activeCategory === 'all' ? "bg-rose-gold text-white" : "bg-warm-gray text-taupe hover:bg-rose-gold-light"
                      )}
                    >
                      All
                    </button>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => updateFilter('category', cat.slug)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs transition-all",
                          activeCategory === cat.slug ? "bg-rose-gold text-white" : "bg-warm-gray text-taupe hover:bg-rose-gold-light"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategories */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold tracking-widest uppercase text-rose-gold">Style</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateFilter('subcategory', 'all')}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs transition-all",
                        activeSubCategory === 'all' ? "bg-rose-gold text-white" : "bg-warm-gray text-taupe hover:bg-rose-gold-light"
                      )}
                    >
                      All
                    </button>
                    {SUB_CATEGORIES.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => updateFilter('subcategory', sub.id)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs transition-all",
                          activeSubCategory === sub.id ? "bg-rose-gold text-white" : "bg-warm-gray text-taupe hover:bg-rose-gold-light"
                        )}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Filters Summary */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold tracking-widest uppercase text-rose-gold">Active Filters</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeCategory !== 'all' && (
                      <span className="flex items-center gap-2 px-3 py-1.5 bg-rose-gold-light text-rose-gold text-xs rounded-full">
                        {activeCategory} <X size={12} className="cursor-pointer" onClick={() => updateFilter('category', 'all')} />
                      </span>
                    )}
                    {activeSubCategory !== 'all' && (
                      <span className="flex items-center gap-2 px-3 py-1.5 bg-rose-gold-light text-rose-gold text-xs rounded-full">
                        {activeSubCategory} <X size={12} className="cursor-pointer" onClick={() => updateFilter('subcategory', 'all')} />
                      </span>
                    )}
                    {activeCategory === 'all' && activeSubCategory === 'all' && (
                      <span className="text-xs text-taupe italic">No active filters</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSearchParams({});
                      setSearchQuery('');
                    }}
                    className="text-xs text-rose-gold hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        {!loading && loadError && (
          <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-5 py-4 text-sm">
            Catalog could not be loaded from CSV source. {loadError}
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[4/5] bg-white animate-pulse rounded-3xl"></div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-40 space-y-6">
            <div className="w-20 h-20 bg-blush rounded-full flex items-center justify-center mx-auto text-rose-gold">
              <Search size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-light text-deep-taupe">No pieces found</h3>
              <p className="text-sm text-taupe">Try adjusting your filters or search query.</p>
            </div>
            <button
              onClick={() => {
                setSearchParams({});
                setSearchQuery('');
              }}
              className="btn-secondary"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
