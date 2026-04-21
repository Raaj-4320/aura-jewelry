import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, User, LogIn } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.unauthorized) {
      toast.error('Admin access required. Please sign in with an authorized account.');
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back to Aura');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully');
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-ivory">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-sm border border-rose-gold/10"
      >
        <div className="text-center space-y-4 mb-10">
          <div className="w-16 h-16 bg-blush rounded-full flex items-center justify-center mx-auto text-rose-gold mb-6">
            {isLogin ? <LogIn size={28} /> : <User size={28} />}
          </div>
          <h1 className="text-3xl font-light text-deep-taupe uppercase tracking-widest">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-xs text-taupe tracking-widest uppercase">
            {isLogin ? 'Enter your details to sign in' : 'Join our exclusive community'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-4">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe/40" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                className="w-full pl-12 pr-4 py-4 bg-warm-gray/50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-taupe ml-4">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-taupe/40" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-warm-gray/50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-rose-gold/30 transition-all outline-none"
              />
            </div>
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button type="button" className="text-[10px] font-semibold uppercase tracking-widest text-rose-gold hover:underline">
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-warm-gray text-center">
          <p className="text-sm text-taupe">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-rose-gold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
