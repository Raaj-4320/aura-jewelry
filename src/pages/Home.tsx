import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Star, Instagram } from 'lucide-react';
import { Product } from '../types';
import { getDisplayProducts } from '../services/catalogService';
import ProductCard from '../components/ProductCard';
import { CATEGORIES } from '../constants';
import { normalizeCategory, normalizeSubcategory } from '../lib/utils';
import { useStoreSettings } from '../contexts/StoreSettingsContext';

function ProductSection({ title, subtitle, products }: { title: string; subtitle: string; products: Product[] }) {
  return (
    <section className="bg-blush py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10 sm:mb-12">
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-rose-gold">{subtitle}</span>
            <h2 className="text-2xl sm:text-3xl font-light text-deep-taupe uppercase tracking-widest">{title}</h2>
          </div>
          <Link to="/shop" className="text-sm font-medium text-taupe border-b border-rose-gold/30 hover:border-rose-gold transition-all pb-1">
            View All Products
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="text-center py-14 bg-white/50 rounded-3xl border border-dashed border-rose-gold/20">
            <p className="text-taupe italic">Products will appear here once inventory is available.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { settings } = useStoreSettings();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getDisplayProducts();
        setAllProducts(data || []);
      } catch (error) {
        console.error(error);
        setAllProducts([]);
        setLoadError(error instanceof Error ? error.message : 'Unable to load catalog');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const sections = useMemo(() => {
    const featured = allProducts.filter((p) => p.featured).slice(0, 4);
    const newArrivals = [...allProducts]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 4);
    const bridal = allProducts.filter((p) => p.bridal || normalizeCategory(p.category) === 'bridal-sets').slice(0, 4);
    const minimal = allProducts.filter((p) => normalizeSubcategory(p.subcategory) === 'minimal').slice(0, 4);

    return {
      featured: featured.length ? featured : newArrivals,
      newArrivals,
      bridal: bridal.length ? bridal : featured,
      minimal: minimal.length ? minimal : newArrivals,
    };
  }, [allProducts]);

  return (
    <div className="space-y-16 sm:space-y-20 pb-20">
      <section className="relative h-[80vh] sm:h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2000"
            alt="Luxury Jewelry"
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ivory via-ivory/40 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="max-w-xl space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-semibold tracking-[0.4em] uppercase text-rose-gold">Timeless Elegance</span>
              <h1 className="text-4xl sm:text-6xl font-light text-deep-taupe leading-[1.1]">
                Radiate <br />
                <span className="italic font-normal text-rose-gold">Your Inner</span> <br />
                Luminescence
              </h1>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/shop" className="btn-primary flex items-center gap-2">Explore Collection <ArrowRight size={16} /></Link>
              <Link to="/shop?category=bridal-sets" className="btn-secondary">Bridal Edit</Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-light text-deep-taupe uppercase tracking-widest">Shop by Category</h2>
          <div className="w-12 h-[1px] bg-rose-gold mx-auto"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES.slice(0, 4).map((cat, idx) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} viewport={{ once: true }} className="group relative aspect-square overflow-hidden rounded-3xl bg-warm-gray">
              <Link to={`/shop?category=${cat.slug}`}>
                <img src={`https://picsum.photos/seed/${cat.slug}/600/600`} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs sm:text-sm font-medium tracking-[0.2em] uppercase border-b border-white/40 pb-1 group-hover:border-white transition-all">{cat.name}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {loading ? (
        <section className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-[4/5] bg-white/50 animate-pulse rounded-2xl"></div>)}
          </div>
        </section>
      ) : (
        <>
          {loadError && (
            <section className="max-w-7xl mx-auto px-6">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-5 py-4 text-sm">
                Catalog could not be loaded from CSV source. {loadError}
              </div>
            </section>
          )}
          <ProductSection title="Featured Collection" subtitle="Curated Selection" products={sections.featured} />
          <ProductSection title="New Arrivals" subtitle="Just Added" products={sections.newArrivals} />
          <ProductSection title="Bridal Edit" subtitle="Wedding Spotlight" products={sections.bridal} />
          <ProductSection title="Minimal Favorites" subtitle="Everyday Elegance" products={sections.minimal} />
        </>
      )}

      <section className="max-w-4xl mx-auto px-6 text-center space-y-10 py-10">
        <div className="flex justify-center space-x-2 text-rose-gold">
          {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} fill="currentColor" />)}
        </div>
        <h3 className="text-2xl md:text-4xl font-light text-deep-taupe leading-relaxed italic">
          "Jewelry is not just an accessory; it's a reflection of your soul's radiance."
        </h3>
      </section>

      {settings.instagramUrl && (
        <section className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Instagram className="text-rose-gold" size={24} />
              <h2 className="text-xl font-light text-deep-taupe uppercase tracking-widest">On Instagram</h2>
            </div>
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold tracking-widest uppercase text-rose-gold hover:text-deep-taupe transition-colors">
              Visit Profile
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
