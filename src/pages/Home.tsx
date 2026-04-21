import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Star, Instagram, MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { getProducts } from '../services/firebaseService';
import ProductCard from '../components/ProductCard';
import { CATEGORIES } from '../constants';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await getProducts({ featured: true, limit: 4 });
        setFeaturedProducts(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
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
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl space-y-8"
          >
            <div className="space-y-4">
              <span className="text-xs font-semibold tracking-[0.4em] uppercase text-rose-gold">
                Timeless Elegance
              </span>
              <h1 className="text-5xl md:text-7xl font-light text-deep-taupe leading-[1.1]">
                Radiate <br />
                <span className="italic font-normal text-rose-gold">Your Inner</span> <br />
                Luminescence
              </h1>
              <p className="text-lg text-taupe font-light leading-relaxed max-w-md">
                Discover our curated collection of handcrafted jewelry, designed to celebrate the modern woman's grace and strength.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/shop" className="btn-primary flex items-center gap-2">
                Explore Collection <ArrowRight size={16} />
              </Link>
              <Link to="/shop?category=bridal-sets" className="btn-secondary">
                Bridal Edit
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Highlights */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-light text-deep-taupe uppercase tracking-widest">Shop by Category</h2>
          <div className="w-12 h-[1px] bg-rose-gold mx-auto"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {CATEGORIES.slice(0, 4).map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="group relative aspect-square overflow-hidden rounded-3xl bg-warm-gray"
            >
              <Link to={`/shop?category=${cat.slug}`}>
                <img
                  src={`https://picsum.photos/seed/${cat.slug}/600/600`}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-sm font-medium tracking-[0.2em] uppercase border-b border-white/40 pb-1 group-hover:border-white transition-all">
                    {cat.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-blush py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div className="space-y-4">
              <span className="text-xs font-semibold tracking-widest uppercase text-rose-gold">Curated Selection</span>
              <h2 className="text-3xl font-light text-deep-taupe uppercase tracking-widest">Trending Now</h2>
            </div>
            <Link to="/shop" className="text-sm font-medium text-tau border-b border-rose-gold/30 hover:border-rose-gold transition-all pb-1">
              View All Products
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[4/5] bg-white/50 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-white/50 rounded-3xl border border-dashed border-rose-gold/20">
                  <p className="text-taupe italic">Our new collection is coming soon.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Brand Statement */}
      <section className="max-w-4xl mx-auto px-6 text-center space-y-10 py-10">
        <div className="flex justify-center space-x-2 text-rose-gold">
          <Star size={16} fill="currentColor" />
          <Star size={16} fill="currentColor" />
          <Star size={16} fill="currentColor" />
          <Star size={16} fill="currentColor" />
          <Star size={16} fill="currentColor" />
        </div>
        <h3 className="text-2xl md:text-4xl font-light text-deep-taupe leading-relaxed italic">
          "Jewelry is not just an accessory; it's a reflection of your soul's radiance. At Aura, we craft pieces that resonate with your inner beauty."
        </h3>
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-[1px] bg-rose-gold"></div>
          <span className="text-xs tracking-[0.3em] uppercase text-taupe">The Aura Philosophy</span>
        </div>
      </section>

      {/* Instagram Feed Preview */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <Instagram className="text-rose-gold" size={24} />
            <h2 className="text-xl font-light text-deep-taupe uppercase tracking-widest">On Instagram</h2>
          </div>
          <a href="#" className="text-xs font-semibold tracking-widest uppercase text-rose-gold hover:text-deep-taupe transition-colors">
            @aurajewelry_official
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-2xl bg-warm-gray group relative">
              <img
                src={`https://picsum.photos/seed/insta-${i}/400/400`}
                alt="Instagram post"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Instagram className="text-white" size={24} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-warm-gray/30 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest uppercase text-rose-gold">Ethically Sourced</h4>
            <p className="text-sm text-taupe leading-relaxed">We prioritize sustainable practices and ethical sourcing for all our materials.</p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest uppercase text-rose-gold">Handcrafted Luxury</h4>
            <p className="text-sm text-taupe leading-relaxed">Each piece is meticulously handcrafted by master artisans with decades of experience.</p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-semibold tracking-widest uppercase text-rose-gold">Personalized Service</h4>
            <p className="text-sm text-taupe leading-relaxed">From custom orders to styling advice, we're here to make your experience perfect.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
