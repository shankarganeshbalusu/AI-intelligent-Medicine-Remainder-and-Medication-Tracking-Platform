import React, { useState } from 'react';
import { X, ShieldAlert, Save, Loader2 } from 'lucide-react';
import { EmergencyInfo } from '../types';
import { usersService } from '../services/users';

interface EditEmergencyInfoModalProps {
  initialInfo: EmergencyInfo | null;
  onClose: () => void;
  onSaveSuccess: (updated: EmergencyInfo) => void;
}

export const EditEmergencyInfoModal: React.FC<EditEmergencyInfoModalProps> = ({
  initialInfo,
  onClose,
  onSaveSuccess
}) => {
  const [formData, setFormData] = useState<EmergencyInfo>({
    blood_group: initialInfo?.blood_group || '',
    emergency_contact_name: initialInfo?.emergency_contact_name || '',
    emergency_contact_phone: initialInfo?.emergency_contact_phone || '',
    relationship: initialInfo?.relationship || '',
    allergies: initialInfo?.allergies || '',
    medical_conditions: initialInfo?.medical_conditions || '',
    important_notes: initialInfo?.important_notes || '',
    doctor_name: initialInfo?.doctor_name || '',
    doctor_phone: initialInfo?.doctor_phone || ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await usersService.updateEmergencyInfo(formData);
      onSaveSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update emergency information.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Edit Emergency Information</h2>
              <p className="text-xs text-slate-400">Update critical medical data & emergency contacts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Blood Group & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Blood Group</label>
              <select
                value={formData.blood_group || ''}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Contact Relationship</label>
              <input
                type="text"
                placeholder="e.g. Spouse, Parent, Sibling"
                value={formData.relationship || ''}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
              />
            </div>
          </div>

          {/* Emergency Contact Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Emergency Contact Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={formData.emergency_contact_name || ''}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Emergency Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +1 555-0199"
                value={formData.emergency_contact_phone || ''}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
              />
            </div>
          </div>

          {/* Allergies & Conditions */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Known Drug / Food Allergies</label>
            <textarea
              rows={2}
              placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
              value={formData.allergies || ''}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Pre-Existing Medical Conditions</label>
            <textarea
              rows={2}
              placeholder="e.g. Asthma, Type 2 Diabetes, Hypertension"
              value={formData.medical_conditions || ''}
              onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
            />
          </div>

          {/* Doctor Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Primary Doctor Name</label>
              <input
                type="text"
                placeholder="e.g. Dr. Sarah Jenkins"
                value={formData.doctor_name || ''}
                onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Doctor Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +1 555-0144"
                value={formData.doctor_phone || ''}
                onChange={(e) => setFormData({ ...formData, doctor_phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
              />
            </div>
          </div>

          {/* Important Notes */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Important Medical Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Pacemaker implanted, Requires insulin before breakfast"
              value={formData.important_notes || ''}
              onChange={(e) => setFormData({ ...formData, important_notes: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-rose-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Emergency Info</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmergencyInfoModal;
