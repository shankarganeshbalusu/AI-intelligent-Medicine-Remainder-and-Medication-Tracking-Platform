import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Loader2
} from 'lucide-react';
import { adminService } from '../../services/admin';
import { AdminMedicineItem } from '../../types';

export const AdminMedicalRecords: React.FC = () => {
  const [medicines, setMedicines] = useState<AdminMedicineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await adminService.getMedicines({ limit: 50 });
      setMedicines(res.medicines);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filtered = medicines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.patient_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="h-6 w-6 text-brand-400" />
            <span>Medical Record Audit Repository</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized health records, prescription archives, and adherence compliance records.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search patient medical records or drug names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
          />
        </div>
      </div>

      {/* Content */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl p-6">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-brand-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading audit repository...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            No matching medical records logged.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{item.name}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.status}
                  </span>
                </div>
                <p className="text-slate-400">Patient: <span className="text-slate-200 font-semibold">{item.patient_name}</span></p>
                <p className="text-slate-400">Dosage Strength: <span className="text-slate-200">{item.dosage}</span></p>
                <p className="text-slate-400">Times / Day: <span className="text-slate-200">{item.times_per_day}</span></p>
                {item.discontinue_reason && (
                  <p className="text-amber-400 text-[11px] italic">Audit Note: {item.discontinue_reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMedicalRecords;
