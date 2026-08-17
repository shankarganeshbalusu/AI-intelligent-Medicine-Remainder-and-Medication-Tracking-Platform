from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_profile(
    profile_in: schemas.ProfileUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if profile_in.name is not None:
        current_user.name = profile_in.name
    if profile_in.email is not None:
        # Check if email is already taken
        if profile_in.email != current_user.email:
            existing = db.query(models.User).filter(models.User.email == profile_in.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            current_user.email = profile_in.email
    if profile_in.notification_email is not None:
        current_user.notification_email = profile_in.notification_email
    if profile_in.role is not None and profile_in.role in ["patient", "caregiver"]:
        current_user.role = profile_in.role
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/send-test-email")
def send_test_email(
    req: schemas.TestEmailRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    from app.email_worker import send_email_notification
    import random
    
    target_email = req.email.strip().lower() if req.email else current_user.email.strip().lower()
    
    quotes = [
        "Health is wealth.",
        "To keep the body in good health is a duty. Otherwise, we shall not be able to keep our mind strong and clear. - Buddha",
        "A healthy outside starts from the inside. - Robert Urich",
        "He who has health has hope; and he who has hope has everything. - Arabian Proverb",
        "Your body is a temple, but only if you treat it as one. - Astrid Alauda",
        "An apple a day keeps the doctor away.",
        "Health is not valued till sickness comes. - Thomas Fuller",
        "The first wealth is health. - Ralph Waldo Emerson"
    ]
    quote = random.choice(quotes)
    
    subject = f"🔔 PillSync Live Alert Test for {target_email}"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">🔑 PillSync Live Notification Verification</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello <strong>{current_user.name}</strong>,</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">This is a live test notification confirming that PillSync is actively configured to send medicine alerts to your recipient email: <strong>{target_email}</strong>.</p>
      
      <div style="background-color: #f8fafc; border-left: 4px solid #06b6d4; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
        <span style="display: block; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #06b6d4; margin-bottom: 4px;">Daily Motivational Quote</span>
        <p style="color: #334155; font-size: 14px; font-style: italic; margin: 0;">"{quote}"</p>
      </div>

      <p style="margin: 24px 0; text-align: left;">
        <a href="http://localhost:5173/login" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(6, 182, 212, 0.2);">Open PillSync Login Page</a>
      </p>
      
      <p style="color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 24px;">PillSync Intelligent Medicine Tracker Engine</p>
    </div>
    """
    send_email_notification(target_email, subject, html_body)
    return {"status": f"Test email successfully dispatched to {target_email}."}



@router.post("/link-caregiver", response_model=schemas.AssociationResponse)
def link_caregiver(
    link_in: schemas.CaregiverLinkCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Only patients can invite caregivers
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only patients can associate themselves with a caregiver"
        )
    
    # Find the caregiver
    caregiver = db.query(models.User).filter(
        models.User.email == link_in.caregiver_email,
        models.User.role == "caregiver"
    ).first()
    if not caregiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caregiver with this email not found or does not have caregiver role"
        )
    
    # Check if link already exists
    existing = db.query(models.PatientCaregiver).filter(
        models.PatientCaregiver.patient_id == current_user.id,
        models.PatientCaregiver.caregiver_id == caregiver.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An association with this caregiver already exists (Status: {existing.status})"
        )
    
    new_link = models.PatientCaregiver(
        patient_id=current_user.id,
        caregiver_id=caregiver.id,
        status="pending"
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    
    # Helper dict for mapping to response schema
    return {
        "id": new_link.id,
        "patient_id": new_link.patient_id,
        "caregiver_id": new_link.caregiver_id,
        "status": new_link.status,
        "created_at": new_link.created_at,
        "patient_name": current_user.name,
        "patient_email": current_user.email,
        "caregiver_name": caregiver.name,
        "caregiver_email": caregiver.email
    }


@router.post("/link-patient", response_model=schemas.AssociationResponse)
def link_patient(
    link_in: schemas.PatientLinkCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Only caregivers can invite patients
    if current_user.role != "caregiver":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only caregivers can request association with a patient"
        )
    
    # Find the patient
    patient = db.query(models.User).filter(
        models.User.email == link_in.patient_email,
        models.User.role == "patient"
    ).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient with this email not found or does not have patient role"
        )
    
    # Check if link already exists
    existing = db.query(models.PatientCaregiver).filter(
        models.PatientCaregiver.patient_id == patient.id,
        models.PatientCaregiver.caregiver_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An association with this patient already exists (Status: {existing.status})"
        )
    
    new_link = models.PatientCaregiver(
        patient_id=patient.id,
        caregiver_id=current_user.id,
        status="pending"
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    
    return {
        "id": new_link.id,
        "patient_id": new_link.patient_id,
        "caregiver_id": new_link.caregiver_id,
        "status": new_link.status,
        "created_at": new_link.created_at,
        "patient_name": patient.name,
        "patient_email": patient.email,
        "caregiver_name": current_user.name,
        "caregiver_email": current_user.email
    }


@router.get("/associations", response_model=List[schemas.AssociationResponse])
def get_associations(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "patient":
        links = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.patient_id == current_user.id
        ).all()
    elif current_user.role == "caregiver":
        links = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.caregiver_id == current_user.id
        ).all()
    else:
        # Admins see all
        links = db.query(models.PatientCaregiver).all()
        
    res = []
    for link in links:
        res.append({
            "id": link.id,
            "patient_id": link.patient_id,
            "caregiver_id": link.caregiver_id,
            "status": link.status,
            "created_at": link.created_at,
            "patient_name": link.patient.name,
            "patient_email": link.patient.email,
            "caregiver_name": link.caregiver.name,
            "caregiver_email": link.caregiver.email
        })
    return res


@router.put("/associations/{link_id}", response_model=schemas.AssociationResponse)
def respond_to_link(
    link_id: int,
    status_update: str,  # "active" or "rejected"
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if status_update not in ["active", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'active' or 'rejected'"
        )
        
    link = db.query(models.PatientCaregiver).filter(
        models.PatientCaregiver.id == link_id
    ).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link request not found"
        )
        
    # The response can be done by:
    # 1. The patient (if the caregiver invited them)
    # 2. The caregiver (if the patient invited them)
    # Basically, if they are involved in the link and not the sole initiator, or simple check:
    # Any of the parties involved can update the status
    if current_user.id != link.patient_id and current_user.id != link.caregiver_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to respond to this association request"
        )
        
    # Strict rule: Caregivers cannot accept requests sent to patients.
    # Only the target patient can log in and accept the caregiver.
    if status_update == "active" and current_user.role == "caregiver":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only the patient can accept this caregiver connection request. The patient must log into their account to accept."
        )

    link.status = status_update
    db.commit()
    db.refresh(link)
    
    return {
        "id": link.id,
        "patient_id": link.patient_id,
        "caregiver_id": link.caregiver_id,
        "status": link.status,
        "created_at": link.created_at,
        "patient_name": link.patient.name,
        "patient_email": link.patient.email,
        "caregiver_name": link.caregiver.name,
        "caregiver_email": link.caregiver.email
    }


@router.delete("/associations/{link_id}", status_code=status.HTTP_200_OK)
def delete_association(
    link_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    link = db.query(models.PatientCaregiver).filter(models.PatientCaregiver.id == link_id).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Association link not found"
        )
    if current_user.id != link.patient_id and current_user.id != link.caregiver_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this association"
        )
    
    db.delete(link)
    db.commit()
    return {"status": "Association removed successfully"}


@router.put("/me/password", status_code=status.HTTP_200_OK)
def change_password(
    pwd_in: schemas.PasswordChange,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if not auth.verify_password(pwd_in.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.password_hash = auth.get_password_hash(pwd_in.new_password)
    db.commit()
    return {"status": "password updated successfully"}

@router.post("/me/chatbot", response_model=schemas.ChatBotResponse)
def chatbot_interaction(
    req: schemas.ChatBotRequest,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    med_card_details = []
    emergency_card_details = []
    patient_context_name = current_user.name

    if current_user.role == "patient":
        # 1. Active Medicines
        active_meds = db.query(models.Medicine).filter(
            models.Medicine.user_id == current_user.id,
            models.Medicine.is_archived == False
        ).all()
        for m in active_meds:
            med_card_details.append({
                "name": m.name,
                "generic_name": m.generic_name or "",
                "dosage": m.dosage,
                "quantity": m.quantity,
                "times_per_day": m.times_per_day,
                "duration_days": m.duration_days,
                "food_relation": m.food_relation or "No Preference",
                "custom_times": m.custom_times or "",
                "days_of_week": m.days_of_week or "Daily"
            })

        # 2. Emergency Info Card
        emg = db.query(models.EmergencyInfo).filter(models.EmergencyInfo.user_id == current_user.id).first()
        if emg:
            emergency_card_details.append({
                "patient_name": current_user.name,
                "blood_group": emg.blood_group or "Not Specified",
                "emergency_contact_name": emg.emergency_contact_name or "None",
                "emergency_contact_phone": emg.emergency_contact_phone or "None",
                "relationship": emg.contact_relationship or "None",
                "allergies": emg.allergies or "No Known Allergies",
                "medical_conditions": emg.medical_conditions or "None Listed",
                "doctor_name": emg.doctor_name or "None",
                "doctor_phone": emg.doctor_phone or "None",
                "important_notes": emg.important_notes or ""
            })

    elif current_user.role == "caregiver":
        # Caregiver inspecting assigned patients
        links = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.caregiver_id == current_user.id,
            models.PatientCaregiver.status == "active"
        ).all()

        patient_names = []
        for l in links:
            patient = l.patient
            if patient:
                patient_names.append(patient.name)
                # Patient meds
                p_meds = db.query(models.Medicine).filter(
                    models.Medicine.user_id == patient.id,
                    models.Medicine.is_archived == False
                ).all()
                for m in p_meds:
                    med_card_details.append({
                        "patient_name": patient.name,
                        "name": m.name,
                        "generic_name": m.generic_name or "",
                        "dosage": m.dosage,
                        "quantity": m.quantity,
                        "times_per_day": m.times_per_day,
                        "duration_days": m.duration_days,
                        "food_relation": m.food_relation or "No Preference",
                        "custom_times": m.custom_times or "",
                        "days_of_week": m.days_of_week or "Daily"
                    })

                # Patient emergency info
                p_emg = db.query(models.EmergencyInfo).filter(models.EmergencyInfo.user_id == patient.id).first()
                if p_emg:
                    emergency_card_details.append({
                        "patient_name": patient.name,
                        "blood_group": p_emg.blood_group or "Not Specified",
                        "emergency_contact_name": p_emg.emergency_contact_name or "None",
                        "emergency_contact_phone": p_emg.emergency_contact_phone or "None",
                        "relationship": p_emg.contact_relationship or "None",
                        "allergies": p_emg.allergies or "No Known Allergies",
                        "medical_conditions": p_emg.medical_conditions or "None Listed",
                        "doctor_name": p_emg.doctor_name or "None",
                        "doctor_phone": p_emg.doctor_phone or "None",
                        "important_notes": p_emg.important_notes or ""
                    })

        patient_context_name = f"Caregiver {current_user.name} (Assigned Patients: {', '.join(patient_names) if patient_names else 'None'})"

    # Compliance Logs
    logs = db.query(models.MedicationLog).filter(models.MedicationLog.user_id == current_user.id).all()
    taken = sum(1 for l in logs if l.status == "taken")
    total = len(logs)
    score = round((taken / total) * 100) if total > 0 else 100
    
    from app.ai_service import get_chatbot_response
    reply = get_chatbot_response(
        message=req.message,
        user_name=patient_context_name,
        user_role=current_user.role,
        medicine_details=med_card_details,
        emergency_details=emergency_card_details,
        compliance_score=score
    )
    return {"reply": reply}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        user_id = current_user.id

        # 1. Delete all medication logs for user
        db.query(models.MedicationLog).filter(models.MedicationLog.user_id == user_id).delete(synchronize_session=False)

        # 2. Delete all reminders for user's medicines
        user_medicines = db.query(models.Medicine).filter(models.Medicine.user_id == user_id).all()
        user_med_ids = [m.id for m in user_medicines]
        if user_med_ids:
            db.query(models.MedicationLog).filter(models.MedicationLog.reminder_id.in_(user_med_ids)).delete(synchronize_session=False)
            db.query(models.Reminder).filter(models.Reminder.medicine_id.in_(user_med_ids)).delete(synchronize_session=False)

        # 3. Delete medicines
        db.query(models.Medicine).filter(models.Medicine.user_id == user_id).delete(synchronize_session=False)

        # 4. Delete caregiver-patient links
        db.query(models.PatientCaregiver).filter(
            (models.PatientCaregiver.caregiver_id == user_id) | 
            (models.PatientCaregiver.patient_id == user_id)
        ).delete(synchronize_session=False)

        # 5. Delete user record
        db.query(models.User).filter(models.User.id == user_id).delete(synchronize_session=False)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        print("Delete account error:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )


# --- EMERGENCY INFORMATION ENDPOINTS ---

def _build_emergency_response(info: models.EmergencyInfo, user: models.User) -> schemas.EmergencyInfoResponse:
    if not info:
        return schemas.EmergencyInfoResponse(
            user_id=user.id,
            patient_name=user.name,
            patient_email=user.email
        )
    return schemas.EmergencyInfoResponse(
        id=info.id,
        user_id=info.user_id,
        patient_name=user.name,
        patient_email=user.email,
        blood_group=info.blood_group,
        emergency_contact_name=info.emergency_contact_name,
        emergency_contact_phone=info.emergency_contact_phone,
        relationship=info.contact_relationship,
        allergies=info.allergies,
        medical_conditions=info.medical_conditions,
        important_notes=info.important_notes,
        doctor_name=info.doctor_name,
        doctor_phone=info.doctor_phone,
        updated_at=info.updated_at
    )


@router.get("/emergency-info", response_model=schemas.EmergencyInfoResponse)
def get_own_emergency_info(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    info = db.query(models.EmergencyInfo).filter(models.EmergencyInfo.user_id == current_user.id).first()
    return _build_emergency_response(info, current_user)


@router.put("/emergency-info", response_model=schemas.EmergencyInfoResponse)
def update_own_emergency_info(
    info_in: schemas.EmergencyInfoCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    info = db.query(models.EmergencyInfo).filter(models.EmergencyInfo.user_id == current_user.id).first()
    if not info:
        info = models.EmergencyInfo(
            user_id=current_user.id,
            blood_group=info_in.blood_group,
            emergency_contact_name=info_in.emergency_contact_name,
            emergency_contact_phone=info_in.emergency_contact_phone,
            contact_relationship=info_in.relationship,
            allergies=info_in.allergies,
            medical_conditions=info_in.medical_conditions,
            important_notes=info_in.important_notes,
            doctor_name=info_in.doctor_name,
            doctor_phone=info_in.doctor_phone
        )
        db.add(info)
    else:
        if info_in.blood_group is not None: info.blood_group = info_in.blood_group
        if info_in.emergency_contact_name is not None: info.emergency_contact_name = info_in.emergency_contact_name
        if info_in.emergency_contact_phone is not None: info.emergency_contact_phone = info_in.emergency_contact_phone
        if info_in.relationship is not None: info.contact_relationship = info_in.relationship
        if info_in.allergies is not None: info.allergies = info_in.allergies
        if info_in.medical_conditions is not None: info.medical_conditions = info_in.medical_conditions
        if info_in.important_notes is not None: info.important_notes = info_in.important_notes
        if info_in.doctor_name is not None: info.doctor_name = info_in.doctor_name
        if info_in.doctor_phone is not None: info.doctor_phone = info_in.doctor_phone
        info.updated_at = datetime.datetime.utcnow()
    
    db.commit()
    db.refresh(info)
    return _build_emergency_response(info, current_user)


@router.get("/patients/{patient_id}/emergency-info", response_model=schemas.EmergencyInfoResponse)
def get_patient_emergency_info(
    patient_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # 1. Permission Check
    if current_user.id == patient_id:
        pass  # Patient accessing own record
    elif current_user.role == "admin":
        pass  # Admin access
    elif current_user.role == "caregiver":
        link = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.patient_id == patient_id,
            models.PatientCaregiver.caregiver_id == current_user.id,
            models.PatientCaregiver.status == "active"
        ).first()
        if not link:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to view emergency info for this patient."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )

    patient = db.query(models.User).filter(models.User.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    info = db.query(models.EmergencyInfo).filter(models.EmergencyInfo.user_id == patient_id).first()
    return _build_emergency_response(info, patient)




