import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  Save,
  Loader2,
  Globe,
  MessageCircle,
  Instagram,
  Cloud,
  KeyRound,
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { logAuth, logError } from '../../utils/logger';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordConfigured, setPasswordConfigured] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [settings, setSettings] = useState({
    brandName: 'Sviwa Creation',
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
          const data = docSnap.data();
          setSettings(prev => ({ ...prev, brandName: data.brandName || prev.brandName, brandDescription: data.brandDescription || prev.brandDescription, whatsappNumber: data.whatsappNumber || '', instagramUrl: data.instagramUrl || '' }));
          setPasswordConfigured(data.passwordConfigured === true);
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


  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user?.email) return toast.error('Sign in again before setting your admin password.');
    if (passwordForm.newPassword.length < 8) return toast.error('Use at least 8 characters for the new password.');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('New password and confirmation do not match.');
    if (passwordConfigured && !passwordForm.currentPassword) return toast.error('Enter your current password.');

    setSavingPassword(true);
    logAuth(passwordConfigured ? 'admin_password_change_start' : 'admin_password_setup_start', { uid: user.uid, email: user.email });
    try {
      if (passwordConfigured) {
        const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
        await reauthenticateWithCredential(user, credential);
      }
      await updatePassword(user, passwordForm.newPassword);
      await setDoc(doc(db, 'settings', 'general'), { passwordConfigured: true, updatedAt: serverTimestamp() }, { merge: true });
      setPasswordConfigured(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      logAuth(passwordConfigured ? 'admin_password_change_success' : 'admin_password_setup_success', { uid: user.uid, email: user.email });
      toast.success(passwordConfigured ? 'Admin password changed successfully.' : 'Admin password created. Use it for your next login.');
    } catch (error) {
      const firebaseError = error as { code?: string };
      logError(passwordConfigured ? 'admin_password_change_failure' : 'admin_password_setup_failure', error, { code: firebaseError.code });
      if (firebaseError.code === 'auth/requires-recent-login') toast.error('Sign out and use the secure email login link again, then retry immediately.');
      else if (firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/wrong-password') toast.error('Current password is incorrect.');
      else if (firebaseError.code === 'auth/weak-password') toast.error('Choose a stronger password that meets your Firebase password policy.');
      else toast.error('Unable to save the admin password. Please try again.');
    } finally {
      setSavingPassword(false);
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

        <form onSubmit={handlePasswordSubmit} className="space-y-5 bg-white p-8 rounded-[2.5rem] border border-rose-gold/10 shadow-sm">
          <div className="flex items-center gap-3 border-b border-warm-gray pb-4">
            <KeyRound className="text-rose-gold" size={20} />
            <div><h2 className="text-xs font-bold uppercase tracking-[0.2em] text-deep-taupe">Admin Password</h2><p className="mt-1 text-xs text-taupe">{passwordConfigured ? 'Change the Firebase Authentication password for the signed-in admin.' : 'Create your Firebase Authentication password for future admin logins.'}</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {passwordConfigured && <label className="space-y-2"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Current password</span><input type="password" autoComplete="current-password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} className="w-full px-4 py-3 bg-warm-gray/30 rounded-xl text-sm outline-none focus:bg-white focus:ring-1 focus:ring-rose-gold/30" /></label>}
            <label className="space-y-2"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">{passwordConfigured ? 'New password' : 'Create password'}</span><input type="password" autoComplete="new-password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} className="w-full px-4 py-3 bg-warm-gray/30 rounded-xl text-sm outline-none focus:bg-white focus:ring-1 focus:ring-rose-gold/30" /></label>
            <label className="space-y-2"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Confirm new password</span><input type="password" autoComplete="new-password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} className="w-full px-4 py-3 bg-warm-gray/30 rounded-xl text-sm outline-none focus:bg-white focus:ring-1 focus:ring-rose-gold/30" /></label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-taupe">Passwords are sent directly to Firebase Authentication and are never stored in Firestore or logs.</p><button type="submit" disabled={savingPassword} className="btn-primary flex items-center gap-2 px-5 py-3 disabled:opacity-50">{savingPassword ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}{passwordConfigured ? 'Change Password' : 'Save First Password'}</button></div>
        </form>
      </div>
    </AdminLayout>
  );
}
