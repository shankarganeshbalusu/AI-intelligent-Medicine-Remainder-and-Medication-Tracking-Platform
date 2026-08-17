# PillSync Milestone 2: Verification Walkthrough Report
**Component: Medication Management & Email Reminders**

This report details the work accomplished, tests executed, and manual verification steps completed for **Milestone 2**.

---

## 🌟 What was Built

### 1. Backend API Routing & Database Mappings
We implemented full routing handlers in `backend/app/routes/medicines.py` and validated inputs using Pydantic schemas in `schemas.py`:
* **`POST /api/medicines`**: Registers patient medications (drug name, dose strength, times per day, quantity stock, duration).
  * **Auto-Scheduler:** Generates scheduled daily slots inside the `reminders` table automatically (e.g. 2 times daily for 10 days generates 20 reminders).
* **`GET /api/medicines`**: Lists patient medicine inventories.
* **`GET /api/reminders/today`**: Returns checklist slots scheduled for the current date.
* **`PUT /api/reminders/{id}/status`**: Updates status (`taken` / `missed`). Decrements medicine remaining stock counts automatically if taken. Logs records into `medication_logs`.
* **`GET /api/medication-logs`**: Returns compliance history timelines.

### 2. Async Background Email Notification Engine (`email_worker.py`)
* Operates as a lightweight daemon worker inside the FastAPI loop.
* **Alerts Engine:** Scans `reminders` every minute for pending times matching the current hour and minute. Formats custom HTML alerts, sends emails via SMTP (or prints to console logs locally if credentials are blank), and updates statuses to `notified`.
* **Escalation Daemon:** If a patient leaves an alert un-actioned for > 1 hour, it updates reminder status to `missed`, writes a log, and sends an escalation alert email to their **linked Caregiver** to warning them.

### 3. Frontend Interactive UI Pages
* **Medicines Inventory (`Medicines.tsx`)**: Form cards to add medicines and view stock levels. For Caregivers, renders a dropdown selector to view linked patient cabinets.
* **Dashboard Checklist (`Dashboard.tsx`)**: Renders today's scheduled dose slots with interactive checklist action buttons ("Take" / "Miss") for patients, and read-only status tags for caregivers. Calculates compliance scores.
* **Compliance History (`History.tsx`)**: Renders timelines showing green logs for Taken and red logs for Missed. Includes caregiver selection controls.

---

## 🧪 Verification & Validation

### 1. Automated Integration Tests (Passed)
Wrote 3 test cases inside `backend/tests/test_medicines.py`:
* `test_create_medicine_and_reminders`: Verifies registration and auto-scheduling reminder rows.
* `test_log_reminder_status_and_stock_deduction`: Verifies status updates, logs creation, and stock decrements.
* `test_caregiver_access_permissions`: Verifies caregivers can only monitor patient medicines after active link approval.

**Result: 10/10 tests passed successfully (including auth, profile, and medicines suites).**

### 2. Frontend Production Compiling (Passed)
Ran Vite's compilation bundle check:
```bash
npm run build
```
**Result: Compiles and bundles successfully with 0 errors.**
