import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, and_

from app import models, auth
from app.database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])

# Helper function to log audit events
def log_audit_event(
    db: Session,
    action: str,
    event_type: str,
    target: Optional[str] = None,
    details: Optional[str] = None,
    user_id: Optional[int] = None
):
    try:
        audit = models.AuditLog(
            user_id=user_id,
            action=action,
            event_type=event_type,
            target=target,
            details=details,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print(f"[AUDIT LOG WARNING] Failed to record audit event: {e}")
        db.rollback()


# Admin Dependency Enforcement
def get_current_admin_user(current_user: models.User = Depends(auth.get_current_active_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin privileges required."
        )
    return current_user


# 1. Admin Stats Endpoint
@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    total_users = db.query(models.User).count()
    total_patients = db.query(models.User).filter(models.User.role == "patient").count()
    total_caregivers = db.query(models.User).filter(models.User.role == "caregiver").count()
    
    total_medicines = db.query(models.Medicine).count()
    active_medicines = db.query(models.Medicine).filter(models.Medicine.is_archived == False).count()
    
    completed_treatments = db.query(models.Medicine).filter(
        models.Medicine.is_archived == True,
        models.Medicine.discontinue_reason.ilike("%completed%")
    ).count()
    
    discontinued_medicines = db.query(models.Medicine).filter(
        models.Medicine.is_archived == True,
        ~models.Medicine.discontinue_reason.ilike("%completed%")
    ).count()
    
    # Calculate low stock medicines (quantity / times_per_day <= 2 OR quantity <= 2)
    active_meds_list = db.query(models.Medicine).filter(models.Medicine.is_archived == False).all()
    low_stock_count = 0
    for med in active_meds_list:
        tpd = med.times_per_day if med.times_per_day > 0 else 1
        days_left = med.quantity // tpd
        if days_left <= 2 or med.quantity <= 2:
            low_stock_count += 1

    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "total_caregivers": total_caregivers,
        "total_medicines": total_medicines,
        "active_medicines": active_medicines,
        "completed_treatments": completed_treatments,
        "discontinued_medicines": discontinued_medicines,
        "low_stock_medicines": low_stock_count
    }


# 2. Patients List with Search, Filter, Sort, Pagination
@router.get("/patients")
def get_admin_patients(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None), # verified, unverified, all
    sort_by: Optional[str] = Query("created_at"),
    order: Optional[str] = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    query = db.query(models.User).filter(models.User.role == "patient")

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(or_(
            models.User.name.ilike(search_fmt),
            models.User.email.ilike(search_fmt)
        ))

    if status_filter == "verified":
        query = query.filter(models.User.is_verified == True)
    elif status_filter == "unverified":
        query = query.filter(models.User.is_verified == False)

    # Sorting
    sort_col = getattr(models.User, sort_by, models.User.created_at)
    if order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total_count = query.count()
    offset = (page - 1) * limit
    patients = query.offset(offset).limit(limit).all()

    patient_list = []
    for p in patients:
        med_count = db.query(models.Medicine).filter(models.Medicine.user_id == p.id, models.Medicine.is_archived == False).count()
        
        # Assigned caregiver
        cg_link = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.patient_id == p.id,
            models.PatientCaregiver.status == "active"
        ).first()
        cg_name = cg_link.caregiver.name if (cg_link and cg_link.caregiver) else None

        # Last log activity
        last_log = db.query(models.MedicationLog).filter(models.MedicationLog.user_id == p.id).order_by(models.MedicationLog.logged_at.desc()).first()
        last_activity = last_log.logged_at.isoformat() if last_log else p.created_at.isoformat()

        patient_list.append({
            "id": p.id,
            "name": p.name,
            "email": p.email,
            "notification_email": p.notification_email,
            "is_verified": p.is_verified,
            "assigned_caregiver": cg_name,
            "medicine_count": med_count,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "last_activity": last_activity
        })

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "patients": patient_list
    }


# 3. Patient Details View
@router.get("/patients/{patient_id}")
def get_admin_patient_detail(
    patient_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    patient = db.query(models.User).filter(models.User.id == patient_id, models.User.role == "patient").first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    active_medicines = db.query(models.Medicine).filter(models.Medicine.user_id == patient_id, models.Medicine.is_archived == False).all()
    history_medicines = db.query(models.Medicine).filter(models.Medicine.user_id == patient_id, models.Medicine.is_archived == True).all()
    
    # Caregiver details
    cg_links = db.query(models.PatientCaregiver).filter(models.PatientCaregiver.patient_id == patient_id).all()
    caregivers = [{
        "link_id": c.id,
        "caregiver_id": c.caregiver_id,
        "caregiver_name": c.caregiver.name if c.caregiver else "Unknown",
        "caregiver_email": c.caregiver.email if c.caregiver else "Unknown",
        "status": c.status
    } for c in cg_links]

    # Calculate Adherence Score
    logs = db.query(models.MedicationLog).filter(models.MedicationLog.user_id == patient_id).all()
    total_logs = len(logs)
    taken_logs = sum(1 for l in logs if l.status == "taken")
    adherence_score = round((taken_logs / total_logs * 100), 1) if total_logs > 0 else 100.0

    log_history = [{
        "id": l.id,
        "medicine_name": l.reminder.medicine.name if (l.reminder and l.reminder.medicine) else "Prescription",
        "dosage": l.reminder.medicine.dosage if (l.reminder and l.reminder.medicine) else "-",
        "status": l.status,
        "logged_at": l.logged_at.isoformat() if l.logged_at else None
    } for l in logs[-20:]] # Last 20 logs

    log_audit_event(db, f"Viewed Patient Record #{patient_id}", "user", f"Patient: {patient.name}", user_id=admin.id)

    return {
        "id": patient.id,
        "name": patient.name,
        "email": patient.email,
        "notification_email": patient.notification_email,
        "is_verified": patient.is_verified,
        "created_at": patient.created_at.isoformat() if patient.created_at else None,
        "adherence_score": adherence_score,
        "total_logged_doses": total_logs,
        "caregivers": caregivers,
        "active_medicines": [{
            "id": m.id,
            "name": m.name,
            "generic_name": m.generic_name,
            "dosage": m.dosage,
            "quantity": m.quantity,
            "times_per_day": m.times_per_day,
            "custom_times": m.custom_times,
            "food_relation": m.food_relation,
            "start_date": m.start_date.isoformat() if m.start_date else None,
            "duration_days": m.duration_days
        } for m in active_medicines],
        "archived_medicines": [{
            "id": m.id,
            "name": m.name,
            "dosage": m.dosage,
            "discontinue_reason": m.discontinue_reason,
            "created_at": m.created_at.isoformat() if m.created_at else None
        } for m in history_medicines],
        "recent_logs": log_history
    }


# 4. Caregiver Directory
@router.get("/caregivers")
def get_admin_caregivers(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    query = db.query(models.User).filter(models.User.role == "caregiver")

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(or_(
            models.User.name.ilike(search_fmt),
            models.User.email.ilike(search_fmt)
        ))

    if status_filter == "verified":
        query = query.filter(models.User.is_verified == True)
    elif status_filter == "unverified":
        query = query.filter(models.User.is_verified == False)

    total_count = query.count()
    offset = (page - 1) * limit
    caregivers = query.offset(offset).limit(limit).all()

    caregiver_list = []
    for c in caregivers:
        assigned_links = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.caregiver_id == c.id,
            models.PatientCaregiver.status == "active"
        ).all()
        
        patient_names = [l.patient.name for l in assigned_links if l.patient]

        caregiver_list.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "notification_email": c.notification_email,
            "is_verified": c.is_verified,
            "assigned_patients_count": len(assigned_links),
            "assigned_patient_names": patient_names,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "caregivers": caregiver_list
    }


# 5. Caregiver Detail View
@router.get("/caregivers/{caregiver_id}")
def get_admin_caregiver_detail(
    caregiver_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    caregiver = db.query(models.User).filter(models.User.id == caregiver_id, models.User.role == "caregiver").first()
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    links = db.query(models.PatientCaregiver).filter(models.PatientCaregiver.caregiver_id == caregiver_id).all()
    patients = [{
        "link_id": l.id,
        "patient_id": l.patient_id,
        "patient_name": l.patient.name if l.patient else "Unknown",
        "patient_email": l.patient.email if l.patient else "Unknown",
        "status": l.status,
        "created_at": l.created_at.isoformat() if l.created_at else None
    } for l in links]

    log_audit_event(db, f"Viewed Caregiver Record #{caregiver_id}", "user", f"Caregiver: {caregiver.name}", user_id=admin.id)

    return {
        "id": caregiver.id,
        "name": caregiver.name,
        "email": caregiver.email,
        "is_verified": caregiver.is_verified,
        "created_at": caregiver.created_at.isoformat() if caregiver.created_at else None,
        "assigned_patients": patients
    }


# 6. Admin Medicines Management
@router.get("/medicines")
def get_admin_medicines(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None), # active, completed, discontinued, low_stock, all
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    query = db.query(models.Medicine).join(models.User)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(or_(
            models.Medicine.name.ilike(search_fmt),
            models.Medicine.generic_name.ilike(search_fmt),
            models.User.name.ilike(search_fmt)
        ))

    if status_filter and status_filter.lower() != "all":
        if status_filter == "active":
            query = query.filter(models.Medicine.is_archived == False)
        elif status_filter == "completed":
            query = query.filter(models.Medicine.is_archived == True, models.Medicine.discontinue_reason.ilike("%completed%"))
        elif status_filter == "discontinued":
            query = query.filter(models.Medicine.is_archived == True, ~models.Medicine.discontinue_reason.ilike("%completed%"))
        elif status_filter == "low_stock":
            query = query.filter(models.Medicine.quantity <= 5)

    medicines = query.order_by(models.Medicine.created_at.desc()).all()

    filtered_meds = []
    for m in medicines:
        tpd = m.times_per_day if m.times_per_day > 0 else 1
        days_left = m.quantity // tpd
        is_low_stock = (days_left <= 2 or m.quantity <= 2) and (not m.is_archived)

        if status_filter == "low_stock" and not is_low_stock:
            continue

        # Status string
        if m.is_archived:
            if m.discontinue_reason and "completed" in m.discontinue_reason.lower():
                status_str = "Completed Treatment"
            else:
                status_str = m.discontinue_reason or "Discontinued"
        else:
            if is_low_stock:
                status_str = "Low Stock"
            else:
                status_str = "Active"

        filtered_meds.append({
            "id": m.id,
            "name": m.name,
            "generic_name": m.generic_name,
            "patient_name": m.user.name if m.user else "Unknown",
            "patient_id": m.user_id,
            "dosage": m.dosage,
            "quantity": m.quantity,
            "times_per_day": m.times_per_day,
            "custom_times": m.custom_times,
            "status": status_str,
            "is_archived": m.is_archived,
            "discontinue_reason": m.discontinue_reason,
            "days_left": days_left,
            "is_low_stock": is_low_stock,
            "start_date": m.start_date.isoformat() if m.start_date else None,
            "duration_days": m.duration_days,
            "food_relation": m.food_relation
        })

    total_count = len(filtered_meds)
    offset = (page - 1) * limit
    paginated_meds = filtered_meds[offset:offset + limit]

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "medicines": paginated_meds
    }


# 7. Medication Activity Feed & Audit Logs
@router.get("/activity")
def get_admin_activity_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    logs = db.query(models.MedicationLog).order_by(models.MedicationLog.logged_at.desc()).limit(100).all()
    audit_logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(50).all()

    activity_feed = []

    # Map medication logs
    for l in logs:
        med_name = l.reminder.medicine.name if (l.reminder and l.reminder.medicine) else "Prescription"
        dosage = l.reminder.medicine.dosage if (l.reminder and l.reminder.medicine) else ""
        event_title = f"Dose {l.status.capitalize()}: {med_name} ({dosage})" if dosage else f"Dose {l.status.capitalize()}: {med_name}"
        
        activity_feed.append({
            "id": f"log-{l.id}",
            "user_name": l.user.name if l.user else "Patient",
            "user_email": l.user.email if l.user else "",
            "event_type": "dose",
            "action": event_title,
            "status": l.status,
            "timestamp": l.logged_at.isoformat() if l.logged_at else datetime.datetime.utcnow().isoformat()
        })

    # Map audit logs
    for a in audit_logs:
        activity_feed.append({
            "id": f"audit-{a.id}",
            "user_name": a.user.name if a.user else "System/Admin",
            "user_email": a.user.email if a.user else "",
            "event_type": a.event_type,
            "action": a.action,
            "status": "logged",
            "timestamp": a.timestamp.isoformat() if a.timestamp else datetime.datetime.utcnow().isoformat()
        })

    # Sort merged activities by timestamp desc
    activity_feed.sort(key=lambda x: x["timestamp"], reverse=True)

    total_count = len(activity_feed)
    offset = (page - 1) * limit
    paginated = activity_feed[offset:offset + limit]

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "activities": paginated
    }


# 8. Refill Monitoring Page
@router.get("/refills")
def get_admin_refill_tracker(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    active_meds = db.query(models.Medicine).filter(models.Medicine.is_archived == False).all()

    refill_list = []
    for med in active_meds:
        tpd = med.times_per_day if med.times_per_day > 0 else 1
        days_left = med.quantity // tpd
        is_critical = days_left <= 2 or med.quantity <= 2
        
        refill_status = "Critical Refill Needed" if is_critical else "Adequate Stock"
        
        refill_list.append({
            "medicine_id": med.id,
            "medicine_name": med.name,
            "patient_name": med.user.name if med.user else "Unknown",
            "patient_email": med.user.email if med.user else "Unknown",
            "notification_email": med.user.notification_email if med.user else None,
            "current_stock": med.quantity,
            "times_per_day": med.times_per_day,
            "days_left": days_left,
            "refill_status": refill_status,
            "is_critical": is_critical,
            "start_date": med.start_date.isoformat() if med.start_date else None
        })

    # Sort critical refills first
    refill_list.sort(key=lambda x: (not x["is_critical"], x["days_left"]))

    return {
        "total": len(refill_list),
        "critical_count": sum(1 for r in refill_list if r["is_critical"]),
        "refills": refill_list
    }


# 9. Notification Routing Management Audit
@router.get("/notifications")
def get_admin_notifications_audit(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    reminders = db.query(models.Reminder).join(models.Medicine).order_by(models.Reminder.reminder_date.desc(), models.Reminder.dose_time.desc()).limit(50).all()

    notifications = []
    for r in reminders:
        patient = r.medicine.user
        caregiver_link = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.patient_id == patient.id,
            models.PatientCaregiver.status == "active"
        ).first()

        cg_name = caregiver_link.caregiver.name if (caregiver_link and caregiver_link.caregiver) else None
        cg_email = caregiver_link.caregiver.email if (caregiver_link and caregiver_link.caregiver) else None

        # Patient notification entry
        notifications.append({
            "id": f"pat-rem-{r.id}",
            "recipient_role": "patient",
            "recipient_name": patient.name if patient else "Patient",
            "recipient_email": patient.email if patient else "Unknown",
            "medicine_name": r.medicine.name,
            "dose_time": r.dose_time,
            "scheduled_date": r.reminder_date.strftime("%Y-%m-%d") if r.reminder_date else "",
            "notification_type": "Dose Reminder",
            "status": r.status,
            "routing_rule": "Strict Patient Dispatch"
        })

        # If missed, caregiver alert entry
        if r.status == "missed" and cg_name:
            notifications.append({
                "id": f"cg-missed-{r.id}",
                "recipient_role": "caregiver",
                "recipient_name": cg_name,
                "recipient_email": cg_email,
                "medicine_name": r.medicine.name,
                "dose_time": r.dose_time,
                "scheduled_date": r.reminder_date.strftime("%Y-%m-%d") if r.reminder_date else "",
                "notification_type": "Emergency Missed Dose Alert",
                "status": "dispatched",
                "routing_rule": "Strict Caregiver Escalation"
            })

    return {
        "total": len(notifications),
        "notifications": notifications
    }


# 10. Admin Analytics Reports
@router.get("/reports")
def get_admin_analytics_reports(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    # Active vs Inactive / Role Distribution
    patients = db.query(models.User).filter(models.User.role == "patient").count()
    caregivers = db.query(models.User).filter(models.User.role == "caregiver").count()
    admins = db.query(models.User).filter(models.User.role == "admin").count()

    # Medicine Status Distribution
    active_meds = db.query(models.Medicine).filter(models.Medicine.is_archived == False).count()
    completed_meds = db.query(models.Medicine).filter(models.Medicine.is_archived == True, models.Medicine.discontinue_reason.ilike("%completed%")).count()
    discontinued_meds = db.query(models.Medicine).filter(models.Medicine.is_archived == True, ~models.Medicine.discontinue_reason.ilike("%completed%")).count()

    # Adherence breakdown
    logs = db.query(models.MedicationLog).all()
    taken_count = sum(1 for l in logs if l.status == "taken")
    missed_count = sum(1 for l in logs if l.status == "missed")
    total_logs = len(logs)
    adherence_pct = round((taken_count / total_logs * 100), 1) if total_logs > 0 else 100.0

    return {
        "role_distribution": [
            {"name": "Patients", "value": patients},
            {"name": "Caregivers", "value": caregivers},
            {"name": "Admins", "value": admins}
        ],
        "medication_status_distribution": [
            {"name": "Active Medications", "value": active_meds},
            {"name": "Completed Treatments", "value": completed_meds},
            {"name": "Discontinued", "value": discontinued_meds}
        ],
        "adherence_metrics": {
            "overall_adherence_percentage": adherence_pct,
            "taken_doses": taken_count,
            "missed_doses": missed_count,
            "total_doses_logged": total_logs
        }
    }


# 11. Admin Audit Logs List
@router.get("/audit-logs")
def get_admin_audit_logs(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    audits = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(100).all()
    return [{
        "id": a.id,
        "performer_name": a.user.name if a.user else "System",
        "action": a.action,
        "event_type": a.event_type,
        "target": a.target,
        "details": a.details,
        "timestamp": a.timestamp.isoformat() if a.timestamp else None
    } for a in audits]


# 12. Toggle User Verified/Active Status
@router.post("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin_user)
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    target_user.is_verified = not target_user.is_verified
    db.commit()
    
    status_str = "Verified" if target_user.is_verified else "Unverified"
    log_audit_event(db, f"Updated User Verification to {status_str}", "user", f"User: {target_user.name}", user_id=admin.id)
    
    return {"message": f"User status updated to {status_str}", "is_verified": target_user.is_verified}
