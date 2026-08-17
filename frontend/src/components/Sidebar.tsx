import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Pill,
  LogOut,
  User as UserIcon,
  Sparkles,
  Home,
  LayoutDashboard,
  Scan,
  BarChart3,
  RefreshCw,
  FileText,
  Menu,
  X,
  ChevronRight,
  Settings
} from 'lucide-react';
import { authService } from '../services/auth';
import AdminSidebar from './AdminSidebar';

interface SidebarProps {
  user: any;
  onLogout: () => void;
  onAskAI?: () => void;
}

export default function Sidebar({ user, onLogout, onAskAI }: SidebarProps) {
  if (user?.role === 'admin') {
    return <AdminSidebar user={user} onLogout={onLogout} />;
  }
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    authService.logout();
    onLogout();
    navigate('/login');
  };

  const isPatient = user?.role === 'patient';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: 'text-cyan-400' },
    { label: isPatient ? 'Cabinet' : 'Patient Cabinets', path: '/medicines', icon: Pill, color: 'text-blue-400' },
    { label: 'Refill Tracker', path: '/refill', icon: RefreshCw, color: 'text-amber-400' },
    { label: 'Medical Records', path: '/medical-records', icon: FileText, color: 'text-emerald-400' },
    ...(isPatient ? [{ label: 'AI Scanner', path: '/prescription-ocr', icon: Scan, color: 'text-purple-400' }] : []),
    { label: 'Report Analysis', path: '/history', icon: BarChart3, color: 'text-indigo-400' },
    { label: 'Settings', path: '/profile', icon: Settings, color: 'text-slate-300' },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-50 bg-slate-900/95 backdrop-blur-2xl border-b border-cyan-500/30 px-3 py-2 flex items-center justify-between shadow-lg">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-cyan-400 animate-pulse" />
          <span className="text-lg font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            PillSync
          </span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 bg-slate-800 text-cyan-400 rounded-lg border border-cyan-500/30 hover:bg-slate-700 active:scale-95 transition-all"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 animate-fade-in"
        />
      )}

      {/* Sleek Compact Vertical Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-52 bg-slate-900/95 backdrop-blur-2xl border-r border-cyan-500/30 p-3 flex flex-col justify-between shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-4">
          {/* Compact Brand Header */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
            <Link
              to={user ? "/dashboard" : "/"}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 group"
            >
              <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-300/40 group-hover:scale-105 transition-transform">
                <Pill className="h-4.5 w-4.5 text-white animate-heartbeat" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent block leading-tight">
                  PillSync
                </span>
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block -mt-0.5">
                  Platform
                </span>
              </div>
            </Link>

            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Compact Navigation Menu Items */}
          <div className="space-y-1">
            <span className="block text-[10px] font-black text-cyan-400 uppercase tracking-widest px-2.5 mb-1.5">
              Menu
            </span>

            {!user && (
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                  isActive('/')
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-300/40'
                    : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Home className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Home</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-cyan-400/60" />
              </Link>
            )}

            {user && navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all group ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-300/40'
                      : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${active ? 'text-white' : item.color} group-hover:scale-105 transition-transform`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-slate-500'} group-hover:translate-x-0.5 transition-transform shrink-0`} />
                </Link>
              );
            })}

            {user?.role === 'patient' && onAskAI && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onAskAI();
                }}
                className="w-full mt-2 flex items-center justify-between px-2.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer border border-cyan-300/40"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-200 animate-pulse" />
                  <span>Ask AI</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-white shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Compact User Controls Anchored at Bottom */}
        <div className="border-t border-cyan-500/20 pt-3 space-y-2">
          {user ? (
            <>
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className={`p-2 rounded-xl flex items-center justify-between border transition-all ${
                  isActive('/profile')
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                    : 'bg-slate-950/80 border-cyan-500/30 text-slate-300 hover:border-cyan-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 border border-cyan-300/40">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate text-left">
                    <span className="block text-[11px] font-black text-white truncate leading-tight">{user.name}</span>
                    <span className="block text-[9px] font-extrabold text-cyan-400 uppercase tracking-widest">{user.role}</span>
                  </div>
                </div>
                <UserIcon className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              </Link>

              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full py-2 px-3 bg-slate-950 hover:bg-rose-950/80 active:scale-95 text-rose-300 hover:text-white font-black text-[11px] uppercase tracking-wider rounded-xl border border-rose-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-400" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="space-y-1.5">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 text-center text-[11px] font-black text-white bg-slate-800 hover:bg-slate-700 rounded-lg block border border-cyan-500/30"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 text-center text-[11px] font-black text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg block shadow-lg"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
