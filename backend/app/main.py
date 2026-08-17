from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routes import auth, users, medicines, admin
from app import email_worker
import asyncio

# Auto-create SQLite database tables on startup
try:
    Base.metadata.create_all(bind=engine)
except Exception as db_err:
    print("[DB CREATION WARNING]", db_err)

app = FastAPI(
    title="PillSync: Medication Reminder and Adherence Platform",
    description="Backend services for PillSync, including user accounts, profile management, and caregiver linking.",
    version="1.0.0"
)

# Configure CORS so our React frontend can consume the APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. Limit this in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import Response

@app.middleware("http")
async def head_request_middleware(request: Request, call_next):
    if request.method == "HEAD":
        return Response(status_code=200)
    return await call_next(request)

# Register endpoints routers with both /api and root prefixes for Vercel Serverless routing compatibility
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(medicines.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(medicines.router)
app.include_router(admin.router)

def seed_initial_database():
    try:
        from app.database import SessionLocal
        from app import models, auth
        from sqlalchemy import func
        db = SessionLocal()
        
        # Seed Admin
        admin_user = db.query(models.User).filter(func.lower(models.User.email) == "admin@pillsync.com").first()
        if not admin_user:
            admin_user = models.User(
                name="System Administrator",
                email="admin@pillsync.com",
                notification_email="admin@pillsync.com",
                password_hash=auth.get_password_hash("AdminPillSync123!"),
                role="admin",
                is_verified=True
            )
            db.add(admin_user)
            try:
                db.commit()
            except Exception:
                db.rollback()
        else:
            admin_user.password_hash = auth.get_password_hash("AdminPillSync123!")
            admin_user.is_verified = True
            try:
                db.commit()
            except Exception:
                db.rollback()

        # Seed Patient
        patient_user = db.query(models.User).filter(func.lower(models.User.email) == "shankarganeshbalusu@gmail.com").first()
        if not patient_user:
            patient_user = models.User(
                name="Shankar Ganesh",
                email="shankarganeshbalusu@gmail.com",
                notification_email="shankarganeshbalusu@gmail.com",
                password_hash=auth.get_password_hash("Patient123!"),
                role="patient",
                is_verified=True
            )
            db.add(patient_user)
            try:
                db.commit()
            except Exception:
                db.rollback()
        else:
            patient_user.password_hash = auth.get_password_hash("Patient123!")
            patient_user.is_verified = True
            try:
                db.commit()
            except Exception:
                db.rollback()

        # Seed Caregiver
        caregiver_user = db.query(models.User).filter(func.lower(models.User.email) == "maths4412@gmail.com").first()
        if not caregiver_user:
            caregiver_user = models.User(
                name="Maths Caregiver",
                email="maths4412@gmail.com",
                notification_email="maths4412@gmail.com",
                password_hash=auth.get_password_hash("Caregiver123!"),
                role="caregiver",
                is_verified=True
            )
            db.add(caregiver_user)
            try:
                db.commit()
            except Exception:
                db.rollback()
        else:
            caregiver_user.password_hash = auth.get_password_hash("Caregiver123!")
            caregiver_user.is_verified = True
            try:
                db.commit()
            except Exception:
                db.rollback()

        # Link Patient & Caregiver
        if patient_user and caregiver_user:
            link = db.query(models.PatientCaregiver).filter(
                models.PatientCaregiver.patient_id == patient_user.id,
                models.PatientCaregiver.caregiver_id == caregiver_user.id
            ).first()
            if not link:
                link = models.PatientCaregiver(patient_id=patient_user.id, caregiver_id=caregiver_user.id, status="active")
                db.add(link)
                try:
                    db.commit()
                except Exception:
                    db.rollback()

        # Seed Patient Medicines and Medication Logs
        if patient_user:
            med_count = db.query(models.Medicine).filter(models.Medicine.user_id == patient_user.id).count()
            if med_count == 0:
                sample_meds = [
                    models.Medicine(user_id=patient_user.id, name="Pantop 40", dosage="40mg", quantity=30, times_per_day=1, custom_times="08:00", duration_days=30, days_of_week="Daily", food_relation="Before Breakfast", is_archived=False),
                    models.Medicine(user_id=patient_user.id, name="Glycomet SR 500", dosage="500mg", quantity=60, times_per_day=2, custom_times="09:00,21:00", duration_days=30, days_of_week="Daily", food_relation="After Meals", is_archived=False),
                    models.Medicine(user_id=patient_user.id, name="Glucored Forte", dosage="5mg/500mg", quantity=30, times_per_day=1, custom_times="09:00", duration_days=30, days_of_week="Daily", food_relation="After Breakfast", is_archived=False),
                    models.Medicine(user_id=patient_user.id, name="Lonezep 1mg", dosage="1mg", quantity=15, times_per_day=1, custom_times="22:00", duration_days=15, days_of_week="Daily", food_relation="Before Bed", is_archived=False),
                    models.Medicine(user_id=patient_user.id, name="Lecalm Plus", dosage="5mg", quantity=30, times_per_day=1, custom_times="21:30", duration_days=30, days_of_week="Daily", food_relation="After Dinner", is_archived=False),
                    models.Medicine(user_id=patient_user.id, name="Divalproex ER 250", dosage="250mg", quantity=30, times_per_day=1, custom_times="22:00", duration_days=30, days_of_week="Daily", food_relation="Before Bed", is_archived=False),
                    models.Medicine(user_id=patient_user.id, name="Atos 10", dosage="10mg", quantity=30, times_per_day=1, custom_times="21:00", duration_days=30, days_of_week="Daily", food_relation="After Dinner", is_archived=False)
                ]
                for m in sample_meds:
                    db.add(m)
                try:
                    db.commit()
                except Exception:
                    db.rollback()

            # Seed Medication Logs
            log_count = db.query(models.MedicationLog).filter(models.MedicationLog.user_id == patient_user.id).count()
            if log_count == 0:
                sample_logs = [
                    models.MedicationLog(user_id=patient_user.id, medicine_name="Pantop 40", status="taken", logged_at=datetime.datetime.utcnow() - datetime.timedelta(hours=6)),
                    models.MedicationLog(user_id=patient_user.id, medicine_name="Glycomet SR 500", status="taken", logged_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5)),
                    models.MedicationLog(user_id=patient_user.id, medicine_name="Glucored Forte", status="taken", logged_at=datetime.datetime.utcnow() - datetime.timedelta(hours=4)),
                    models.MedicationLog(user_id=patient_user.id, medicine_name="Lonezep 1mg", status="taken", logged_at=datetime.datetime.utcnow() - datetime.timedelta(hours=3)),
                    models.MedicationLog(user_id=patient_user.id, medicine_name="Lecalm Plus", status="taken", logged_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)),
                    models.MedicationLog(user_id=patient_user.id, medicine_name="Divalproex ER 250", status="taken", logged_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1)),
                    models.MedicationLog(user_id=patient_user.id, medicine_name="Atos 10", status="taken", logged_at=datetime.datetime.utcnow())
                ]
                for l in sample_logs:
                    db.add(l)
                try:
                    db.commit()
                except Exception:
                    db.rollback()

            # Seed Audit Logs
            audit_count = db.query(models.AuditLog).count()
            if audit_count == 0:
                sample_audits = [
                    models.AuditLog(user_id=patient_user.id, action="Logged Doses Batch", event_type="dose", target="Medication Checklist", details="Marked 7 scheduled doses as taken"),
                    models.AuditLog(user_id=admin_user.id if admin_user else 1, action="System Maintenance", event_type="system", target="Database", details="Auto-initialized PillSync Healthcare SaaS Admin platform")
                ]
                for a in sample_audits:
                    db.add(a)
                try:
                    db.commit()
                except Exception:
                    db.rollback()

        # Emergency info
        if patient_user:
            emg = db.query(models.EmergencyInfo).filter(models.EmergencyInfo.user_id == patient_user.id).first()
            if not emg:
                emg = models.EmergencyInfo(
                    user_id=patient_user.id,
                    blood_group="O+",
                    emergency_contact_name="Ramesh Balusu",
                    emergency_contact_phone="+91 9876543210",
                    contact_relationship="Father",
                    allergies="Penicillin",
                    medical_conditions="Mild Asthma",
                    doctor_name="Dr. V. K. Sharma",
                    doctor_phone="+91 9123456789"
                )
                db.add(emg)
                try:
                    db.commit()
                except Exception:
                    db.rollback()
        db.close()
    except Exception as err:
        print("[AUTO-SEED WARNING]", err)

@app.on_event("startup")
async def startup_event():
    seed_initial_database()
    asyncio.create_task(email_worker.check_and_send_reminders())

@app.get("/")
def root_check():
    return {
        "status": "online",
        "service": "PillSync Backend REST API",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "pillsync-backend"}

