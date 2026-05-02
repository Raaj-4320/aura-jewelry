import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  Save,
  Loader2,
  Globe,
  MessageCircle,
  Instagram,
  Cloud,
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    brandName: 'Aura Jewelry',
    brandDescription: 'Premium luxury jewelry boutique for women.',
    whatsappNumber: '',
    instagramUrl: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'general');
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-rose-gold" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">Brand Settings</h1>
          <p className="text-xs text-taupe tracking-widest uppercase">Manage your boutique's global configuration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Brand Info */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-warm-gray pb-4">
              <Globe className="text-rose-gold" size={20} />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-deep-taupe">General Brand Info</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">Brand Name</label>
                <input
                  type="text"
                  name="brandName"
                  value={settings.brandName}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-warm-gray/30 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">Brand Tagline</label>
                <input
                  type="text"
                  name="brandDescription"
                  value={settings.brandDescription}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-warm-gray/30 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none"
                />
              </div>
            </div>
          </section>

          {/* Social & Contact */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-warm-gray pb-4">
              <MessageCircle className="text-rose-gold" size={20} />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-deep-taupe">Contact & Social</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">WhatsApp Number</label>
                <div className="relative">
                  <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe/40" size={18} />
                  <input
                    type="text"
                    name="whatsappNumber"
                    value={settings.whatsappNumber}
                    onChange={handleChange}
                    placeholder="e.g. 919876543210"
                    className="w-full pl-12 pr-4 py-4 bg-warm-gray/30 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-2">Instagram Profile URL</label>
                <div className="relative">
                  <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe/40" size={18} />
                  <input
                    type="url"
                    name="instagramUrl"
                    value={settings.instagramUrl}
                    onChange={handleChange}
                    placeholder="https://instagram.com/your-brand"
                    className="w-full pl-12 pr-4 py-4 bg-warm-gray/30 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Media (Cloudinary) */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-warm-gray pb-4">
              <Cloud className="text-rose-gold" size={20} />
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-deep-taupe">Media Configuration (Cloudinary)</h2>
            </div>
            <p className="text-sm text-taupe leading-relaxed">
              Cloudinary upload runtime configuration is controlled via environment variables:
              <code className="mx-1">VITE_CLOUDINARY_CLOUD_NAME</code>
              and
              <code className="mx-1">VITE_CLOUDINARY_UPLOAD_PRESET</code>.
              This prevents misleading client-side configuration and avoids exposing secrets in Firestore.
            </p>
            <div className="rounded-2xl bg-warm-gray/40 p-4 text-xs text-taupe uppercase tracking-wider">
              To change upload target, update deployment environment variables and redeploy the app.
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-10 py-4 shadow-xl shadow-rose-gold/20"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
