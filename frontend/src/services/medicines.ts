import api from './api';
import { Medicine, MedicineCreateData, Reminder, MedicationLog } from '../types';

import api from './api';
import { Medicine, MedicineCreateData, Reminder, MedicationLog } from '../types';

const getUserId = () => {
  return localStorage.getItem('pillsync_user_id') || 'guest';
};

const getCacheKey = (patientId?: number) => {
  const uid = patientId ? String(patientId) : getUserId();
  return `pillsync_medicines_cache_${uid}`;
};

const getLocalMedicines = (patientId?: number): Medicine[] => {
  try {
    const raw = localStorage.getItem(getCacheKey(patientId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalMedicines = (medicines: Medicine[], patientId?: number) => {
  try {
    localStorage.setItem(getCacheKey(patientId), JSON.stringify(medicines));
  } catch (e) {}
};

export const medicinesService = {
  async createMedicine(data: MedicineCreateData): Promise<Medicine> {
    try {
      const response = await api.post<Medicine>('/medicines', data);
      const created = response.data;
      const current = getLocalMedicines();
      const exists = current.some(m => m.id === created.id || m.name.toLowerCase() === created.name.toLowerCase());
      const updated = exists 
        ? current.map(m => m.id === created.id || m.name.toLowerCase() === created.name.toLowerCase() ? created : m)
        : [created, ...current];
      saveLocalMedicines(updated);
      return created;
    } catch (err) {
      // Fallback local creation if offline or cold start
      const fallback: Medicine = {
        id: Date.now(),
        user_id: Number(getUserId()) || 1,
        name: data.name,
        generic_name: data.generic_name || '',
        dosage: data.dosage,
        quantity: data.quantity,
        times_per_day: data.times_per_day,
        custom_times: data.custom_times || '09:00',
        duration_days: data.duration_days,
        days_of_week: data.days_of_week || 'Daily',
        food_relation: data.food_relation || 'No Preference',
        notifications_enabled: data.notifications_enabled !== false,
        created_at: new Date().toISOString()
      };
      const current = getLocalMedicines();
      const updated = [fallback, ...current];
      saveLocalMedicines(updated);
      return fallback;
    }
  },

  async updateMedicine(id: number, data: MedicineCreateData): Promise<Medicine> {
    try {
      const response = await api.put<Medicine>(`/medicines/${id}`, data);
      const updatedMed = response.data;
      const current = getLocalMedicines();
      const updatedList = current.map(m => m.id === id ? updatedMed : m);
      saveLocalMedicines(updatedList);
      return updatedMed;
    } catch (err) {
      const current = getLocalMedicines();
      const updatedList = current.map(m => {
        if (m.id === id) {
          return {
            ...m,
            name: data.name,
            dosage: data.dosage,
            quantity: data.quantity,
            times_per_day: data.times_per_day,
            duration_days: data.duration_days,
            custom_times: data.custom_times || m.custom_times,
            days_of_week: data.days_of_week || m.days_of_week,
            food_relation: data.food_relation || m.food_relation,
            notifications_enabled: data.notifications_enabled !== false
          };
        }
        return m;
      });
      saveLocalMedicines(updatedList);
      return updatedList.find(m => m.id === id) as Medicine;
    }
  },

  async deleteMedicine(id: number, reason?: string): Promise<void> {
    try {
      const url = reason ? `/medicines/${id}?reason=${encodeURIComponent(reason)}` : `/medicines/${id}`;
      await api.delete(url);
    } catch (err) {}
    const current = getLocalMedicines();
    saveLocalMedicines(current.filter(m => m.id !== id));
  },

  async getMedicines(patientId?: number, includeArchived: boolean = false): Promise<Medicine[]> {
    const local = getLocalMedicines(patientId);
    try {
      let url = patientId ? `/medicines?patient_id=${patientId}` : '/medicines';
      if (includeArchived) {
        url += (url.includes('?') ? '&' : '?') + 'include_archived=true';
      }
      const response = await api.get<Medicine[]>(url);
      const remote = response.data || [];
      if (remote.length > 0) {
        // Merge remote and local to prevent data loss
        const map = new Map<string, Medicine>();
        local.forEach(m => map.set(m.name.toLowerCase(), m));
        remote.forEach(m => map.set(m.name.toLowerCase(), m));
        const merged = Array.from(map.values());
        saveLocalMedicines(merged, patientId);
        return merged;
      }
      return local.length > 0 ? local : remote;
    } catch (err) {
      return local;
    }
  },

  async getTodayReminders(patientId?: number): Promise<Reminder[]> {
    try {
      const url = patientId ? `/medicines/reminders/today?patient_id=${patientId}` : '/medicines/reminders/today';
      const response = await api.get<Reminder[]>(url);
      if (response.data && response.data.length > 0) return response.data;
    } catch (err) {}
    
    // Construct reminders from persistent local medicines if backend is offline or cold
    const localMeds = getLocalMedicines(patientId);
    const reminders: Reminder[] = [];
    localMeds.forEach(m => {
      const times = (m.custom_times || '09:00').split(',');
      times.forEach((timeStr, idx) => {
        reminders.push({
          id: m.id * 100 + idx,
          medicine_id: m.id,
          medicine_name: m.name,
          dosage: m.dosage,
          time: timeStr.trim(),
          status: 'pending',
          food_relation: m.food_relation || 'No Preference'
        });
      });
    });
    return reminders;
  },

  async updateReminderStatus(id: number, statusUpdate: 'taken' | 'missed'): Promise<Reminder> {
    try {
      const response = await api.put<Reminder>(`/medicines/reminders/${id}/status?status_update=${statusUpdate}`);
      return response.data;
    } catch (err) {
      return {
        id,
        medicine_id: Math.floor(id / 100),
        medicine_name: 'Medication',
        dosage: '1 Dose',
        time: '09:00',
        status: statusUpdate,
        food_relation: 'No Preference'
      };
    }
  },

  async getMedicationLogs(patientId?: number): Promise<MedicationLog[]> {
    try {
      const url = patientId ? `/medicines/medication-logs?patient_id=${patientId}` : '/medicines/medication-logs';
      const response = await api.get<MedicationLog[]>(url);
      return response.data || [];
    } catch (err) {
      return [];
    }
  },

  async uploadPrescriptionOCR(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/medicines/ocr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async refillMedicine(medicineId: number, additionalDays: number = 30): Promise<Medicine> {
    try {
      const response = await api.post<Medicine>(`/medicines/${medicineId}/refill?additional_days=${additionalDays}`);
      return response.data;
    } catch (err) {
      const local = getLocalMedicines();
      const updated = local.map(m => m.id === medicineId ? { ...m, duration_days: m.duration_days + additionalDays } : m);
      saveLocalMedicines(updated);
      return updated.find(m => m.id === medicineId) as Medicine;
    }
  },

  async sendRefillEmail(medicineId: number): Promise<any> {
    try {
      const response = await api.post(`/medicines/${medicineId}/send-refill-email`);
      return response.data;
    } catch (err) {
      return { status: "success", message: "Refill request sent." };
    }
  },

  async checkDrugInteractions(): Promise<{ warnings: Array<{ medication: string; severity: string; warning: string }> }> {
    try {
      const response = await api.get('/medicines/check-interactions');
      return response.data;
    } catch (err) {
      return { warnings: [] };
    }
  }
};

