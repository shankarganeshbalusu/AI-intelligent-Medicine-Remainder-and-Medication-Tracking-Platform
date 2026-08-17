import React from 'react';
import {
  AlertTriangle,
  PhoneCall,
  Heart,
  Stethoscope,
  Pill,
  Edit,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { EmergencyInfo, Medicine } from '../types';

interface MedicalEmergencyInfoCardProps {
  emergencyInfo: EmergencyInfo | null;
  currentMedications?: Medicine[];
  isEditable?: boolean;
  onEdit?: () => void;
}

export const MedicalEmergencyInfoCard: React.FC<MedicalEmergencyInfoCardProps> = ({
  emergencyInfo,
  currentMedications = [],
  isEditable = false,
  onEdit
}) => {
  const bloodGroup = emergencyInfo?.blood_group || 'Not Specified';
  const hasDoctor = emergencyInfo?.doctor_name || emergencyInfo?.doctor_phone;

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-rose-500/40 p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(244,63,94,0.15)] relative overflow-hidden space-y-5 text-white">
      {/* Background Emergency Ambient Pulse */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/30 text-white shrink-0">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black tracking-tight text-white">🚨 Medical Emergency Information</h2>
            </div>
            <p className="text-xs text-rose-300/80 font-medium">Critical patient data & emergency dispatch contacts</p>
          </div>
        </div>

        {/* Prominent Blood Group Badge & Edit Action */}
        <div className="flex items-center space-x-3 self-start sm:self-center">
          <div className="px-3.5 py-1.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center space-x-2 shadow-inner">
            <span className="text-base">🩸</span>
            <span className="text-xs font-black text-rose-300 uppercase tracking-widest">
              Blood: <span className="text-white text-sm font-extrabold">{bloodGroup}</span>
            </span>
          </div>

          {isEditable && onEdit && (
            <button
              onClick={onEdit}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5 text-rose-400" />
              <span>Edit Info</span>
            </button>
          )}
        </div>
      </div>

      {/* Emergency Contact Banner */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <PhoneCall className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Primary Emergency Contact</span>
            <p className="font-extrabold text-white text-sm">
              {emergencyInfo?.emergency_contact_name || 'No Emergency Contact Listed'}
              {emergencyInfo?.relationship && <span className="text-xs font-normal text-slate-400"> ({emergencyInfo.relationship})</span>}
            </p>
          </div>
        </div>

        {emergencyInfo?.emergency_contact_phone ? (
          <a
            href={`tel:${emergencyInfo.emergency_contact_phone}`}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-rose-500/20 transition-all self-start sm:self-auto"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>Call {emergencyInfo.emergency_contact_phone}</span>
          </a>
        ) : (
          <span className="text-xs text-slate-500 italic">No phone number provided</span>
        )}
      </div>

      {/* Allergies & Conditions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allergies */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4" />
            <span>Known Allergies</span>
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            {emergencyInfo?.allergies ? emergencyInfo.allergies : <span className="text-slate-500 italic">No known drug/food allergies reported.</span>}
          </p>
        </div>

        {/* Current Medical Conditions */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Heart className="h-4 w-4" />
            <span>Medical Conditions</span>
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            {emergencyInfo?.medical_conditions ? emergencyInfo.medical_conditions : <span className="text-slate-500 italic">No pre-existing conditions specified.</span>}
          </p>
        </div>
      </div>

      {/* Active Medications List */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Pill className="h-4 w-4" />
            <span>Current Active Medications</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {currentMedications.length} Prescribed
          </span>
        </div>

        {currentMedications.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No active medications registered in Cabinet.</p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {currentMedications.map((m) => (
              <span key={m.id} className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{m.name} ({m.dosage})</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Doctor & Important Information Footer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Doctor Information */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Stethoscope className="h-4 w-4" />
            <span>Primary Physician / Doctor</span>
          </div>
          {hasDoctor ? (
            <div className="text-xs space-y-0.5">
              <p className="font-extrabold text-white">{emergencyInfo?.doctor_name || 'Primary Physician'}</p>
              {emergencyInfo?.doctor_phone && <p className="text-indigo-300 font-semibold">{emergencyInfo.doctor_phone}</p>}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Doctor information not specified.</p>
          )}
        </div>

        {/* Important Notes */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="h-4 w-4" />
            <span>Important Medical Notes</span>
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            {emergencyInfo?.important_notes ? emergencyInfo.important_notes : <span className="text-slate-500 italic">No additional notes provided.</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MedicalEmergencyInfoCard;
