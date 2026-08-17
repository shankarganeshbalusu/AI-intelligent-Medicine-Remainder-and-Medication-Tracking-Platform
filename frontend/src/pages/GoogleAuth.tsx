import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { Pill, Mail, ShieldCheck, KeyRound, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface GoogleAuthProps {
  onLoginSuccess?: () => void;
}

export default function GoogleAuth({ onLoginSuccess }: GoogleAuthProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlEmail = searchParams.get('email') || '';
  const urlOtp = searchParams.get('otp') || '';

  const [step, setStep] = useState<'send' | 'verify'>(urlOtp ? 'verify' : 'send');
  const [email, setEmail] = useState(urlEmail || '');
  const [otpCode, setOtpCode] = useState(urlOtp || '');
  const [role, setRole] = useState('patient');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-verify if clicked directly from verification link in email
  useEffect(() => {
    if (urlEmail && urlOtp) {
      handleVerify(urlEmail, urlOtp);
    }
  }, [urlEmail, urlOtp]);

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your Google email address.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authService.googleSendOTP(cleanEmail, role);
      setSuccessMsg(res.message || `Verification code sent to ${cleanEmail}. Please check your email inbox.`);
      setOtpCode('');
      setStep('verify');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid mail ID');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (verifyEmail = email, verifyOtp = otpCode) => {
    const cleanEmail = verifyEmail.trim().toLowerCase();
    const cleanOtp = verifyOtp.trim();

    if (!cleanEmail || !cleanOtp) {
      setError('Please enter both your email address and 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const authData = await authService.googleVerifyOTP(cleanEmail, cleanOtp, role);
      if (authData && authData.access_token) {
        localStorage.setItem('pillsync_token', authData.access_token);
        localStorage.setItem('pillsync_user_id', String(authData.user_id));
        localStorage.setItem('pillsync_user_role', authData.role);
        localStorage.setItem('pillsync_user_name', authData.name);
        localStorage.setItem('pillsync_user_email', authData.email);
      }
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <Pill className="h-8 w-8 text-cyan-400 animate-pulse" />
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            PillSync
          </span>
        </Link>
        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
          <svg className="h-6 w-6" viewBox="0 0 24 24">
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
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google Authentication
        </h2>
        <p className="text-slate-300 text-xs font-semibold mt-1">
          {step === 'send'
            ? 'Enter your registered Google email to receive your 6-digit OTP code'
            : 'Enter the 6-digit verification code sent to your email'}
        </p>
      </div>

      <div className="glass-card bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-2xl text-white">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl flex flex-col gap-2 text-red-300 text-sm font-bold shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
            {(error.includes("Invalid mail ID") || error.includes("not registered")) && (
              <Link
                to="/register"
                className="mt-2 inline-flex items-center justify-center py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-md transition-all"
              >
                Create Account First on Sign Up Page →
              </Link>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/40 rounded-xl flex items-start gap-3 text-green-300 text-sm font-bold shadow-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-green-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'send' ? (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-2">
                Google Email Address
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
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-cyan-500/30 bg-slate-900 text-white font-semibold placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 shadow-inner"
                  placeholder="your.google.email@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-2">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`py-3 px-4 rounded-xl border font-black text-xs transition-all cursor-pointer ${
                    role === 'patient'
                      ? 'border-cyan-400 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole('caregiver')}
                  className={`py-3 px-4 rounded-xl border font-black text-xs transition-all cursor-pointer ${
                    role === 'caregiver'
                      ? 'border-cyan-400 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Caregiver
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
              <span>Send Verification Code</span>
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-2">
                Enter 6-Digit Google OTP Code
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-cyan-400 pointer-events-none z-10">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-cyan-500/30 bg-slate-900 text-cyan-300 placeholder-slate-600 text-center font-black tracking-[8px] text-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 shadow-inner"
                  placeholder="E.g. 123456"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleVerify()}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              <span>Verify & Sign In</span>
            </button>

            <div className="flex flex-col items-center gap-2 pt-2 text-center">
              <p className="text-[11px] text-slate-400 font-semibold">
                Didn't receive the email? Check your <span className="text-cyan-300 font-bold">Spam / Promotions</span> folder or resend.
              </p>
              <button
                type="button"
                onClick={async (e) => {
                  setError('');
                  setSuccessMsg('');
                  await handleSendOTP(e as any);
                }}
                disabled={loading}
                className="text-xs font-black text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer disabled:opacity-50"
              >
                🔄 Resend Verification Code
              </button>
              <button
                type="button"
                onClick={() => { setStep('send'); setError(''); setSuccessMsg(''); }}
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer mt-1"
              >
                ← Change Email Address
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <Link
            to="/login"
            className="text-xs font-bold text-slate-400 hover:text-cyan-300 transition-colors"
          >
            ← Back to Standard Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
