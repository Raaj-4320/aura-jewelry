import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

function isAllowedAdminEmail(email?: string | null) {
  return email === 'raj.golakiya0@gmail.com';
}

async function hasAdminRole(user: User): Promise<boolean> {
  if (isAllowedAdminEmail(user.email)) return true;
  try {
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    return !!userSnap.exists() && userSnap.data()?.role === 'admin';
  } catch (error) {
    console.error('Failed to verify admin role', error);
    return false;
  }
}

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthorized(false);
        setAuthLoading(false);
        return;
      }

      const isAdmin = await hasAdminRole(user);
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
    return <Navigate to="/login" replace state={{ from: location.pathname, unauthorized: true }} />;
  }

  return <>{children}</>;
}
