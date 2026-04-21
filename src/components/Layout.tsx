import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../constants';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        {children}
      </main>
      <Footer />
      
      {/* Sticky WhatsApp Button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-rose-gold text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-300"
      >
        <MessageCircle size={28} />
      </a>

      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#FFF5F2',
            color: '#4A4440',
            border: '1px solid #E5B4A2',
            fontSize: '14px',
            borderRadius: '12px',
          },
        }}
      />
    </div>
  );
}
