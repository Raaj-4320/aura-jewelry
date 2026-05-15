import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink } from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth } from '../firebase';
import { isApprovedAdminEmail } from '../config/admins';
import { logAuth, logError, logRoute } from '../utils/logger';

const ADMIN_EMAIL = 'sviwa.creation@gmail.com';
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

function getFriendlyAuthMessage(code?: string, fallback = 'Unable to complete sign-in. Please try again.') {
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Firebase Email Link sign-in is not enabled. Enable Email/Password and Email link sign-in in Firebase Authentication.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Authentication. Add your Vercel domain to Firebase Auth authorized domains.';
    case 'auth/invalid-action-code':
      return 'This login link is invalid or already used. Send a new link.';
    case 'auth/expired-action-code':
      return 'This login link expired. Send a new link.';
    case 'auth/user-disabled':
      return 'This admin user is disabled in Firebase.';
    default:
      return fallback;
  }
}

export default function AdminLogin() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [needsEmailRestore, setNeedsEmailRestore] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useMemo(() => getSafeRedirectPath(location), [location]);
  const isAdminAuthBypassEnabled = import.meta.env.VITE_BYPASS_ADMIN_AUTH === 'true';

  useEffect(() => {
    logAuth('admin_login_page_loaded', { path: location.pathname });
    logAuth('admin_email_prefilled', { email: ADMIN_EMAIL, readOnly: true });
  }, [location.pathname]);

  useEffect(() => {
    if (isAdminAuthBypassEnabled) {
      logAuth('admin_login_bypassed_redirect_to_admin', { from: location.pathname });
      navigate('/admin', { replace: true });
      return;
    }
    if ((location.state as any)?.unauthorized) {
      toast.error('Admin access required.');
    }
  }, [isAdminAuthBypassEnabled, location.pathname, location.state, navigate]);

  useEffect(() => {
    const completeEmailLinkSignIn = async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) return;
      logAuth('admin_email_link_detected', { path: location.pathname });

      const storedEmail = window.localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY) || '';
      const restoredEmail = storedEmail || ADMIN_EMAIL;

      if (!storedEmail) {
        setNeedsEmailRestore(true);
        logAuth('admin_email_link_email_missing_from_storage', { fallbackEmail: ADMIN_EMAIL });
      } else {
        logAuth('admin_email_link_email_restored', { email: restoredEmail });
      }

      if (!isApprovedAdminEmail(restoredEmail)) {
        logAuth('admin_email_link_unauthorized_email', { email: restoredEmail });
        toast.error('This email is not allowed for admin access.');
        return;
      }

      setLoading(true);
      logAuth('admin_email_link_signin_start', { redirectPath });
      try {
        const credential = await signInWithEmailLink(auth, restoredEmail, window.location.href);
        await credential.user.getIdToken(true);
        window.localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY);
        logAuth('admin_email_link_signin_success', { uid: credential.user.uid, email: credential.user.email });
        logRoute('admin_login_redirect_after_email_link', { to: redirectPath || '/admin' });
        toast.success('Admin sign-in successful.');
        navigate(redirectPath || '/admin', { replace: true });
      } catch (error: unknown) {
        const firebaseError = error as { code?: string; message?: string };
        logAuth('admin_email_link_signin_failure', { code: firebaseError?.code, message: firebaseError?.message });
        logError('admin_email_link_signin_failure', error);
        toast.error(getFriendlyAuthMessage(firebaseError?.code, firebaseError?.message || 'Unable to complete sign-in link authentication.'));
      } finally {
        setLoading(false);
      }
    };

    completeEmailLinkSignIn();
  }, [location.pathname, navigate, redirectPath]);

  const handleSendLink = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    logAuth('admin_email_link_send_clicked', { email: normalizedEmail });

    if (!isApprovedAdminEmail(normalizedEmail) || normalizedEmail !== ADMIN_EMAIL) {
      logAuth('admin_email_link_unauthorized_email', { email: normalizedEmail });
      toast.error('This email is not allowed for admin access.');
      return;
    }

    setLoading(true);
    logAuth('admin_email_link_send_start', { email: normalizedEmail, redirectPath });
    try {
      await sendSignInLinkToEmail(auth, normalizedEmail, {
        url: `${window.location.origin}/admin-login`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, normalizedEmail);
      setLinkSent(true);
      logAuth('admin_email_link_send_success', { email: normalizedEmail });
      toast.success('Sign-in link sent. Open your email to continue.');
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      logAuth('admin_email_link_send_failure', { code: firebaseError?.code, message: firebaseError?.message });
      logError('admin_email_link_send_failure', error);
      toast.error(getFriendlyAuthMessage(firebaseError?.code, firebaseError?.message || 'Unable to send sign-in link.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-ivory">
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-sm border border-rose-gold/10">
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-blush rounded-full flex items-center justify-center mx-auto text-rose-gold mb-6"><Mail size={28} /></div>
          <h1 className="text-3xl font-light text-deep-taupe uppercase tracking-widest">Admin Login</h1>
          <p className="text-xs text-taupe tracking-widest uppercase">Email link passwordless sign-in</p>
        </div>

        {!linkSent ? (
          <form onSubmit={handleSendLink} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-4">Admin Email</label>
              <input type="email" required value={email} readOnly onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-4 bg-warm-gray/50 border border-transparent rounded-2xl text-sm" />
              <p className="text-xs text-taupe">A secure Firebase sign-in link will be sent to the admin email.</p>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'Sending link...' : 'Send Login Link'} {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-deep-taupe">Login link sent to <strong>{ADMIN_EMAIL}</strong>. Please check your email.</p>
            <p className="text-xs text-taupe">It may take a few seconds. Check spam/promotions if you do not see it.</p>
            <div className="flex gap-3">
              <button onClick={() => setLinkSent(false)} className="btn-secondary flex-1">Back</button>
              <button onClick={(e) => handleSendLink(e as any)} disabled={loading} className="btn-primary flex-1">Resend Link</button>
            </div>
          </div>
        )}

        {needsEmailRestore && (
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Email was restored from default admin account for link completion.
          </p>
        )}
      </div>
    </div>
  );
}
