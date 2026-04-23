export const COLORS = {
  roseGold: '#E5B4A2',
  lightRoseGold: '#F8E8E2',
  ivory: '#FDFCFB',
  blush: '#FFF5F2',
  champagne: '#F7E7CE',
  taupe: '#8E8279',
  warmGray: '#F5F5F5',
  deepTaupe: '#4A4440',
};

export const CATEGORIES = [
  { id: 'necklaces', name: 'Necklaces', slug: 'necklaces' },
  { id: 'earrings', name: 'Earrings', slug: 'earrings' },
  { id: 'rings', name: 'Rings', slug: 'rings' },
  { id: 'bracelets', name: 'Bracelets', slug: 'bracelets' },
  { id: 'bridal-sets', name: 'Bridal Sets', slug: 'bridal-sets' },
  { id: 'party-wear', name: 'Party Wear', slug: 'party-wear' },
  { id: 'everyday-wear', name: 'Everyday Wear', slug: 'everyday-wear' },
  { id: 'custom-jewelry', name: 'Custom Jewelry', slug: 'custom-jewelry' },
];

export const SUB_CATEGORIES = [
  { id: 'gold', name: 'Gold' },
  { id: 'silver', name: 'Silver' },
  { id: 'rose-gold', name: 'Rose Gold' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'traditional', name: 'Traditional' },
  { id: 'contemporary', name: 'Contemporary' },
  { id: 'bridal', name: 'Bridal' },
  { id: 'statement', name: 'Statement' },
  { id: 'office-wear', name: 'Office Wear' },
  { id: 'festive', name: 'Festive' },
];

export const DEFAULT_BRAND_NAME = 'Sviwa Creation';
export const DEFAULT_BRAND_TAGLINE = 'Sviwa Creation — timeless jewelry crafted for modern elegance.';

export const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER || '+919274529394').trim();
export const INSTAGRAM_URL = (import.meta.env.VITE_INSTAGRAM_URL || '').trim();

export const JEWELRY_IMAGE_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF5F2"/>
          <stop offset="100%" stop-color="#F7E7CE"/>
        </linearGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#bg)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8E8279" font-size="40" font-family="Arial, sans-serif" letter-spacing="8">SVIWA</text>
    </svg>`
  );
