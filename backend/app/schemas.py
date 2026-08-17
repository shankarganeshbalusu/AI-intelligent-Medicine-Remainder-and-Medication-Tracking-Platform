from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str  # patient, caregiver, admin

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    notification_email: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    name: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    notification_email: Optional[EmailStr] = None
    role: Optional[str] = None

# Caregiver Patient Link schemas
class CaregiverLinkCreate(BaseModel):
    caregiver_email: EmailStr

class PatientLinkCreate(BaseModel):
    patient_email: EmailStr

class AssociationResponse(BaseModel):
    id: int
    patient_id: int
    caregiver_id: int
    status: str
    created_at: datetime.datetime
    patient_name: str
    patient_email: str
    caregiver_name: str
    caregiver_email: str

    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class MedicineCreate(BaseModel):
    name: str
    generic_name: Optional[str] = None
    dosage: str
    quantity: int
    times_per_day: int
    duration_days: int
    custom_times: Optional[str] = None
    days_of_week: Optional[str] = "Daily"
    food_relation: Optional[str] = "No Preference"
    notifications_enabled: Optional[bool] = True


class MedicineResponse(BaseModel):
    id: int
    name: str
    generic_name: Optional[str] = None
    dosage: str
    quantity: int
    times_per_day: int
    start_date: datetime.datetime
    duration_days: int
    custom_times: Optional[str] = None
    days_of_week: Optional[str] = "Daily"
    source: str
    food_relation: Optional[str] = "No Preference"
    notifications_enabled: bool
    is_archived: Optional[bool] = False
    discontinue_reason: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ReminderResponse(BaseModel):
    id: int
    medicine_id: int
    dose_time: str
    reminder_date: datetime.datetime
    status: str
    created_at: datetime.datetime
    medicine_name: Optional[str] = None
    medicine_dosage: Optional[str] = None
    medicine_food_relation: Optional[str] = None

    class Config:
        from_attributes = True


class MedicationLogResponse(BaseModel):
    id: int
    reminder_id: int
    user_id: int
    status: str
    logged_at: datetime.datetime
    medicine_name: Optional[str] = None
    dose_time: Optional[str] = None

    class Config:
        from_attributes = True


class GoogleAuthRequest(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = "patient"
    credential: Optional[str] = None

class GoogleSendOTPRequest(BaseModel):
    email: EmailStr
    role: Optional[str] = "patient"

class GoogleVerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str
    role: Optional[str] = "patient"

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str


class TestEmailRequest(BaseModel):
    email: EmailStr


class ChatBotRequest(BaseModel):
    message: str

class ChatBotResponse(BaseModel):
    reply: str

class ParsedPrescriptionItem(BaseModel):
    name: str
    generic_name: Optional[str] = None
    dosage: str
    quantity: int
    times_per_day: int
    duration_days: int
    custom_times: Optional[str] = None
    days_of_week: Optional[str] = "Daily"
    food_relation: Optional[str] = "No Preference"
    confidence: Optional[int] = 95
    name_confidence: Optional[int] = 98
    dosage_confidence: Optional[int] = 95
    frequency_confidence: Optional[int] = 94
    instructions: Optional[str] = None

class PrescriptionOCRResponse(BaseModel):
    patient_name: Optional[str] = None
    diagnosis: Optional[str] = None
    medicines: List[ParsedPrescriptionItem]
    is_mock: Optional[bool] = False

class InteractionWarning(BaseModel):
    medication: str
    severity: str
    warning: str

class InteractionCheckResponse(BaseModel):
    warnings: List[InteractionWarning]


# Emergency Info Schemas
class EmergencyInfoBase(BaseModel):
    blood_group: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    relationship: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    important_notes: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_phone: Optional[str] = None

class EmergencyInfoCreate(EmergencyInfoBase):
    pass

class EmergencyInfoResponse(EmergencyInfoBase):
    id: Optional[int] = None
    user_id: Optional[int] = None
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

