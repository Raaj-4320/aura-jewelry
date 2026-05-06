import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { signInAnonymously, signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth } from '../firebase';

const COOLDOWN_MS = 10_000;

function getSafeRedirectPath(location: ReturnType<typeof useLocation>) {
  const fallback = '/admin';
  const from = (location.state as any)?.from;
  const pathname = typeof from?.pathname === 'string' ? from.pathname : '';
  const search = typeof from?.search === 'string' ? from.search : '';
  if (!pathname.startsWith('/')) return fallback;
  if (pathname.startsWith('//') || pathname.includes('://')) return fallback;
  return `${pathname}${search}`;
}

export default function AdminLogin() {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const verifyUrl = (import.meta.env.VITE_VERIFY_ADMIN_PASSCODE_URL || '').trim();
  const redirectPath = useMemo(() => getSafeRedirectPath(location), [location]);

  useEffect(() => {
    if ((location.state as any)?.unauthorized) {
      toast.error('Admin access required.');
    }
  }, [location.state]);

  const handleUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!verifyUrl) {
      toast.error('Admin verification is not configured.');
      return;
    }
    if (Date.now() < cooldownUntil) return;

    setLoading(true);
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const idToken = await auth.currentUser!.getIdToken();
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ passcode }),
      });

      if (!response.ok) {
        setCooldownUntil(Date.now() + COOLDOWN_MS);
        throw new Error('invalid-passcode');
      }

      await auth.currentUser!.getIdToken(true);
      toast.success('Admin access granted');
      navigate(redirectPath, { replace: true });
    } catch {
      toast.error('Unable to verify passcode.');
    } finally {
      setLoading(false);
      setPasscode('');
    }
  };

  const handleLock = async () => {
    await signOut(auth);
    toast.success('Admin session locked');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-ivory">
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-sm border border-rose-gold/10">
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-blush rounded-full flex items-center justify-center mx-auto text-rose-gold mb-6">
            <Lock size={28} />
          </div>
          <h1 className="text-3xl font-light text-deep-taupe uppercase tracking-widest">Admin Access</h1>
          <p className="text-xs text-taupe tracking-widest uppercase">Enter shared admin passcode</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-4">Admin Passcode</label>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-4 py-4 bg-warm-gray/50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || Date.now() < cooldownUntil}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Unlock Admin'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <button onClick={handleLock} className="mt-6 w-full text-xs uppercase tracking-widest text-taupe hover:underline">
          Lock admin session
        </button>
      </div>
    </div>
  );
}
