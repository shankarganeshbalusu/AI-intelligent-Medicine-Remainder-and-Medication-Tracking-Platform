import React, { useState } from 'react';
import {
  Settings,
  Mail,
  Lock,
  CheckCircle2
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <Settings className="h-6 w-6 text-brand-400" />
          <span>System Settings & Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Global administrative settings, automated notification triggers, and security controls.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Administrative settings updated successfully!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Email & Notification Triggers */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Mail className="h-4 w-4 text-brand-400" />
            <span>Automated Refill & Email Dispatches</span>
          </h2>

          <div className="space-y-3 text-xs">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded bg-slate-950 border-slate-800 text-brand-500 focus:ring-0" />
              <span className="text-slate-200">Automatically dispatch refill alerts when medicine stock &le; 2 days</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded bg-slate-950 border-slate-800 text-brand-500 focus:ring-0" />
              <span className="text-slate-200">Dispatch emergency missed-dose email to assigned caregiver</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded bg-slate-950 border-slate-800 text-brand-500 focus:ring-0" />
              <span className="text-slate-200">Require mandatory doctor prescription warning for controlled drugs (Xanax, Morphine)</span>
            </label>
          </div>
        </div>

        {/* Security & Access */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Lock className="h-4 w-4 text-indigo-400" />
            <span>Role-Based Access & Security</span>
          </h2>

          <div className="space-y-3 text-xs">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded bg-slate-950 border-slate-800 text-brand-500 focus:ring-0" />
              <span className="text-slate-200">Strictly block non-admin roles from accessing `/admin/*` API endpoints</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded bg-slate-950 border-slate-800 text-brand-500 focus:ring-0" />
              <span className="text-slate-200">Log all administrative actions to AuditLog table</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all"
        >
          Save System Configuration
        </button>
      </form>
    </div>
  );
};

export default AdminSettings;
