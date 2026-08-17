import { useState, useEffect } from 'react';
import { Medicine, Association } from '../types';
import { medicinesService } from '../services/medicines';
import { usersService } from '../services/users';
import { authService } from '../services/auth';
import {
  Pill,
  Plus,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ListFilter,
  Users,
  Edit3,
  Trash2,
  X,
  FileText,
  Bell,
  BellOff,
  Clock,
  AlertTriangle
} from 'lucide-react';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

export default function Medicines() {
  const user = authService.getCurrentUser();
  const isPatient = user?.role === 'patient';

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Association[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editMedicineId, setEditMedicineId] = useState<number | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Form states (Patients only)
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState('');
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [customTimes, setCustomTimes] = useState<string[]>(['09:00']);
  const [durationDays, setDurationDays] = useState('');
  const [scheduleType, setScheduleType] = useState<'Daily' | 'Specific Days'>('Daily');
  const [selectedDays, setSelectedDays] = useState<string[]>(weekdays);
  const [submitting, setSubmitting] = useState(false);
  const [foodRelation, setFoodRelation] = useState('No Preference');
  const [formMessage, setFormMessage] = useState({ text: '', type: '' });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isPatient) {
        const list = await medicinesService.getMedicines();
        setMedicines(list);
      } else {
        const associations = await usersService.getAssociations();
        const activeLinks = associations.filter(a => a.status === 'active');
        setPatients(activeLinks);
        
        if (activeLinks.length > 0) {
          setSelectedPatientId(activeLinks[0].patient_id);
          const list = await medicinesService.getMedicines(activeLinks[0].patient_id);
          setMedicines(list);
        }
      }
    } catch (err) {
      console.error('Failed to load medicines data', err);
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
      const list = await medicinesService.getMedicines(patientId);
      setMedicines(list);
    } catch (err) {
      console.error('Failed to fetch patient medicines', err);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTimesPerDayChange = (val: number) => {
    setTimesPerDay(val);
    // Auto populate custom times depending on the times per day
    const defaults: { [key: number]: string[] } = {
      1: ['09:00'],
      2: ['09:00', '21:00'],
      3: ['09:00', '14:00', '21:00'],
      4: ['09:00', '13:00', '18:00', '22:00']
    };
    setCustomTimes(defaults[val] || ['09:00']);
  };

  const handlePrescriptionOCRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setFormMessage({ text: '', type: '' });
    try {
      const data = await medicinesService.uploadPrescriptionOCR(file);
      const firstMed = data.medicines?.[0];
      if (!firstMed) throw new Error("No medicines found in the scanned prescription.");

      setName(firstMed.name || '');
      setDosage(firstMed.dosage || '');
      setQuantity((firstMed.quantity || '').toString());
      setTimesPerDay(firstMed.times_per_day || 1);
      setDurationDays((firstMed.duration_days || '').toString());
      setFoodRelation(firstMed.food_relation || 'No Preference');
      if (firstMed.custom_times) {
        setCustomTimes(firstMed.custom_times.split(','));
      }
      if (firstMed.days_of_week && firstMed.days_of_week !== 'Daily') {
        setScheduleType('Specific Days');
        setSelectedDays(firstMed.days_of_week.split(','));
      } else {
        setScheduleType('Daily');
        setSelectedDays(weekdays);
      }
      setFormMessage({
        text: `AI parsed successfully! Prefilled form with '${firstMed.name}'. You can scan and import all medicines at once on the dedicated Prescription OCR page.`,
        type: 'success'
      });
    } catch (err: any) {
      setFormMessage({
        text: err.response?.data?.detail || 'Failed to process prescription with AI. Please fill manually.',
        type: 'error'
      });
    } finally {
      setOcrLoading(false);
      e.target.value = '';
    }
  };

  const handleTimeChange = (idx: number, val: string) => {
    const updated = [...customTimes];
    updated[idx] = val;
    setCustomTimes(updated);
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleDeleteMedicine = async (medId: number) => {
    if (window.confirm('Are you sure you want to delete this medication? This will also delete all its compliance logs.')) {
      try {
        await medicinesService.deleteMedicine(medId);
        const list = await medicinesService.getMedicines();
        setMedicines(list);
      } catch (err) {
        console.error('Failed to delete medicine', err);
      }
    }
  };

  const startEditMedicine = (med: Medicine) => {
    setIsEditing(true);
    setEditMedicineId(med.id);
    setName(med.name);
    setDosage(med.dosage);
    setQuantity(med.quantity.toString());
    setTimesPerDay(med.times_per_day);
    setFoodRelation(med.food_relation || 'No Preference');
    if (med.custom_times) {
      setCustomTimes(med.custom_times.split(','));
    } else {
      const defaults = ['09:00', '21:00', '14:00', '18:00'];
      setCustomTimes(defaults.slice(0, med.times_per_day));
    }
    setDurationDays(med.duration_days.toString());
    if (med.days_of_week && med.days_of_week !== 'Daily') {
      setScheduleType('Specific Days');
      setSelectedDays(med.days_of_week.split(','));
    } else {
      setScheduleType('Daily');
      setSelectedDays(weekdays);
    }
    setNotificationsEnabled(med.notifications_enabled !== false);
    setFormMessage({ text: '', type: '' });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditMedicineId(null);
    setName('');
    setDosage('');
    setQuantity('');
    setTimesPerDay(1);
    setCustomTimes(['09:00']);
    setDurationDays('');
    setScheduleType('Daily');
    setSelectedDays(weekdays);
    setFoodRelation('No Preference');
    setNotificationsEnabled(true);
    setFormMessage({ text: '', type: '' });
  };

  const toggleNotifications = async (med: Medicine) => {
    try {
      const updatedPayload = {
        name: med.name,
        generic_name: med.generic_name,
        dosage: med.dosage,
        quantity: med.quantity,
        times_per_day: med.times_per_day,
        duration_days: med.duration_days,
        custom_times: med.custom_times || '',
        days_of_week: med.days_of_week || 'Daily',
        food_relation: med.food_relation || 'No Preference',
        notifications_enabled: !(med.notifications_enabled !== false)
      };
      await medicinesService.updateMedicine(med.id, updatedPayload);
      const list = await medicinesService.getMedicines();
      setMedicines(list);
    } catch (err) {
      console.error('Failed to toggle notifications', err);
    }
  };

const RESTRICTED_SUBSTANCES = [
  'cocaine',
  'anesthesia',
  'anesthetic',
  'ketamine',
  'propofol',
  'fentanyl',
  'morphine',
  'oxycodone',
  'hydrocodone',
  'methadone',
  'amphetamine',
  'alprazolam',
  'diazepam',
  'lorazepam',
  'clonazepam',
  'etomidate',
  'thiopental',
  'midazolam'
];

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPatient) return;
    setSubmitting(true);
    setFormMessage({ text: '', type: '' });

    // Block manual addition of controlled/anesthesia substances requiring doctor prescription
    const normalizedName = name.toLowerCase().trim();
    const foundRestricted = RESTRICTED_SUBSTANCES.find(substance => normalizedName.includes(substance));
    if (foundRestricted) {
      setFormMessage({
        text: `Restricted Medicine Warning: "${name}" is a strictly controlled/anesthesia drug requiring an official doctor's prescription. Manual addition is prohibited. Please upload your doctor's prescription in the AI Scanner.`,
        type: 'error'
      });
      setSubmitting(false);
      return;
    }

    // Validate duplicate custom times
    const uniqueTimes = new Set(customTimes.map(t => t.trim()));
    if (uniqueTimes.size !== customTimes.length) {
      setFormMessage({
        text: 'Duplicate dose timings are not allowed. Please set a different time for each dose.',
        type: 'error'
      });
      setSubmitting(false);
      return;
    }

    const payload = {
      name,
      dosage,
      quantity: parseInt(quantity),
      times_per_day: timesPerDay,
      duration_days: parseInt(durationDays),
      custom_times: customTimes.join(','),
      days_of_week: scheduleType === 'Daily' ? 'Daily' : selectedDays.join(','),
      food_relation: foodRelation,
      notifications_enabled: notificationsEnabled
    };

    try {
      if (isEditing && editMedicineId !== null) {
        await medicinesService.updateMedicine(editMedicineId, payload);
        setFormMessage({ text: 'Medicine updated successfully and reminders rescheduled!', type: 'success' });
        cancelEdit();
      } else {
        await medicinesService.createMedicine(payload);
        setFormMessage({ text: 'Medicine added successfully and reminder slots generated!', type: 'success' });
        
        setName('');
        setDosage('');
        setQuantity('');
        setTimesPerDay(1);
        setCustomTimes(['09:00']);
        setDurationDays('');
        setScheduleType('Daily');
        setSelectedDays(weekdays);
        setFoodRelation('No Preference');
        setNotificationsEnabled(true);
      }

      const list = await medicinesService.getMedicines();
      setMedicines(list);
    } catch (err: any) {
      setFormMessage({
        text: err.response?.data?.detail || 'Failed to submit medicine form.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-page-3d">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Pill className="h-6 w-6 text-cyan-400" />
            Medicine Cabinet
          </h2>
          <p className="text-slate-300 text-sm font-semibold mt-1">
            {isPatient
              ? 'Manage your medication schedule and track inventory levels.'
              : "Monitor your linked patients' medicine cabinets."}
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
          <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm mt-4">Syncing inventory data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form to Add/Edit Medicine (Patient) OR Caregiver Inspection Info */}
          <div className="lg:col-span-1">
            {isPatient ? (
              <div className="glass-card rounded-3xl p-6 border-cyan-500/20 bg-slate-900/90 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-5 sticky top-24">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-black text-white text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-cyan-400" />
                    {isEditing ? 'Edit Medication' : 'Add Medication'}
                  </h3>
                {isEditing && (
                  <button
                    onClick={cancelEdit}
                    className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-all"
                    title="Cancel Edit"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {formMessage.text && (
                <div className={`p-3.5 rounded-xl border text-sm flex gap-2.5 ${
                  formMessage.type === 'success'
                    ? 'bg-green-500/20 border-green-500/40 text-green-300'
                    : 'bg-red-500/20 border-red-500/40 text-red-300'
                }`}>
                  {formMessage.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                  )}
                  <span>{formMessage.text}</span>
                </div>
              )}

              {/* AI Prescription Upload scanner shortcut */}
              {!isEditing && (
                <div className="mb-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.1)] mt-4">
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-500/10 font-black text-6xl pointer-events-none select-none">AI OCR</span>
                  <FileText className="h-8 w-8 text-cyan-400 mb-2 animate-pulse" />
                  <h4 className="text-xs font-black text-white">Scan Prescription with AI</h4>
                  <p className="text-[10px] text-slate-300 font-semibold mt-0.5 mb-3 max-w-[240px]">
                    Upload your prescription file or photo. Our AI will automatically extract details and fill out the form!
                  </p>
                  
                  <label className="relative cursor-pointer py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1.5 cursor-pointer">
                    {ocrLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>AI is parsing...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5" />
                        <span>Select Image / PDF</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={ocrLoading}
                      onChange={handlePrescriptionOCRUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              <form onSubmit={handleAddMedicine} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1.5">Medicine Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metformin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all font-semibold"
                  />
                  {["xanax", "alprazolam", "morphine", "oxycodone", "fentanyl", "adderall", "clonazepam", "tramadol", "diazepam", "lorazepam", "ritalin", "ketamine", "methadone", "codeine"].some(c => name.toLowerCase().includes(c)) && (
                    <div className="mt-2 p-2.5 bg-amber-950/80 border border-amber-500/60 rounded-xl text-amber-200 text-[11px] font-bold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>👨‍⚕️ Mandatory Doctor Prescription Required: This is a controlled prescription medicine. Please confirm valid doctor authorization.</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 px-0.5 py-1">
                  <input
                    type="checkbox"
                    id="notifications_enabled"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="notifications_enabled" className="text-xs font-bold text-slate-200 select-none cursor-pointer">
                    Enable Email Notifications for this medicine
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1.5">Dosage strength</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500mg or 1 tablet"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1.5">Stock Quantity</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 60"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1.5">Duration (Days)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 30"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all font-semibold"
                    />
                    <p className="text-[10px] text-cyan-400 font-semibold mt-1">Specify how many days you will take this medicine. Refill alerts trigger when 2 days remain.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1.5">Schedule Frequency</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => { setScheduleType('Daily'); setSelectedDays(weekdays); }}
                      className={`flex-1 py-2 text-xs font-black rounded-xl border transition-all ${
                        scheduleType === 'Daily'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType('Specific Days')}
                      className={`flex-1 py-2 text-xs font-black rounded-xl border transition-all ${
                        scheduleType === 'Specific Days'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Specific Days
                    </button>
                  </div>

                  {scheduleType === 'Specific Days' && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {weekdays.map((day) => {
                        const isSelected = selectedDays.includes(day);
                        const shortName = day.substring(0, 3);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`px-2.5 py-1 text-[11px] font-black rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            {shortName}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1.5">Doses per Day</label>
                  <select
                    value={timesPerDay}
                    onChange={(e) => handleTimesPerDayChange(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 font-semibold cursor-pointer"
                  >
                    <option value={1} className="bg-slate-900 text-white">1 time daily</option>
                    <option value={2} className="bg-slate-900 text-white">2 times daily</option>
                    <option value={3} className="bg-slate-900 text-white">3 times daily</option>
                    <option value={4} className="bg-slate-900 text-white">4 times daily</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-cyan-300 uppercase tracking-wider mb-1.5">Food Relation</label>
                  <select
                    value={foodRelation}
                    onChange={(e) => setFoodRelation(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-cyan-500/30 rounded-xl text-sm bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 font-semibold cursor-pointer"
                  >
                    <option value="No Preference" className="bg-slate-900 text-white">No Preference</option>
                    <option value="Before Food" className="bg-slate-900 text-white">Before Food</option>
                    <option value="After Food" className="bg-slate-900 text-white">After Food</option>
                    <option value="With Food" className="bg-slate-900 text-white">With Food</option>
                  </select>
                </div>

                {/* Dynamic Time Picker Rows */}
                {customTimes.map((t, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-cyan-500/20 p-3 rounded-xl">
                    <label className="block text-[11px] font-black text-cyan-300 uppercase tracking-wider mb-1">
                      Dose {idx + 1} Time
                    </label>
                    <input
                      type="time"
                      value={t}
                      onChange={(e) => handleTimeChange(idx, e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-cyan-500/30 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-400 font-bold"
                    />
                  </div>
                ))}

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-black text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isEditing ? 'Save Changes' : 'Confirm & Schedule'}
                  </button>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
            ) : (
              <div className="glass-card rounded-3xl p-6 border-cyan-500/20 bg-slate-900/90 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-4 sticky top-24 text-white">
                <div className="flex items-center space-x-3 text-cyan-400 border-b border-slate-800 pb-3">
                  <Users className="h-6 w-6 shrink-0" />
                  <div>
                    <h3 className="font-black text-white text-base">Caregiver Mode</h3>
                    <p className="text-[11px] text-cyan-300/80 font-semibold">Assigned Patient Cabinet Inspection</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-slate-300 space-y-2 leading-relaxed font-medium">
                  <p className="text-white font-bold flex items-center gap-1.5">
                    <span>ℹ️ Read-Only Cabinet View</span>
                  </p>
                  <p>
                    Select an assigned patient from the dropdown above to inspect their active prescriptions, daily dose schedules, stock levels, and discontinuation logs.
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    Patients register their prescriptions from their own account.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Medicines Inventory List */}
          <div className="lg:col-span-2 space-y-4">
            {!isPatient && patients.length === 0 ? (
              <div className="glass-card rounded-3xl py-16 px-6 text-center border border-cyan-500/20 bg-slate-900/90 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                <Users className="h-10 w-10 text-cyan-400 mx-auto mb-3 animate-pulse" />
                <p className="text-base font-black text-white">No linked patients</p>
                <p className="text-xs font-semibold text-slate-300 mt-1">Accept client connections in the profile to see their cabinets.</p>
              </div>
            ) : medicines.length === 0 ? (
              <div className="glass-card rounded-3xl py-16 px-6 text-center border border-cyan-500/20 bg-slate-900/90 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                <Pill className="h-10 w-10 text-cyan-400 mx-auto mb-3 animate-pulse" />
                <p className="text-base font-black text-white">No medications logged</p>
                <p className="text-xs font-semibold text-slate-300 mt-1">
                  {isPatient
                    ? 'Start by inputting your first prescription details.'
                    : 'The patient has not added any medications yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicines.map((med) => (
                  <div key={med.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 med-card-3d">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100/60 rounded-xl med-card-3d-pop shrink-0 flex items-center justify-center relative shadow-sm">
                          <div className="w-5 h-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 rotate-12 relative flex items-center justify-between px-0.5">
                            <div className="w-2 h-1.5 bg-white/30 rounded-full" />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-black border uppercase tracking-wider ${
                            med.quantity > 10
                              ? 'bg-green-500/20 border-green-500/40 text-green-300'
                              : med.quantity > 0
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-red-500/20 border-red-500/40 text-red-300'
                          }`}>
                            {med.quantity} remaining
                          </span>

                          {isPatient && (
                            <div className="flex items-center gap-1 border-l border-cyan-500/30 pl-2">
                              <button
                                onClick={() => startEditMedicine(med)}
                                className="p-1.5 text-cyan-400 hover:text-cyan-200 hover:bg-slate-800 rounded-lg transition-all"
                                title="Edit Medication"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMedicine(med.id)}
                                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-all"
                                title="Delete Medication"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Prominent Brand Name + Muted Generic Name */}
                      <div className="mt-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="text-lg font-black text-white tracking-tight med-card-3d-pop">{med.name}</h4>
                          <span className="text-xs font-extrabold text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 rounded-md shrink-0">
                            {med.dosage}
                          </span>
                        </div>
                        {med.generic_name && (
                          <p className="text-cyan-200 text-xs font-semibold mt-0.5 font-mono">
                            Formula: {med.generic_name}
                          </p>
                        )}
                      </div>
                      
                      {/* Food Relation Warning */}
                      <div className="mt-3 flex items-center justify-between gap-2 text-xs font-bold bg-slate-900/80 border border-cyan-500/20 p-2.5 rounded-xl text-slate-200 med-card-3d-pop">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm">🍽️</span>
                          <span>Intake Advice:</span>
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          med.food_relation?.toLowerCase().includes('before')
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : med.food_relation?.toLowerCase().includes('after')
                            ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {med.food_relation || 'No Preference'}
                        </span>
                      </div>
                      
                      {med.days_of_week && med.days_of_week !== 'Daily' && (
                        <p className="text-cyan-400 text-[10px] font-bold mt-2.5 uppercase tracking-wider">
                          Days: {med.days_of_week.split(',').map(d => d.substring(0,3)).join(', ')}
                        </p>
                      )}
                      {med.custom_times && (
                        <p className="text-slate-300 text-[11px] font-semibold mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-cyan-400" />
                          <span>Timings: {med.custom_times.split(',').map(formatTimeToShow).join(', ')}</span>
                        </p>
                      )}
                    </div>

                    <div className="border-t border-cyan-500/20 pt-3.5 flex items-center justify-between text-xs text-slate-200 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-cyan-400" />
                        <span>{med.duration_days} days schedule</span>
                      </div>
                      <div className="text-right font-black text-cyan-300 capitalize">
                        {med.days_of_week && med.days_of_week !== 'Daily' ? 'Weekly' : 'Daily'} ({med.times_per_day}x)
                      </div>
                    </div>

                    {isPatient && (
                      <div className="border-t border-cyan-500/20 pt-3 flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-200 flex items-center gap-1.5">
                          {med.notifications_enabled !== false ? <Bell className="h-3.5 w-3.5 text-cyan-400" /> : <BellOff className="h-3.5 w-3.5 text-slate-500" />}
                          Email Notifications:
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${med.notifications_enabled !== false ? 'text-cyan-300' : 'text-slate-400'}`}>
                            {med.notifications_enabled !== false ? 'ON' : 'OFF'}
                          </span>
                          <button
                            onClick={() => toggleNotifications(med)}
                            className={`relative inline-flex items-center medical-toggle-track ${
                              med.notifications_enabled !== false ? 'on' : 'off'
                            }`}
                            title={med.notifications_enabled !== false ? "Click to disable notifications" : "Click to enable notifications"}
                          >
                            <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                              med.notifications_enabled !== false ? 'translate-x-5' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
