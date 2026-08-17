import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth';
import { Pill, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        setMessage({ text: 'Invalid or missing email verification parameters.', type: 'error' });
        setLoading(false);
        return;
      }

      try {
        const res = await authService.verifyEmail(email, token);
        setMessage({ text: res.status || 'Email verified successfully! You can now log in.', type: 'success' });
      } catch (err: any) {
        setMessage({
          text: err.response?.data?.detail || 'Failed to verify email address. The link may have expired.',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, email]);

  return (
    <div className="w-full max-w-md animate-fade-in mx-auto py-12">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <Pill className="h-8 w-8 text-cyan-400 animate-pulse" />
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            PillSync
          </span>
        </Link>
        <h2 className="text-2xl font-black text-white">Email Verification</h2>
        <p className="text-slate-300 text-xs font-semibold mt-1.5">Account Security & Verification</p>
      </div>

      <div className="glass-card bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-2xl text-center">
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
            <p className="text-slate-300 text-sm font-semibold">Verifying your email address...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`p-4 rounded-2xl border text-sm flex items-center gap-3 text-left font-bold ${
              message.type === 'success'
                ? 'bg-green-500/20 border-green-500/40 text-green-300'
                : 'bg-red-500/20 border-red-500/40 text-red-300'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-green-400" />
              ) : (
                <AlertCircle className="h-6 w-6 shrink-0 text-red-400" />
              )}
              <span>{message.text}</span>
            </div>

            {message.type === 'success' ? (
              <Link
                to="/login"
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-block text-xs font-black text-cyan-400 hover:underline"
              >
                Back to Registration
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
