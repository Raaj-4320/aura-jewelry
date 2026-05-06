import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onIdTokenChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

async function hasAdminClaim(user: User): Promise<boolean> {
  try {
    const tokenResult = await user.getIdTokenResult(true);
    return tokenResult.claims.admin === true;
  } catch {
    return false;
  }
}

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        setAuthorized(false);
        setAuthLoading(false);
        return;
      }

      const isAdmin = await hasAdminClaim(user);
      setAuthorized(isAdmin);
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

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
    return <Navigate to="/admin-login" replace state={{ from: { pathname: location.pathname, search: location.search }, unauthorized: true }} />;
  }

  return <>{children}</>;
}
