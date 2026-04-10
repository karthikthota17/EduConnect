import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, BookOpen } from 'lucide-react';
import Background3D from '../components/Background3D';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <Background3D />
      
      <div className="max-w-[440px] w-full p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] glass-panel relative z-10 overflow-hidden animate-in fade-in zoom-in duration-700">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse"></div>
        
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-indigo-600/20 text-indigo-400 mb-4 md:mb-6 indigo-glow">
             <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">Welcome Back</h1>
          <p className="text-slate-400 font-medium text-sm md:text-base">Continue your learning journey.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 md:p-4 rounded-xl text-xs md:text-sm mb-6 md:mb-8 text-center animate-shake leading-tight">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-400 text-slate-400">
                <Mail className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all text-white placeholder:text-slate-600 text-sm md:text-base"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-400 text-slate-400">
                <Lock className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all text-white placeholder:text-slate-600 text-sm md:text-base"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl md:rounded-2xl transition-all flex items-center justify-center shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 mt-4 group text-xs md:text-sm uppercase tracking-widest"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-8 md:mt-10 text-center text-xs md:text-sm font-medium text-slate-400">
          New to the platform?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold underline-offset-4 hover:underline transition-all">
            Join Now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
