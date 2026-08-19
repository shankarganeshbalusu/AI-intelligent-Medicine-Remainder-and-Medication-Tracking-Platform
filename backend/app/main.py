import asyncio
import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.database import engine, Base, SessionLocal
from app.routes import auth, users, medicines, admin
from app import email_worker, models, auth as app_auth

# Auto-create SQLite database tables on startup
try:
    Base.metadata.create_all(bind=engine)
except Exception as db_err:
    print("[DB CREATION WARNING]", db_err)

def seed_initial_database():
    """Ensures all essential admin, patient, caregiver accounts, active medicines, reminders, and audit logs are present."""
    db = SessionLocal()
    try:
        from sqlalchemy import func

        # 1. Seed Admin
        admin_user = db.query(models.User).filter(func.lower(models.User.email) == "admin@pillsync.com").first()
        if not admin_user:
            admin_user = models.User(
                name="System Administrator",
                email="admin@pillsync.com",
                notification_email="admin@pillsync.com",
                password_hash=app_auth.get_password_hash("AdminPillSync123!"),
                role="admin",
                is_verified=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        else:
            admin_user.password_hash = app_auth.get_password_hash("AdminPillSync123!")
            admin_user.is_verified = True
            db.commit()

        # 2. Seed Primary Patients
        patient_emails = ["shankarganeshbalusu@gmail.com", "sbalusu4@gitam.in"]
        patient_users = []
        for p_email in patient_emails:
            p_user = db.query(models.User).filter(func.lower(models.User.email) == p_email).first()
            if not p_user:
                p_user = models.User(
                    name="Shankar Ganesh",
                    email=p_email,
                    notification_email=p_email,
                    password_hash=app_auth.get_password_hash("Patient123!"),
                    role="patient",
                    is_verified=True
                )
                db.add(p_user)
                db.commit()
                db.refresh(p_user)
            else:
                p_user.password_hash = app_auth.get_password_hash("Patient123!")
                p_user.is_verified = True
                db.commit()
            patient_users.append(p_user)

        # 3. Seed Caregiver
        caregiver_user = db.query(models.User).filter(func.lower(models.User.email) == "maths4412@gmail.com").first()
        if not caregiver_user:
            caregiver_user = models.User(
                name="Maths Caregiver",
                email="maths4412@gmail.com",
                notification_email="maths4412@gmail.com",
                password_hash=app_auth.get_password_hash("Caregiver123!"),
                role="caregiver",
                is_verified=True
            )
            db.add(caregiver_user)
            db.commit()
            db.refresh(caregiver_user)
        else:
            caregiver_user.password_hash = app_auth.get_password_hash("Caregiver123!")
            caregiver_user.is_verified = True
            db.commit()

        # 4. Link All Patients with Caregiver
        if caregiver_user:
            for p_user in patient_users:
                link = db.query(models.PatientCaregiver).filter(
                    models.PatientCaregiver.patient_id == p_user.id,
                    models.PatientCaregiver.caregiver_id == caregiver_user.id
                ).first()
                if not link:
                    link = models.PatientCaregiver(patient_id=p_user.id, caregiver_id=caregiver_user.id, status="active")
                    db.add(link)
                    db.commit()

        # 5. Seed Patient Medicines, Today's Reminders & Logs
        today_date = datetime.datetime.combine(datetime.date.today(), datetime.time.min)
        now_dt = datetime.datetime.utcnow()

        for p_user in patient_users:
            med_count = db.query(models.Medicine).filter(models.Medicine.user_id == p_user.id).count()
            if med_count == 0:
                sample_med_data = [
                    ("Pantop 40", "Pantoprazole", "40mg", 30, 1, "08:00", 30, "Before Breakfast", False, None),
                    ("Glycomet SR 500", "Metformin Hydrochloride", "500mg", 60, 2, "09:00,21:00", 30, "After Meals", False, None),
                    ("Glucored Forte", "Glibenclamide + Metformin", "5mg/500mg", 30, 1, "09:00", 30, "After Breakfast", False, None),
                    ("Lonezep 1mg", "Clonazepam", "1mg", 15, 1, "22:00", 15, "Before Bed", False, None),
                    ("Lecalm Plus", "Levosulpiride", "5mg", 30, 1, "21:30", 30, "After Dinner", False, None),
                    ("Divalproex ER 250", "Divalproex Sodium", "250mg", 30, 1, "22:00", 30, "Before Bed", False, None),
                    ("Atos 10", "Atorvastatin", "10mg", 30, 1, "21:00", 30, "After Dinner", False, None)
                ]

                created_medicines = []
                for name, gname, dosage, qty, tpd, ctimes, dur, frel, is_arch, dis_reason in sample_med_data:
                    m = models.Medicine(
                        user_id=p_user.id,
                        name=name,
                        generic_name=gname,
                        dosage=dosage,
                        quantity=qty,
                        times_per_day=tpd,
                        custom_times=ctimes,
                        duration_days=dur,
                        days_of_week="Daily",
                        food_relation=frel,
                        is_archived=is_arch,
                        discontinue_reason=dis_reason,
                        notifications_enabled=True,
                        created_at=now_dt - datetime.timedelta(days=2)
                    )
                    db.add(m)
                    db.commit()
                    db.refresh(m)
                    created_medicines.append(m)

                # Seed Reminders & Logs for these medicines
                for idx, m in enumerate(created_medicines):
                    times = m.custom_times.split(",") if m.custom_times else ["09:00"]
                    for t in times:
                        rem = models.Reminder(
                            medicine_id=m.id,
                            dose_time=t.strip(),
                            reminder_date=today_date,
                            status="taken" if idx < 4 else "pending",
                            created_at=now_dt
                        )
                        db.add(rem)
                        db.commit()
                        db.refresh(rem)

                        if idx < 4:
                            log = models.MedicationLog(
                                reminder_id=rem.id,
                                user_id=p_user.id,
                                status="taken",
                                logged_at=now_dt - datetime.timedelta(hours=(6 - idx))
                            )
                            db.add(log)
                            db.commit()

            # Seed Emergency Info
            emg = db.query(models.EmergencyInfo).filter(models.EmergencyInfo.user_id == p_user.id).first()
            if not emg:
                emg = models.EmergencyInfo(
                    user_id=p_user.id,
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
                db.commit()

        # Seed Audit Logs
        audit_count = db.query(models.AuditLog).count()
        if audit_count == 0:
            sample_audits = [
                models.AuditLog(user_id=patient_users[0].id if patient_users else 1, action="Logged Doses Batch", event_type="dose", target="Medication Checklist", details="Marked scheduled doses as taken", timestamp=now_dt - datetime.timedelta(hours=2)),
                models.AuditLog(user_id=admin_user.id if admin_user else 1, action="System Maintenance", event_type="system", target="Database", details="Auto-initialized PillSync Healthcare SaaS Admin platform", timestamp=now_dt)
            ]
            for a in sample_audits:
                db.add(a)
            db.commit()

    except Exception as err:
        print("[AUTO-SEED WARNING]", err)
        try:
            db.rollback()
        except Exception:
            pass
    finally:
        db.close()

# Execute initial seed at startup module import
try:
    seed_initial_database()
except Exception as e:
    print("[IMPORT SEED ERROR]", e)

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

@app.on_event("startup")
async def startup_event():
    seed_initial_database()
    try:
        asyncio.create_task(email_worker.check_and_send_reminders())
    except Exception as e:
        print("[EMAIL WORKER STARTUP WARNING]", e)

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


