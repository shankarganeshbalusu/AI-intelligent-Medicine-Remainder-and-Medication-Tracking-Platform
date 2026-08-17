import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  Pill,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  TrendingUp,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { AdminStats, AdminActivityItem } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<AdminActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, actRes] = await Promise.all([
        adminService.getStats(),
        adminService.getActivityFeed({ page: 1, limit: 8 })
      ]);
      setStats(statsRes);
      setActivities(actRes.activities);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load administrative analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-brand-400 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Loading PillSync Administrative Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">System Status: Live & Secure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Administrative Control Center
          </h1>
          <p className="text-sm text-slate-400">
            Real-time compliance monitoring, user distribution, and medication audit analytics.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-md self-start md:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* 8 Metric Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl hover:border-slate-700/80 transition-all duration-300 group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total System Users</span>
            <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats?.total_users || 0}</span>
            <span className="text-[11px] font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
              Registered Accounts
            </span>
          </div>
        </div>

        {/* Total Patients */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl hover:border-slate-700/80 transition-all duration-300 group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Patients</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats?.total_patients || 0}</span>
            <NavLink to="/admin/patients" className="text-[11px] font-semibold text-cyan-400 hover:underline">
              View Directory &rarr;
            </NavLink>
          </div>
        </div>

        {/* Total Caregivers */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl hover:border-slate-700/80 transition-all duration-300 group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Caregivers</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats?.total_caregivers || 0}</span>
            <NavLink to="/admin/caregivers" className="text-[11px] font-semibold text-indigo-400 hover:underline">
              View Caregivers &rarr;
            </NavLink>
          </div>
        </div>

        {/* Total Medicines */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl hover:border-slate-700/80 transition-all duration-300 group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Prescriptions</span>
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
              <Pill className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats?.total_medicines || 0}</span>
            <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              Total Logged
            </span>
          </div>
        </div>

        {/* Active Medicines */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl hover:border-slate-700/80 transition-all duration-300 group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Regimens</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats?.active_medicines || 0}</span>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Ongoing Treatment
            </span>
          </div>
        </div>

        {/* Completed Treatments */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl hover:border-slate-700/80 transition-all duration-300 group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Courses</span>
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats?.completed_treatments || 0}</span>
            <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              Full Term Met
            </span>
          </div>
        </div>

        {/* Discontinued Medicines */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl hover:border-slate-700/80 transition-all duration-300 group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doctor Discontinued</span>
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats?.discontinued_medicines || 0}</span>
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Stopped Early
            </span>
          </div>
        </div>

        {/* Low Stock Medicines */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl hover:border-slate-700/80 transition-all duration-300 group shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Refills</span>
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-rose-400">{stats?.low_stock_medicines || 0}</span>
            <NavLink to="/admin/refill" className="text-[11px] font-semibold text-rose-400 hover:underline">
              Inspect Stock &rarr;
            </NavLink>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <NavLink
          to="/admin/patients"
          className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/50 transition-all duration-300 space-y-3 group backdrop-blur-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-brand-400 group-hover:translate-x-1 transition-transform">Manage Directory &rarr;</span>
          </div>
          <h3 className="text-lg font-bold text-white">Patient Record Directory</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Search patient accounts, review active medication regimens, adherence scores, and assigned caregiver links.
          </p>
        </NavLink>

        <NavLink
          to="/admin/refill"
          className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-rose-500/50 transition-all duration-300 space-y-3 group backdrop-blur-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-rose-400 group-hover:translate-x-1 transition-transform">Refill Center &rarr;</span>
          </div>
          <h3 className="text-lg font-bold text-white">Refill Alert Monitor</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Identify low inventory levels (&le; 2 days remaining) and verify automated email dispatch notifications.
          </p>
        </NavLink>

        <NavLink
          to="/admin/reports"
          className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 space-y-3 group backdrop-blur-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">Analytics &rarr;</span>
          </div>
          <h3 className="text-lg font-bold text-white">System Reports & Analytics</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Visualize user growth trends, treatment outcomes, missed dose rates, and caregiver distribution metrics.
          </p>
        </NavLink>
      </div>

      {/* Recent Medication Activity Feed */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Recent System Activity & Audit Trail</h2>
            <p className="text-xs text-slate-400">Live events across patient medication logs and administrative operations.</p>
          </div>
          <NavLink
            to="/admin/activity"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 hover:underline"
          >
            View Full Audit Log &rarr;
          </NavLink>
        </div>

        {activities.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-medium">
            No system activity logs recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {activities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-brand-400">
                    {act.user_name ? act.user_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">{act.action}</p>
                    <p className="text-[11px] text-slate-400">By {act.user_name} ({act.user_email || 'System'})</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
