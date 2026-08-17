import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Loader2
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { AdminRefillItem } from '../../types';

export const AdminRefillTracker: React.FC = () => {
  const [refills, setRefills] = useState<AdminRefillItem[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRefills = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getRefillTracker();
      setRefills(res.refills);
      setCriticalCount(res.critical_count);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch refill metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefills();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 text-rose-400" />
            <span>Refill Alert & Inventory Monitoring Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stock level tracking (&le; 2 days or &le; 2 pills threshold) and email alert dispatch audit.
          </p>
        </div>

        <button
          onClick={fetchRefills}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Stock Levels</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Metric Callout Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{criticalCount} Medicines Require Critical Refill</h2>
            <p className="text-xs text-slate-400">Automated Google SMTP email alerts trigger automatically when stock hits red threshold.</p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-3xl font-black text-rose-400">{criticalCount}</span>
          <p className="text-[10px] uppercase font-bold text-slate-500">Critical Red Zone</p>
        </div>
      </div>

      {/* Refill Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-rose-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading stock inventory...</p>
          </div>
        ) : refills.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            No active prescription refill records logged.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4">Medicine & Patient</th>
                  <th className="px-6 py-4">Current Stock</th>
                  <th className="px-6 py-4">Daily Dosage</th>
                  <th className="px-6 py-4">Days Remaining</th>
                  <th className="px-6 py-4">Refill Status</th>
                  <th className="px-6 py-4 text-right">Dispatch Email Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {refills.map((item, idx) => (
                  <tr key={idx} className={`hover:bg-slate-800/40 transition-colors ${item.is_critical ? 'bg-rose-500/5' : ''}`}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white text-xs">{item.medicine_name}</p>
                        <p className="text-[11px] text-slate-400">Patient: {item.patient_name}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-white">
                      {item.current_stock} Pills
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {item.times_per_day} dose(s)/day
                    </td>

                    <td className="px-6 py-4">
                      <span className={`font-black ${item.is_critical ? 'text-rose-400 text-sm' : 'text-slate-200'}`}>
                        {item.days_left} Days
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {item.is_critical ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Critical Refill Needed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Adequate Stock</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1 text-[11px] text-slate-400">
                        <Mail className="h-3.5 w-3.5 text-brand-400" />
                        <span>{item.notification_email || item.patient_email}</span>
                      </div>
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

export default AdminRefillTracker;
