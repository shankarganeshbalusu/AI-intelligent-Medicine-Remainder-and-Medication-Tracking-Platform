import React, { useState } from 'react';
import { ShieldCheck, Lock, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/auth';
import { usersService } from '../../services/users';

export const AdminProfile: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await usersService.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setMsg('Admin password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update password.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl flex items-center space-x-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-brand-500/20">
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{currentUser?.name || 'System Administrator'}</h1>
          <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">{currentUser?.email || 'admin@pillsync.com'} &bull; Administrator Role</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Account Info & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4 shadow-xl text-xs">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <UserIcon className="h-4 w-4 text-brand-400" />
            <span>Admin Account Credentials</span>
          </h2>

          <div className="space-y-2">
            <div>
              <p className="text-[11px] text-slate-400">Full Name</p>
              <p className="font-bold text-white text-sm">{currentUser?.name || 'System Administrator'}</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400">Primary Email</p>
              <p className="font-bold text-white text-sm">{currentUser?.email || 'admin@pillsync.com'}</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400">System Role</p>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 font-bold text-[10px]">
                <ShieldCheck className="h-3 w-3" />
                <span>Super Admin</span>
              </span>
            </div>
          </div>
        </div>

        {/* Change Security Password */}
        <form onSubmit={handlePasswordChange} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4 shadow-xl text-xs">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Lock className="h-4 w-4 text-indigo-400" />
            <span>Update Admin Password</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md"
            >
              Update Security Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
