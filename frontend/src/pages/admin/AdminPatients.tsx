import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Users,
  ShieldCheck,
  Stethoscope,
  Pill,
  Clock,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { PatientListItem, PatientDetail } from '../../types';

export const AdminPatients: React.FC = () => {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Patient detail drawer
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getPatients({
        search: search.trim() || undefined,
        status_filter: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit
      });
      setPatients(res.patients);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  const handleOpenDetail = async (patientId: number) => {
    setSelectedPatientId(patientId);
    setDetailLoading(true);
    try {
      const data = await adminService.getPatientDetail(patientId);
      setDetail(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Users className="h-6 w-6 text-brand-400" />
            <span>Patient Record Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Directory of registered patient accounts, active medicine counts, assigned caregivers, and compliance states.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search patient name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
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
              <option value="all" className="bg-slate-900">All Account Statuses</option>
              <option value="verified" className="bg-slate-900">Verified Patients Only</option>
              <option value="unverified" className="bg-slate-900">Unverified Patients</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Patient Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
            <p className="text-xs text-slate-400">Fetching patient directory...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            No patient records match your current filter query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4">Patient Profile</th>
                  <th className="px-6 py-4">Assigned Caregiver</th>
                  <th className="px-6 py-4 text-center">Active Regimens</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">Registration Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold flex items-center justify-center text-sm">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{patient.name}</p>
                          <p className="text-[11px] text-slate-400">{patient.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {patient.assigned_caregiver ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-semibold">
                          <Stethoscope className="h-3 w-3" />
                          <span>{patient.assigned_caregiver}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Unassigned</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                        <Pill className="h-3 w-3" />
                        <span>{patient.medicine_count} Active</span>
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {patient.is_verified ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-400 text-[11px]">
                      {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(patient.id)}
                        className="px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[11px] font-semibold transition-all"
                      >
                        Inspect Record &rarr;
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
          <span>
            Showing {patients.length} of {total} patients (Page {page} of {totalPages})
          </span>
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

      {/* Patient Detail Drawer / Slide-Over Modal */}
      {selectedPatientId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-500/20 text-brand-400 font-bold flex items-center justify-center text-lg">
                    {detail?.name ? detail.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">{detail?.name || 'Patient Record'}</h2>
                    <p className="text-xs text-slate-400">{detail?.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => { setSelectedPatientId(null); setDetail(null); }}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {detailLoading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
                  <p className="text-xs text-slate-400">Loading patient medical records...</p>
                </div>
              ) : detail ? (
                <div className="mt-6 space-y-6">
                  {/* Quick Metric Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Adherence Score</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">{detail.adherence_score}%</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{detail.total_logged_doses} Doses Logged</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Active Prescriptions</p>
                      <p className="text-2xl font-black text-brand-400 mt-1">{detail.active_medicines.length}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{detail.archived_medicines.length} Archived / Completed</p>
                    </div>
                  </div>

                  {/* Caregiver Link */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                      <Stethoscope className="h-4 w-4 text-indigo-400" />
                      <span>Monitored Caregiver Link</span>
                    </h3>
                    {detail.caregivers.length === 0 ? (
                      <p className="text-xs text-slate-500">No active caregiver assigned to this patient.</p>
                    ) : (
                      detail.caregivers.map((cg) => (
                        <div key={cg.link_id} className="flex items-center justify-between text-xs py-1">
                          <span className="font-semibold text-white">{cg.caregiver_name} ({cg.caregiver_email})</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                            {cg.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Active Medicines List */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                      <Pill className="h-4 w-4 text-emerald-400" />
                      <span>Active Medications</span>
                    </h3>
                    {detail.active_medicines.length === 0 ? (
                      <p className="text-xs text-slate-500">No active medications registered.</p>
                    ) : (
                      detail.active_medicines.map((m) => (
                        <div key={m.id} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-white">{m.name} <span className="text-slate-400 font-normal">({m.dosage})</span></p>
                            <p className="text-[10px] text-slate-400">{m.times_per_day} dose(s) per day &bull; Stock: {m.quantity} pills remaining</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            Active
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Medication History & Discontinued */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <span>Medication History & Doctor Actions</span>
                    </h3>
                    {detail.archived_medicines.length === 0 ? (
                      <p className="text-xs text-slate-500">No archived medication records.</p>
                    ) : (
                      detail.archived_medicines.map((m) => (
                        <div key={m.id} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-300">{m.name} ({m.dosage})</p>
                            <p className="text-[10px] text-amber-400">Reason: {m.discontinue_reason || 'Archived'}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            Archived
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => { setSelectedPatientId(null); setDetail(null); }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Close Patient File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPatients;
