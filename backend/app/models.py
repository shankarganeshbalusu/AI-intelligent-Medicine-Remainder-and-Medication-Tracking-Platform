import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    notification_email = Column(String, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="patient")  # patient, caregiver, admin
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String, nullable=True)
    google_otp_code = Column(String, nullable=True)
    google_otp_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    medicines = relationship("Medicine", back_populates="user", cascade="all, delete-orphan")
    medication_logs = relationship("MedicationLog", back_populates="user", cascade="all, delete-orphan")
    
    # As patient: list of caregiver assignments
    caregiver_links = relationship(
        "PatientCaregiver",
        foreign_keys="[PatientCaregiver.patient_id]",
        back_populates="patient",
        cascade="all, delete-orphan"
    )
    
    # As caregiver: list of patient assignments
    patient_links = relationship(
        "PatientCaregiver",
        foreign_keys="[PatientCaregiver.caregiver_id]",
        back_populates="caregiver",
        cascade="all, delete-orphan"
    )


class PatientCaregiver(Base):
    __tablename__ = "patient_caregivers"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    caregiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")  # pending, active, rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], back_populates="caregiver_links")
    caregiver = relationship("User", foreign_keys=[caregiver_id], back_populates="patient_links")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    generic_name = Column(String, nullable=True)
    dosage = Column(String, nullable=False)  # e.g., "500mg" or "1 tablet"
    quantity = Column(Integer, nullable=False)  # total quantity of medicine, e.g. 60 pills
    times_per_day = Column(Integer, nullable=False)  # frequency
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    duration_days = Column(Integer, nullable=False)
    custom_times = Column(String, nullable=True)  # e.g. "08:30,20:00"
    days_of_week = Column(String, nullable=True, default="Daily")  # e.g. "Monday,Wednesday"
    source = Column(String, default="manual")  # manual, prescription, lookup
    food_relation = Column(String, default="No Preference")  # "Before Food", "After Food", "No Preference"
    notifications_enabled = Column(Boolean, default=True, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    discontinue_reason = Column(String, nullable=True, default="Discontinued / Removed")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="medicines")
    reminders = relationship("Reminder", back_populates="medicine", cascade="all, delete-orphan")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    dose_time = Column(String, nullable=False)  # e.g., "08:00", "20:00" (HH:MM format)
    reminder_date = Column(DateTime, nullable=False)  # The date this reminder is scheduled for
    status = Column(String, default="pending")  # pending, notified, taken, missed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    medicine = relationship("Medicine", back_populates="reminders")
    logs = relationship("MedicationLog", back_populates="reminder", cascade="all, delete-orphan")


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    reminder_id = Column(Integer, ForeignKey("reminders.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False)  # taken, missed
    logged_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    reminder = relationship("Reminder", back_populates="logs")
    user = relationship("User", back_populates="medication_logs")


class DrugReference(Base):
    __tablename__ = "drug_references"

    id = Column(Integer, primary_key=True, index=True)
    condition = Column(String, index=True, nullable=False)  # e.g., "Hypertension"
    age_min = Column(Integer, nullable=False)
    age_max = Column(Integer, nullable=False)
    medicine_category = Column(String, nullable=False)  # e.g., "Beta-blocker"
    notes = Column(Text, nullable=True)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    event_type = Column(String, nullable=False)  # auth, medicine, user, caregiver, system
    target = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User")


class EmergencyInfo(Base):
    __tablename__ = "emergency_info"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    blood_group = Column(String, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    contact_relationship = Column("relationship", String, nullable=True)
    allergies = Column(Text, nullable=True)
    medical_conditions = Column(Text, nullable=True)
    important_notes = Column(Text, nullable=True)
    doctor_name = Column(String, nullable=True)
    doctor_phone = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationship
    user_rel = relationship("User", backref="emergency_info")



