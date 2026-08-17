import { useState, useEffect } from 'react';
import { Medicine } from '../types';
import { medicinesService } from '../services/medicines';
import { authService } from '../services/auth';
import {
  RefreshCw,
  PackageCheck,
  AlertTriangle,
  Clock,
  Plus,
  Loader2,
  CheckCircle2,
  Mail,
  Pill,
  ShoppingBag,
  Edit3,
  Save,
  X,
  Trash2
} from 'lucide-react';

export default function RefillTracker() {
  const currentUser = authService.getCurrentUser();
  const isPatient = currentUser?.role === 'patient';

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refillingId, setRefillingId] = useState<number | null>(null);
  const [customDaysMap, setCustomDaysMap] = useState<{ [key: number]: number }>({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [sendingTestAlert, setSendingTestAlert] = useState<number | null>(null);

  // Edit stock / mistake correction states
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [editDurationDays, setEditDurationDays] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadRefillData = async () => {
    try {
      setLoading(true);
      const meds = await medicinesService.getMedicines();
      setMedicines(meds);
    } catch (err) {
      console.error('Failed to load medicines for refill tracker', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefillData();
  }, []);

  const handleRefill = async (medicineId: number, days: number = 30) => {
    setRefillingId(medicineId);
    setMessage({ text: '', type: '' });

    try {
      const updated = await medicinesService.refillMedicine(medicineId, days);
      setMedicines(prev => prev.map(m => m.id === medicineId ? updated : m));
      setMessage({
        text: `Successfully refilled ${updated.name} for +${days} days of supply (${updated.quantity} pills now in stock)!`,
        type: 'success'
      });
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || 'Failed to refill medicine.',
        type: 'error'
      });
    } finally {
      setRefillingId(null);
    }
  };

  const startEditing = (med: Medicine) => {
    setEditingMedId(med.id);
    setEditQuantity(med.quantity.toString());
    setEditDurationDays(med.duration_days.toString());
  };

  const handleSaveEditRefill = async (med: Medicine) => {
    setSavingEdit(true);
    setMessage({ text: '', type: '' });

    try {
      const updated = await medicinesService.updateMedicine(med.id, {
        name: med.name,
        dosage: med.dosage,
        quantity: parseInt(editQuantity) || med.quantity,
        times_per_day: med.times_per_day,
        duration_days: parseInt(editDurationDays) || med.duration_days,
        custom_times: med.custom_times || '',
        days_of_week: med.days_of_week || 'Daily',
        food_relation: med.food_relation || 'No Preference',
        notifications_enabled: med.notifications_enabled
      });

      setMedicines(prev => prev.map(m => m.id === med.id ? updated : m));
      setMessage({
        text: `Corrected stock & days for ${updated.name}! (${updated.quantity} pills / ${updated.duration_days} days).`,
        type: 'success'
      });
      setEditingMedId(null);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || 'Failed to update medicine stock.',
        type: 'error'
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleTestRefillEmail = async (med: Medicine) => {
    setSendingTestAlert(med.id);
    setMessage({ text: '', type: '' });

    try {
      await medicinesService.sendRefillEmail(med.id);
      setMessage({
        text: `Refill mail sent directly! ("This is a refill mail for your medicines. Do you want to continue or not like refill?") Check your inbox!`,
        type: 'success'
      });
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || 'Failed to send refill email notification.',
        type: 'error'
      });
    } finally {
      setSendingTestAlert(null);
    }
  };

  const handleDeleteMedicine = async (medicineId: number, medName: string) => {
    if (!window.confirm(`Are you sure you want to discontinue and remove ${medName} from your inventory after finishing your current tablets?`)) {
      return;
    }
    try {
      await medicinesService.deleteMedicine(medicineId);
      setMedicines(prev => prev.filter(m => m.id !== medicineId));
      setMessage({
        text: `Successfully discontinued and removed ${medName} from your cabinet!`,
        type: 'success'
      });
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || 'Failed to remove medicine.',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
        <p className="text-slate-300 font-bold text-sm mt-4">Loading PillSync Refill Tracker & Stock Inventory...</p>
      </div>
    );
  }

  const criticalItems = medicines.filter(m => {
    const dailyDose = m.times_per_day > 0 ? m.times_per_day : 1;
    const daysLeft = Math.floor(m.quantity / dailyDose);
    return daysLeft <= 2;
  });

  const lowItems = medicines.filter(m => {
    const dailyDose = m.times_per_day > 0 ? m.times_per_day : 1;
    const daysLeft = Math.floor(m.quantity / dailyDose);
    return daysLeft > 2 && daysLeft <= 5;
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-page-3d">
      {/* Refill Hero Banner - Vibrant Cyber Glass Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-3xl p-8 shadow-[0_0_40px_rgba(245,158,11,0.25)] border border-amber-400/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-yellow-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-orange-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-widest bg-white/20 backdrop-blur-md border border-white/40 px-3.5 py-1 rounded-full text-yellow-100 shadow-sm flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-yellow-300" /> Pharmacy Stock Engine
            </span>
            <span className="text-xs font-black uppercase tracking-wider bg-yellow-400/30 border border-yellow-300/50 px-3.5 py-1 rounded-full text-white">
              2-Day Refill Alerts
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-3 text-white drop-shadow-md">
            Medicine Refill & Supply Tracker
          </h2>
          <p className="text-amber-100 text-sm mt-2 font-bold leading-relaxed">
            Monitor total treatment days, track remaining pill quantities, edit refill mistakes, and receive automated reminders when your supply drops to 2 days or fewer.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            onClick={loadRefillData}
            className="p-3.5 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white rounded-2xl border border-white/30 transition-all cursor-pointer shadow-lg backdrop-blur-md"
            title="Refresh Inventory"
          >
            <RefreshCw className="h-5 w-5 animate-spin-slow" />
          </button>
        </div>
      </div>

      {/* Alert Banner Message */}
      {message.text && (
        <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 shadow-lg backdrop-blur-md ${
          message.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200' : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Critical Refill Warning Banner */}
      {criticalItems.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-rose-950/90 via-red-900/90 to-orange-950/90 border-2 border-rose-500/70 backdrop-blur-xl rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse-slow">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-inner mt-0.5">
              <AlertTriangle className="h-6 w-6 shrink-0" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-rose-200 bg-rose-900/80 px-3 py-1 rounded-full border border-rose-500/50">
                Action Required — Supply Exhaustion Imminent
              </span>
              <h5 className="font-black text-lg text-white mt-1.5">
                {criticalItems.length} Medication(s) Have 2 or Fewer Days of Stock Left!
              </h5>
              <p className="text-xs text-rose-200 font-bold mt-0.5">
                {criticalItems.map(m => m.name).join(', ')} — Refill now or discontinue after completing tablets.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Overview — Colorful Glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-cyan-950/80 via-slate-900/90 to-slate-950/90 rounded-2xl border-2 border-cyan-500/40 p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">Total Medications</span>
            <Pill className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white mt-2 drop-shadow-md">{medicines.length}</p>
          <span className="text-xs text-slate-400 font-bold">Active in cabinet</span>
        </div>

        <div className="bg-gradient-to-br from-amber-950/80 via-slate-900/90 to-slate-950/90 rounded-2xl border-2 border-amber-500/40 p-5 shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Low Stock (3-5 Days)</span>
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-300 mt-2 drop-shadow-md">{lowItems.length}</p>
          <span className="text-xs text-amber-400 font-bold">Stock notice period</span>
        </div>

        <div className="bg-gradient-to-br from-rose-950/80 via-slate-900/90 to-slate-950/90 rounded-2xl border-2 border-rose-500/40 p-5 shadow-[0_0_20px_rgba(244,63,94,0.15)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-400 uppercase tracking-widest">Critical Refill (&le;2 Days)</span>
            <AlertTriangle className="h-5 w-5 text-rose-400 animate-pulse" />
          </div>
          <p className="text-3xl font-black text-rose-300 mt-2 drop-shadow-md">{criticalItems.length}</p>
          <span className="text-xs text-rose-400 font-extrabold">Automated alerts active</span>
        </div>
      </div>

      {/* Medication Refill Inventory Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-md">
          <PackageCheck className="h-6 w-6 text-amber-400" />
          Medication Refill Inventory & Days Tracker
        </h3>

        {medicines.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/80 backdrop-blur-xl border-2 border-dashed border-cyan-500/30 rounded-3xl">
            <Pill className="h-10 w-10 text-cyan-400/60 mx-auto mb-3" />
            <p className="text-base font-black text-white">No medicines registered in your inventory yet</p>
            <p className="text-xs text-slate-400 font-bold mt-1">Add medications on the Cabinet page to start stock tracking.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {medicines.map((med) => {
              const dailyDose = med.times_per_day > 0 ? med.times_per_day : 1;
              const daysLeft = Math.floor(med.quantity / dailyDose);
              const isCritical = daysLeft <= 2;
              const isLow = daysLeft > 2 && daysLeft <= 5;
              const maxTargetDays = med.duration_days > 0 ? med.duration_days : 30;
              const stockPercent = Math.min(100, Math.max(0, Math.round((daysLeft / maxTargetDays) * 100)));
              const isEditingThis = editingMedId === med.id;
              const customDays = customDaysMap[med.id] || 30;

              return (
                <div
                  key={med.id}
                  className={`bg-slate-900/90 backdrop-blur-2xl rounded-3xl border-2 p-6 transition-all shadow-2xl ${
                    isCritical
                      ? 'border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.25)] bg-gradient-to-r from-slate-900/95 via-rose-950/30 to-slate-900/95'
                      : isLow
                      ? 'border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.2)] bg-gradient-to-r from-slate-900/95 via-amber-950/20 to-slate-900/95'
                      : 'border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Info */}
                    <div className="space-y-4 flex-grow">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-2xl font-black text-white drop-shadow-sm">{med.name}</h4>
                        <span className="text-xs px-3 py-1 rounded-full font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                          {med.dosage}
                        </span>
                        
                        <span className={`text-xs px-3.5 py-1 rounded-full font-black uppercase tracking-wider border shadow-md ${
                          isCritical
                            ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                            : isLow
                            ? 'bg-amber-500 text-slate-950 border-amber-300 font-extrabold'
                            : 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50'
                        }`}>
                          {isCritical ? '⚠️ Refill Urgently (<=2 Days)' : isLow ? 'Low Stock Notice' : 'Sufficient Supply'}
                        </span>
                      </div>

                      {/* Colorful High-Contrast Dark Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/80 p-4.5 rounded-2xl border border-cyan-500/30 shadow-inner">
                        <div>
                          <span className="block text-xs font-black text-cyan-400 uppercase tracking-widest mb-1">Treatment Duration</span>
                          <span className="font-black text-white text-base sm:text-lg">{med.duration_days} Days</span>
                        </div>
                        <div>
                          <span className="block text-xs font-black text-cyan-400 uppercase tracking-widest mb-1">Daily Frequency</span>
                          <span className="font-black text-white text-base sm:text-lg">{med.times_per_day} Dose(s) / Day</span>
                        </div>
                        <div>
                          <span className="block text-xs font-black text-cyan-400 uppercase tracking-widest mb-1">Units in Stock</span>
                          <span className="font-black text-white text-base sm:text-lg">{med.quantity} Pills</span>
                        </div>
                        <div>
                          <span className="block text-xs font-black text-cyan-400 uppercase tracking-widest mb-1">Days Remaining</span>
                          <span className={`inline-block font-black text-base px-3.5 py-1 rounded-xl border shadow-md ${
                            isCritical
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                              : isLow
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                              : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                          }`}>
                            {daysLeft} Day(s) Left
                          </span>
                        </div>
                      </div>

                      {/* Visual Stock Meter Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-300">
                          <span>Stock Level Progress</span>
                          <span className="text-cyan-300">{daysLeft} / {maxTargetDays} Days ({stockPercent}%)</span>
                        </div>
                        <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-cyan-500/30 p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritical ? 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.8)]' : isLow ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.8)]' : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                            }`}
                            style={{ width: `${Math.max(5, stockPercent)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions & Refill Edit Buttons */}
                    <div className="flex flex-col gap-2.5 shrink-0 sm:min-w-[240px]">
                      {isPatient && (
                        <>
                          <button
                            disabled={refillingId === med.id}
                            onClick={() => handleRefill(med.id, 30)}
                            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {refillingId === med.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                              <RefreshCw className="h-4 w-4 text-white" />
                            )}
                            <span>⚡ Quick Refill (+30 Days)</span>
                          </button>

                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={customDays}
                              onChange={(e) => setCustomDaysMap({ ...customDaysMap, [med.id]: parseInt(e.target.value) || 1 })}
                              className="w-20 px-2.5 py-2 border-2 border-cyan-500/40 rounded-xl text-xs font-black text-center bg-slate-950 text-cyan-200 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                            />
                            <button
                              disabled={refillingId === med.id}
                              onClick={() => handleRefill(med.id, customDays)}
                              className="flex-grow py-2 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 border-2 border-cyan-500/40 text-cyan-300 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                            >
                              <Plus className="h-3.5 w-3.5 text-cyan-400" />
                              <span>Refill Custom Days</span>
                            </button>
                          </div>

                          {/* EDIT / CORRECT MISTAKE BUTTON */}
                          <button
                            onClick={() => isEditingThis ? setEditingMedId(null) : startEditing(med)}
                            className="w-full py-2.5 px-3 border-2 border-cyan-400/50 bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-200 font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)] active:scale-95"
                          >
                            <Edit3 className="h-4 w-4 text-cyan-400" />
                            <span>{isEditingThis ? 'Close Edit Form' : '✏️ Edit / Correct Refill Mistake'}</span>
                          </button>
                        </>
                      )}

                      {isCritical ? (
                        <div className="space-y-1.5">
                          <span className="block text-[11px] text-center font-black uppercase tracking-wider text-rose-300 bg-rose-950/90 border border-rose-500/60 px-2 py-1 rounded-xl shadow-md">
                            ⚡ Refill Mail Dispatched Automatically
                          </span>
                          <button
                            disabled={sendingTestAlert === med.id}
                            onClick={() => handleTestRefillEmail(med)}
                            className="w-full py-2.5 px-3 border-2 border-rose-400/50 bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(244,63,94,0.3)] active:scale-95"
                          >
                            {sendingTestAlert === med.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" /> : <Mail className="h-3.5 w-3.5 text-rose-400" />}
                            <span>📧 Re-send Direct Refill Mail</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={sendingTestAlert === med.id}
                          onClick={() => handleTestRefillEmail(med)}
                          className="w-full py-2.5 px-3 border-2 border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/30 text-amber-200 font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
                        >
                          {sendingTestAlert === med.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" /> : <Mail className="h-3.5 w-3.5 text-amber-400" />}
                          <span>📧 Send Refill Alert Email Manually</span>
                        </button>
                      )}

                      {isPatient && (
                        <button
                          onClick={() => handleDeleteMedicine(med.id, med.name)}
                          className="w-full py-2 px-3 border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                          <span>Discontinue & Remove Medicine</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* INLINE EDIT FORM FOR CORRECTING REFILL MISTAKES */}
                  {isEditingThis && (
                    <div className="mt-5 p-5 bg-slate-950/90 border-2 border-cyan-400/60 rounded-2xl space-y-4 animate-fade-in shadow-2xl">
                      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                        <h5 className="font-black text-sm text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                          <Edit3 className="h-4 w-4 text-cyan-400" /> Correct Stock Quantity & Treatment Days for {med.name}
                        </h5>
                        <button
                          onClick={() => setEditingMedId(null)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-cyan-400 uppercase tracking-wider mb-1.5">Set Total Stock Quantity (Pills)</label>
                          <input
                            type="number"
                            min="1"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-full px-3.5 py-2.5 border-2 border-cyan-500/40 rounded-xl text-sm font-black text-white bg-slate-900 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-cyan-400 uppercase tracking-wider mb-1.5">Set Treatment Duration (Days)</label>
                          <input
                            type="number"
                            min="1"
                            value={editDurationDays}
                            onChange={(e) => setEditDurationDays(e.target.value)}
                            className="w-full px-3.5 py-2.5 border-2 border-cyan-500/40 rounded-xl text-sm font-black text-white bg-slate-900 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2.5 pt-2">
                        <button
                          onClick={() => setEditingMedId(null)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={savingEdit}
                          onClick={() => handleSaveEditRefill(med)}
                          className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {savingEdit ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4 text-white" />}
                          <span>Save Corrected Stock</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
