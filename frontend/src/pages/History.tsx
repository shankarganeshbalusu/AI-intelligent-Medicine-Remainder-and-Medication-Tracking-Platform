import { useState, useEffect } from 'react';
import { MedicationLog, Association } from '../types';
import { medicinesService } from '../services/medicines';
import { usersService } from '../services/users';
import { authService } from '../services/auth';
import {
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ListFilter,
  Users,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Award,
  Sun,
  Sunset,
  Moon,
  Sunrise
} from 'lucide-react';

export default function History() {
  const user = authService.getCurrentUser();
  const isPatient = user?.role === 'patient';

  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [patients, setPatients] = useState<Association[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isPatient) {
        let list = await medicinesService.getMedicationLogs();
        if (list && list.length > 0) {
          setLogs(list);
          localStorage.setItem('pillsync_cached_logs', JSON.stringify(list));
        } else {
          const cached = localStorage.getItem('pillsync_cached_logs');
          if (cached) {
            try { setLogs(JSON.parse(cached)); } catch (e) { setLogs(list || []); }
          } else {
            setLogs(list || []);
          }
        }
      } else {
        const associations = await usersService.getAssociations();
        const activeLinks = associations.filter(a => a.status === 'active');
        setPatients(activeLinks);
        
        if (activeLinks.length > 0) {
          setSelectedPatientId(activeLinks[0].patient_id);
          const list = await medicinesService.getMedicationLogs(activeLinks[0].patient_id);
          setLogs(list);
        }
      }
    } catch (err) {
      console.error('Failed to load logs', err);
      const cached = localStorage.getItem('pillsync_cached_logs');
      if (cached) {
        try { setLogs(JSON.parse(cached)); } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePatientChange = async (patientId: number) => {
    setSelectedPatientId(patientId);
    try {
      setLoading(true);
      const list = await medicinesService.getMedicationLogs(patientId);
      setLogs(list);
    } catch (err) {
      console.error('Failed to fetch patient history logs', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter out any orphaned or unknown logs
  const validLogs = logs.filter(l => l.medicine_name && l.medicine_name !== 'Unknown' && l.medicine_name !== 'Unassigned');

  // Analytics Calculations for Visual Summary Graphs
  const takenCount = validLogs.filter(l => l.status === 'taken').length;
  const missedCount = validLogs.filter(l => l.status === 'missed').length;
  const totalCount = validLogs.length;
  const complianceRate = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  // Medication Specific Adherence Breakdown
  const medBreakdown: Array<{ name: string; total: number; taken: number; rate: number }> = [];
  if (validLogs.length > 0) {
    const map = new Map<string, { total: number; taken: number }>();
    validLogs.forEach(l => {
      const name = l.medicine_name || '';
      if (!name) return;
      const curr = map.get(name) || { total: 0, taken: 0 };
      curr.total += 1;
      if (l.status === 'taken') curr.taken += 1;
      map.set(name, curr);
    });
    map.forEach((val, name) => {
      medBreakdown.push({
        name,
        total: val.total,
        taken: val.taken,
        rate: Math.round((val.taken / val.total) * 100)
      });
    });
  }

  // Time of Day Adherence Breakdown
  const timeOfDayStats = {
    Morning: { taken: 0, total: 0, icon: Sunrise, label: 'Morning (6am-12pm)' },
    Afternoon: { taken: 0, total: 0, icon: Sun, label: 'Afternoon (12pm-5pm)' },
    Evening: { taken: 0, total: 0, icon: Sunset, label: 'Evening (5pm-9pm)' },
    Night: { taken: 0, total: 0, icon: Moon, label: 'Night (9pm-6am)' }
  };

  if (logs.length > 0) {
    logs.forEach(l => {
      const t = l.dose_time || '';
      let hour = 9;
      const parts = t.split(':');
      if (parts.length >= 2) {
        let h = parseInt(parts[0], 10);
        if (t.toUpperCase().includes('PM') && h < 12) h += 12;
        if (t.toUpperCase().includes('AM') && h === 12) h = 0;
        if (!isNaN(h)) hour = h;
      }

      let slot: 'Morning' | 'Afternoon' | 'Evening' | 'Night' = 'Morning';
      if (hour >= 6 && hour < 12) slot = 'Morning';
      else if (hour >= 12 && hour < 17) slot = 'Afternoon';
      else if (hour >= 17 && hour < 21) slot = 'Evening';
      else slot = 'Night';

      timeOfDayStats[slot].total += 1;
      if (l.status === 'taken') timeOfDayStats[slot].taken += 1;
    });
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-page-3d">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-cyan-400" />
            Adherence History & Report Analysis
          </h2>
          <p className="text-slate-300 text-sm font-semibold mt-1">
            {isPatient
              ? 'Timeline and visual analytical summary graphs of your medication adherence.'
              : "Audit logs and analytical performance graphs showing patient compliance."}
          </p>
        </div>

        {/* Caregiver Patient Dropdown selection */}
        {!isPatient && patients.length > 0 && (
          <div className="flex items-center gap-2">
            <ListFilter className="h-4.5 w-4.5 text-cyan-400" />
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientChange(parseInt(e.target.value))}
              className="px-4 py-2 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              {patients.map(p => (
                <option key={p.id} value={p.patient_id} className="bg-slate-900 text-white font-semibold">
                  {p.patient_name} ({p.patient_email})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
          <p className="text-slate-300 text-sm mt-4 font-bold">Syncing adherence ledger & generating analytics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Metric Cards */}
          {logs.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-card rounded-2xl p-4 text-center border-cyan-500/20 bg-slate-900/80">
                <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider block">Compliance Rate</span>
                <span className="text-2xl font-black text-cyan-300 mt-1 block">
                  {complianceRate}%
                </span>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center border-cyan-500/20 bg-slate-900/80">
                <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider block">Taken Doses</span>
                <span className="text-2xl font-black text-green-300 mt-1 block">
                  {takenCount}
                </span>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center border-cyan-500/20 bg-slate-900/80">
                <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider block">Missed Doses</span>
                <span className="text-2xl font-black text-red-300 mt-1 block">
                  {missedCount}
                </span>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center border-cyan-500/20 bg-slate-900/80">
                <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider block">Total Logged</span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {totalCount}
                </span>
              </div>
            </div>
          )}

          {/* 📊 SUMMARY ANALYTICAL GRAPHS SECTION */}
          {logs.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-cyan-400" />
                  Visual Analytical Summary Graphs
                </h3>
                <span className="text-xs font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 rounded-full">
                  Real-time Data Synthesis
                </span>
              </div>

              {/* Grid Layout for Analytics Graphs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* GRAPH 1: Compliance Donut & Proportional Bar Graph */}
                <div className="glass-card rounded-3xl p-6 border-cyan-500/20 bg-slate-900/90 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                      <PieChart className="h-4 w-4 text-cyan-400" />
                      Overall Adherence Ratio
                    </h4>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      complianceRate >= 80
                        ? 'bg-green-500/20 text-green-300 border-green-500/40'
                        : complianceRate >= 50
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-red-500/20 text-red-300 border-red-500/40'
                    }`}>
                      {complianceRate >= 80 ? 'Optimal' : complianceRate >= 50 ? 'Moderate' : 'Critical'}
                    </span>
                  </div>

                  {/* SVG Donut Chart */}
                  <div className="flex items-center justify-center my-4 relative">
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="58"
                        stroke="rgba(15, 23, 42, 0.9)"
                        strokeWidth="14"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="58"
                        stroke="rgba(239, 68, 68, 0.6)"
                        strokeWidth="14"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="58"
                        stroke="#06b6d4"
                        strokeWidth="14"
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 - (364.4 * complianceRate) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-white">{complianceRate}%</span>
                      <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">Score</span>
                    </div>
                  </div>

                  {/* Proportional Ratio Bar */}
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-green-300 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        Taken ({takenCount})
                      </span>
                      <span className="text-red-300 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Missed ({missedCount})
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex border border-cyan-500/20">
                      <div
                        style={{ width: `${complianceRate}%` }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700"
                      />
                      <div
                        style={{ width: `${100 - complianceRate}%` }}
                        className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-700"
                      />
                    </div>
                  </div>
                </div>

                {/* GRAPH 2: Per-Medication Compliance Breakdown Chart */}
                <div className="glass-card rounded-3xl p-6 border-cyan-500/20 bg-slate-900/90 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                      <TrendingUp className="h-4 w-4 text-cyan-400" />
                      Medication Specific Breakdown
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {medBreakdown.length} Medications
                    </span>
                  </div>

                  <div className="space-y-3.5 my-auto overflow-y-auto max-h-[190px] pr-1">
                    {medBreakdown.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-white font-extrabold truncate max-w-[170px]">{item.name}</span>
                          <span className="text-cyan-300 font-mono font-black">
                            {item.taken}/{item.total} ({item.rate}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/20">
                          <div
                            style={{ width: `${item.rate}%` }}
                            className={`h-full rounded-full transition-all duration-700 ${
                              item.rate >= 80
                                ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                                : item.rate >= 50
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : 'bg-gradient-to-r from-red-500 to-rose-600'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-2 border-t border-cyan-500/20 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                    <span>Higher bars indicate optimal daily adherence.</span>
                    <Award className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                </div>

                {/* GRAPH 3: Time-of-Day Dose Distribution Chart (Full Width) */}
                <div className="md:col-span-2 glass-card rounded-3xl p-6 border-cyan-500/20 bg-slate-900/90 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      Time-of-Day Compliance Distribution
                    </h4>
                    <span className="text-[10px] text-cyan-300 font-bold bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 rounded-full">
                      Dose Slot Breakdown
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                    {(Object.keys(timeOfDayStats) as Array<keyof typeof timeOfDayStats>).map((slotKey) => {
                      const slot = timeOfDayStats[slotKey];
                      const Icon = slot.icon;
                      const slotRate = slot.total > 0 ? Math.round((slot.taken / slot.total) * 100) : 0;

                      return (
                        <div key={slotKey} className="bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-3.5 text-center flex flex-col justify-between gap-3">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                            <span className="flex items-center gap-1.5 text-white">
                              <Icon className="h-3.5 w-3.5 text-cyan-400" />
                              {slotKey}
                            </span>
                            <span className="text-[10px] text-cyan-300 font-mono">{slot.taken}/{slot.total}</span>
                          </div>

                          {/* Visual Vertical Progress Column */}
                          <div className="w-full h-16 bg-slate-800/80 rounded-xl overflow-hidden relative border border-cyan-500/20 flex items-end p-1">
                            <div
                              style={{ height: slot.total > 0 ? `${Math.max(slotRate, 12)}%` : '0%' }}
                              className={`w-full rounded-lg transition-all duration-700 ${
                                slotRate >= 80
                                  ? 'bg-gradient-to-t from-cyan-600 to-emerald-400'
                                  : slotRate >= 50
                                  ? 'bg-gradient-to-t from-amber-600 to-yellow-400'
                                  : slot.total > 0
                                  ? 'bg-gradient-to-t from-red-600 to-rose-400'
                                  : 'bg-slate-700'
                              }`}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-md pointer-events-none">
                              {slot.total > 0 ? `${slotRate}%` : 'No Doses'}
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 font-semibold">{slot.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Timeline Adherence Logs Header */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mt-6">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              Detailed Adherence Audit Logs
            </h3>
            <span className="text-xs font-bold text-slate-300">
              {logs.length} Entries Logged
            </span>
          </div>

          {!isPatient && patients.length === 0 ? (
            <div className="glass-card rounded-3xl py-16 px-6 text-center border border-cyan-500/20 bg-slate-900/90 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <Users className="h-10 w-10 text-cyan-400 mx-auto mb-3 animate-pulse" />
              <p className="text-base font-black text-white">No linked patients</p>
              <p className="text-xs font-semibold text-slate-300 mt-1">Accept patient invitations in the profile settings.</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="glass-card rounded-3xl py-16 px-6 text-center border border-cyan-500/20 bg-slate-900/90 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <Clock className="h-10 w-10 text-cyan-400 mx-auto mb-3 animate-pulse" />
              <p className="text-base font-black text-white">No logs found</p>
              <p className="text-xs font-semibold text-slate-300 mt-1">
                {isPatient
                  ? "You haven't checked off any scheduled doses yet."
                  : 'The patient has not logged any scheduled doses yet.'}
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-cyan-500/30 pl-6 ml-4 space-y-6">
              {logs.map((log) => {
                const isTaken = log.status === 'taken';
                const logDate = new Date(log.logged_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={log.id} className="relative group text-left">
                    {/* Timeline node point */}
                    <span className={`absolute -left-[31px] top-4 h-4 w-4 rounded-full border-2 border-slate-900 shadow-md transition-transform duration-300 group-hover:scale-125 ${
                      isTaken ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                    }`} />

                    {/* Elevated Glass Node Panel */}
                    <div className={`card-3d-premium rounded-2xl p-5 border-l-4 shadow-xl flex items-center justify-between gap-4 transition-all duration-300 bg-slate-900/85 backdrop-blur-xl ${
                      isTaken ? 'border-l-emerald-400 border-cyan-500/20' : 'border-l-red-500 border-cyan-500/20'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl border ${
                          isTaken
                            ? 'bg-green-500/20 border-green-500/40 text-green-300'
                            : 'bg-red-500/20 border-red-500/40 text-red-300'
                        }`}>
                          {isTaken ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-white tracking-tight">{log.medicine_name}</h4>
                          <p className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1.5 bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/40 shadow-xs">
                            <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                            <span>Dose time: <strong className="text-cyan-300 font-black">{log.dose_time}</strong></span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col items-end">
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider border shadow-xs ${
                          isTaken
                            ? 'bg-green-500/20 border-green-500/40 text-green-300'
                            : 'bg-red-500/20 border-red-500/40 text-red-300'
                        }`}>
                          {isTaken ? 'Taken' : 'Missed'}
                        </span>
                        <p className="text-xs font-black text-slate-200 mt-2 bg-slate-900/80 px-2.5 py-1 rounded-md border border-cyan-500/30">{logDate}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
