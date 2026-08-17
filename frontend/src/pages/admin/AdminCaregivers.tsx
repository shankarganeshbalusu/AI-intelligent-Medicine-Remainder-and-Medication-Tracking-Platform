import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Search,
  Users,
  ShieldCheck,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { CaregiverListItem } from '../../types';

export const AdminCaregivers: React.FC = () => {
  const [caregivers, setCaregivers] = useState<CaregiverListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Caregiver Detail Modal
  const [selectedCaregiver, setSelectedCaregiver] = useState<any | null>(null);

  const fetchCaregivers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getCaregivers({
        search: search.trim() || undefined,
        page,
        limit
      });
      setCaregivers(res.caregivers);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch caregiver records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregivers();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCaregivers();
  };

  const handleOpenDetail = async (id: number) => {
    try {
      const data = await adminService.getCaregiverDetail(id);
      setSelectedCaregiver(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Stethoscope className="h-6 w-6 text-indigo-400" />
            <span>Caregiver Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Caregiver accounts directory, linked patient assignments, and monitoring metrics.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search caregiver name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </form>
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
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading caregiver records...</p>
          </div>
        ) : caregivers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            No caregiver accounts found matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4">Caregiver Profile</th>
                  <th className="px-6 py-4">Assigned Patients Count</th>
                  <th className="px-6 py-4">Monitored Patients</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registration Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {caregivers.map((cg) => (
                  <tr key={cg.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm">
                          {cg.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{cg.name}</p>
                          <p className="text-[11px] text-slate-400">{cg.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-bold">
                        <Users className="h-3 w-3" />
                        <span>{cg.assigned_patients_count} Patient(s)</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      {cg.assigned_patient_names.length === 0 ? (
                        <span className="text-slate-500 text-[11px]">No active links</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {cg.assigned_patient_names.map((pname, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                              {pname}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {cg.is_verified ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-400 text-[11px]">
                      {cg.created_at ? new Date(cg.created_at).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(cg.id)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-semibold transition-all"
                      >
                        Inspect Caregiver &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {caregivers.length} of {total} caregivers (Page {page} of {totalPages})</span>
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

      {/* Drawer */}
      {selectedCaregiver && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-lg">
                    {selectedCaregiver.name ? selectedCaregiver.name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">{selectedCaregiver.name}</h2>
                    <p className="text-xs text-slate-400">{selectedCaregiver.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCaregiver(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <Users className="h-4 w-4 text-indigo-400" />
                  <span>Assigned Patients ({selectedCaregiver.assigned_patients?.length || 0})</span>
                </h3>

                {selectedCaregiver.assigned_patients?.length === 0 ? (
                  <p className="text-xs text-slate-500">No patient assignments linked to this caregiver.</p>
                ) : (
                  selectedCaregiver.assigned_patients?.map((p: any) => (
                    <div key={p.link_id} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{p.patient_name}</p>
                        <p className="text-[10px] text-slate-400">{p.patient_email}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        {p.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedCaregiver(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Close Caregiver File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCaregivers;
