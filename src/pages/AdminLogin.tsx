import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Mail } from 'lucide-react';
import { isSignInWithEmailLink, sendPasswordResetEmail, sendSignInLinkToEmail, signInWithEmailAndPassword, signInWithEmailLink } from 'firebase/auth';
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
  if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('://')) return fallback;
  return `${pathname}${search}`;
}

function getFriendlyAuthMessage(code?: string, fallback = 'Unable to complete sign-in. Please try again.') {
  switch (code) {
    case 'auth/operation-not-allowed': return 'Firebase Email/Password sign-in is not enabled. Enable it in Firebase Authentication → Sign-in method.';
    case 'auth/unauthorized-domain': return 'This domain is not authorized in Firebase Authentication. Add this deployment domain to Firebase Auth authorized domains.';
    case 'auth/invalid-action-code': return 'This login link is invalid or already used. Send a new link.';
    case 'auth/expired-action-code': return 'This login link expired. Send a new link.';
    case 'auth/user-disabled': return 'This admin user is disabled in Firebase.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password': return 'Incorrect email or password. Try again or use Forgot password.';
    case 'auth/too-many-requests': return 'Too many sign-in attempts. Wait a moment or reset your password.';
    default: return fallback;
  }
}

export default function AdminLogin() {
  const [email] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [needsEmailRestore, setNeedsEmailRestore] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useMemo(() => getSafeRedirectPath(location), [location]);
  const isAdminAuthBypassEnabled = import.meta.env.VITE_BYPASS_ADMIN_AUTH === 'true';

  useEffect(() => { logAuth('admin_login_page_loaded', { path: location.pathname }); logAuth('admin_email_prefilled', { email: ADMIN_EMAIL, readOnly: true }); }, [location.pathname]);
  useEffect(() => {
    if (isAdminAuthBypassEnabled) { logAuth('admin_login_bypassed_redirect_to_admin', { from: location.pathname }); navigate('/admin', { replace: true }); return; }
    if ((location.state as any)?.reason === 'non_admin') toast.error('You are signed in, but this account does not have admin access.');
  }, [isAdminAuthBypassEnabled, location.pathname, location.state, navigate]);

  useEffect(() => {
    const completeEmailLinkSignIn = async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) return;
      logAuth('admin_email_link_detected', { path: location.pathname });
      const storedEmail = window.localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY) || '';
      const restoredEmail = storedEmail || ADMIN_EMAIL;
      if (!storedEmail) { setNeedsEmailRestore(true); logAuth('admin_email_link_email_missing_from_storage', { fallbackEmail: ADMIN_EMAIL }); }
      if (!isApprovedAdminEmail(restoredEmail)) return toast.error('This email is not allowed for admin access.');
      setLoading(true);
      try {
        const credential = await signInWithEmailLink(auth, restoredEmail, window.location.href);
        await credential.user.getIdToken(true);
        window.localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY);
        logAuth('admin_email_link_signin_success', { uid: credential.user.uid, email: credential.user.email });
        logRoute('admin_login_redirect_after_email_link', { to: redirectPath });
        toast.success('Admin sign-in successful. You can set your password in Settings.');
        navigate(redirectPath, { replace: true });
      } catch (error) { const firebaseError = error as { code?: string; message?: string }; logError('admin_email_link_signin_failure', error); toast.error(getFriendlyAuthMessage(firebaseError.code, firebaseError.message)); }
      finally { setLoading(false); }
    };
    completeEmailLinkSignIn();
  }, [location.pathname, navigate, redirectPath]);

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password) return toast.error('Enter your password.');
    setLoading(true); logAuth('admin_password_signin_start', { email });
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await credential.user.getIdToken(true);
      logAuth('admin_password_signin_success', { uid: credential.user.uid, email: credential.user.email });
      logRoute('admin_login_redirect_after_password', { to: redirectPath });
      toast.success('Admin sign-in successful.'); navigate(redirectPath, { replace: true });
    } catch (error) { const firebaseError = error as { code?: string; message?: string }; logError('admin_password_signin_failure', error, { code: firebaseError.code }); toast.error(getFriendlyAuthMessage(firebaseError.code, firebaseError.message)); }
    finally { setLoading(false); setPassword(''); }
  };

  const handleForgotPassword = async () => {
    setLoading(true); logAuth('admin_password_reset_send_start', { email });
    try { await sendPasswordResetEmail(auth, email); logAuth('admin_password_reset_send_success', { email }); toast.success('If the admin account is available, Firebase sent a password reset email.'); }
    catch (error) { const firebaseError = error as { code?: string; message?: string }; logError('admin_password_reset_send_failure', error, { code: firebaseError.code }); toast.error(getFriendlyAuthMessage(firebaseError.code, 'Unable to send the password reset email.')); }
    finally { setLoading(false); }
  };

  const handleSendLink = async () => {
    setLoading(true); logAuth('admin_email_link_send_start', { email });
    try {
      await sendSignInLinkToEmail(auth, email, { url: `${window.location.origin}/admin-login`, handleCodeInApp: true });
      window.localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, email); setLinkSent(true); logAuth('admin_email_link_send_success', { email }); toast.success('Secure sign-in link sent. Open your email to continue.');
    } catch (error) { const firebaseError = error as { code?: string; message?: string }; logError('admin_email_link_send_failure', error, { code: firebaseError.code }); toast.error(getFriendlyAuthMessage(firebaseError.code, firebaseError.message)); }
    finally { setLoading(false); }
  };

  return <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-ivory"><div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-sm border border-rose-gold/10 space-y-7">
    <div className="text-center space-y-3"><div className="w-14 h-14 bg-blush rounded-full flex items-center justify-center mx-auto text-rose-gold"><KeyRound size={25} /></div><h1 className="text-2xl font-light text-deep-taupe uppercase tracking-widest">Admin Login</h1><p className="text-xs text-taupe">Sign in with your Firebase admin password.</p></div>
    <form onSubmit={handlePasswordLogin} className="space-y-4"><label className="block space-y-1"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Admin email</span><input type="email" value={email} readOnly className="w-full px-4 py-3 bg-warm-gray/50 rounded-xl text-sm" /></label><label className="block space-y-1"><span className="text-[10px] font-semibold uppercase tracking-widest text-taupe">Password</span><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full px-4 py-3 bg-warm-gray/50 rounded-xl text-sm" /></label><button type="submit" disabled={loading} className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50">{loading ? 'Please wait…' : 'Login with password'} {!loading && <ArrowRight size={16} />}</button><button type="button" disabled={loading} onClick={handleForgotPassword} className="w-full text-xs font-semibold text-rose-gold hover:text-deep-taupe">Forgot password? Send reset email</button></form>
    <div className="border-t border-warm-gray pt-5 space-y-3"><div className="flex items-center gap-2 text-taupe"><Mail size={16} /><h2 className="text-xs font-bold uppercase tracking-widest">First login or recovery</h2></div>{linkSent ? <div className="space-y-3"><p className="text-xs text-taupe">Secure login link sent to <strong>{email}</strong>. Open it to sign in, then set your password in Settings.</p><button type="button" disabled={loading} onClick={handleSendLink} className="btn-secondary w-full py-2">Resend secure link</button></div> : <><p className="text-xs text-taupe">If you have not set a password yet, send a secure email link. After signing in, open Settings to create your password.</p><button type="button" disabled={loading} onClick={handleSendLink} className="btn-secondary w-full py-2">Send first-time login link</button></>}</div>
    {needsEmailRestore && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">Email was restored from the default admin account for link completion.</p>}
  </div></div>;
}
