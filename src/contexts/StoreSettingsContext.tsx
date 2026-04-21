import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_BRAND_NAME, DEFAULT_BRAND_TAGLINE, INSTAGRAM_URL, WHATSAPP_NUMBER } from '../constants';
import { sanitizeWhatsAppNumber } from '../lib/utils';

interface StoreSettings {
  brandName: string;
  brandDescription: string;
  whatsappNumber: string;
  instagramUrl: string;
}

const defaultSettings: StoreSettings = {
  brandName: DEFAULT_BRAND_NAME,
  brandDescription: DEFAULT_BRAND_TAGLINE,
  whatsappNumber: sanitizeWhatsAppNumber(WHATSAPP_NUMBER),
  instagramUrl: INSTAGRAM_URL,
};

const StoreSettingsContext = createContext<{ settings: StoreSettings; loading: boolean }>({
  settings: defaultSettings,
  loading: true,
});

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'general'));
        if (snap.exists()) {
          const data = snap.data();
          setSettings({
            brandName: data.brandName || defaultSettings.brandName,
            brandDescription: data.brandDescription || defaultSettings.brandDescription,
            whatsappNumber: sanitizeWhatsAppNumber(data.whatsappNumber || defaultSettings.whatsappNumber),
            instagramUrl: data.instagramUrl || defaultSettings.instagramUrl,
          });
        }
      } catch (error) {
        console.error('Failed to load storefront settings', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const value = useMemo(() => ({ settings, loading }), [settings, loading]);
  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
