import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Pill, LogOut, User as UserIcon, Sparkles, Home, LayoutDashboard, Scan, BarChart3, RefreshCw, FileText } from 'lucide-react';
import { authService } from '../services/auth';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  onAskAI?: () => void;
}

export default function Navbar({ user, onLogout, onAskAI }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    authService.logout();
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900/95 sticky top-3 mx-auto z-50 backdrop-blur-2xl border-2 border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.25)] rounded-2xl md:rounded-full max-w-7xl w-[98%] transition-all duration-300">
      <div className="px-3 sm:px-6 w-full">
        <div className="flex items-center justify-between min-h-[56px] py-1.5 gap-2">
          {/* Brand Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex-shrink-0 flex items-center gap-2 mr-2 group" title={user ? "Go to Dashboard" : "Go to Home Page"}>
            <div className="p-1.5 bg-cyan-500/20 rounded-xl border border-cyan-400/40 group-hover:scale-105 transition-transform">
              <Pill className="h-5 w-5 text-cyan-400 animate-heartbeat" />
            </div>
            <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              PillSync
            </span>
          </Link>

          {/* Navigation Links (No scrollbar, perfectly spaced) */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {!user && (
              <Link
                to="/"
                className={`flex items-center gap-1.5 text-[11px] lg:text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full transition-all shrink-0 ${
                  isActive('/')
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                    : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </Link>
            )}

            {user && (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 text-[11px] lg:text-xs font-black uppercase tracking-wider px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
                    isActive('/dashboard')
                      ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                      : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80'
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/medicines"
                  className={`flex items-center gap-1.5 text-[11px] lg:text-xs font-black uppercase tracking-wider px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
                    isActive('/medicines')
                      ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                      : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80'
                  }`}
                >
                  <Pill className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Cabinet</span>
                </Link>
                <Link
                  to="/refill"
                  className={`flex items-center gap-1.5 text-[11px] lg:text-xs font-black uppercase tracking-wider px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
                    isActive('/refill')
                      ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                      : 'text-slate-300 hover:text-amber-400 hover:bg-slate-800/80'
                  }`}
                >
                  <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
                  <span>Refill Tracker</span>
                </Link>
                <Link
                  to="/medical-records"
                  className={`flex items-center gap-1.5 text-[11px] lg:text-xs font-black uppercase tracking-wider px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
                    isActive('/medical-records')
                      ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                      : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Medical Records</span>
                </Link>
                <Link
                  to="/prescription-ocr"
                  className={`flex items-center gap-1.5 text-[11px] lg:text-xs font-black uppercase tracking-wider px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
                    isActive('/prescription-ocr')
                      ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                      : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80'
                  }`}
                >
                  <Scan className="h-3.5 w-3.5 text-cyan-400" />
                  <span>AI Scanner</span>
                </Link>
                <Link
                  to="/history"
                  className={`flex items-center gap-1.5 text-[11px] lg:text-xs font-black uppercase tracking-wider px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all shrink-0 ${
                    isActive('/history')
                      ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                      : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Report Analysis</span>
                </Link>
                {user?.role === 'patient' && onAskAI && (
                  <button
                    onClick={onAskAI}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-[10px] lg:text-[11px] font-black uppercase tracking-wider text-white rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all ml-1 shrink-0 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3 text-cyan-200 animate-pulse" />
                    <span>Ask AI</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* User Account Controls */}
          <div className="flex items-center shrink-0 ml-2">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden xl:flex flex-col text-right">
                  <span className="text-xs font-black text-white leading-none">{user.name}</span>
                  <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-widest block mt-0.5">{user.role}</span>
                </div>
                
                <Link
                  to="/profile"
                  className={`p-2 rounded-full transition-all ${
                    isActive('/profile')
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 border border-slate-700/60'
                  }`}
                  title="My Profile & Settings"
                >
                  <UserIcon className="h-4 w-4" />
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-slate-700/80 text-xs font-black text-slate-200 hover:text-rose-300 hover:bg-rose-950/60 hover:border-rose-500/60 transition-all cursor-pointer shadow-sm"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-extrabold text-slate-300 hover:text-cyan-400 px-3 py-1.5 rounded-full transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
