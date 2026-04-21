import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, User, Menu, X, Search, Instagram } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useStoreSettings } from '../contexts/StoreSettingsContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const location = useLocation();
  const { settings } = useStoreSettings();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (updatedUser) => setUser(updatedUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop All', path: '/shop' },
    { name: 'Categories', path: '/shop' },
    { name: 'Bridal', path: '/shop?category=bridal-sets' },
    { name: 'About', path: '/about' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4',
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button
          className="lg:hidden text-taupe p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link to="/" className="flex flex-col items-center group">
          <span className="text-2xl font-light tracking-[0.2em] text-deep-taupe group-hover:text-rose-gold transition-colors duration-300 uppercase">
            {settings.brandName.split(' ')[0] || 'Sviwa'}
          </span>
          <span className="text-[0.6rem] tracking-[0.4em] text-taupe uppercase -mt-1">
            {settings.brandName.split(' ').slice(1).join(' ') || 'Creation'}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center space-x-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                'text-xs font-medium tracking-widest uppercase text-taupe hover:text-rose-gold transition-colors duration-300 relative py-1',
                location.pathname === link.path && 'text-rose-gold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-rose-gold'
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-5 text-taupe">
          <Link to="/shop" className="hover:text-rose-gold transition-colors duration-300" aria-label="Search products">
            <Search size={20} strokeWidth={1.5} />
          </Link>
          <Link to="/wishlist" className="hover:text-rose-gold transition-colors duration-300 relative">
            <Heart size={20} strokeWidth={1.5} />
          </Link>
          <Link to={user ? '/account' : '/login'} className="hover:text-rose-gold transition-colors duration-300">
            <User size={20} strokeWidth={1.5} />
          </Link>
          {settings.instagramUrl && (
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hidden sm:block hover:text-rose-gold transition-colors duration-300">
              <Instagram size={20} strokeWidth={1.5} />
            </a>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white shadow-xl border-t border-warm-gray lg:hidden overflow-hidden"
          >
            <div className="flex flex-col p-8 space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-sm font-medium tracking-widest uppercase text-taupe hover:text-rose-gold"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-warm-gray flex space-x-6">
                {settings.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-taupe hover:text-rose-gold"><Instagram size={20} /></a>}
                <Link to="/wishlist" className="text-taupe hover:text-rose-gold"><Heart size={20} /></Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
