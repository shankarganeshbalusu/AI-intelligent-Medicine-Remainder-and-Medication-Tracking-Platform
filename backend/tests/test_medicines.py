import pytest
import datetime

def test_create_medicine_and_reminders(client):
    # Register user
    client.post(
        "/api/auth/register",
        json={
            "name": "Med Patient",
            "email": "med_patient@example.com",
            "password": "patientpassword",
            "role": "patient"
        }
    )
    
    # Login patient
    login_res = client.post(
        "/api/auth/login",
        json={"email": "med_patient@example.com", "password": "patientpassword"}
    ).json()
    token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create medicine: Aspirin, 100mg, qty: 50, frequency: 2 times/day, duration: 3 days
    create_res = client.post(
        "/api/medicines",
        json={
            "name": "Aspirin",
            "dosage": "100mg",
            "quantity": 50,
            "times_per_day": 2,
            "duration_days": 3
        },
        headers=headers
    )
    assert create_res.status_code == 201
    med_data = create_res.json()
    assert med_data["name"] == "Aspirin"
    assert med_data["times_per_day"] == 2
    assert med_data["duration_days"] == 3
    
    # Fetch today's reminders (should find 2 scheduled times: 09:00, 21:00)
    reminders_res = client.get("/api/medicines/reminders/today", headers=headers)
    assert reminders_res.status_code == 200
    reminders = reminders_res.json()
    assert len(reminders) == 2
    assert reminders[0]["medicine_name"] == "Aspirin"
    assert reminders[0]["dose_time"] == "09:00"
    assert reminders[1]["dose_time"] == "21:00"

def test_log_reminder_status_and_stock_deduction(client):
    # Register user
    client.post(
        "/api/auth/register",
        json={
            "name": "Stock Patient",
            "email": "stock_patient@example.com",
            "password": "patientpassword",
            "role": "patient"
        }
    )
    
    # Login patient
    login_res = client.post(
        "/api/auth/login",
        json={"email": "stock_patient@example.com", "password": "patientpassword"}
    ).json()
    token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create medicine
    create_res = client.post(
        "/api/medicines",
        json={
            "name": "Ibuprofen",
            "dosage": "200mg",
            "quantity": 30,
            "times_per_day": 1,
            "duration_days": 2
        },
        headers=headers
    )
    assert create_res.status_code == 201
    med_id = create_res.json()["id"]
    
    # Get today's reminders
    rem_res = client.get("/api/medicines/reminders/today", headers=headers)
    reminder_id = rem_res.json()[0]["id"]
    
    # Put status update: taken
    log_res = client.put(
        f"/api/medicines/reminders/{reminder_id}/status?status_update=taken",
        headers=headers
    )
    assert log_res.status_code == 200
    assert log_res.json()["status"] == "taken"
    
    # Check that stock quantity is reduced from 30 to 29
    med_list = client.get("/api/medicines", headers=headers)
    med = [m for m in med_list.json() if m["id"] == med_id][0]
    assert med["quantity"] == 29

    # Check medication log creation
    logs_res = client.get("/api/medicines/medication-logs", headers=headers)
    logs = logs_res.json()
    assert len(logs) == 1
    assert logs[0]["medicine_name"] == "Ibuprofen"
    assert logs[0]["status"] == "taken"

def test_caregiver_access_permissions(client):
    # Register Patient
    client.post(
        "/api/auth/register",
        json={
            "name": "Link Patient",
            "email": "link_patient@example.com",
            "password": "patientpassword",
            "role": "patient"
        }
    )
    patient_id = client.post(
        "/api/auth/login",
        json={"email": "link_patient@example.com", "password": "patientpassword"}
    ).json()["user_id"]
    
    # Register Caregiver
    client.post(
        "/api/auth/register",
        json={
            "name": "Link Caregiver",
            "email": "link_caregiver@example.com",
            "password": "caregiverpassword",
            "role": "caregiver"
        }
    )
    caregiver_login = client.post(
        "/api/auth/login",
        json={"email": "link_caregiver@example.com", "password": "caregiverpassword"}
    ).json()
    caregiver_headers = {"Authorization": f"Bearer {caregiver_login['access_token']}"}
    
    # Check that caregiver cannot view patient's medicines before link is active
    no_auth_res = client.get(f"/api/medicines?patient_id={patient_id}", headers=caregiver_headers)
    assert no_auth_res.status_code == 403
    
    # Establish connection
    patient_headers = {"Authorization": f"Bearer " + client.post(
        "/api/auth/login",
        json={"email": "link_patient@example.com", "password": "patientpassword"}
    ).json()["access_token"]}
    
    # Send link request
    link_res = client.post(
        "/api/users/link-caregiver",
        json={"caregiver_email": "link_caregiver@example.com"},
        headers=patient_headers
    )
    link_id = link_res.json()["id"]
    
    # Caregiver accepts link
    client.put(f"/api/users/associations/{link_id}?status_update=active", headers=caregiver_headers)
    
    # Now check that caregiver can view patient's medicines successfully
    auth_res = client.get(f"/api/medicines?patient_id={patient_id}", headers=caregiver_headers)
    assert auth_res.status_code == 200
