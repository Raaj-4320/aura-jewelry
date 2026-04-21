import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart, 
  MessageCircle, 
  Instagram, 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Share2
} from 'lucide-react';
import { Product } from '../types';
import { getDisplayProductBySlug, getDisplayProducts } from '../services/catalogService';
import { formatPrice, cn } from '../lib/utils';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';
import { JEWELRY_IMAGE_FALLBACK } from '../constants';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { settings } = useStoreSettings();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await getDisplayProductBySlug(slug);
        if (data) {
          setProduct(data);
          // Fetch related products
          const allProducts = await getDisplayProducts();
          const related = allProducts
            .filter((p) => p.category === data.category && p.id !== data.id)
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error(error);
        setLoadError(error instanceof Error ? error.message : 'Unable to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="w-12 h-12 border-2 border-rose-gold/20 border-t-rose-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ivory space-y-6">
        <h2 className="text-2xl font-light text-deep-taupe">Piece Not Found</h2>
        {loadError && (
          <p className="max-w-md text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
            Catalog could not be loaded from CSV source. {loadError}
          </p>
        )}
        <Link to="/shop" className="btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const images = [product.thumbnailImage || JEWELRY_IMAGE_FALLBACK, ...(product.galleryImages || [])].filter(Boolean);
  const instagramUrl = product.instagramUrl || settings.instagramUrl;
  const whatsappUrl = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
        `Hello, I'm interested in this jewelry item:\nProduct: ${product.name}\nProduct ID: ${product.id}\nPlease share availability and purchase details.`
      )}`
    : '';

  const handleShare = () => {
    navigator.share?.({
      title: product.name,
      text: product.shortDescription,
      url: window.location.href,
    }).catch(() => {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    });
  };

  return (
    <div className="bg-ivory pb-20">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-taupe/60">
        <Link to="/" className="hover:text-rose-gold">Home</Link>
        <ChevronRight size={10} />
        <Link to="/shop" className="hover:text-rose-gold">Shop</Link>
        <ChevronRight size={10} />
        <Link to={`/shop?category=${(product.category || '').toLowerCase()}`} className="hover:text-rose-gold">{product.category || 'Jewelry'}</Link>
        <ChevronRight size={10} />
        <span className="text-rose-gold">{product.name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image Gallery */}
        <div className="space-y-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-warm-gray group">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                src={images[activeImage] || JEWELRY_IMAGE_FALLBACK}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.src = JEWELRY_IMAGE_FALLBACK; }}
              />
            </AnimatePresence>
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={() => setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-taupe hover:bg-rose-gold hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-taupe hover:bg-rose-gold hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "relative w-24 aspect-square rounded-xl overflow-hidden bg-warm-gray shrink-0 transition-all duration-300",
                    activeImage === idx ? "ring-2 ring-rose-gold ring-offset-2" : "opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${idx}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.src = JEWELRY_IMAGE_FALLBACK; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-10">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-semibold tracking-widest uppercase text-rose-gold">
                  {product.category || 'Jewelry'} • {product.subcategory || 'Classic'}
                </span>
                <h1 className="text-3xl md:text-4xl font-light text-deep-taupe tracking-tight">
                  {product.name}
                </h1>
              </div>
              <button 
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-rose-gold-light/30 text-taupe transition-colors"
              >
                <Share2 size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-2xl font-medium text-rose-gold">
                {product.priceOnRequest ? "Price on Request" : formatPrice(product.price, product.currency)}
              </span>
              {product.onlyFewLeft && (
                <span className="text-[10px] font-bold tracking-widest uppercase text-red-400 bg-red-50 px-2 py-1 rounded-full">
                  Only Few Left
                </span>
              )}
            </div>

            <p className="text-taupe leading-relaxed font-light">
              {product.shortDescription}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn-primary flex items-center justify-center gap-3 py-4"
                >
                  <MessageCircle size={20} />
                  Buy on WhatsApp
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 btn-primary opacity-50 cursor-not-allowed flex items-center justify-center gap-3 py-4"
                >
                  <MessageCircle size={20} />
                  WhatsApp Unavailable
                </button>
              )}
              <button
                onClick={() => {
                  setIsWishlisted(!isWishlisted);
                  toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
                }}
                className={cn(
                  "px-8 py-4 rounded-full border transition-all flex items-center justify-center gap-2",
                  isWishlisted 
                    ? "bg-rose-gold text-white border-rose-gold" 
                    : "bg-white text-taupe border-rose-gold/20 hover:border-rose-gold/40"
                )}
              >
                <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
              </button>
            </div>
            
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-secondary flex items-center justify-center gap-3 py-4"
              >
                <Instagram size={20} />
                View on Instagram
              </a>
            )}
          </div>

          {/* Details Tabs (Simplified) */}
          <div className="space-y-8 pt-8 border-t border-warm-gray">
            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-widest uppercase text-deep-taupe">Product Details</h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-taupe/60">Material</span>
                  <p className="text-sm text-taupe">{product.material}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-taupe/60">Occasion</span>
                  <p className="text-sm text-taupe">{(product.occasionTags || []).join(', ') || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-taupe/60">Style</span>
                  <p className="text-sm text-taupe">{(product.styleTags || []).join(', ') || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-taupe/60">Availability</span>
                  <p className="text-sm text-taupe">{product.madeToOrder ? "Made to Order" : "In Stock"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-widest uppercase text-deep-taupe">Description</h4>
              <p className="text-sm text-taupe leading-relaxed font-light whitespace-pre-line">
                {product.fullDescription}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-semibold tracking-widest uppercase text-deep-taupe">Care Instructions</h4>
              <p className="text-sm text-taupe leading-relaxed font-light italic">
                {product.careInstructions}
              </p>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-warm-gray">
            <div className="flex flex-col items-center text-center space-y-2">
              <ShieldCheck size={20} className="text-rose-gold" />
              <span className="text-[10px] uppercase tracking-tighter text-taupe">Certified Quality</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <Truck size={20} className="text-rose-gold" />
              <span className="text-[10px] uppercase tracking-tighter text-taupe">Global Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <RotateCcw size={20} className="text-rose-gold" />
              <span className="text-[10px] uppercase tracking-tighter text-taupe">Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 mt-32">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">You May Also Like</h2>
            <div className="w-12 h-[1px] bg-rose-gold mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
