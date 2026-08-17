import api from './api';
import { Medicine, MedicineCreateData, Reminder, MedicationLog } from '../types';

export const medicinesService = {
  async createMedicine(data: MedicineCreateData): Promise<Medicine> {
    const response = await api.post<Medicine>('/medicines', data);
    return response.data;
  },

  async updateMedicine(id: number, data: MedicineCreateData): Promise<Medicine> {
    const response = await api.put<Medicine>(`/medicines/${id}`, data);
    return response.data;
  },

  async deleteMedicine(id: number, reason?: string): Promise<void> {
    const url = reason ? `/medicines/${id}?reason=${encodeURIComponent(reason)}` : `/medicines/${id}`;
    await api.delete(url);
  },

  async getMedicines(patientId?: number, includeArchived: boolean = false): Promise<Medicine[]> {
    let url = patientId ? `/medicines?patient_id=${patientId}` : '/medicines';
    if (includeArchived) {
      url += (url.includes('?') ? '&' : '?') + 'include_archived=true';
    }
    const response = await api.get<Medicine[]>(url);
    return response.data;
  },

  async getTodayReminders(patientId?: number): Promise<Reminder[]> {
    const url = patientId ? `/medicines/reminders/today?patient_id=${patientId}` : '/medicines/reminders/today';
    const response = await api.get<Reminder[]>(url);
    return response.data;
  },

  async updateReminderStatus(id: number, statusUpdate: 'taken' | 'missed'): Promise<Reminder> {
    const response = await api.put<Reminder>(`/medicines/reminders/${id}/status?status_update=${statusUpdate}`);
    return response.data;
  },

  async getMedicationLogs(patientId?: number): Promise<MedicationLog[]> {
    const url = patientId ? `/medicines/medication-logs?patient_id=${patientId}` : '/medicines/medication-logs';
    const response = await api.get<MedicationLog[]>(url);
    return response.data;
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
    const response = await api.post<Medicine>(`/medicines/${medicineId}/refill?additional_days=${additionalDays}`);
    return response.data;
  },

  async sendRefillEmail(medicineId: number): Promise<any> {
    const response = await api.post(`/medicines/${medicineId}/send-refill-email`);
    return response.data;
  },

  async checkDrugInteractions(): Promise<{ warnings: Array<{ medication: string; severity: string; warning: string }> }> {
    const response = await api.get('/medicines/check-interactions');
    return response.data;
  }
};

