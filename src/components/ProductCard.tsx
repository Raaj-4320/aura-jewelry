import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Instagram } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { WHATSAPP_NUMBER } from '../constants';

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
  key?: string | number;
}

export default function ProductCard({ product, isWishlisted, onToggleWishlist }: ProductCardProps) {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hello, I'm interested in this jewelry item:\nProduct: ${product.name}\nProduct ID: ${product.id}\nPlease share availability and purchase details.`
  )}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-warm-gray mb-4">
        <Link to={`/product/${product.slug}`}>
          <img
            src={product.thumbnailImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.featured && (
            <span className="bg-rose-gold text-white text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded-full">
              Featured
            </span>
          )}
          {product.onlyFewLeft && (
            <span className="bg-white/90 backdrop-blur-sm text-taupe text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded-full">
              Only Few Left
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={() => onToggleWishlist?.(product.id)}
          className={cn(
            "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
            isWishlisted 
              ? "bg-rose-gold text-white" 
              : "bg-white/80 backdrop-blur-sm text-taupe hover:bg-rose-gold hover:text-white"
          )}
        >
          <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={1.5} />
        </button>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black/20 to-transparent">
          <div className="flex gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-white hover:bg-rose-gold hover:text-white text-taupe text-xs font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
            {product.instagramUrl && (
              <a
                href={product.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 bg-white/90 hover:bg-rose-gold hover:text-white text-taupe rounded-xl flex items-center justify-center transition-colors"
              >
                <Instagram size={14} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1 px-1">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-deep-taupe group-hover:text-rose-gold transition-colors">
            <Link to={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
          <span className="text-sm font-semibold text-rose-gold">
            {product.priceOnRequest ? "Price on Request" : formatPrice(product.price, product.currency)}
          </span>
        </div>
        <p className="text-xs text-taupe line-clamp-1 italic font-light">
          {product.category} • {product.subcategory}
        </p>
      </div>
    </motion.div>
  );
}
