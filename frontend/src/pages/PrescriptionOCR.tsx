import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Check, 
  ClipboardList, 
  Sparkles, 
  Clock,
  Edit3,
  Trash2,
  Save,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { medicinesService } from '../services/medicines';
import { authService } from '../services/auth';

interface ExtractedMedicine {
  name: string;
  generic_name?: string;
  dosage: string;
  quantity: number;
  times_per_day: number;
  duration_days: number;
  custom_times: string;
  days_of_week: string;
  food_relation: string;
  confidence?: number;
  name_confidence?: number;
  dosage_confidence?: number;
  frequency_confidence?: number;
  instructions?: string;
}

interface ExtractedData {
  patient_name?: string;
  diagnosis?: string;
  is_mock?: boolean;
  medicines: ExtractedMedicine[];
}

export default function PrescriptionOCR() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const currentUser = authService.getCurrentUser();
  if (currentUser?.role === 'caregiver') {
    return (
      <div className="w-full max-w-xl mx-auto py-16 px-6 text-center space-y-5 glass-card rounded-3xl border border-cyan-500/20 bg-slate-900/90 backdrop-blur-2xl text-white shadow-2xl my-8">
        <div className="h-16 w-16 bg-cyan-500/20 text-cyan-400 rounded-3xl border border-cyan-500/30 flex items-center justify-center mx-auto shadow-lg">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">Prescription AI Scanner</h2>
        <p className="text-xs text-slate-300 font-semibold leading-relaxed max-w-md mx-auto">
          Prescription OCR scanning is available on Patient portals to allow patients to scan and register their prescriptions directly into their medicine cabinet.
        </p>
        <button
          onClick={() => navigate('/medicines')}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
        >
          View Patient Cabinets
        </button>
      </div>
    );
  }

  // Edit states for review list
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editGenericName, setEditGenericName] = useState('');
  const [editDosage, setEditDosage] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editTimesPerDay, setEditTimesPerDay] = useState(1);
  const [editCustomTimes, setEditCustomTimes] = useState<string[]>(['09:00']);
  const [editDurationDays, setEditDurationDays] = useState('');
  const [editFoodRelation, setEditFoodRelation] = useState('No Preference');
  const [editInstructions, setEditInstructions] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedData(null);
      setEditingIndex(null);
      setMessage({ text: '', type: '' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setEditingIndex(null);
    setMessage({ text: '', type: '' });
    try {
      const data = await medicinesService.uploadPrescriptionOCR(file);
      setExtractedData(data);
      // Select all medicines by default
      setSelectedIndexes(data.medicines.map((_: any, idx: number) => idx));
      setMessage({ text: 'AI successfully scanned the prescription and extracted all items!', type: 'success' });
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || 'Failed to scan prescription. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectMedicine = (idx: number) => {
    if (editingIndex === idx) return; // Prevent selection toggle while editing
    setSelectedIndexes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  // Start editing a specific medicine item inline
  const startEditing = (idx: number, med: ExtractedMedicine) => {
    setEditingIndex(idx);
    setEditName(med.name);
    setEditGenericName(med.generic_name || '');
    setEditDosage(med.dosage);
    setEditQuantity(med.quantity.toString());
    setEditTimesPerDay(med.times_per_day);
    setEditCustomTimes(med.custom_times.split(','));
    setEditDurationDays(med.duration_days.toString());
    setEditFoodRelation(med.food_relation);
    setEditInstructions(med.instructions || '');
  };

  const handleTimesPerDayChange = (val: number) => {
    setEditTimesPerDay(val);
    const defaults: { [key: number]: string[] } = {
      1: ['09:00'],
      2: ['09:00', '21:00'],
      3: ['09:00', '14:00', '21:00'],
      4: ['09:00', '13:00', '18:00', '22:00']
    };
    setEditCustomTimes(defaults[val] || ['09:00']);
  };

  const handleTimeChange = (idx: number, val: string) => {
    const updated = [...editCustomTimes];
    updated[idx] = val;
    setEditCustomTimes(updated);
  };

  // Save changes back to local list
  const saveMedicineEdit = (idx: number) => {
    if (!extractedData) return;
    
    // Validate custom times duplicates
    const uniqueTimes = new Set(editCustomTimes.map(t => t.trim()));
    if (uniqueTimes.size !== editCustomTimes.length) {
      alert('Duplicate timings are not allowed. Please set a different time for each dose.');
      return;
    }

    const updatedMedicines = [...extractedData.medicines];
    updatedMedicines[idx] = {
      ...updatedMedicines[idx],
      name: editName,
      generic_name: editGenericName || undefined,
      dosage: editDosage,
      quantity: parseInt(editQuantity) || 10,
      times_per_day: editTimesPerDay,
      duration_days: parseInt(editDurationDays) || 5,
      custom_times: editCustomTimes.join(','),
      food_relation: editFoodRelation,
      instructions: editInstructions,
      confidence: 100, // Manually corrected elements gain 100% confidence
      name_confidence: 100,
      dosage_confidence: 100,
      frequency_confidence: 100
    };

    setExtractedData({
      ...extractedData,
      medicines: updatedMedicines
    });
    setEditingIndex(null);
  };

  // Delete medicine from local scan list
  const deleteMedicine = (idx: number) => {
    if (!extractedData) return;
    const updatedMedicines = extractedData.medicines.filter((_, i) => i !== idx);
    setSelectedIndexes(prev => prev.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
    setExtractedData({
      ...extractedData,
      medicines: updatedMedicines
    });
    if (editingIndex === idx) {
      setEditingIndex(null);
    }
  };

  // Append a blank medicine to list in edit mode
  const addNewMedicine = () => {
    if (!extractedData) return;
    const newMed: ExtractedMedicine = {
      name: 'New Medicine',
      generic_name: 'Generic Chemical Name',
      dosage: '1 tablet',
      quantity: 10,
      times_per_day: 1,
      duration_days: 5,
      custom_times: '09:00',
      days_of_week: 'Daily',
      food_relation: 'No Preference',
      confidence: 100,
      name_confidence: 100,
      dosage_confidence: 100,
      frequency_confidence: 100,
      instructions: ''
    };

    const newIdx = extractedData.medicines.length;
    setExtractedData({
      ...extractedData,
      medicines: [...extractedData.medicines, newMed]
    });
    setSelectedIndexes(prev => [...prev, newIdx]);
    startEditing(newIdx, newMed);
  };

  // Import selected checked medications into database
  const handleImport = async () => {
    if (!extractedData || selectedIndexes.length === 0) return;
    setImporting(true);
    setMessage({ text: '', type: '' });
    let successCount = 0;
    let failedNames: string[] = [];

    for (const idx of selectedIndexes) {
      const med = extractedData.medicines[idx];
      try {
        await medicinesService.createMedicine({
          name: med.name,
          generic_name: med.generic_name,
          dosage: med.dosage,
          quantity: med.quantity,
          times_per_day: med.times_per_day,
          duration_days: med.duration_days,
          custom_times: med.custom_times,
          days_of_week: med.days_of_week,
          food_relation: med.food_relation
        });
        successCount++;
      } catch (err: any) {
        console.error(`Failed to import ${med.name}`, err);
        failedNames.push(med.name);
      }
    }

    if (successCount > 0) {
      let msgText = `Successfully imported ${successCount} medicine(s) into your cabinet and scheduled daily reminders!`;
      if (failedNames.length > 0) {
        msgText += ` (${failedNames.length} item(s) skipped: ${failedNames.join(', ')})`;
      }
      setMessage({
        text: msgText,
        type: 'success'
      });
      setTimeout(() => {
        navigate('/medicines');
      }, 2500);
    } else {
      setMessage({
        text: failedNames.length > 0
          ? `Failed to import: ${failedNames.join(', ')}. Please verify medicine details and try again.`
          : `Failed to import medicines. Please verify the medicine details and try again.`,
        type: 'error'
      });
    }
    setImporting(false);
  };

  const getConfidenceColorClass = (score: number) => {
    if (score >= 95) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 80) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200 animate-pulse';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 95) return `🟢 ${score}%`;
    if (score >= 80) return `🟡 ${score}%`;
    return `🔴 ${score}%`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-page-3d pb-12">
      {/* Header Panel */}
      <div className="border-b border-cyan-500/20 pb-5">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-cyan-400 animate-pulse" />
          AI Prescription OCR Linear Review
        </h2>
        <p className="text-slate-300 text-sm font-semibold mt-1">
          Upload any prescription image. Verify written shortcuts alongside full chemical names lineally side-by-side before cabinet import.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl border text-sm flex gap-3 ${
          message.type === 'success'
            ? 'bg-green-500/20 border-green-500/40 text-green-300 font-bold'
            : 'bg-red-500/20 border-red-500/40 text-red-300 font-bold'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card rounded-3xl p-6 border-2 border-dashed border-cyan-500/40 bg-slate-900/90 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col items-center justify-center text-center relative overflow-hidden transition-all">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-500/10 font-black text-8xl pointer-events-none select-none">OCR</div>
            
            <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-2xl text-cyan-400 mb-3 filter drop-shadow-sm">
              <FileText className="h-8 w-8 animate-pulse" />
            </div>

            <h4 className="text-sm font-black text-white">Drop prescription here</h4>
            <p className="text-[11px] text-cyan-300 font-black mt-1 mb-4 max-w-[190px]">
              ✦ AI-Powered Medicine Extraction ✦
            </p>

            <label className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer text-center block border border-cyan-500/30 shadow-sm">
              {file ? file.name : 'Choose File (JPG, PNG, PDF)'}
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
            </label>

            {file && (
              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    <span>AI Scanner Active...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
                    <span>Run AI OCR Scanner</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="glass-card rounded-3xl p-5 border border-cyan-500/20 bg-slate-900/90 backdrop-blur-xl space-y-3.5 text-left">
            <h5 className="text-[10px] font-black text-cyan-300 uppercase tracking-widest">Guide</h5>
            <ul className="space-y-2 text-[11px] text-slate-200 font-semibold">
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
                <span>Shows prescription shortcuts side-by-side with full generic chemical active formulas.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
                <span>Compact linear table format for simple overview.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-9">
          {extractedData ? (
            <div className="card-3d-premium rounded-3xl p-6 border-cyan-500/10 space-y-6">
              {/* Header Context */}
              <div className="flex flex-col sm:flex-row justify-between border-b border-cyan-500/20 pb-4 gap-2 text-left bg-slate-900/90 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">Patient Name</span>
                  <h4 className="text-base font-black text-white">{extractedData.patient_name || 'Not specified'}</h4>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block sm:text-right">Diagnosis/Context</span>
                  <h4 className="text-base font-black text-cyan-400 block sm:text-right">{extractedData.diagnosis || 'General Treatment'}</h4>
                </div>
              </div>

              {/* Medicines List */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-black text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                    Medication Checklist ({extractedData.medicines.length})
                  </h5>
                  <button
                    onClick={addNewMedicine}
                    className="flex items-center gap-1 py-1.5 px-3 bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-white text-[11px] font-black uppercase rounded-full tracking-wider transition-all"
                  >
                    <Plus className="h-3.5 w-3.5 text-cyan-300" />
                    <span>Add Medicine</span>
                  </button>
                </div>
                
                {/* Linear Compact Table wrapper */}
                <div className="overflow-x-auto border border-cyan-500/30 rounded-2xl shadow-inner bg-slate-950/80">
                  <table className="w-full min-w-[800px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-cyan-500/30 text-cyan-300 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3 w-10 text-center">Select</th>
                        <th className="py-3 px-4 w-[280px]">Medicine Names (Shortcut vs Full Generic)</th>
                        <th className="py-3 px-3 w-28">Dosage & Stock</th>
                        <th className="py-3 px-3 w-40">Schedule & Food</th>
                        <th className="py-3 px-2 w-16 text-center">Days</th>
                        <th className="py-3 px-3 w-28 text-center">Confidence</th>
                        <th className="py-3 px-3 w-20 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/90 text-white">
                      {extractedData.medicines.map((med, idx) => {
                        const isSelected = selectedIndexes.includes(idx);
                        const isEditing = editingIndex === idx;
                        const confidenceVal = med.confidence ?? 95;
                        const isLowConfidence = confidenceVal < 80;

                        if (isEditing) {
                          return (
                            <tr key={idx} className="bg-cyan-950/40 ring-2 ring-cyan-400 ring-inset">
                              <td className="py-4 px-3 text-center">
                                <Check className="h-4.5 w-4.5 text-cyan-400 mx-auto" />
                              </td>
                              <td className="py-4 px-4 space-y-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-cyan-300 uppercase block">Shortcut/Brand name</label>
                                  <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-2 py-1 border border-cyan-500/40 rounded-lg text-xs bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-white font-bold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-cyan-300 uppercase block">Full Generic name</label>
                                  <input
                                    type="text"
                                    value={editGenericName}
                                    onChange={(e) => setEditGenericName(e.target.value)}
                                    className="w-full px-2 py-1 border border-cyan-500/40 rounded-lg text-xs bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-cyan-200 italic"
                                    placeholder="Active ingredients"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-cyan-300 uppercase block">Notes/Instructions</label>
                                  <textarea
                                    value={editInstructions}
                                    onChange={(e) => setEditInstructions(e.target.value)}
                                    rows={1}
                                    className="w-full px-2 py-1 border border-cyan-500/40 rounded-lg text-xs bg-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-slate-200"
                                    placeholder="Instructions"
                                  />
                                </div>
                              </td>
                              <td className="py-4 px-3 space-y-2 vertical-align-top">
                                <div>
                                  <label className="text-[9px] font-black text-cyan-300 uppercase block">Dose</label>
                                  <input
                                    type="text"
                                    required
                                    value={editDosage}
                                    onChange={(e) => setEditDosage(e.target.value)}
                                    className="w-full px-2 py-1 border border-cyan-500/40 rounded-lg text-xs bg-slate-950 focus:outline-none text-center text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-cyan-300 uppercase block">Qty Stock</label>
                                  <input
                                    type="number"
                                    required
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    className="w-full px-2 py-1 border border-cyan-500/40 rounded-lg text-xs bg-slate-950 focus:outline-none text-center text-white"
                                  />
                                </div>
                              </td>
                              <td className="py-4 px-3 space-y-2 vertical-align-top">
                                <div>
                                  <label className="text-[9px] font-black text-cyan-300 uppercase block">Food relation</label>
                                  <select
                                    value={editFoodRelation}
                                    onChange={(e) => setEditFoodRelation(e.target.value)}
                                    className="w-full px-2 py-1 border border-cyan-500/40 rounded-lg text-xs bg-slate-950 focus:outline-none text-white font-medium"
                                  >
                                    <option value="No Preference">No Preference</option>
                                    <option value="Before Food">Before Food</option>
                                    <option value="After Food">After Food</option>
                                    <option value="At Night">At Night</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-cyan-300 uppercase block">Frequency</label>
                                  <select
                                    value={editTimesPerDay}
                                    onChange={(e) => handleTimesPerDayChange(parseInt(e.target.value))}
                                    className="w-full px-2 py-1 border border-cyan-500/40 rounded-lg text-xs bg-slate-950 focus:outline-none text-white font-medium"
                                  >
                                    <option value={1}>1x daily</option>
                                    <option value={2}>2x daily</option>
                                    <option value={3}>3x daily</option>
                                    <option value={4}>4x daily</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-cyan-300 uppercase block">Dose Timings</label>
                                  <div className="grid grid-cols-2 gap-1">
                                    {editCustomTimes.map((time, tIdx) => (
                                      <input
                                        key={tIdx}
                                        type="time"
                                        required
                                        value={time}
                                        onChange={(e) => handleTimeChange(tIdx, e.target.value)}
                                        className="px-1 py-0.5 border border-cyan-500/40 rounded text-[10px] text-center bg-slate-950 text-white"
                                      />
                                    ))}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-2 text-center vertical-align-top">
                                <label className="text-[9px] font-black text-cyan-300 uppercase block sm:hidden">Days</label>
                                <input
                                  type="number"
                                  required
                                  value={editDurationDays}
                                  onChange={(e) => setEditDurationDays(e.target.value)}
                                  className="w-12 px-1 py-1 border border-cyan-500/40 rounded-lg text-xs bg-slate-950 focus:outline-none text-center text-white"
                                />
                              </td>
                              <td className="py-4 px-3 text-center text-[10px] text-cyan-300">
                                <span>Correcting...</span>
                              </td>
                              <td className="py-4 px-3 text-center flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => saveMedicineEdit(idx)}
                                  className="p-1 bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-white rounded-lg transition-all"
                                  title="Save Changes"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingIndex(null)}
                                  className="p-1 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg transition-all"
                                  title="Cancel Edit"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        }

                        // Compact table row
                        return (
                          <tr 
                            key={idx} 
                            className={`hover:bg-slate-800/80 transition-all ${
                              isSelected ? 'bg-slate-900 text-white font-medium' : 'bg-slate-950/60 text-slate-400 opacity-60'
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => toggleSelectMedicine(idx)}
                                className={`p-1.5 rounded-lg border transition-all mx-auto ${
                                  isSelected
                                    ? 'bg-cyan-500 border-cyan-400 text-white'
                                    : 'bg-slate-950 border-slate-700 text-slate-400'
                                }`}
                              >
                                {isSelected ? <Check className="h-3.5 w-3.5 text-white" /> : <div className="h-3.5 w-3.5" />}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-black text-white text-sm flex items-center gap-1.5 flex-wrap">
                                  {med.name}
                                  {isLowConfidence && (
                                    <span className="flex items-center gap-0.5 text-[8px] font-black text-red-300 bg-red-500/20 border border-red-500/40 px-1 py-0.2 rounded uppercase">
                                      Verify
                                    </span>
                                  )}
                                </span>
                                {med.generic_name && (
                                  <span className="text-[11px] text-cyan-200 font-semibold italic">
                                    {med.generic_name}
                                  </span>
                                )}
                                {med.instructions && (
                                  <span className="text-[10px] text-cyan-300 font-semibold mt-1 pl-2 border-l-2 border-cyan-500/40 block">
                                    Note: {med.instructions}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-200">
                              <div className="flex flex-col">
                                <span className="text-white font-black">{med.dosage}</span>
                                <span className="text-[10px] text-cyan-300">{med.quantity} in stock</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-extrabold text-cyan-200 bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                                    {med.times_per_day}x daily
                                  </span>
                                  <span className="text-[10px] font-extrabold text-emerald-200 bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase">
                                    {med.food_relation}
                                  </span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-cyan-400" />
                                  <span>{med.custom_times}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center text-xs font-bold text-slate-200">
                              {med.duration_days} days
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block py-0.5 px-2 rounded-full text-[10px] font-extrabold border ${getConfidenceColorClass(confidenceVal)}`}>
                                {getConfidenceBadge(confidenceVal)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditing(idx, med)}
                                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-lg transition-all"
                                  title="Edit item"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteMedicine(idx)}
                                  className="p-1.5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition-all"
                                  title="Remove item"
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

                <div className="flex flex-col sm:flex-row justify-between items-center pt-3 gap-3">
                  <span className="text-xs font-extrabold text-cyan-300">
                    {selectedIndexes.length} of {extractedData.medicines.length} medicines selected for cabinet
                  </span>
                
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setExtractedData(null);
                        setFile(null);
                        setMessage({ text: '', type: '' });
                      }}
                      className="py-2.5 px-4 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-all"
                    >
                      Cancel Scan
                    </button>

                    <button
                      onClick={handleImport}
                      disabled={importing || selectedIndexes.length === 0 || editingIndex !== null}
                      className="py-2.5 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Saving to Medication Cabinet...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4.5 w-4.5 text-emerald-300" />
                          <span>Save to Medication Cabinet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="h-[360px] card-3d-premium border-cyan-500/30 rounded-3xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-slate-900/90">
              {/* 3D Scanning Line Laser */}
              <div className="absolute top-4 left-4 right-4 scan-beam-3d rounded-full z-20" />
              
              {/* Matrix Ground grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(14,144,233,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(14,144,233,0.06)_1px,transparent_1px)] bg-[size:16px_16px] opacity-75" />
              
              {/* Floating Simulated Prescription Doc */}
              <div className="w-[160px] h-[200px] bg-slate-950 border border-cyan-500/40 shadow-2xl rounded-2xl flex flex-col justify-between p-4 relative z-10 animate-float-slow transform-gpu" style={{ transformStyle: 'preserve-3d', transform: 'rotateY(6deg) rotateX(12deg)' }}>
                <div className="h-4 w-12 bg-cyan-500/40 rounded-md animate-pulse" />
                <div className="space-y-2 mt-4 flex-1">
                  <div className="h-2 w-full bg-slate-800 rounded animate-pulse" />
                  <div className="h-2 w-[85%] bg-slate-800 rounded animate-pulse" />
                  <div className="h-2 w-[90%] bg-slate-800 rounded animate-pulse" />
                  <div className="h-2.5 w-16 bg-cyan-500/30 rounded animate-pulse mt-3" />
                  <div className="h-2 w-full bg-slate-800 rounded animate-pulse" />
                </div>
                <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                  <div className="h-3 w-8 bg-slate-800 rounded" />
                  <div className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
                </div>
              </div>
              
              <div className="relative z-10 mt-6 space-y-2">
                <h4 className="text-base font-black text-white tracking-wide flex items-center justify-center gap-1.5 drop-shadow-md">
                  <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                  AI OCR Clinical Extraction Active
                </h4>
                <p className="text-[11px] text-cyan-300 font-extrabold uppercase tracking-wider">
                  Mapping generic chemical compounds dynamically...
                </p>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl h-64 border-2 border-dashed border-cyan-500/30 bg-slate-900/90 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col items-center justify-center p-6 text-center">
              <ClipboardList className="h-10 w-10 text-cyan-400 mb-3 animate-pulse" />
              <h4 className="text-base font-black text-white">No Scanning Data</h4>
              <p className="text-xs font-semibold text-slate-200 mt-1 max-w-[280px]">
                Please select your doctor prescription document in the left panel and click scan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
