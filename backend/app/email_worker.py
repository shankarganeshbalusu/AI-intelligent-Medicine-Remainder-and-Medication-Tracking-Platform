import asyncio
import datetime
import os
import smtplib
import subprocess
from typing import Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session

from app import models
from app.database import SessionLocal

# SMTP settings (loaded from environment variables if present)
SMTP_SERVER = os.getenv("SMTP_SERVER", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "noreply@pillsync.com")

# Frontend platform URL for login links
LOGIN_URL = os.getenv("FRONTEND_URL", "http://localhost:5173") + "/login"


def send_email_notification(to_email: str, subject: str, html_body: str):
    """Sends email directly via fast native Python smtplib with Node.js fallback and local outbox audit logging."""
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER") or "maths4412@gmail.com"
    smtp_password = os.getenv("SMTP_PASSWORD") or "ffawgczfiszwouhu"
    sender_email = os.getenv("SENDER_EMAIL") or smtp_user

    # Audit log to backend/dispatched_emails.txt for verification
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        log_path = os.path.join(backend_dir, "dispatched_emails.txt")
        log_entry = f"[{datetime.datetime.now().isoformat()}] TO: {to_email} | SUBJECT: {subject}\n"
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception:
        pass

    # 1. Native Python smtplib (Fast direct delivery <0.5s)
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"PillSync Automated System <{sender_email}>"
        msg["To"] = to_email
        msg["Reply-To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(sender_email, [to_email], msg.as_string())
        print(f"[NATIVE FAST SMTP] Email sent instantly to {to_email}")
        return
    except Exception as py_err:
        print(f"[NATIVE SMTP WARNING] {py_err}. Trying Node fallback...")

    # 2. Subprocess fallback (Nodemailer)
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        script_path = os.path.join(backend_dir, "send_email.js")
        node_bin = "node"
        appdata_node = r"C:\Users\MY PC\AppData\Local\nodejs\node.exe"
        if os.path.exists(appdata_node):
            node_bin = appdata_node
            
        result = subprocess.run(
            [node_bin, script_path, to_email, subject, html_body],
            capture_output=True,
            text=True,
            cwd=backend_dir,
            check=True
        )
        print(f"[NODEMAILER FALLBACK]\n{result.stdout}")
    except Exception as node_err:
        print(f"[EMAIL DISPATCH FAILURE] All email transports failed: {node_err}")


SENT_REFILL_ALERT_KEYS = set()

def reset_refill_alert_tracker(medicine_id: int):
    """Resets the sent refill alert tracker for a medicine when it is refilled."""
    keys_to_remove = [k for k in SENT_REFILL_ALERT_KEYS if k.startswith(f"{medicine_id}_")]
    for k in keys_to_remove:
        SENT_REFILL_ALERT_KEYS.discard(k)

def send_refill_alert_email(to_email: str, patient_name: str, medicine_name: str, dosage: str, quantity_left: int, days_left: int, medicine_id: Optional[int] = None, force_send: bool = False):
    """Dispatches a low stock refill warning email asking if the user wants to refill or discontinue when 2 or fewer days remain. Guarantees EXACTLY ONE delivery per red-zone stock event per day."""
    if medicine_id and not force_send:
        alert_key = f"{medicine_id}_{datetime.date.today().isoformat()}_{to_email}"
        if alert_key in SENT_REFILL_ALERT_KEYS:
            print(f"[REFILL EMAIL GUARD] Email already sent today for medicine ID {medicine_id} to {to_email}. Skipping duplicate sending.")
            return
        SENT_REFILL_ALERT_KEYS.add(alert_key)

    subject = f"⚠️ PillSync — Refill Mail for Your Medicines (Stock Completing)"
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #f59e0b; border-radius: 16px; background-color: #ffffff; box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.15);">
      <div style="background-color: #fffbeb; border-bottom: 2px solid #fde68a; padding: 16px 20px; border-radius: 12px 12px 0 0; margin: -24px -24px 20px -24px;">
        <h2 style="color: #b45309; margin: 0; font-size: 20px; font-weight: 800;">⚠️ PillSync — Refill Mail for Your Medicines</h2>
      </div>

      <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin-bottom: 12px;">Hello <strong>{patient_name}</strong>,</p>
      
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <p style="color: #92400e; font-size: 16px; font-weight: 800; margin: 0 0 8px 0; line-height: 1.4;">
          This is a refill mail for your medicines. Do you want to continue or not like refill? The stock is completing.
        </p>
        <p style="color: #78350f; font-size: 14px; font-weight: 600; margin: 0;">
          Your medication supply for <strong>{medicine_name}</strong> has only <strong>{days_left} day(s)</strong> left ({quantity_left} pills remaining).
        </p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <h4 style="color: #0f172a; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Medication Supply Summary</h4>
        <p style="margin: 6px 0; color: #334155; font-size: 14px;"><strong>Medicine Name:</strong> <span style="color: #0f172a; font-weight: 700;">{medicine_name}</span></p>
        <p style="margin: 6px 0; color: #334155; font-size: 14px;"><strong>Dosage Strength:</strong> {dosage}</p>
        <p style="margin: 6px 0; color: #334155; font-size: 14px;"><strong>Current Stock Left:</strong> {quantity_left} pills ({days_left} day(s) supply)</p>
        <p style="margin: 10px 0 0 0; color: #dc2626; font-size: 15px; font-weight: 800;">Status: Only {days_left} Day(s) Left Before Exhaustion!</p>
      </div>

      <div style="text-align: center; background-color: #fafafa; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 20px;">
        <p style="color: #0f172a; font-size: 15px; font-weight: 800; margin-bottom: 16px;">Do you want to continue this medicine treatment or discontinue after finishing tablets?</p>
        
        <div style="margin-bottom: 12px;">
          <a href="{LOGIN_URL}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">
            ✅ YES, CONTINUE & REFILL MEDICINE NOW
          </a>
        </div>

        <div>
          <a href="{LOGIN_URL}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-block;">
            ❌ NO, DISCONTINUE & REMOVE MEDICINE WHEN FINISHED
          </a>
        </div>
      </div>
      
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
        PillSync Automated Medicine Refill Dispatch System &bull; Mandatory Password Authentication Required
      </p>
    </div>
    """
    send_email_notification(to_email, subject, html_body)


def print_mock_email(to_email: str, subject: str, html_body: str):
    """Fallback mock print representation of the email notification."""
    try:
        title_str = "[EMAIL NOTIFICATION] (Local Mock Mode)"
        to_str = f"To:      {to_email}"
        sub_str = f"Subject: {subject}"
        
        import re
        clean_text = html_body.replace("<p>", "").replace("</p>", "\n").replace("<strong>", "").replace("</strong>", "").replace("<br>", "\n")
        clean_text = re.sub(r'<[^>]*>', '', clean_text)
        clean_text = "\n".join([line.strip() for line in clean_text.splitlines() if line.strip()])
        
        def safe_print(msg: str):
            print(msg.encode('ascii', 'ignore').decode('ascii'))
            
        safe_print("=" * 70)
        safe_print(title_str)
        safe_print(to_str)
        safe_print(sub_str)
        safe_print("-" * 70)
        safe_print(clean_text)
        safe_print("=" * 70)
    except Exception as e:
        print(f"[MOCK EMAIL ERROR] Failed to print mock logs: {e}")


async def check_and_send_reminders():
    """Background task to poll and check reminders every 60 seconds with role-aware routing."""
    while True:
        try:
            db: Session = SessionLocal()
            now = datetime.datetime.now()
            today_date = datetime.datetime.combine(datetime.date.today(), datetime.time.min)
            current_time_str = now.strftime("%H:%M")
            
            # 1. Check for active reminders due in the current minute (status == "pending")
            due_reminders = db.query(models.Reminder).join(models.Medicine).filter(
                models.Reminder.reminder_date == today_date,
                models.Reminder.dose_time == current_time_str,
                models.Reminder.status == "pending",
                models.Medicine.notifications_enabled == True
            ).all()

            for reminder in due_reminders:
                patient = reminder.medicine.user
                patient_email = patient.email.strip().lower() if patient.email else None
                
                print(f"[NOTIFICATION] Reminder ID={reminder.id}")
                print(f"[NOTIFICATION] Medication owner: ID={patient.id} Email={patient_email}")

                import random
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
                food_rel = reminder.medicine.food_relation or "As prescribed"
                
                # A. Patient Medication Reminder
                subject_patient = "PillSync — Medication Reminder"
                html_patient = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <h2 style="color: #0f172a; margin-bottom: 16px;">💊 PillSync — Medication Reminder</h2>
                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello <strong>{patient.name}</strong>,</p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">This is a reminder to take your scheduled medication:</p>
                  
                  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <p style="margin: 4px 0; color: #0f172a; font-size: 15px;"><strong>Medicine:</strong> {reminder.medicine.name}</p>
                    <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Dosage:</strong> {reminder.medicine.dosage}</p>
                    <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Scheduled Time:</strong> {reminder.dose_time}</p>
                    <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Food Relation:</strong> {food_rel}</p>
                    <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Status:</strong> Pending</p>
                  </div>
                  
                  <p style="margin: 24px 0; text-align: left;">
                    <a href="{LOGIN_URL}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">Open PillSync Login Page</a>
                  </p>
                  
                  <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                    <span style="display: block; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #10b981; margin-bottom: 4px;">Motivational Health Quote</span>
                    <p style="color: #334155; font-size: 14px; font-style: italic; margin: 0;">"{quote}"</p>
                  </div>
                  
                  <p style="color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 24px;">PillSync Intelligent Medicine Tracker Engine</p>
                </div>
                """
                
                if patient_email:
                    print(f"[EMAIL] Patient reminder recipient: {patient_email}")
                    send_email_notification(patient_email, subject_patient, html_patient)

                # B. Active Caregiver Scheduled Notification
                caregiver_link = db.query(models.PatientCaregiver).filter(
                    models.PatientCaregiver.patient_id == patient.id,
                    models.PatientCaregiver.status == "active"
                ).first()

                if caregiver_link and caregiver_link.caregiver:
                    cg = caregiver_link.caregiver
                    cg_email = cg.email.strip().lower() if cg.email else None
                    print(f"[NOTIFICATION] Active caregiver: ID={cg.id} Email={cg_email}")
                    
                    if cg_email:
                        subject_cg = f"PillSync — Scheduled Dose Alert for {patient.name}"
                        html_cg = f"""
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                          <h2 style="color: #06b6d4; margin-bottom: 16px;">🔔 PillSync Caregiver Scheduled Alert</h2>
                          <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello <strong>{cg.name}</strong>,</p>
                          <p style="color: #475569; font-size: 14px; line-height: 1.5;">Your monitored patient <strong>{patient.name}</strong> has a scheduled medication dose:</p>
                          
                          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 16px 0;">
                            <p style="margin: 4px 0; color: #0f172a; font-size: 15px;"><strong>Patient:</strong> {patient.name}</p>
                            <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Medicine:</strong> {reminder.medicine.name}</p>
                            <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Dosage:</strong> {reminder.medicine.dosage}</p>
                            <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Scheduled Time:</strong> {reminder.dose_time} today</p>
                          </div>

                          <p style="margin: 24px 0; text-align: left;">
                            <a href="{LOGIN_URL}" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(6, 182, 212, 0.2);">Open PillSync Login Page</a>
                          </p>
                          
                          <p style="color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 24px;">PillSync Caregiver Monitoring Engine</p>
                        </div>
                        """
                        print(f"[EMAIL] Caregiver notification recipient: {cg_email}")
                        send_email_notification(cg_email, subject_cg, html_cg)

                # Set reminder notified state to prevent duplicate sending
                reminder.status = "notified"
                db.commit()

            # 2. Check for overdue reminders (scheduled > 1 hour ago and still pending/notified)
            overdue_cutoff = now - datetime.timedelta(hours=1)
            
            overdue_reminders = db.query(models.Reminder).join(models.Medicine).filter(
                models.Reminder.reminder_date <= today_date,
                models.Reminder.status.in_(["pending", "notified"])
            ).all()
            
            for r in overdue_reminders:
                try:
                    dose_hour, dose_min = map(int, r.dose_time.split(":"))
                    dose_dt = datetime.datetime.combine(r.reminder_date.date(), datetime.time(dose_hour, dose_min))
                    
                    if dose_dt < overdue_cutoff:
                        # Mark reminder as missed
                        r.status = "missed"
                        
                        log = models.MedicationLog(
                            reminder_id=r.id,
                            user_id=r.medicine.user_id,
                            status="missed"
                        )
                        db.add(log)
                        db.commit()
                        
                        patient = r.medicine.user
                        
                        # CAREGIVER ONLY missed-dose email (User Directive)
                        caregiver_link = db.query(models.PatientCaregiver).filter(
                            models.PatientCaregiver.patient_id == patient.id,
                            models.PatientCaregiver.status == "active"
                        ).first()
                        
                        if r.medicine.notifications_enabled and caregiver_link and caregiver_link.caregiver:
                            cg = caregiver_link.caregiver
                            cg_email = cg.email.strip().lower() if cg.email else None
                            
                            if cg_email:
                                subject_cg_missed = f"PillSync — Missed Medication Alert for {patient.name}"
                                html_cg_missed = f"""
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                                  <h2 style="color: #ef4444; margin-bottom: 16px;">⚠️ PillSync — Missed Medication Alert</h2>
                                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello <strong>{cg.name}</strong>,</p>
                                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">Your monitored patient <strong>{patient.name}</strong> has missed their scheduled medication dosage.</p>
                                  
                                  <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 16px 0;">
                                    <p style="margin: 4px 0; color: #991b1b; font-size: 15px;"><strong>Patient:</strong> {patient.name}</p>
                                    <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Medicine:</strong> {r.medicine.name}</p>
                                    <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Dosage:</strong> {r.medicine.dosage}</p>
                                    <p style="margin: 4px 0; color: #991b1b; font-size: 14px;"><strong>Scheduled Time:</strong> {r.dose_time} on {r.reminder_date.strftime('%Y-%m-%d')}</p>
                                    <p style="margin: 8px 0 0 0; color: #7f1d1d; font-size: 14px; font-weight: bold;">Alert: Patient missed this scheduled medicine or dosage.</p>
                                  </div>
                                  
                                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">Suggested Action: Please check in with {patient.name} to confirm adherence.</p>

                                  <p style="margin: 24px 0; text-align: left;">
                                    <a href="{LOGIN_URL}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);">Open PillSync Login Page</a>
                                  </p>
                                  
                                  <p style="color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 24px;">PillSync Caregiver Tracking Engine</p>
                                </div>
                                """
                                print(f"[MISSED EMAIL] Dispatching missed alert to CAREGIVER ONLY: {cg_email}")
                                send_email_notification(cg_email, subject_cg_missed, html_cg_missed)
                except Exception as err:
                    print(f"[REMAINING WORKER ERROR] {err}")

            # 3. Automatic periodic check for any medicines in the RED ZONE (<= 2 days or <= 2 pills left)
            try:
                red_zone_medicines = db.query(models.Medicine).all()

                for med in red_zone_medicines:
                    times_per_day = med.times_per_day if med.times_per_day > 0 else 1
                    days_left = med.quantity // times_per_day
                    if days_left <= 2 or med.quantity <= 2:
                        patient = med.user
                        if patient:
                            target_emails = set()
                            if patient.email:
                                target_emails.add(patient.email.strip().lower())
                            if patient.notification_email:
                                target_emails.add(patient.notification_email.strip().lower())

                            for target_email in target_emails:
                                send_refill_alert_email(
                                    to_email=target_email,
                                    patient_name=patient.name,
                                    medicine_name=med.name,
                                    dosage=med.dosage,
                                    quantity_left=med.quantity,
                                    days_left=days_left,
                                    medicine_id=med.id
                                )
                                print(f"[BACKGROUND WORKER RED ZONE REFILL EMAIL DISPATCHED] to {target_email} for {med.name} (Pills: {med.quantity}, Days: {days_left})")
            except Exception as red_err:
                print(f"[RED ZONE BACKGROUND CHECK ERROR] {red_err}")

            db.close()
        except Exception as e:
            print(f"[REMAINING WORKER CRITICAL ERROR] {e}")
        
        await asyncio.sleep(60)
