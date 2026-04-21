import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';
import { MessageCircle } from 'lucide-react';
import { useStoreSettings } from '../contexts/StoreSettingsContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { settings } = useStoreSettings();
  const whatsappUrl = settings.whatsappNumber ? `https://wa.me/${settings.whatsappNumber}` : '';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        {children}
      </main>
      <Footer />

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-40 w-12 h-12 sm:w-14 sm:h-14 bg-rose-gold text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-300"
          aria-label="Contact on WhatsApp"
        >
          <MessageCircle size={28} />
        </a>
      )}

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
