import { useState, useEffect } from 'react';
import { medicinesService } from '../services/medicines';
import { usersService } from '../services/users';
import { authService } from '../services/auth';
import { Medicine, User } from '../types';
import {
  FileText,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Award,
  Edit3,
  Trash2,
  Stethoscope,
  X,
  Save,
  AlertCircle
} from 'lucide-react';

export default function MedicalRecords() {
  const [profile, setProfile] = useState<User | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Correct Mistake Drawer state
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [editName, setEditName] = useState('');
  const [editGenericName, setEditGenericName] = useState('');
  const [editDosage, setEditDosage] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editDurationDays, setEditDurationDays] = useState('');
  const [editReason, setEditReason] = useState('Typo / Spelling Correction');
  const [actionLoading, setActionLoading] = useState(false);

  // Discontinue / Remove Modal state
  const [removingMed, setRemovingMed] = useState<Medicine | null>(null);
  const [discontinueReasonChoice, setDiscontinueReasonChoice] = useState('Doctor Order');

  const currentUser = authService.getCurrentUser();

  const loadData = async () => {
    try {
      setLoading(true);
      const me = await usersService.getMe();
      setProfile(me);

      let targetPatientId: number | undefined = undefined;
      if (me.role === 'caregiver') {
        const links = await usersService.getAssociations().catch(() => []);
        const activeLink = links.find(l => l.status === 'active');
        if (activeLink) {
          targetPatientId = activeLink.patient_id;
        }
      }

      const [medList, logList] = await Promise.all([
        medicinesService.getMedicines(targetPatientId, true),
        medicinesService.getMedicationLogs(targetPatientId)
      ]);
      setMedicines(medList);
      setLogs(logList);
    } catch (err) {
      console.error('Failed to load medical records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const startCorrection = (med: Medicine) => {
    setEditingMed(med);
    setEditName(med.name);
    setEditGenericName(med.generic_name || '');
    setEditDosage(med.dosage);
    setEditQuantity(med.quantity.toString());
    setEditDurationDays(med.duration_days.toString());
    setEditReason('Typo / Spelling Correction');
  };

  const handleSaveCorrection = async () => {
    if (!editingMed) return;
    try {
      setActionLoading(true);
      await medicinesService.updateMedicine(editingMed.id, {
        name: editName,
        generic_name: editGenericName,
        dosage: editDosage,
        quantity: parseInt(editQuantity) || editingMed.quantity,
        times_per_day: editingMed.times_per_day,
        duration_days: parseInt(editDurationDays) || editingMed.duration_days,
        custom_times: editingMed.custom_times,
        days_of_week: editingMed.days_of_week,
        food_relation: editingMed.food_relation,
        notifications_enabled: editingMed.notifications_enabled
      });
      setEditingMed(null);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save correction. Please check medicine name.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDiscontinue = async () => {
    if (!removingMed) return;
    try {
      setActionLoading(true);
      let formattedReason = "Discontinued per Doctor Order";
      if (discontinueReasonChoice === 'Treatment Completed') {
        formattedReason = "Completed Full Treatment Course";
      } else if (discontinueReasonChoice === 'Mistaken Entry') {
        formattedReason = "Mistaken Entry / Voided";
      }
      
      await medicinesService.deleteMedicine(removingMed.id, formattedReason);
      setRemovingMed(null);
      await loadData();
    } catch (err: any) {
      alert('Failed to update record status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
        <p className="text-slate-300 font-bold text-sm mt-4">Generating Official Patient Medical Records & Proof Log...</p>
      </div>
    );
  }

  const takenCount = logs.filter(l => l.status === 'taken').length;
  const missedCount = logs.filter(l => l.status === 'missed').length;
  const totalDoses = takenCount + missedCount;
  const adherenceRate = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 100;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-page-3d pb-12 select-none">
      {/* Header Bar */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-900 via-blue-900 to-slate-900 text-white rounded-3xl p-8 shadow-[0_0_40px_rgba(6,182,212,0.2)] border-2 border-cyan-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-widest bg-cyan-500/20 backdrop-blur-md border border-cyan-400/40 px-3.5 py-1 rounded-full text-cyan-200 shadow-sm flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan-400" /> Verified Health Records
            </span>
            <span className="text-xs font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-1 rounded-full text-emerald-300">
              Official Proof Log
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-3 text-white drop-shadow-md flex items-center gap-3">
            <FileText className="h-8 w-8 text-cyan-400" /> Patient Medical History & Treatment Proof
          </h2>
          <p className="text-cyan-100 text-sm mt-2 font-bold leading-relaxed max-w-2xl">
            Official verifiable record of all prescribed medications, doctor discontinuation logs, dosage history, and proof certificates.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 print:hidden">
          <button
            onClick={loadData}
            className="p-3.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-cyan-300 rounded-2xl border border-cyan-500/40 transition-all cursor-pointer shadow-lg backdrop-blur-md"
            title="Refresh History"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-white" />
            <span>Print Official History Proof</span>
          </button>
        </div>
      </div>

      {/* Patient Information Certificate Card */}
      <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl border-2 border-cyan-500/40 p-6 shadow-2xl text-white space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-cyan-500/20 pb-5 gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg border border-cyan-300/40">
              {profile?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">{profile?.name || currentUser?.name}</h3>
              <p className="text-xs text-cyan-300 font-bold">{profile?.email || currentUser?.email} &bull; Account Role: {profile?.role?.toUpperCase()}</p>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-cyan-500/30 text-right">
            <span className="block text-[11px] font-black text-cyan-400 uppercase tracking-widest">Medical Record ID</span>
            <span className="font-mono text-sm font-bold text-white">PX-MEDREC-{profile?.id || '001'}-2026</span>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-cyan-500/30">
            <span className="block text-xs font-black text-cyan-400 uppercase tracking-widest mb-1">Total Treatments</span>
            <span className="font-black text-white text-2xl">{medicines.length} Medications</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30">
            <span className="block text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Doses Taken</span>
            <span className="font-black text-emerald-300 text-2xl">{takenCount} Doses</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-rose-500/30">
            <span className="block text-xs font-black text-rose-400 uppercase tracking-widest mb-1">Doses Missed</span>
            <span className="font-black text-rose-300 text-2xl">{missedCount} Doses</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30">
            <span className="block text-xs font-black text-amber-400 uppercase tracking-widest mb-1">Adherence Rate</span>
            <span className="font-black text-amber-300 text-2xl">{adherenceRate}%</span>
          </div>
        </div>
      </div>

      {/* Complete Historical Medication Proof Table */}
      <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl border-2 border-cyan-500/40 p-6 shadow-2xl space-y-4 text-white">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2.5">
            <Award className="h-6 w-6 text-yellow-400" /> Prescribed Medication History & Proof Log
          </h3>
          <span className="text-xs text-cyan-300 font-bold bg-slate-950 px-3 py-1 rounded-full border border-cyan-500/30">
            {medicines.length} Historical Records Found
          </span>
        </div>

        {medicines.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/80 border-2 border-dashed border-cyan-500/30 rounded-2xl">
            <FileText className="h-10 w-10 text-cyan-400/60 mx-auto mb-3" />
            <p className="text-base font-black text-white">No medication history recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cyan-500/30 bg-slate-950/80 text-cyan-300 text-xs font-black uppercase tracking-wider">
                  <th className="p-3.5 rounded-l-xl">Medication & Generic</th>
                  <th className="p-3.5">Dosage</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Frequency</th>
                  <th className="p-3.5">Stock Left</th>
                  <th className="p-3.5">Proof Verification Status</th>
                  <th className="p-3.5 rounded-r-xl print:hidden text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/20 text-xs font-bold">
                {medicines.map((med) => {
                  const dailyDose = med.times_per_day > 0 ? med.times_per_day : 1;
                  const daysLeft = Math.floor(med.quantity / dailyDose);
                  const isArchived = med.is_archived;
                  const reason = med.discontinue_reason || '';

                  let statusText = 'Active Medical Record';
                  let statusBadgeClass = 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300';
                  let IconComponent = CheckCircle2;

                  if (reason.toLowerCase().includes('doctor')) {
                    statusText = 'Stopped per Doctor Advice';
                    statusBadgeClass = 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300';
                    IconComponent = Stethoscope;
                  } else if (reason.toLowerCase().includes('completed')) {
                    statusText = 'Treatment Course Completed';
                    statusBadgeClass = 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300';
                    IconComponent = Award;
                  } else if (reason.toLowerCase().includes('mistake') || reason.toLowerCase().includes('void')) {
                    statusText = 'Mistaken Entry (Voided)';
                    statusBadgeClass = 'bg-rose-950/80 border-rose-500/60 text-rose-300 line-through opacity-80';
                    IconComponent = AlertCircle;
                  } else if (isArchived) {
                    statusText = 'Discontinued / Archived Record';
                    statusBadgeClass = 'bg-slate-800 border-slate-600 text-slate-300';
                    IconComponent = FileText;
                  }

                  return (
                    <tr key={med.id} className="hover:bg-slate-800/60 transition-colors">
                      <td className="p-3.5">
                        <span className="block font-black text-sm text-white">{med.name}</span>
                        <span className="text-[11px] text-cyan-400">{med.generic_name || 'Standard Pharmaceutical'}</span>
                      </td>
                      <td className="p-3.5 text-slate-200 font-extrabold">{med.dosage}</td>
                      <td className="p-3.5 text-white font-black">{med.duration_days} Days</td>
                      <td className="p-3.5 text-slate-300">{med.times_per_day} Dose(s)/Day</td>
                      <td className="p-3.5 text-white font-black">{med.quantity} Pills ({daysLeft}d left)</td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm ${statusBadgeClass}`}>
                          <IconComponent className="h-3.5 w-3.5" />
                          {statusText}
                        </span>
                      </td>
                      <td className="p-3.5 print:hidden text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => startCorrection(med)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 rounded-xl border border-cyan-500/30 transition-all cursor-pointer"
                            title="Correct Record Mistake"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setRemovingMed(med)}
                            className="p-2 bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300 rounded-xl border border-rose-500/30 transition-all cursor-pointer"
                            title="Discontinue / Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-4 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>PillSync Digital Health Verification Stamp &bull; Certified System Log</span>
          </div>
          <span>Official Timestamp: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* MODAL 1: Correct Mistake / Edit Record Drawer */}
      {editingMed && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 max-w-lg w-full text-white space-y-5 shadow-2xl animate-page-3d relative">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-cyan-400" /> Correct Record Mistake
              </h3>
              <button
                onClick={() => setEditingMed(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-cyan-300 uppercase tracking-wider mb-1">Reason for Correction</label>
                <select
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-2.5 font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="Typo / Spelling Correction">Typo / Spelling Correction</option>
                  <option value="Adjusted Dosage per Doctor Order">Adjusted Dosage per Doctor Order</option>
                  <option value="Corrected Stock Quantity">Corrected Initial Stock Quantity</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-cyan-300 uppercase tracking-wider mb-1">Medicine Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-2.5 font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block font-black text-cyan-300 uppercase tracking-wider mb-1">Generic Chemical Formula</label>
                <input
                  type="text"
                  value={editGenericName}
                  onChange={(e) => setEditGenericName(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-2.5 font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-cyan-300 uppercase tracking-wider mb-1">Dosage</label>
                  <input
                    type="text"
                    value={editDosage}
                    onChange={(e) => setEditDosage(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-2.5 font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-black text-cyan-300 uppercase tracking-wider mb-1">Stock Pills</label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-2.5 font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-black text-cyan-300 uppercase tracking-wider mb-1">Duration Days</label>
                  <input
                    type="number"
                    value={editDurationDays}
                    onChange={(e) => setEditDurationDays(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-2.5 font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/20">
              <button
                onClick={() => setEditingMed(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCorrection}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Verified Correction</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Discontinue / Remove Medicine Modal */}
      {removingMed && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 max-w-md w-full text-white space-y-5 shadow-2xl animate-page-3d relative">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-cyan-400" /> Discontinue & Remove Record
              </h3>
              <button
                onClick={() => setRemovingMed(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              Please select the reason for discontinuing <strong className="text-white font-black">{removingMed.name}</strong>:
            </p>

            <div className="space-y-3">
              <label
                onClick={() => setDiscontinueReasonChoice('Doctor Order')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  discontinueReasonChoice === 'Doctor Order'
                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Stethoscope className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-black text-sm text-white">👨‍⚕️ Stopped per Doctor's Order</span>
                  <span className="text-[11px] font-semibold text-cyan-300">Doctor requested discontinuation. Cancels future reminders without score penalty.</span>
                </div>
              </label>

              <label
                onClick={() => setDiscontinueReasonChoice('Treatment Completed')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  discontinueReasonChoice === 'Treatment Completed'
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Award className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-black text-sm text-white">🎓 Completed Full Treatment Course</span>
                  <span className="text-[11px] font-semibold text-emerald-300">Finished prescribed duration. Marks treatment as completed.</span>
                </div>
              </label>

              <label
                onClick={() => setDiscontinueReasonChoice('Mistaken Entry')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  discontinueReasonChoice === 'Mistaken Entry'
                    ? 'bg-rose-950/90 border-rose-400 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-black text-sm text-white">🚫 Accidental Entry / Typo</span>
                  <span className="text-[11px] font-semibold text-rose-300">Added by mistake. Voids the entry from compliance graphs.</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-rose-500/20">
              <button
                onClick={() => setRemovingMed(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDiscontinue}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span>Confirm Removal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
