import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { Pill, Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await authService.forgotPassword(email);
      setMessage({
        text: 'If this email is registered, a password reset link has been dispatched! Please check your email inbox (or terminal console logs).',
        type: 'success'
      });
      setEmail('');
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || 'An error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in mx-auto py-12">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <Pill className="h-8 w-8 text-cyan-400 animate-pulse" />
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            PillSync
          </span>
        </Link>
        <h2 className="text-2xl font-black text-white">Forgot Password</h2>
        <p className="text-slate-300 text-xs font-semibold mt-1.5">Enter your email address to receive a secure reset link.</p>
      </div>

      <div className="glass-card bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
        {message.text && (
          <div className={`p-4 rounded-xl border text-sm flex gap-3 mb-6 font-bold ${
            message.type === 'success'
              ? 'bg-green-500/20 border-green-500/40 text-green-300'
              : 'bg-red-500/20 border-red-500/40 text-red-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-cyan-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full pl-12 pr-4 py-3 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 font-semibold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Request Reset Link
          </button>
        </form>

        <div className="border-t border-slate-800 pt-5 mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-black text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
