export interface User {
  id: number;
  name: string;
  email: string;
  notification_email?: string;
  role: string;
  created_at: string;
}

export interface UserLoginCredentials {
  email: string;
  password_hash?: string;
  password?: string;
}

export interface UserRegisterData {
  name: string;
  email: string;
  password?: string;
  password_hash?: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  role: string;
  name: string;
  email: string;
}

export interface Association {
  id: number;
  patient_id: number;
  caregiver_id: number;
  status: string;
  created_at: string;
  patient_name: string;
  patient_email: string;
  caregiver_name: string;
  caregiver_email: string;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  notification_email?: string;
  role?: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export interface Medicine {
  id: number;
  user_id: number;
  name: string;
  generic_name?: string;
  dosage: string;
  quantity: number;
  times_per_day: number;
  start_date: string;
  duration_days: number;
  custom_times?: string;
  days_of_week?: string;
  source: string;
  food_relation?: string;
  notifications_enabled?: boolean;
  is_archived?: boolean;
  discontinue_reason?: string;
  created_at: string;
}

export interface MedicineCreateData {
  name: string;
  generic_name?: string;
  dosage: string;
  quantity: number;
  times_per_day: number;
  duration_days: number;
  custom_times?: string;
  days_of_week?: string;
  food_relation?: string;
  notifications_enabled?: boolean;
}

export interface Reminder {
  id: number;
  medicine_id: number;
  dose_time: string;
  reminder_date: string;
  status: string;
  created_at: string;
  medicine_name?: string;
  medicine_dosage?: string;
  medicine_food_relation?: string;
}

export interface MedicationLog {
  id: number;
  reminder_id: number;
  user_id: number;
  status: string;
  logged_at: string;
  medicine_name?: string;
  dose_time?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  new_password: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleAuthData {
  credential?: string;
  email?: string;
  name?: string;
  role?: string;
}

export interface AdminStats {
  total_users: number;
  total_patients: number;
  total_caregivers: number;
  total_medicines: number;
  active_medicines: number;
  completed_treatments: number;
  discontinued_medicines: number;
  low_stock_medicines: number;
}

export interface PatientListItem {
  id: number;
  name: string;
  email: string;
  notification_email?: string;
  is_verified: boolean;
  assigned_caregiver?: string;
  medicine_count: number;
  created_at?: string;
  last_activity?: string;
}

export interface PatientDetail {
  id: number;
  name: string;
  email: string;
  notification_email?: string;
  is_verified: boolean;
  created_at?: string;
  adherence_score: number;
  total_logged_doses: number;
  caregivers: Array<{
    link_id: number;
    caregiver_id: number;
    caregiver_name: string;
    caregiver_email: string;
    status: string;
  }>;
  active_medicines: Array<Medicine>;
  archived_medicines: Array<{
    id: number;
    name: string;
    dosage: string;
    discontinue_reason?: string;
    created_at?: string;
  }>;
  recent_logs: Array<{
    id: number;
    medicine_name: string;
    dosage: string;
    status: string;
    logged_at?: string;
  }>;
}

export interface CaregiverListItem {
  id: number;
  name: string;
  email: string;
  notification_email?: string;
  is_verified: boolean;
  assigned_patients_count: number;
  assigned_patient_names: string[];
  created_at?: string;
}

export interface AdminMedicineItem {
  id: number;
  name: string;
  generic_name?: string;
  patient_name: string;
  patient_id: number;
  dosage: string;
  quantity: number;
  times_per_day: number;
  custom_times?: string;
  status: string;
  is_archived: boolean;
  discontinue_reason?: string;
  days_left: number;
  is_low_stock: boolean;
  start_date?: string;
  duration_days: number;
  food_relation?: string;
}

export interface AdminActivityItem {
  id: string;
  user_name: string;
  user_email: string;
  event_type: string;
  action: string;
  status: string;
  timestamp: string;
}

export interface AdminRefillItem {
  medicine_id: number;
  medicine_name: string;
  patient_name: string;
  patient_email: string;
  notification_email?: string;
  current_stock: number;
  times_per_day: number;
  days_left: number;
  refill_status: string;
  is_critical: boolean;
  start_date?: string;
}

export interface AdminNotificationItem {
  id: string;
  recipient_role: 'patient' | 'caregiver';
  recipient_name: string;
  recipient_email: string;
  medicine_name: string;
  dose_time: string;
  scheduled_date: string;
  notification_type: string;
  status: string;
  routing_rule: string;
}

export interface AdminReportsData {
  role_distribution: Array<{ name: string; value: number }>;
  medication_status_distribution: Array<{ name: string; value: number }>;
  adherence_metrics: {
    overall_adherence_percentage: number;
    taken_doses: number;
    missed_doses: number;
    total_doses_logged: number;
  };
}

export interface AuditLogItem {
  id: number;
  performer_name: string;
  action: string;
  event_type: string;
  target?: string;
  details?: string;
  timestamp?: string;
}

export interface EmergencyInfo {
  id?: number;
  user_id?: number;
  patient_name?: string;
  patient_email?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  relationship?: string;
  allergies?: string;
  medical_conditions?: string;
  important_notes?: string;
  doctor_name?: string;
  doctor_phone?: string;
  updated_at?: string;
}



