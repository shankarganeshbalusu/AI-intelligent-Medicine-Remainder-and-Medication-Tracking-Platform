import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Pill,
  Activity,
  RefreshCw,
  FileSpreadsheet,
  Bell,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ShieldAlert
} from 'lucide-react';
import { authService } from '../services/auth';

interface AdminSidebarProps {
  user: any;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Patients', path: '/admin/patients', icon: Users },
    { label: 'Caregivers', path: '/admin/caregivers', icon: Stethoscope },
    { label: 'Medicines', path: '/admin/medicines', icon: Pill },
    { label: 'Medication Activity', path: '/admin/activity', icon: Activity },
    { label: 'Refill Tracker', path: '/admin/refill', icon: RefreshCw },
    { label: 'Medical Records', path: '/admin/medical-records', icon: FileSpreadsheet },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'System Settings', path: '/admin/settings', icon: Settings },
    { label: 'Admin Profile', path: '/admin/profile', icon: ShieldCheck }
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-brand-400 hover:text-white focus:outline-none shadow-lg backdrop-blur-md"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Overlay Backdrop for Mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900/90 border-r border-slate-800/80 text-slate-300 z-40 transition-transform duration-300 ease-in-out flex flex-col justify-between backdrop-blur-xl shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          {/* Header Brand */}
          <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3 bg-slate-950/40">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <ShieldAlert className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg text-white tracking-wider">PillSync</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Healthcare SaaS Admin</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1 flex-1">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Administration
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-500/20 to-indigo-500/20 text-white font-semibold border border-brand-500/40 shadow-sm shadow-brand-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-700/50 border border-transparent'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0 text-brand-400" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Footer User Info & Logout */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 space-y-3">
            <div className="flex items-center space-x-3 px-2 py-1">
              <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-brand-400 text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'System Admin'}</p>
                <p className="text-[10px] text-brand-400 font-medium truncate">{user?.email || 'admin@pillsync.com'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out Admin</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
