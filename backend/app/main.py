from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routes import auth, users, medicines, admin
from app import email_worker
import asyncio

# Auto-create SQLite database tables on startup
Base.metadata.create_all(bind=engine)

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

# Register endpoints routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(medicines.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

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

