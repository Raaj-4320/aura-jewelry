import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Gem, 
  PlusCircle, 
  FileUp,
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Bell
} from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Gem },
    { name: 'Add Product', path: '/admin/products/add', icon: PlusCircle },
    { name: 'Bulk Import', path: '/admin/products/import', icon: FileUp },
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
          <div className="h-20 flex items-center px-6 border-b border-warm-gray">
            <Link to="/" className="flex flex-col items-start">
              <span className={cn("font-light tracking-[0.2em] text-deep-taupe uppercase transition-all", isSidebarOpen ? "text-xl" : "text-xs")}>
                Aura
              </span>
              {isSidebarOpen && <span className="text-[0.5rem] tracking-[0.4em] text-taupe uppercase -mt-1">Admin</span>}
            </Link>
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
        {/* Top Bar */}
        <header className="h-20 bg-white border-b border-rose-gold/10 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-taupe p-2 hover:bg-warm-gray rounded-lg">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs text-taupe/60 uppercase tracking-widest">
              <span>Admin</span>
              <ChevronRight size={12} />
              <span className="text-deep-taupe font-medium">{location.pathname.split('/').pop() || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-[10px] uppercase tracking-widest text-taupe/60 bg-warm-gray/50 px-4 py-2 rounded-full">
              Search coming soon
            </div>
            <div className="relative text-taupe p-2" title="Notifications unavailable">
              <Bell size={20} />
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-warm-gray">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-deep-taupe">{user?.email?.split('@')[0]}</p>
                <p className="text-[10px] text-taupe uppercase tracking-widest">Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-gold-light flex items-center justify-center text-rose-gold font-bold">
                {user?.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
