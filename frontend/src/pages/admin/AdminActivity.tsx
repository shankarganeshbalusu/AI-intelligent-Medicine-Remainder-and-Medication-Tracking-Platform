import React, { useState, useEffect } from 'react';
import {
  Activity,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { AdminActivityItem } from '../../types';

export const AdminActivity: React.FC = () => {
  const [activities, setActivities] = useState<AdminActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 15;

  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchActivity = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getActivityFeed({ page, limit });
      setActivities(res.activities);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch activity feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [page]);

  const filteredActivities = activities.filter((act) => {
    if (filterType === 'all') return true;
    return act.event_type === filterType;
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Activity className="h-6 w-6 text-brand-400" />
            <span>System Activity & Medication Audit Feed</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry of dose logs, reminder generation, prescription updates, and administrative events.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center space-x-2 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-400 font-semibold">Filter Event Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none font-medium"
          >
            <option value="all" className="bg-slate-900">All Events</option>
            <option value="dose" className="bg-slate-900">Patient Dose Logs</option>
            <option value="auth" className="bg-slate-900">Authentication & Security</option>
            <option value="user" className="bg-slate-900">User Profile Updates</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Activity Timeline List */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading live activity feed...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            No activity logs match the selected event filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((act) => {
              const isTaken = act.status === 'taken';
              const isMissed = act.status === 'missed';

              return (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`p-2.5 rounded-xl border ${
                      isTaken
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : isMissed
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                    }`}>
                      {isTaken ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isMissed ? (
                        <XCircle className="h-5 w-5" />
                      ) : (
                        <Activity className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">{act.action}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        User: <span className="text-slate-300 font-semibold">{act.user_name}</span> ({act.user_email || 'System'})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredActivities.length} of {total} activity logs (Page {page} of {totalPages})</span>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminActivity;
