import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { isApprovedAdminEmail } from '../config/admins';
import { logAuth } from '../utils/logger';

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();

  const isAdminAuthBypassEnabled = import.meta.env.VITE_BYPASS_ADMIN_AUTH === 'true';

  useEffect(() => {
    if (isAdminAuthBypassEnabled) {
      logAuth('admin_auth_bypass_enabled', { path: location.pathname });
      logAuth('admin_check_skipped_for_testing', { reason: 'VITE_BYPASS_ADMIN_AUTH=true' });
      setAuthorized(true);
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthorized(false);
        setAuthLoading(false);
        return;
      }

      const isAdmin = isApprovedAdminEmail(user.email);
      if (!isAdmin) logAuth('admin_access_denied_non_admin', { uid: user.uid, email: user.email });
      setAuthorized(isAdmin);
      setAuthLoading(false);
    });

    return () => unsub();
  }, [isAdminAuthBypassEnabled, location.pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-rose-gold/30 border-t-rose-gold rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-[0.2em] text-taupe">Checking access</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    const reason = auth.currentUser ? 'non_admin' : 'unauthenticated';
    logAuth('admin_redirect_to_login', { from: `${location.pathname}${location.search}`, reason });
    return <Navigate to="/admin-login" replace state={{ from: { pathname: location.pathname, search: location.search }, reason }} />;
  }

  return <>{children}</>;
}
