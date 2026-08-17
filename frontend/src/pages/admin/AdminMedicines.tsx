import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Stethoscope
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { AdminMedicineItem } from '../../types';

export const AdminMedicines: React.FC = () => {
  const [medicines, setMedicines] = useState<AdminMedicineItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // active, completed, discontinued, low_stock, all
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMedicines = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getMedicines({
        search: search.trim() || undefined,
        status_filter: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit
      });
      setMedicines(res.medicines);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch medicine repository.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMedicines();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Pill className="h-6 w-6 text-purple-400" />
            <span>Medication Inventory & Status Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global repository of patient medicines, dosage timings, adherence states, and doctor discontinuance audit records.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search medicine or patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none font-medium"
            >
              <option value="all" className="bg-slate-900">All Medication Statuses</option>
              <option value="active" className="bg-slate-900">Active Regimens</option>
              <option value="completed" className="bg-slate-900">Completed Treatments</option>
              <option value="discontinued" className="bg-slate-900">Stopped per Doctor Advice</option>
              <option value="low_stock" className="bg-slate-900">Low Stock (&le; 2 Days Left)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading medication inventory...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            No medicine records found matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4">Medicine & Dosage</th>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Schedule & Frequency</th>
                  <th className="px-6 py-4">Stock Level</th>
                  <th className="px-6 py-4">Status & Doctor Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {medicines.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-sm">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{med.name}</p>
                          <p className="text-[11px] text-slate-400">{med.dosage} &bull; {med.food_relation || 'As prescribed'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {med.patient_name}
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      <p>{med.times_per_day} dose(s) per day</p>
                      {med.custom_times && <p className="text-[10px] text-slate-400">Timings: {med.custom_times}</p>}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        med.is_low_stock
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        <span>{med.quantity} Pills ({med.days_left}d left)</span>
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {med.status === 'Active' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Active Regimen</span>
                        </span>
                      )}
                      {med.status === 'Low Stock' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Low Stock Alert</span>
                        </span>
                      )}
                      {med.status === 'Completed Treatment' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Completed Course</span>
                        </span>
                      )}
                      {med.is_archived && med.status !== 'Completed Treatment' && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                            <Stethoscope className="h-3 w-3" />
                            <span>Stopped per Doctor Advice</span>
                          </span>
                          <p className="text-[10px] text-slate-400 italic">{med.discontinue_reason}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {medicines.length} of {total} medicines (Page {page} of {totalPages})</span>
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

export default AdminMedicines;
