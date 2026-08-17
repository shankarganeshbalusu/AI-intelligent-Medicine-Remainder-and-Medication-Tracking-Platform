import api from './api';
import { User, Association, ProfileUpdateData, PasswordChangeData, EmergencyInfo } from '../types';

export const usersService = {
  async getMe(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  async updateProfile(data: ProfileUpdateData): Promise<User> {
    const response = await api.put<User>('/users/me', data);
    return response.data;
  },

  async changePassword(data: PasswordChangeData): Promise<any> {
    const response = await api.put('/users/me/password', data);
    return response.data;
  },

  async linkCaregiver(caregiverEmail: string): Promise<Association> {
    const response = await api.post<Association>('/users/link-caregiver', { caregiver_email: caregiverEmail });
    return response.data;
  },

  async linkPatient(patientEmail: string): Promise<Association> {
    const response = await api.post<Association>('/users/link-patient', { patient_email: patientEmail });
    return response.data;
  },

  async getAssociations(): Promise<Association[]> {
    const response = await api.get<Association[]>('/users/associations');
    return response.data;
  },

  async respondToAssociation(id: number, statusUpdate: 'active' | 'rejected'): Promise<Association> {
    const response = await api.put<Association>(`/users/associations/${id}?status_update=${statusUpdate}`);
    return response.data;
  },

  async deleteAssociation(id: number): Promise<any> {
    const response = await api.delete(`/users/associations/${id}`);
    return response.data;
  },

  async sendTestEmail(email: string): Promise<any> {
    const response = await api.post('/users/send-test-email', { email });
    return response.data;
  },

  async askChatbot(message: string): Promise<{ reply: string }> {
    const response = await api.post<{ reply: string }>('/users/me/chatbot', { message });
    return response.data;
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/users/me');
  },

  async getEmergencyInfo(): Promise<EmergencyInfo> {
    const response = await api.get<EmergencyInfo>('/users/emergency-info');
    return response.data;
  },

  async updateEmergencyInfo(data: EmergencyInfo): Promise<EmergencyInfo> {
    const response = await api.put<EmergencyInfo>('/users/emergency-info', data);
    return response.data;
  },

  async getPatientEmergencyInfo(patientId: number): Promise<EmergencyInfo> {
    const response = await api.get<EmergencyInfo>(`/users/patients/${patientId}/emergency-info`);
    return response.data;
  }
};

