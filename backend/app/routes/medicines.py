from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/medicines", tags=["medicines"])

import re

def normalize_time_string(t: str) -> str:
    t = t.strip().upper()
    
    # 1. Match format "6:36 PM" or "06:36 PM" or "6:36PM" or "6:36 AM"
    m = re.match(r'^(\d{1,2}):(\d{2})\s*(AM|PM)?$', t)
    if m:
        hr = int(m.group(1))
        mn = int(m.group(2))
        ampm = m.group(3)
        if ampm:
            if ampm == "PM" and hr < 12:
                hr += 12
            elif ampm == "AM" and hr == 12:
                hr = 0
        return f"{hr:02d}:{mn:02d}"
        
    # 2. Match format "6 PM" or "6PM" or "12 AM"
    m_hour = re.match(r'^(\d{1,2})\s*(AM|PM)$', t)
    if m_hour:
        hr = int(m_hour.group(1))
        ampm = m_hour.group(2)
        if ampm == "PM" and hr < 12:
            hr += 12
        elif ampm == "AM" and hr == 12:
            hr = 0
        return f"{hr:02d}:00"
        
    # 3. Match standard "18:36" or "06:36" (already 24 hour or standard input)
    m_std = re.match(r'^(\d{1,2}):(\d{2})$', t)
    if m_std:
        return f"{int(m_std.group(1)):02d}:{int(m_std.group(2)):02d}"
        
    return t

def generate_reminders_for_medicine(db: Session, medicine: models.Medicine, start_from_date: datetime.date, end_date: datetime.date):
    if medicine.custom_times:
        times = [normalize_time_string(t) for t in medicine.custom_times.split(",") if t.strip()]
    else:
        time_mappings = {
            1: ["09:00"],
            2: ["09:00", "21:00"],
            3: ["09:00", "14:00", "21:00"],
            4: ["09:00", "13:00", "18:00", "22:00"]
        }
        times = time_mappings.get(medicine.times_per_day, ["09:00"])

    selected_days = []
    if medicine.days_of_week and medicine.days_of_week != "Daily":
        selected_days = [d.strip() for d in medicine.days_of_week.split(",") if d.strip()]

    current_date = start_from_date
    while current_date <= end_date:
        weekday = current_date.strftime("%A")
        if not selected_days or weekday in selected_days:
            for t in times:
                reminder = models.Reminder(
                    medicine_id=medicine.id,
                    dose_time=t,
                    reminder_date=datetime.datetime.combine(current_date, datetime.time.min),
                    status="pending"
                )
                db.add(reminder)
        current_date += datetime.timedelta(days=1)

@router.post("", response_model=schemas.MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    medicine_in: schemas.MedicineCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "caregiver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Caregivers have read-only access to patient medicine cabinets. Patients must register their prescriptions from their own account."
        )

    from app.ai_service import verify_medicine_with_ai
    banned_list = ["cocaine", "coca", "heroin", "methamphetamine", "meth", "crystal meth", "lsd", "acid", "ecstasy", "mdma", "weed", "marijuana", "cannabis", "hashish", "crack", "pcp", "angel dust", "magic mushroom", "psilocybin", "speed", "opium", "fentanyl street", "ghb", "rohypnol"]
    name_check = medicine_in.name.strip().lower()
    if any(b in name_check for b in banned_list):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"❌ Rejected: '{medicine_in.name}' is an illegal substance and cannot be added to a medical cabinet. Only valid doctor-prescribed medications are permitted."
        )

    if not verify_medicine_with_ai(medicine_in.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"❌ Unrecognized Medication: '{medicine_in.name}' is not a medically recognized prescription or OTC pharmaceutical. Please check the spelling or enter a valid doctor-prescribed medicine."
        )

    normalized_custom_times = None
    if medicine_in.custom_times:
        normalized_custom_times = ",".join([normalize_time_string(t) for t in medicine_in.custom_times.split(",") if t.strip()])

    db_medicine = models.Medicine(
        user_id=current_user.id,
        name=medicine_in.name,
        generic_name=medicine_in.generic_name,
        dosage=medicine_in.dosage,
        quantity=medicine_in.quantity,
        times_per_day=medicine_in.times_per_day,
        duration_days=medicine_in.duration_days,
        custom_times=normalized_custom_times,
        days_of_week=medicine_in.days_of_week,
        food_relation=medicine_in.food_relation,
        notifications_enabled=medicine_in.notifications_enabled,
        source="manual"
    )
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)

    start_date = datetime.date.today()
    end_date = start_date + datetime.timedelta(days=medicine_in.duration_days - 1)
    generate_reminders_for_medicine(db, db_medicine, start_date, end_date)
    db.commit()
    
    # Direct & immediate automatic refill email dispatch if created in red zone (<= 2 days or <= 2 pills left)
    try:
        check_and_trigger_critical_refill_emails(current_user, [db_medicine])
    except Exception as email_err:
        print(f"[REFILL ALERT EMAIL WARNING] {email_err}")
    
    return db_medicine

def check_and_trigger_critical_refill_emails(user: models.User, medicines: List[models.Medicine]):
    """Automatically checks all medicines for a user. If any medicine reaches <= 2 days left OR <= 2 pills left (critical red status), dispatches the refill email directly and immediately."""
    for med in medicines:
        times_per_day = med.times_per_day if med.times_per_day > 0 else 1
        days_left = med.quantity // times_per_day
        if days_left <= 2 or med.quantity <= 2:
            try:
                from app.email_worker import send_refill_alert_email
                target_emails = set()
                if user.email:
                    target_emails.add(user.email.strip().lower())
                if user.notification_email:
                    target_emails.add(user.notification_email.strip().lower())

                for target_email in target_emails:
                    send_refill_alert_email(
                        to_email=target_email,
                        patient_name=user.name,
                        medicine_name=med.name,
                        dosage=med.dosage,
                        quantity_left=med.quantity,
                        days_left=days_left,
                        medicine_id=med.id
                    )
                    print(f"[AUTOMATIC RED ZONE REFILL MAIL DISPATCHED] to {target_email} for {med.name} (Pills: {med.quantity}, Days: {days_left})")
            except Exception as err:
                print(f"[AUTOMATIC REFILL DIRECT EMAIL ERROR] {err}")


@router.get("", response_model=List[schemas.MedicineResponse])
def get_medicines(
    patient_id: Optional[int] = None,
    include_archived: bool = False,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if patient_id:
        # Check caregiver link status
        link = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.patient_id == patient_id,
            models.PatientCaregiver.caregiver_id == current_user.id,
            models.PatientCaregiver.status == "active"
        ).first()
        if not link and current_user.id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to view this patient's medicines"
            )
        user_id = patient_id
        target_user = db.query(models.User).filter(models.User.id == patient_id).first()
    else:
        user_id = current_user.id
        target_user = current_user

    query = db.query(models.Medicine).filter(models.Medicine.user_id == user_id)
    if not include_archived:
        query = query.filter(models.Medicine.is_archived == False)

    user_meds = query.all()
    if target_user:
        check_and_trigger_critical_refill_emails(target_user, user_meds)
    return user_meds

@router.get("/reminders/today", response_model=List[schemas.ReminderResponse])
def get_today_reminders(
    patient_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if patient_id:
        # Check caregiver link status
        link = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.patient_id == patient_id,
            models.PatientCaregiver.caregiver_id == current_user.id,
            models.PatientCaregiver.status == "active"
        ).first()
        if not link and current_user.id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to view this patient's reminders"
            )
        user_id = patient_id
    else:
        user_id = current_user.id

    today_start = datetime.datetime.combine(datetime.date.today(), datetime.time.min)

    db_reminders = db.query(models.Reminder).join(models.Medicine).filter(
        models.Medicine.user_id == user_id,
        models.Medicine.is_archived == False,
        models.Reminder.reminder_date == today_start
    ).all()

    # Auto-generate today's scheduled reminders for active medicines if none exist for today
    if not db_reminders:
        active_meds = db.query(models.Medicine).filter(
            models.Medicine.user_id == user_id,
            models.Medicine.is_archived == False
        ).all()
        for med in active_meds:
            times = med.custom_times.split(",") if med.custom_times else ["09:00"]
            for t in times:
                r = models.Reminder(
                    medicine_id=med.id,
                    dose_time=t.strip(),
                    reminder_date=today_start,
                    status="pending"
                )
                db.add(r)
        try:
            db.commit()
        except Exception:
            db.rollback()

        db_reminders = db.query(models.Reminder).join(models.Medicine).filter(
            models.Medicine.user_id == user_id,
            models.Medicine.is_archived == False,
            models.Reminder.reminder_date == today_start
        ).all()

    res = []
    for r in db_reminders:
        res.append({
            "id": r.id,
            "medicine_id": r.medicine_id,
            "dose_time": r.dose_time,
            "reminder_date": r.reminder_date,
            "status": r.status,
            "created_at": r.created_at,
            "medicine_name": r.medicine.name,
            "medicine_dosage": r.medicine.dosage,
            "medicine_food_relation": r.medicine.food_relation
        })
    return res

@router.put("/reminders/{reminder_id}/status", response_model=schemas.ReminderResponse)
def update_reminder_status(
    reminder_id: int,
    status_update: str,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if status_update not in ["taken", "missed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'taken' or 'missed'"
        )

    reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    if reminder.medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this reminder"
        )

    # Decrement stock count if marking as taken
    if status_update == "taken" and reminder.status != "taken":
        if reminder.medicine.quantity > 0:
            reminder.medicine.quantity -= 1
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Medication stock is empty. Please refill."
            )

    reminder.status = status_update
    
    # Create logs history record
    log = models.MedicationLog(
        reminder_id=reminder.id,
        user_id=current_user.id,
        status=status_update
    )
    db.add(log)
    db.commit()
    db.refresh(reminder)

    # If marked missed, send missed alert email STRICTLY TO CAREGIVER ONLY
    if status_update == "missed":
        try:
            patient = reminder.medicine.user
            caregiver_link = db.query(models.PatientCaregiver).filter(
                models.PatientCaregiver.patient_id == patient.id,
                models.PatientCaregiver.status == "active"
            ).first()

            if reminder.medicine.notifications_enabled and caregiver_link and caregiver_link.caregiver:
                cg = caregiver_link.caregiver
                cg_email = cg.email.strip().lower() if cg.email else None
                if cg_email:
                    from app.email_worker import send_email_notification, LOGIN_URL
                    subject_cg_missed = f"PillSync — Missed Medication Alert for {patient.name}"
                    html_cg_missed = f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                      <h2 style="color: #ef4444; margin-bottom: 16px;">⚠️ PillSync — Missed Medication Alert</h2>
                      <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello <strong>{cg.name}</strong>,</p>
                      <p style="color: #475569; font-size: 14px; line-height: 1.5;">Your monitored patient <strong>{patient.name}</strong> has missed their scheduled medication dosage.</p>
                      
                      <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 16px 0;">
                        <p style="margin: 4px 0; color: #991b1b; font-size: 15px;"><strong>Patient:</strong> {patient.name}</p>
                        <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Medicine:</strong> {reminder.medicine.name}</p>
                        <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Dosage:</strong> {reminder.medicine.dosage}</p>
                        <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Scheduled Time:</strong> {reminder.dose_time} on {reminder.reminder_date.strftime('%Y-%m-%d')}</p>
                        <p style="margin: 8px 0 0 0; color: #7f1d1d; font-size: 14px; font-weight: bold;">Alert: Patient missed this scheduled medicine or dosage.</p>
                      </div>
                      
                      <p style="color: #475569; font-size: 14px; line-height: 1.5;">Suggested Action: Please check in with {patient.name} to confirm adherence.</p>

                      <p style="margin: 24px 0; text-align: left;">
                        <a href="{LOGIN_URL}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);">Open PillSync Login Page</a>
                      </p>
                      
                      <p style="color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 24px;">PillSync Caregiver Tracking Engine</p>
                    </div>
                    """
                    send_email_notification(cg_email, subject_cg_missed, html_cg_missed)
        except Exception as e:
            print(f"[CAREGIVER MISSED EMAIL ERROR] {e}")

    # Check if stock has reached 2 days or fewer left after taking dose
    if status_update == "taken":
        try:
            med = reminder.medicine
            times_per_day = med.times_per_day if med.times_per_day > 0 else 1
            days_left = med.quantity // times_per_day
            if days_left <= 2 and med.notifications_enabled:
                from app.email_worker import send_refill_alert_email
                target_email = current_user.notification_email or current_user.email
                send_refill_alert_email(
                    to_email=target_email.strip().lower(),
                    patient_name=current_user.name,
                    medicine_name=med.name,
                    dosage=med.dosage,
                    quantity_left=med.quantity,
                    days_left=days_left
                )
        except Exception as refill_err:
            print(f"[REFILL ALERT EMAIL WARNING] {refill_err}")

    return {
        "id": reminder.id,
        "medicine_id": reminder.medicine_id,
        "dose_time": reminder.dose_time,
        "reminder_date": reminder.reminder_date,
        "status": reminder.status,
        "created_at": reminder.created_at,
        "medicine_name": reminder.medicine.name,
        "medicine_dosage": reminder.medicine.dosage
    }


@router.post("/{medicine_id}/refill", response_model=schemas.MedicineResponse)
def refill_medicine_stock(
    medicine_id: int,
    additional_days: int = 30,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    if medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to refill this medicine"
        )

    times_per_day = medicine.times_per_day if medicine.times_per_day > 0 else 1
    added_units = additional_days * times_per_day
    
    medicine.quantity += added_units
    medicine.duration_days += additional_days
    
    today = datetime.date.today()
    end_date = today + datetime.timedelta(days=additional_days)
    generate_reminders_for_medicine(db, medicine, today, end_date)
    
    from app.email_worker import reset_refill_alert_tracker
    reset_refill_alert_tracker(medicine_id)
    
    db.commit()
    db.refresh(medicine)
    return medicine


@router.post("/{medicine_id}/send-refill-email", status_code=status.HTTP_200_OK)
def trigger_manual_refill_email(
    medicine_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    if medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to send alerts for this medicine"
        )

    times_per_day = medicine.times_per_day if medicine.times_per_day > 0 else 1
    days_left = medicine.quantity // times_per_day
    target_email = (current_user.notification_email or current_user.email).strip().lower()

    from app.email_worker import send_refill_alert_email
    send_refill_alert_email(
        to_email=target_email,
        patient_name=current_user.name,
        medicine_name=medicine.name,
        dosage=medicine.dosage,
        quantity_left=medicine.quantity,
        days_left=days_left,
        medicine_id=medicine.id,
        force_send=True
    )
    return {"status": f"Refill email successfully dispatched to {target_email}!"}

@router.get("/medication-logs", response_model=List[schemas.MedicationLogResponse])
def get_medication_logs(
    patient_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if patient_id:
        # Check caregiver link status
        link = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.patient_id == patient_id,
            models.PatientCaregiver.caregiver_id == current_user.id,
            models.PatientCaregiver.status == "active"
        ).first()
        if not link and current_user.id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to view this patient's logs"
            )
        user_id = patient_id
    else:
        user_id = current_user.id

    logs = db.query(models.MedicationLog).filter(
        models.MedicationLog.user_id == user_id
    ).order_by(models.MedicationLog.logged_at.desc()).all()
    
    res = []
    for l in logs:
        if not l.reminder or not l.reminder.medicine or l.reminder.medicine.is_archived:
            continue
        res.append({
            "id": l.id,
            "reminder_id": l.reminder_id,
            "user_id": l.user_id,
            "status": l.status,
            "logged_at": l.logged_at,
            "medicine_name": l.reminder.medicine.name,
            "dose_time": l.reminder.dose_time if l.reminder else "Unknown"
        })
    return res

@router.put("/{medicine_id}", response_model=schemas.MedicineResponse)
def update_medicine(
    medicine_id: int,
    medicine_in: schemas.MedicineCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    if medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this medicine"
        )

    from app.ai_service import verify_medicine_with_ai
    banned_list = ["cocaine", "coca", "heroin", "methamphetamine", "meth", "crystal meth", "lsd", "acid", "ecstasy", "mdma", "weed", "marijuana", "cannabis", "hashish", "crack", "pcp", "angel dust", "magic mushroom", "psilocybin", "speed", "opium", "fentanyl street", "ghb", "rohypnol"]
    name_check = medicine_in.name.strip().lower()
    if any(b in name_check for b in banned_list):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"❌ Rejected: '{medicine_in.name}' is an illegal substance and cannot be added to a medical cabinet. Only valid doctor-prescribed medications are permitted."
        )

    if not verify_medicine_with_ai(medicine_in.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"❌ Unrecognized Medication: '{medicine_in.name}' is not a medically recognized prescription or OTC pharmaceutical. Please check the spelling or enter a valid doctor-prescribed medicine."
        )

    medicine.name = medicine_in.name
    medicine.generic_name = medicine_in.generic_name
    medicine.dosage = medicine_in.dosage
    medicine.quantity = medicine_in.quantity
    medicine.times_per_day = medicine_in.times_per_day
    medicine.duration_days = medicine_in.duration_days
    medicine.food_relation = medicine_in.food_relation
    medicine.notifications_enabled = medicine_in.notifications_enabled
    
    normalized_custom_times = None
    if medicine_in.custom_times:
        normalized_custom_times = ",".join([normalize_time_string(t) for t in medicine_in.custom_times.split(",") if t.strip()])
    medicine.custom_times = normalized_custom_times
    medicine.days_of_week = medicine_in.days_of_week
    
    db.query(models.Reminder).filter(
        models.Reminder.medicine_id == medicine_id,
        models.Reminder.status == "pending"
    ).delete()

    today_date = datetime.date.today()
    start_from = max(medicine.start_date.date(), today_date)
    end_date = medicine.start_date.date() + datetime.timedelta(days=medicine.duration_days - 1)
    
    if start_from <= end_date:
        generate_reminders_for_medicine(db, medicine, start_from, end_date)

    db.commit()
    db.refresh(medicine)
    
    # Direct & immediate automatic refill email dispatch if updated stock is in red zone
    check_and_trigger_critical_refill_emails(current_user, [medicine])
    
    return medicine

@router.delete("/{medicine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicine(
    medicine_id: int,
    reason: Optional[str] = "Discontinued / Removed",
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    if medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this medicine"
        )

    # Get all reminder IDs for this medicine to purge logs
    reminders = db.query(models.Reminder).filter(models.Reminder.medicine_id == medicine_id).all()
    reminder_ids = [r.id for r in reminders]

    if reminder_ids:
        db.query(models.MedicationLog).filter(models.MedicationLog.reminder_id.in_(reminder_ids)).delete(synchronize_session=False)

    db.query(models.Reminder).filter(models.Reminder.medicine_id == medicine_id).delete()

    reason_clean = (reason or "").lower()
    if any(k in reason_clean for k in ["mistake", "void", "incorrect", "accidental", "typo", "delete", "remove"]):
        db.delete(medicine)
    else:
        medicine.discontinue_reason = reason if reason else "Discontinued / Removed"
        medicine.is_archived = True

    db.commit()
    return None

from fastapi import UploadFile, File

@router.post("/ocr", response_model=schemas.PrescriptionOCRResponse)
async def upload_prescription_ocr(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    content = await file.read()
    from app.ai_service import parse_prescription_ocr
    parsed_data = parse_prescription_ocr(content, file.filename)
    return parsed_data

@router.get("/check-interactions", response_model=schemas.InteractionCheckResponse)
def check_interactions(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    active_meds = db.query(models.Medicine).filter(models.Medicine.user_id == current_user.id).all()
    if len(active_meds) <= 1:
        return {"warnings": []}

    med_names = [m.name for m in active_meds]
    from app.ai_service import check_drug_interactions
    warnings = check_drug_interactions(med_names[0], med_names[1:])
    return {"warnings": warnings}


