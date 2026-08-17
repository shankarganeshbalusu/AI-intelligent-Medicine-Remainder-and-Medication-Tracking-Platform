import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Pill,
  Loader2,
  Activity
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { AdminReportsData } from '../../types';

export const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<AdminReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getReports();
      setReports(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate system analytics reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Generating PillSync Analytics & Reports...</p>
      </div>
    );
  }

  const roleTotal = reports?.role_distribution.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const medTotal = reports?.medication_status_distribution.reduce((acc, curr) => acc + curr.value, 0) || 1;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-indigo-400" />
            <span>Executive Analytics & Compliance Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated system metrics across user account roles, treatment completion outcomes, and dose adherence rates.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Adherence Highlight Gauge Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Activity className="h-4 w-4" />
            <span>Overall Medication Adherence Index</span>
          </div>
          <h2 className="text-3xl font-black text-white">
            {reports?.adherence_metrics.overall_adherence_percentage}% Patient Compliance Rate
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Calculated across {reports?.adherence_metrics.total_doses_logged} logged dose events.
            ({reports?.adherence_metrics.taken_doses} Doses Taken vs {reports?.adherence_metrics.missed_doses} Doses Missed)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center">
            <div className="h-28 w-28 rounded-full border-8 border-slate-800 border-t-emerald-400 border-r-emerald-400 flex items-center justify-center">
              <span className="text-2xl font-black text-emerald-400">
                {reports?.adherence_metrics.overall_adherence_percentage}%
              </span>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 mt-2">Compliance Rating</span>
        </div>
      </div>

      {/* 2 Visual Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Users className="h-5 w-5 text-brand-400" />
            <span>User Account Role Distribution</span>
          </h3>

          <div className="space-y-3 pt-2">
            {reports?.role_distribution.map((item, idx) => {
              const pct = Math.round((item.value / roleTotal) * 100);
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-300">
                    <span>{item.name}</span>
                    <span className="text-brand-400 font-bold">{item.value} ({pct}%)</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-950/80 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        idx === 0 ? 'bg-brand-500' : idx === 1 ? 'bg-indigo-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Medication Status Breakdown */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Pill className="h-5 w-5 text-purple-400" />
            <span>Medication Outcome Status Breakdown</span>
          </h3>

          <div className="space-y-3 pt-2">
            {reports?.medication_status_distribution.map((item, idx) => {
              const pct = Math.round((item.value / medTotal) * 100);
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-300">
                    <span>{item.name}</span>
                    <span className="text-purple-400 font-bold">{item.value} ({pct}%)</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-950/80 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
