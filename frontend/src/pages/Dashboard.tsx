import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Association, Medicine, Reminder, MedicationLog, EmergencyInfo } from '../types';
import { usersService } from '../services/users';
import { medicinesService } from '../services/medicines';
import { authService } from '../services/auth';
import { MedicalEmergencyInfoCard } from '../components/MedicalEmergencyInfoCard';
import { EditEmergencyInfoModal } from '../components/EditEmergencyInfoModal';
import {
  Activity,
  Pill,
  Clock,
  Loader2,
  FileText,
  Check,
  X,
  ListFilter,
  Plus,
  AlertCircle
} from 'lucide-react';

const formatTimeToShow = (timeStr: string) => {
  if (!timeStr) return '';
  if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
    return timeStr;
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${m} ${ampm}`;
};

export default function Dashboard() {
  const currentUser = authService.getCurrentUser();
  const isPatient = currentUser?.role === 'patient';

  const [profile, setProfile] = useState<User | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [allLinks, setAllLinks] = useState<Association[]>([]);
  const [patients, setPatients] = useState<Association[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  
  // Emergency Info State
  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyInfo | null>(null);
  const [showEditEmergencyModal, setShowEditEmergencyModal] = useState(false);

  // Stats & Schedule data
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [warnings, setWarnings] = useState<Array<{ medication: string; severity: string; warning: string }>>([]);
  
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [complianceScore, setComplianceScore] = useState(100);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const calculateCompliance = (historyLogs: MedicationLog[]) => {
    if (historyLogs.length === 0) {
      setComplianceScore(100);
      return;
    }
    const taken = historyLogs.filter(l => l.status === 'taken').length;
    const total = historyLogs.length;
    setComplianceScore(Math.round((taken / total) * 100));
  };

  const fetchPatientData = async (uid: number) => {
    try {
      const [activeMeds, todayRems, historyLogs, interactionData, emgData] = await Promise.all([
        medicinesService.getMedicines(uid).catch(() => []),
        medicinesService.getTodayReminders(uid).catch(() => []),
        medicinesService.getMedicationLogs(uid).catch(() => []),
        isPatient ? medicinesService.checkDrugInteractions().catch(() => ({ warnings: [] })) : Promise.resolve({ warnings: [] }),
        isPatient ? usersService.getEmergencyInfo().catch(() => null) : usersService.getPatientEmergencyInfo(uid).catch(() => null)
      ]);

      setMedicines(activeMeds);
      setReminders(todayRems);
      setLogs(historyLogs);
      calculateCompliance(historyLogs);
      setWarnings(interactionData.warnings || []);
      setEmergencyInfo(emgData);
    } catch (err) {
      console.error('Failed to fetch patient data', err);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [userProfile, links] = await Promise.all([
        usersService.getMe(),
        usersService.getAssociations().catch(() => [])
      ]);
      
      setProfile(userProfile);
      setAllLinks(links);
      const activeLinks = links.filter(l => l.status === 'active');
      setAssociations(activeLinks);

      if (isPatient) {
        await fetchPatientData(userProfile.id);
      } else {
        setPatients(activeLinks);
        if (activeLinks.length > 0) {
          setSelectedPatientId(activeLinks[0].patient_id);
          await fetchPatientData(activeLinks[0].patient_id);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToAssociation = async (id: number, decision: 'active' | 'rejected') => {
    try {
      await usersService.respondToAssociation(id, decision);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to respond to association link', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handlePatientSelect = async (patientId: number) => {
    setSelectedPatientId(patientId);
    setLoading(true);
    await fetchPatientData(patientId);
    setLoading(false);
  };

  const handleActionDose = async (reminderId: number, outcome: 'taken' | 'missed') => {
    setActioningId(reminderId);
    try {
      await medicinesService.updateReminderStatus(reminderId, outcome);
      
      // Refresh patient data
      const targetId = isPatient ? profile?.id : (selectedPatientId as number);
      if (targetId) {
        await fetchPatientData(targetId);
      }
    } catch (err) {
      console.error('Failed to log reminder outcome', err);
    } finally {
      setActioningId(null);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
        <p className="text-slate-400 text-sm mt-4">Loading your PillSync dashboard...</p>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-page-3d">
      {/* Hero Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-3xl p-8 shadow-2xl shadow-blue-900/20 border border-blue-400/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Ambient Light Glows */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-cyan-200 shadow-sm">
              Welcome Back
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-400/20 border border-cyan-300/30 px-3 py-1 rounded-full text-cyan-100 capitalize">
              {profile?.role || 'Patient'} Mode
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-3 text-white">
            {profile?.name || 'Patient'}
          </h2>
          <p className="text-blue-100/80 text-xs sm:text-sm mt-1.5 font-medium flex items-center gap-2">
            <span>{todayStr}</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-cyan-200">Active Adherence Monitoring</span>
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {!isPatient && patients.length > 0 && (
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 shadow-inner">
              <ListFilter className="h-4 w-4 text-cyan-200" />
              <select
                value={selectedPatientId}
                onChange={(e) => handlePatientSelect(parseInt(e.target.value))}
                className="bg-transparent text-xs font-bold text-white focus:outline-none border-none cursor-pointer"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.patient_id} className="text-slate-800 font-semibold">
                    {p.patient_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3D Floating Medicine Bottle Graphic */}
          <div className="relative w-24 h-24 hidden sm:flex items-center justify-center shrink-0" style={{ perspective: '500px' }}>
            <div className="absolute w-20 h-20 bg-cyan-400/10 rounded-full blur-xl animate-pulse" />
            <div className="relative transform hover:rotate-6 transition-transform duration-500 animate-float-slow">
              <svg width="45" height="75" viewBox="0 0 90 150" fill="none" className="filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
                <rect x="25" y="5" width="40" height="15" rx="4" fill="#ffffff" opacity="0.9" />
                <rect x="33" y="20" width="24" height="12" fill="rgba(255,255,255,0.4)" />
                <rect x="15" y="32" width="60" height="110" rx="18" fill="url(#hero-glass)" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
                <rect x="25" y="65" width="40" height="40" rx="8" fill="white" />
                <path d="M 45,75 L 45,95 M 35,85 L 55,85" stroke="#1677ff" strokeWidth="6" strokeLinecap="round" />
                <defs>
                  <linearGradient id="hero-glass" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                    <stop offset="100%" stopColor="rgba(22,199,232,0.3)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {/* Floating mini capsule */}
            <div className="absolute -top-1 -right-1 w-7 h-3 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400 border border-white/60 shadow-md animate-float-delayed rotate-45" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm mt-4">Syncing dashboard information...</p>
        </div>
      ) : (
        <>
          {/* Pending Caregiver Connection Request Banners (Patient Account Only) */}
          {isPatient && allLinks.filter(l => l.status === 'pending' && l.patient_id === profile?.id).map((pendingLink) => {
            const isPatientRole = profile?.role === 'patient';
            const inviterName = isPatientRole ? pendingLink.caregiver_name : pendingLink.patient_name;
            const inviterEmail = isPatientRole ? pendingLink.caregiver_email : pendingLink.patient_email;
            const inviterRole = isPatientRole ? 'Caregiver' : 'Patient';

            return (
              <div key={pendingLink.id} className="p-5 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-yellow-500/15 border-2 border-amber-500/30 backdrop-blur-md rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-slate-800 shadow-md my-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-inner">
                    <AlertCircle className="h-6 w-6 shrink-0" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Pending Connection Request
                    </span>
                    <h5 className="font-black text-base text-slate-900 mt-1">
                      {inviterRole} Connection Request from {inviterName}
                    </h5>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">
                      {inviterName} ({inviterEmail}) has requested to connect with your PillSync account.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleRespondToAssociation(pendingLink.id, 'active')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Accept Connection</span>
                  </button>
                  <button
                    onClick={() => handleRespondToAssociation(pendingLink.id, 'rejected')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Drug Interaction Warning Banners */}
          {isPatient && warnings.length > 0 && (
            <div className="space-y-3.5 mb-6">
              {warnings.map((w, idx) => (
                <div key={idx} className="p-4 bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-2xl flex items-start gap-3.5 text-red-950 shadow-sm animate-pulse-slow">
                  <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-red-950 flex items-center gap-1.5">
                      Clinical Warning: Drug Interaction Found ({w.severity} Severity)
                    </h5>
                    <p className="text-xs text-red-900 mt-1 leading-relaxed font-semibold">{w.warning}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Compliance Rate Card */}
            <div className="relative overflow-hidden card-3d-premium rounded-3xl p-6 border-cyan-500/20 flex flex-col justify-between min-h-[175px]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider block">Compliance Rate (ECG)</span>
                  <span className="text-3xl font-black text-white mt-2 block tracking-tight">{complianceScore}%</span>
                  <span className={`inline-block mt-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                    complianceScore >= 85 ? 'bg-green-500/20 text-green-300 border-green-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {complianceScore >= 85 ? 'Normal Rhythm' : 'Alert'}
                  </span>
                </div>
                
                {/* 3D Circular Progress SVG */}
                <div className="relative h-16 w-16 shrink-0 flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                  <svg className="absolute w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="26" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="5.5" fill="transparent" />
                    <circle cx="32" cy="32" r="26" stroke="#10b981" strokeWidth="5.5" fill="transparent"
                      strokeDasharray={163.3}
                      strokeDashoffset={163.3 - (163.3 * complianceScore) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="text-xs font-black text-white">{complianceScore}%</span>
                </div>
              </div>
              
              {/* Cardiac ECG monitor grid wrapper */}
              <div className="mt-4 bg-slate-950 border border-slate-900 rounded-xl p-2.5 shadow-inner relative overflow-hidden h-12 flex items-center shrink-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:8px_8px]" />
                <svg className="w-full h-8 relative z-10 opacity-90" viewBox="0 0 300 50" preserveAspectRatio="none">
                  <path
                    d="M 0,25 L 100,25 L 108,10 L 116,40 L 124,25 L 140,25 L 146,5 L 158,45 L 168,21 L 174,29 L 180,25 L 300,25"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-ecg"
                  />
                </svg>
              </div>
            </div>

            {/* Active Medications Card */}
            <div className="flex items-center justify-between gap-4 card-3d-premium rounded-3xl p-6 border-purple-500/20 min-h-[175px]">
              <div>
                <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider block">Active Medications</span>
                <span className="text-3xl font-black text-white mt-2 block tracking-tight">{medicines.length}</span>
                <span className="text-xs text-slate-300 mt-1 block font-semibold">Cabinet active load</span>
              </div>
              
              {/* 3D Medicine Cabinet Visualization */}
              <div className="relative w-16 h-16 border border-cyan-500/30 bg-slate-900/80 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 filter drop-shadow-[0_4px_12px_rgba(99,102,241,0.2)]">
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-700" />
                <div className="absolute top-2.5 left-3 w-5 h-2.5 rounded-full bg-gradient-to-r from-red-500 to-indigo-500 rotate-12 animate-float-slow" />
                <div className="absolute bottom-2.5 right-3 w-6 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 -rotate-45 animate-float-delayed" />
                <span className="absolute text-[11px] font-black text-cyan-200 bg-slate-900/90 border border-cyan-500/40 rounded-md px-1.5 py-0.5 filter drop-shadow-md">{medicines.length}</span>
              </div>
            </div>

            {/* Today's Doses Card */}
            <div className="flex items-center justify-between gap-4 card-3d-premium rounded-3xl p-6 border-indigo-500/20 min-h-[175px]">
              <div>
                <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider block">Today's Doses</span>
                <span className="text-3xl font-black text-white mt-2 block tracking-tight">{reminders.length}</span>
                <span className="text-xs text-slate-300 mt-1 block font-semibold">Scheduled reminders</span>
              </div>

              {/* 3D Clock Dial Timeline Dial */}
              <div className="relative w-16 h-16 bg-slate-900/80 border border-cyan-500/30 rounded-full flex items-center justify-center shrink-0 filter drop-shadow-[0_4px_12px_rgba(6,182,212,0.2)]">
                <div className="absolute inset-2 rounded-full border border-dashed border-cyan-500/40 animate-spin-slow" />
                <div className="absolute top-3.5 bottom-8 w-[2px] bg-indigo-500 origin-bottom transform rotate-45" />
                <div className="absolute top-5 bottom-8 w-[2px] bg-cyan-500 origin-bottom transform -rotate-12" />
                <span className="absolute text-[11px] font-black text-cyan-200 bg-slate-900/90 border border-cyan-500/40 rounded-md px-1.5 py-0.5 filter drop-shadow-md">{reminders.length}</span>
              </div>
            </div>
          </div>

          {/* 🚨 Medical Emergency Information Card */}
          <div className="my-6">
            <MedicalEmergencyInfoCard
              emergencyInfo={emergencyInfo}
              currentMedications={medicines}
              isEditable={isPatient}
              onEdit={() => setShowEditEmergencyModal(true)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checklist Column */}
            <div className="lg:col-span-2 card-3d-premium rounded-3xl p-6 border-cyan-500/20 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="font-black text-white text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  Today's Scheduled Checklist
                </h3>
              </div>

              {reminders.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                  <Pill className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No doses scheduled for today</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isPatient
                      ? 'Go to the Medicines page to register your prescriptions.'
                      : 'The patient has not scheduled any medications.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {reminders.map((rem) => {
                    const isPending = rem.status === 'pending' || rem.status === 'notified';
                    const isTaken = rem.status === 'taken';
                    const isMissed = rem.status === 'missed';

                    return (
                      <div key={rem.id} className="p-4 border border-cyan-500/20 rounded-2xl flex items-center justify-between hover:bg-slate-800/60 bg-slate-900/60 transition-all">
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl text-xs font-black ${
                            isTaken
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : isMissed
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {formatTimeToShow(rem.dose_time)}
                          </div>
                          <div>
                            <h5 className="font-black text-white text-sm flex items-center gap-2">
                              {rem.medicine_name}
                              {rem.medicine_food_relation && (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  rem.medicine_food_relation.toLowerCase().includes('before')
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : rem.medicine_food_relation.toLowerCase().includes('night')
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    : 'bg-green-500/20 text-green-300 border border-green-500/30'
                                }`}>
                                  {rem.medicine_food_relation}
                                </span>
                              )}
                            </h5>
                            <p className="text-xs text-slate-300 font-semibold mt-0.5">Dosage: {rem.medicine_dosage}</p>
                          </div>
                        </div>

                        {/* Action buttons (Patients only) */}
                        {isPatient ? (
                          isPending ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleActionDose(rem.id, 'taken')}
                                disabled={actioningId !== null}
                                className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-300 transition-colors flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                title="Mark Taken"
                              >
                                <Check className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleActionDose(rem.id, 'missed')}
                                disabled={actioningId !== null}
                                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 transition-colors flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                                title="Mark Missed"
                              >
                                <X className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          ) : (
                            <span className={`text-xs px-3 py-1 rounded-full font-black border uppercase tracking-wider ${
                              isTaken
                                ? 'bg-green-500/20 border-green-500/40 text-green-300'
                                : 'bg-red-500/20 border-red-500/40 text-red-300'
                            }`}>
                              {isTaken ? 'Taken' : 'Missed'}
                            </span>
                          )
                        ) : (
                          /* Caregiver Read-only tags */
                          <span className={`text-xs px-3 py-1 rounded-full font-black border uppercase tracking-wider ${
                            isTaken
                              ? 'bg-green-500/20 border-green-500/40 text-green-300'
                              : isMissed
                              ? 'bg-red-500/20 border-red-500/40 text-red-300'
                              : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          }`}>
                            {isTaken ? 'Taken' : isMissed ? 'Missed' : 'Scheduled'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick stats and link section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="card-3d-premium rounded-3xl p-6 border-cyan-500/20 space-y-5">
                <h3 className="font-black text-white text-lg flex items-center gap-2 border-b border-slate-800 pb-4">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Status Info
                </h3>
                
                <div className="space-y-4 text-sm text-slate-300 font-semibold">
                  <div className="flex justify-between">
                    <span>Active Connection</span>
                    <span className="font-black text-cyan-300">
                      {associations.length} {associations.length === 1 ? 'Person' : 'People'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Adherence Logs</span>
                    <span className="font-black text-cyan-300">{logs.length} logged</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-2.5">
                  {isPatient ? (
                    <Link
                      to="/medicines"
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      Add Medication
                    </Link>
                  ) : (
                    <Link
                      to="/medicines"
                      className="w-full flex items-center justify-center gap-2 py-3 border border-cyan-500/30 hover:bg-slate-800/80 font-black text-sm text-slate-200 rounded-xl transition-all"
                    >
                      <Pill className="h-4.5 w-4.5 text-cyan-400" />
                      View Cabinet
                    </Link>
                  )}
                  <Link
                    to="/history"
                    className="w-full flex items-center justify-center gap-2 py-3 border border-slate-700 hover:bg-slate-800/80 font-black text-sm text-slate-200 rounded-xl transition-all"
                  >
                    <FileText className="h-4.5 w-4.5 text-slate-400" />
                    View History Logs
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {showEditEmergencyModal && (
            <EditEmergencyInfoModal
              initialInfo={emergencyInfo}
              onClose={() => setShowEditEmergencyModal(false)}
              onSaveSuccess={(updated) => setEmergencyInfo(updated)}
            />
          )}
        </>
      )}
    </div>
  );
}
