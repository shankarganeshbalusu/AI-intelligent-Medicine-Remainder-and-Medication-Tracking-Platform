import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShieldCheck,
  Loader2,
  Users,
  Stethoscope
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { AdminNotificationItem } from '../../types';

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getNotificationsAudit();
      setNotifications(res.notifications);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch notification logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Bell className="h-6 w-6 text-brand-400" />
            <span>Notification Routing & Dispatch Audit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Verification of strict Patient vs Caregiver email routing rules and notification delivery states.
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
        >
          <Bell className="h-4 w-4" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Rules Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center space-x-3 text-xs">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white">Rule 1: Patient Direct Routing</h3>
            <p className="text-slate-400 text-[11px]">Dose reminders and personal schedules route exclusively to the patient's verified email address.</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center space-x-3 text-xs">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white">Rule 2: Caregiver Escalation Routing</h3>
            <p className="text-slate-400 text-[11px]">Emergency missed dose alerts route exclusively to the assigned active caregiver's email.</p>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading notification audit logs...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            No notification dispatch logs recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4">Recipient & Role</th>
                  <th className="px-6 py-4">Notification Type</th>
                  <th className="px-6 py-4">Medicine & Scheduled Time</th>
                  <th className="px-6 py-4">Enforced Routing Rule</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-lg font-bold flex items-center justify-center text-xs ${
                          n.recipient_role === 'patient'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {n.recipient_role === 'patient' ? 'P' : 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{n.recipient_name}</p>
                          <p className="text-[11px] text-slate-400">{n.recipient_email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {n.notification_type}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{n.medicine_name}</p>
                      <p className="text-[10px] text-slate-400">At {n.dose_time} on {n.scheduled_date}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-brand-300 border border-slate-700">
                        {n.routing_rule}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        <ShieldCheck className="h-3 w-3" />
                        <span className="capitalize">{n.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
