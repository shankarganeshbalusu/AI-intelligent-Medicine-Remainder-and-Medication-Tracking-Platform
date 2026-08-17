import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { Pill, Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      setMessage({ text: 'Invalid or missing password reset parameters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await authService.resetPassword({
        email,
        token,
        new_password: newPassword
      });
      setMessage({ text: 'Password reset successfully! Redirecting you to login...', type: 'success' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || 'Failed to reset password. The link may have expired.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in mx-auto py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <Pill className="h-8 w-8 text-cyan-400 animate-pulse" />
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            PillSync
          </span>
        </div>
        <h2 className="text-2xl font-black text-white">Set New Password</h2>
        <p className="text-slate-300 text-xs font-semibold mt-1.5">Enter a strong, secure password for your account.</p>
      </div>

      <div className="glass-card bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-2xl">
        {!token || !email ? (
          <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-bold flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>Invalid password reset parameters. Please use the original link from your email notification.</span>
          </div>
        ) : (
          <>
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
                <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-cyan-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer z-10"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5 text-cyan-400" /> : <Eye className="h-5 w-5 text-cyan-400" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-cyan-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer z-10"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5 text-cyan-400" /> : <Eye className="h-5 w-5 text-cyan-400" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset Password
              </button>
            </form>
          </>
        )}

        <div className="border-t border-slate-800 pt-5 mt-6 text-center">
          <Link
            to="/login"
            className="text-xs font-black text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
