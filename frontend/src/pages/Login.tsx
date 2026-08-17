import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Google Auth states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleRole, setGoogleRole] = useState('patient');

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail) return;

    setLoading(true);
    setError('');
    setShowGoogleModal(false);

    try {
      await authService.googleLogin({
        email: googleEmail,
        name: googleName || googleEmail.split('@')[0],
        role: googleRole
      });
      onLoginSuccess();
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to authenticate via Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.login({ email, password });
      onLoginSuccess();
      if (res.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'Failed to log in. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative animate-page-3d min-h-[500px]">
      {/* Left Column: Visual Artwork panel */}
      <div className="hidden md:flex md:col-span-5 flex-col justify-center text-left bg-gradient-to-br from-brand-950 via-brand-900 to-indigo-950 p-8 rounded-3xl border border-brand-800/40 shadow-2xl shadow-brand-500/10 relative overflow-hidden h-full min-h-[520px] animate-glow-purple">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,144,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,144,233,0.03)_1px,transparent_1px)] bg-[size:12px_12px]" />
        
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-6 flex flex-col justify-between h-full">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase rounded-full tracking-wider">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-glow-green" />
              PillSync System Active
            </div>
            <h1 className="text-3xl font-black text-white leading-tight mt-4">
              Your Intelligent <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-cyan-400 to-indigo-400">Medicine Cabinet</span>
            </h1>
            <p className="text-slate-350 text-xs mt-3 leading-relaxed">
              Track dose adherence, schedule custom reminders, configure multi-recipient alerts, and synchronize compliance logs dynamically.
            </p>
          </div>

          <div className="flex justify-center py-4 relative" style={{ perspective: '800px', transformStyle: 'preserve-3d' }}>
            {/* Glossy 3D medicine setup */}
            <div className="relative w-44 h-48 flex items-center justify-center transition-all duration-700" style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-6deg) rotateX(10deg)' }}>
              
              {/* Rotating holographic rings */}
              <div className="absolute w-36 h-36 border border-brand-500/25 rounded-full animate-spin-slow" />
              <div className="absolute w-28 h-28 border border-dashed border-indigo-500/25 rounded-full animate-reverse-spin" />

              {/* Volumetric bottle */}
              <div className="absolute animate-float-slow flex items-center justify-center" style={{ transform: 'translateZ(20px)' }}>
                <svg width="65" height="110" viewBox="0 0 90 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_12px_24px_rgba(14,144,233,0.3)]">
                  <rect x="25" y="5" width="40" height="15" rx="4" fill="url(#cap-grad)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <rect x="33" y="20" width="24" height="12" fill="url(#glass-neck-grad)" />
                  <rect x="15" y="32" width="60" height="110" rx="18" fill="url(#glass-body-grad)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                  <rect x="25" y="65" width="40" height="40" rx="8" fill="rgba(255,255,255,0.95)" />
                  <path d="M 45,75 L 45,95 M 35,85 L 55,85" stroke="#0e90e9" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 23,45 Q 23,135 23,135" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
                  <defs>
                    <linearGradient id="cap-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#0e90e9" />
                    </linearGradient>
                    <linearGradient id="glass-neck-grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="rgba(14, 144, 233, 0.4)" />
                      <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
                      <stop offset="100%" stopColor="rgba(14, 144, 233, 0.2)" />
                    </linearGradient>
                    <linearGradient id="glass-body-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                      <stop offset="30%" stopColor="rgba(14, 144, 233, 0.15)" />
                      <stop offset="70%" stopColor="rgba(99, 102, 241, 0.15)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Floating capsules */}
              <div className="absolute top-4 -left-6 animate-float-delayed transform-gpu" style={{ transform: 'translateZ(40px) rotate(15deg)' }}>
                <div className="w-10 h-4.5 rounded-full bg-gradient-to-r from-red-500 to-indigo-500 border border-white/35 shadow-md flex items-center justify-between px-0.5 relative">
                  <div className="w-4 h-3 bg-white/20 rounded-full" />
                </div>
              </div>

              <div className="absolute bottom-6 -right-6 animate-float-slow transform-gpu" style={{ transform: 'translateZ(50px) rotate(-20deg)' }}>
                <div className="w-10 h-4.5 rounded-full bg-gradient-to-r from-cyan-400 to-brand-600 border border-white/35 shadow-md flex items-center justify-between px-0.5 relative">
                  <div className="w-4 h-3 bg-white/20 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-purple-300 border-t border-purple-800/40 pt-4 flex items-center justify-between">
            <span>Powered by Nodemailer</span>
            <span>v2.1.0 (Google SMTP)</span>
          </div>
        </div>
      </div>

      {/* Right Column: Sign In Form panel */}
      <div className="md:col-span-7 w-full">
        {/* Dynamic ECG background */}
        <div className="absolute -inset-x-20 -top-20 -bottom-10 -z-10 overflow-hidden pointer-events-none opacity-[0.05] flex items-center justify-center">
          <svg className="w-full h-48" viewBox="0 0 800 200" fill="none">
            <path
              d="M 0,100 L 250,100 L 270,60 L 290,140 L 310,100 L 350,100 L 365,20 L 395,180 L 415,90 L 430,110 L 445,100 L 800,100"
              stroke="#10b981"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-ecg"
            />
          </svg>
        </div>

        <div className="glass-card rounded-3xl p-8 relative overflow-hidden bg-slate-900/90 border border-cyan-500/30 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)] text-white">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-2xl text-cyan-400 mb-4 relative">
              <Pill className="h-8 w-8 animate-heartbeat" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-glow-green" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Welcome Back</h2>
            <p className="text-sm text-slate-300 font-semibold mt-1">Manage your medication routines intelligently</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl flex items-start gap-3 text-red-300 text-sm font-bold shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-cyan-400 pointer-events-none z-10">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-cyan-500/30 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all font-semibold shadow-inner"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline font-extrabold">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-cyan-400 pointer-events-none z-10">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-cyan-500/30 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all font-semibold shadow-inner"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer z-10"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-cyan-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-cyan-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              Sign In
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-y-1/2 left-0 right-0 border-t border-slate-800"></div>
            <span className="relative px-3.5 bg-slate-900 text-xs font-black text-slate-400 uppercase tracking-wider">
              Or
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/google-auth')}
            className="w-full flex items-center justify-center gap-2.5 py-3 border border-cyan-500/30 bg-slate-900 hover:bg-slate-800 font-black rounded-xl text-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.76 5.76 0 0 1 8.16 12.8a5.76 5.76 0 0 1 5.83-5.8 5.68 5.68 0 0 1 3.907 1.543l3.076-3.078A9.87 9.87 0 0 0 13.99 2 9.84 9.84 0 0 0 4 11.84a9.84 9.84 0 0 0 9.99 9.84c5.78 0 9.82-3.99 9.82-9.84 0-.6-.05-1.18-.16-1.74H12.24z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-300 font-semibold">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyan-400 font-extrabold hover:text-cyan-300 hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-sm w-full p-6 shadow-[0_0_30px_rgba(6,182,212,0.2)] text-white animate-scale-in">
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google Account Sign In
            </h3>
            <p className="text-slate-300 text-xs font-semibold mb-5">Sign in safely to PillSync with any Google email.</p>
            
            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1">Google Email</label>
                <input
                  type="email"
                  required
                  placeholder="shankarganeshbalusu@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shankar Ganesh"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1">Select Role</label>
                <select
                  value={googleRole}
                  onChange={(e) => setGoogleRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 font-semibold cursor-pointer"
                >
                  <option value="patient" className="bg-slate-900 text-white">Patient</option>
                  <option value="caregiver" className="bg-slate-900 text-white">Caregiver</option>
                </select>
              </div>

              <div className="flex gap-3 border-t border-slate-800 pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-2.5 border border-slate-700 hover:bg-slate-800 font-bold text-xs text-slate-300 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                >
                  Sign In with Google
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
