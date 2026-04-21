import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-warm-gray pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        {/* Brand */}
        <div className="space-y-6">
          <Link to="/" className="flex flex-col items-start group">
            <span className="text-2xl font-light tracking-[0.2em] text-deep-taupe uppercase">
              Aura
            </span>
            <span className="text-[0.6rem] tracking-[0.4em] text-taupe uppercase -mt-1">
              Jewelry
            </span>
          </Link>
          <p className="text-sm text-taupe leading-relaxed max-w-xs">
            Crafting timeless elegance and modern luxury for the sophisticated woman. Every piece tells a story of beauty and grace.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="w-10 h-10 rounded-full bg-warm-gray flex items-center justify-center text-taupe hover:bg-rose-gold hover:text-white transition-all duration-300">
              <Instagram size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-warm-gray flex items-center justify-center text-taupe hover:bg-rose-gold hover:text-white transition-all duration-300">
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="text-xs font-semibold tracking-widest uppercase text-deep-taupe mb-6">Shop</h4>
          <ul className="space-y-4">
            <li><Link to="/shop" className="text-sm text-taupe hover:text-rose-gold transition-colors">All Collections</Link></li>
            <li><Link to="/shop?category=necklaces" className="text-sm text-taupe hover:text-rose-gold transition-colors">Necklaces</Link></li>
            <li><Link to="/shop?category=earrings" className="text-sm text-taupe hover:text-rose-gold transition-colors">Earrings</Link></li>
            <li><Link to="/shop?category=rings" className="text-sm text-taupe hover:text-rose-gold transition-colors">Rings</Link></li>
            <li><Link to="/shop?category=bracelets" className="text-sm text-taupe hover:text-rose-gold transition-colors">Bracelets</Link></li>
          </ul>
        </div>

        {/* Information */}
        <div>
          <h4 className="text-xs font-semibold tracking-widest uppercase text-deep-taupe mb-6">Information</h4>
          <ul className="space-y-4">
            <li><Link to="/about" className="text-sm text-taupe hover:text-rose-gold transition-colors">About Us</Link></li>
            <li><Link to="/shipping" className="text-sm text-taupe hover:text-rose-gold transition-colors">Shipping Policy</Link></li>
            <li><Link to="/care" className="text-sm text-taupe hover:text-rose-gold transition-colors">Jewelry Care</Link></li>
            <li><Link to="/faq" className="text-sm text-taupe hover:text-rose-gold transition-colors">FAQs</Link></li>
            <li><Link to="/contact" className="text-sm text-taupe hover:text-rose-gold transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-xs font-semibold tracking-widest uppercase text-deep-taupe mb-6">Contact</h4>
          <ul className="space-y-4">
            <li className="flex items-start space-x-3">
              <MapPin size={18} className="text-rose-gold shrink-0" />
              <span className="text-sm text-taupe">Luxury Boutique, 5th Avenue, Mumbai, India</span>
            </li>
            <li className="flex items-center space-x-3">
              <Phone size={18} className="text-rose-gold shrink-0" />
              <span className="text-sm text-taupe">+91 98765 43210</span>
            </li>
            <li className="flex items-center space-x-3">
              <Mail size={18} className="text-rose-gold shrink-0" />
              <span className="text-sm text-taupe">hello@aurajewelry.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-10 border-t border-warm-gray flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <p className="text-xs text-taupe">
          © {new Date().getFullYear()} Aura Jewelry. All rights reserved.
        </p>
        <div className="flex space-x-6">
          <Link to="/privacy" className="text-xs text-taupe hover:text-rose-gold">Privacy Policy</Link>
          <Link to="/terms" className="text-xs text-taupe hover:text-rose-gold">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
