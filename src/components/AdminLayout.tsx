import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Gem, 
  PlusCircle, 
  Settings,
  PanelsTopLeft,
  LogOut, 
  Menu, 
  X,
  Tags
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { logAuth, logError, logUI } from '../utils/logger';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();



  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const isAdminAuthBypassEnabled = import.meta.env.VITE_BYPASS_ADMIN_AUTH === 'true';

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Gem },
    { name: 'Add Product', path: '/admin/products/add', icon: PlusCircle },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Storefront', path: '/admin/storefront', icon: PanelsTopLeft },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-warm-gray/30 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-rose-gold/10 transition-all duration-300",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="relative h-20 flex items-center px-6 border-b border-warm-gray">
            <Link to="/" className="flex flex-col items-start">
              <span className={cn("font-light tracking-[0.2em] text-deep-taupe uppercase transition-all", isSidebarOpen ? "text-xl" : "text-xs")}>
                {isSidebarOpen ? 'Sviwa' : 'S'}
              </span>
              {isSidebarOpen && <span className="text-[0.5rem] tracking-[0.4em] text-taupe uppercase -mt-1">Admin</span>}
            </Link>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-rose-gold/20 bg-white p-2 text-taupe shadow-sm hover:bg-blush" aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>{isSidebarOpen ? <X size={16} /> : <Menu size={16} />}</button>
          </div>

          {/* Nav */}
          <nav className="flex-grow py-8 px-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group",
                  location.pathname === item.path 
                    ? "bg-rose-gold text-white shadow-md shadow-rose-gold/20" 
                    : "text-taupe hover:bg-rose-gold-light/30 hover:text-rose-gold"
                )}
              >
                <item.icon size={20} className={cn("shrink-0", location.pathname === item.path ? "text-white" : "text-taupe group-hover:text-rose-gold")} />
                {isSidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-warm-gray">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-taupe hover:bg-red-50 hover:text-red-500 transition-all"
            >
              <LogOut size={20} className="shrink-0" />
              {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn("flex-grow transition-all duration-300", isSidebarOpen ? "ml-64" : "ml-20")}>
        {/* Page Content */}
        <div className="p-4 sm:p-5 lg:p-6">
          {isAdminAuthBypassEnabled && (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-sm">
              Admin auth bypass is enabled for testing. Do not use in production.
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
