import api from './api';
import {
  AdminStats,
  PatientListItem,
  PatientDetail,
  CaregiverListItem,
  AdminMedicineItem,
  AdminActivityItem,
  AdminRefillItem,
  AdminNotificationItem,
  AdminReportsData,
  AuditLogItem
} from '../types';

export const adminService = {
  // 1. Stats
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get<AdminStats>('/admin/stats');
    return response.data;
  },

  // 2. Patients list
  getPatients: async (params?: {
    search?: string;
    status_filter?: string;
    sort_by?: string;
    order?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; limit: number; patients: PatientListItem[] }> => {
    const response = await api.get('/admin/patients', { params });
    return response.data;
  },

  // 3. Patient Detail
  getPatientDetail: async (patientId: number): Promise<PatientDetail> => {
    const response = await api.get<PatientDetail>(`/admin/patients/${patientId}`);
    return response.data;
  },

  // 4. Caregivers list
  getCaregivers: async (params?: {
    search?: string;
    status_filter?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; limit: number; caregivers: CaregiverListItem[] }> => {
    const response = await api.get('/admin/caregivers', { params });
    return response.data;
  },

  // 5. Caregiver Detail
  getCaregiverDetail: async (caregiverId: number): Promise<any> => {
    const response = await api.get(`/admin/caregivers/${caregiverId}`);
    return response.data;
  },

  // 6. Medicines list
  getMedicines: async (params?: {
    search?: string;
    status_filter?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; limit: number; medicines: AdminMedicineItem[] }> => {
    const response = await api.get('/admin/medicines', { params });
    return response.data;
  },

  // 7. Activity feed
  getActivityFeed: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; limit: number; activities: AdminActivityItem[] }> => {
    const response = await api.get('/admin/activity', { params });
    return response.data;
  },

  // 8. Refills
  getRefillTracker: async (): Promise<{ total: number; critical_count: number; refills: AdminRefillItem[] }> => {
    const response = await api.get('/admin/refills');
    return response.data;
  },

  // 9. Notifications Audit
  getNotificationsAudit: async (): Promise<{ total: number; notifications: AdminNotificationItem[] }> => {
    const response = await api.get('/admin/notifications');
    return response.data;
  },

  // 10. Reports
  getReports: async (): Promise<AdminReportsData> => {
    const response = await api.get<AdminReportsData>('/admin/reports');
    return response.data;
  },

  // 11. Audit Logs
  getAuditLogs: async (): Promise<AuditLogItem[]> => {
    const response = await api.get<AuditLogItem[]>('/admin/audit-logs');
    return response.data;
  },

  // 12. Toggle User Verification
  toggleUserStatus: async (userId: number): Promise<{ message: string; is_verified: boolean }> => {
    const response = await api.post(`/admin/users/${userId}/status`);
    return response.data;
  }
};
