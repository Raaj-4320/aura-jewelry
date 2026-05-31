import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Instagram, Star } from 'lucide-react';
import { Product } from '../types';
import { logProduct, logUI } from '../utils/logger';
import { getProducts } from '../services/firebaseService';
import ProductCard from '../components/ProductCard';
import { JEWELRY_IMAGE_FALLBACK } from '../constants';
import { useCatalogCategories } from '../hooks/useCatalogCategories';
import { useHomepageContent } from '../hooks/useHomepageContent';
import { normalizeCategory, normalizeSubcategory } from '../lib/utils';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { HomepageSection } from '../services/homepageService';

function ProductSection({ title, subtitle, products, shopLink }: { key?: React.Key; title: string; subtitle: string; products: Product[]; shopLink: string }) {
  return <section className="bg-blush py-16 sm:py-20 px-4 sm:px-6"><div className="max-w-7xl mx-auto"><div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-10 sm:mb-12"><div className="space-y-2"><span className="text-xs font-semibold tracking-widest uppercase text-rose-gold">{subtitle}</span><h2 className="text-2xl sm:text-3xl font-light text-deep-taupe uppercase tracking-widest">{title}</h2></div><Link to={shopLink || '/shop'} className="text-sm font-medium text-taupe border-b border-rose-gold/30 hover:border-rose-gold transition-all pb-1">View All Products</Link></div>{products.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="text-center py-14 bg-white/50 rounded-3xl border border-dashed border-rose-gold/20"><p className="text-taupe italic">Products will appear here once inventory is available.</p></div>}</div></section>;
}

export default function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const { settings } = useStoreSettings();
  const { categories } = useCatalogCategories();
  const { content } = useHomepageContent();

  useEffect(() => { getProducts().then((data) => { setAllProducts(data || []); logProduct('public_products_visible_count', { count: (data || []).length }); }).catch((error) => { console.error(error); setAllProducts([]); setLoadError(error instanceof Error ? error.message : 'Unable to load catalog'); }).finally(() => setLoading(false)); }, []);

  const productGroups = useMemo(() => {
    const featured = allProducts.filter((product) => product.featured);
    const newArrivals = [...allProducts].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    const bridal = allProducts.filter((product) => product.bridal || normalizeCategory(product.category) === 'bridal-sets');
    const minimal = allProducts.filter((product) => normalizeSubcategory(product.subcategory) === 'minimal');
    return { featured: featured.length ? featured : newArrivals, 'new-arrivals': newArrivals, bridal: bridal.length ? bridal : featured, minimal: minimal.length ? minimal : newArrivals };
  }, [allProducts]);

  const productsForSection = (section: HomepageSection) => {
    const products = section.collection === 'category' ? allProducts.filter((product) => normalizeCategory(product.category) === section.categorySlug) : productGroups[section.collection];
    return products.slice(0, section.productLimit);
  };

  const fallbackHeroImage = productGroups.featured[0]?.thumbnailImage || productGroups['new-arrivals'][0]?.thumbnailImage || '';
  const heroSlides = content.heroSlides.length ? content.heroSlides : [];
  const hero = heroSlides[Math.min(activeSlide, Math.max(0, heroSlides.length - 1))];

  useEffect(() => { setActiveSlide((current) => Math.min(current, Math.max(0, heroSlides.length - 1))); }, [heroSlides.length]);
  useEffect(() => {
    if (heroSlides.length < 2 || content.heroAutoplaySeconds <= 0) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % heroSlides.length), content.heroAutoplaySeconds * 1000);
    return () => window.clearInterval(timer);
  }, [content.heroAutoplaySeconds, heroSlides.length]);

  const showSlide = (index: number) => { setActiveSlide((index + heroSlides.length) % heroSlides.length); logUI('homepage_hero_slide_changed', { index }); };
  const categoryImageMap = useMemo(() => Object.fromEntries(categories.flatMap((category) => { const match = allProducts.find((product) => normalizeCategory(product.category) === category.slug && product.thumbnailImage); return match ? [[category.slug, match.thumbnailImage]] : []; })), [allProducts, categories]);
  const categoryCards = useMemo(() => { const fromCatalog = categories.filter((category) => allProducts.some((product) => normalizeCategory(product.category) === category.slug)); const fallback = categories.filter((category) => !fromCatalog.some((item) => item.slug === category.slug)); return [...fromCatalog, ...fallback].slice(0, content.categoryLimit).map((category) => ({ ...category, hasProducts: allProducts.some((product) => normalizeCategory(product.category) === category.slug) })); }, [allProducts, categories, content.categoryLimit]);

  return <div className="space-y-16 sm:space-y-20 pb-20">
    {content.heroEnabled && hero && <section className="relative h-[80vh] sm:h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">{hero.imageUrl || fallbackHeroImage ? <motion.img key={hero.imageUrl || fallbackHeroImage} initial={{ opacity: 0.3 }} animate={{ opacity: 0.6 }} transition={{ duration: 0.5 }} src={hero.imageUrl || fallbackHeroImage} alt={hero.title || 'Sviwa Creation jewelry'} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.src = JEWELRY_IMAGE_FALLBACK; }} /> : <div className="w-full h-full bg-gradient-to-br from-blush via-ivory to-champagne" />}<div className="absolute inset-0 bg-gradient-to-r from-ivory via-ivory/40 to-transparent" /></div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full"><motion.div key={hero.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-xl space-y-8"><div className="space-y-4">{hero.eyebrow && <span className="text-xs font-semibold tracking-[0.4em] uppercase text-rose-gold">{hero.eyebrow}</span>}<h1 className="text-4xl sm:text-6xl font-light text-deep-taupe leading-[1.1]">{hero.title}{hero.accentText && <><br /><span className="italic font-normal text-rose-gold">{hero.accentText}</span></>}{hero.trailingText && <><br />{hero.trailingText}</>}</h1></div><div className="flex flex-wrap gap-4 pt-2">{hero.primaryLabel && <Link to={hero.primaryLink || '/shop'} className="btn-primary flex items-center gap-2">{hero.primaryLabel}<ArrowRight size={16} /></Link>}{hero.secondaryLabel && <Link to={hero.secondaryLink || '/shop'} className="btn-secondary">{hero.secondaryLabel}</Link>}</div></motion.div></div>
      {heroSlides.length > 1 && <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/75 px-3 py-2 shadow-sm backdrop-blur"><button aria-label="Previous hero slide" onClick={() => showSlide(activeSlide - 1)} className="rounded-full p-1 text-taupe hover:text-rose-gold"><ArrowLeft size={16} /></button>{heroSlides.map((slide, index) => <button key={slide.id} aria-label={`Show hero slide ${index + 1}`} onClick={() => showSlide(index)} className={`h-2 rounded-full transition-all ${index === activeSlide ? 'w-6 bg-rose-gold' : 'w-2 bg-taupe/35'}`} />)}<button aria-label="Next hero slide" onClick={() => showSlide(activeSlide + 1)} className="rounded-full p-1 text-taupe hover:text-rose-gold"><ArrowRight size={16} /></button></div>}
    </section>}

    {content.categoriesEnabled && <section className="max-w-7xl mx-auto px-6"><div className="text-center space-y-4 mb-12"><h2 className="text-3xl font-light text-deep-taupe uppercase tracking-widest">{content.categoriesTitle}</h2><div className="w-12 h-px bg-rose-gold mx-auto" /></div><div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">{categoryCards.map((category, index) => <motion.div key={category.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} viewport={{ once: true }} className="group relative aspect-square overflow-hidden rounded-3xl bg-warm-gray"><Link to={category.hasProducts ? `/shop?category=${category.slug}` : '/shop'}>{categoryImageMap[category.slug] ? <img src={categoryImageMap[category.slug]} alt={category.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-85" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.src = JEWELRY_IMAGE_FALLBACK; }} /> : <div className="w-full h-full bg-gradient-to-br from-blush via-ivory to-champagne" />}<div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" /><div className="absolute inset-0 flex items-center justify-center"><span className="text-white text-xs sm:text-sm font-medium tracking-[0.2em] uppercase border-b border-white/40 pb-1 group-hover:border-white transition-all">{category.name}</span></div></Link></motion.div>)}</div></section>}

    {loading ? <section className="max-w-7xl mx-auto px-6"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{[1, 2, 3, 4].map((item) => <div key={item} className="aspect-[4/5] bg-white/50 animate-pulse rounded-2xl" />)}</div></section> : <>{loadError && <section className="max-w-7xl mx-auto px-6"><div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-5 py-4 text-sm">Catalog could not be loaded from Firestore source. {loadError}</div></section>}{content.sections.filter((section) => section.visible).map((section) => <ProductSection key={section.id} title={section.title} subtitle={section.subtitle} products={productsForSection(section)} shopLink={section.shopLink} />)}</>}

    {content.quoteEnabled && <section className="max-w-4xl mx-auto px-6 text-center space-y-6"><div className="flex justify-center gap-1 text-rose-gold">{[1, 2, 3, 4, 5].map((item) => <Star key={item} size={16} fill="currentColor" />)}</div><h3 className="text-2xl md:text-4xl font-light text-deep-taupe leading-relaxed italic">“{content.quoteText}”</h3></section>}
    {content.instagramEnabled && settings.instagramUrl && <section className="max-w-7xl mx-auto px-6"><div className="flex items-center justify-between mb-8"><div className="flex items-center gap-3"><Instagram className="text-rose-gold" size={24} /><h2 className="text-xl font-light text-deep-taupe uppercase tracking-widest">On Instagram</h2></div><a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold tracking-widest uppercase text-rose-gold hover:text-deep-taupe transition-colors">Visit Profile</a></div></section>}
  </div>;
}
