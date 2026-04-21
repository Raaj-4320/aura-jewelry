import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { getProducts } from '../services/firebaseService';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock wishlist for now (using local storage or similar)
  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        // In a real app, we'd fetch specific IDs
        // For now, let's just show some products as "wishlisted"
        const allProducts = await getProducts();
        setWishlistItems(allProducts?.slice(0, 2) || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  const removeFromWishlist = (id: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== id));
    toast.success('Removed from wishlist');
  };

  return (
    <div className="min-h-screen bg-ivory pb-20">
      <div className="bg-blush py-20 px-6 text-center">
        <div className="max-w-7xl mx-auto space-y-4">
          <h1 className="text-4xl font-light text-deep-taupe uppercase tracking-[0.2em]">Your Wishlist</h1>
          <p className="text-sm text-taupe font-light tracking-widest uppercase">Pieces you've fallen in love with</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="aspect-[4/5] bg-white animate-pulse rounded-3xl"></div>
            ))}
          </div>
        ) : wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence>
              {wishlistItems.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative"
                >
                  <ProductCard product={product} isWishlisted={true} onToggleWishlist={() => removeFromWishlist(product.id)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-32 space-y-8">
            <div className="w-24 h-24 bg-blush rounded-full flex items-center justify-center mx-auto text-rose-gold/40">
              <Heart size={40} strokeWidth={1} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-light text-deep-taupe">Your wishlist is empty</h3>
              <p className="text-sm text-taupe max-w-xs mx-auto">
                Discover our collections and save your favorite pieces to view them later.
              </p>
            </div>
            <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
              Start Exploring <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
