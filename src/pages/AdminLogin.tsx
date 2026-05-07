import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import { isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth } from '../firebase';
import { isApprovedAdminEmail } from '../config/admins';

const ADMIN_EMAIL_STORAGE_KEY = 'adminEmailForSignIn';

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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useMemo(() => getSafeRedirectPath(location), [location]);

  useEffect(() => {
    if ((location.state as any)?.unauthorized) {
      toast.error('Admin access required.');
    }
  }, [location.state]);

  useEffect(() => {
    const completeEmailLinkSignIn = async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) return;

      const storedEmail = window.localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY) || '';
      if (!isApprovedAdminEmail(storedEmail)) {
        toast.error('Please request a new admin sign-in link from an approved email.');
        return;
      }

      setLoading(true);
      try {
        await signInWithEmailLink(auth, storedEmail, window.location.href);
        window.localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY);
        toast.success('Admin sign-in successful.');
        navigate('/admin', { replace: true });
      } catch {
        toast.error('Unable to complete sign-in link authentication.');
      } finally {
        setLoading(false);
      }
    };

    completeEmailLinkSignIn();
  }, [navigate]);

  const handleSendLink = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!isApprovedAdminEmail(normalizedEmail)) {
      toast.error('This email is not allowed for admin access.');
      return;
    }

    setLoading(true);
    try {
      await sendSignInLinkToEmail(auth, normalizedEmail, {
        url: `${window.location.origin}/admin-login`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, normalizedEmail);
      toast.success('Sign-in link sent. Open your email to continue.');
      setEmail('');
    } catch {
      toast.error('Unable to send sign-in link. Check Firebase Auth Email Link settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-ivory">
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-sm border border-rose-gold/10">
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-blush rounded-full flex items-center justify-center mx-auto text-rose-gold mb-6">
            <Mail size={28} />
          </div>
          <h1 className="text-3xl font-light text-deep-taupe uppercase tracking-widest">Admin Access</h1>
          <p className="text-xs text-taupe tracking-widest uppercase">Sign in with your approved admin email</p>
        </div>

        <form onSubmit={handleSendLink} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-4">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
              autoComplete="email"
              className="w-full px-4 py-4 bg-warm-gray/50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Sending link...' : 'Send Sign-In Link'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
