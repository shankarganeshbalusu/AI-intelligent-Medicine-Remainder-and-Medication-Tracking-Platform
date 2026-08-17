import api from './api';
import { UserLoginCredentials, UserRegisterData, AuthResponse, ResetPasswordData, GoogleAuthData } from '../types';

export const authService = {
  async login(credentials: UserLoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const data = response.data;
    
    // Save to local storage
    localStorage.setItem('pillsync_token', data.access_token);
    localStorage.setItem('pillsync_user_id', String(data.user_id));
    localStorage.setItem('pillsync_user_role', data.role);
    localStorage.setItem('pillsync_user_name', data.name);
    localStorage.setItem('pillsync_user_email', data.email);
    
    return data;
  },

  async register(data: UserRegisterData): Promise<any> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async googleLogin(data: GoogleAuthData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/google-login', data);
    const authData = response.data;
    
    localStorage.setItem('pillsync_token', authData.access_token);
    localStorage.setItem('pillsync_user_id', String(authData.user_id));
    localStorage.setItem('pillsync_user_role', authData.role);
    localStorage.setItem('pillsync_user_name', authData.name);
    localStorage.setItem('pillsync_user_email', authData.email);
    
    return authData;
  },

  async googleSendOTP(email: string, role: string = 'patient'): Promise<any> {
    const response = await api.post('/auth/google-send-otp', { email, role });
    return response.data;
  },

  async googleVerifyOTP(email: string, otp_code: string, role: string = 'patient'): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/google-verify-otp', { email, otp_code, role });
    const authData = response.data;
    
    localStorage.setItem('pillsync_token', authData.access_token);
    localStorage.setItem('pillsync_user_id', String(authData.user_id));
    localStorage.setItem('pillsync_user_role', authData.role);
    localStorage.setItem('pillsync_user_name', authData.name);
    localStorage.setItem('pillsync_user_email', authData.email);
    
    return authData;
  },

  async forgotPassword(email: string): Promise<any> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(data: ResetPasswordData): Promise<any> {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  async verifyEmail(email: string, token: string): Promise<any> {
    const response = await api.post('/auth/verify-email', { email, token });
    return response.data;
  },

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('pillsync_token');
  },

  getCurrentUser() {
    const token = localStorage.getItem('pillsync_token');
    if (!token) return null;
    
    return {
      token,
      userId: Number(localStorage.getItem('pillsync_user_id')),
      role: localStorage.getItem('pillsync_user_role') || '',
      name: localStorage.getItem('pillsync_user_name') || '',
      email: localStorage.getItem('pillsync_user_email') || '',
    };
  }
};
