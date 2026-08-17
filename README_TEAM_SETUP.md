# 🚀 PillSync — Team Setup & Local Execution Guide

This document provides step-by-step instructions for your team members to set up and run the **PillSync Intelligent Medicine Reminder & Tracking Platform** on their local machines.

---

## 💻 Tech Stack Overview

* **Frontend:** React 18, Vite 4, TypeScript, Tailwind CSS, Lucide Icons, Axios, Recharts
* **Backend:** Python 3.10+, FastAPI, SQLAlchemy, SQLite (`pillsync.db`), Pydantic, Passlib (Bcrypt)
* **AI & OCR Services:** Google Gemini 1.5 Flash Vision API, FDA RxNav REST API
* **Email Worker:** Python SMTPLib / Nodemailer (Google SMTP Server)

---

## 📋 Prerequisites

Before running the project, ensure your computer has the following installed:
1. **Node.js** (v18.0 or higher) $\rightarrow$ [Download Node.js](https://nodejs.org)
2. **Python** (v3.10 or higher) $\rightarrow$ [Download Python](https://python.org)

---

## ⚡ Quick Start Guide (2 Steps)

### Step 1: Start the Backend Server (Terminal 1)

Open a terminal inside the project directory and run:

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Start FastAPI Uvicorn Development Server
uvicorn app.main:app --reload --port 8000
```

> **Backend API Running At:** `http://localhost:8000`  
> **Interactive Swagger Documentation:** `http://localhost:8000/docs`

---

### Step 2: Start the Frontend Application (Terminal 2)

Open a second terminal inside the project directory and run:

```bash
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start Vite Frontend Development Server
npm run dev
```

> **Frontend Web Application Running At:** `http://localhost:5173`

---

## 🔑 Pre-Configured Test Accounts

Your database (`pillsync.db`) comes pre-seeded with ready-to-use accounts for your presentation:

| Account Type | Email Address | Role | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Patient Account** | `shankarganeshbalusu@gmail.com` | `Patient` | Cabinet management, AI Prescription OCR scanner, dose adherence logging, history analysis |
| **Caregiver Account** | `maths4412@gmail.com` | `Caregiver` | Patient link monitoring, emergency missed-dose alerts, inventory refill tracker |

---

## 🎯 Key Application Features & API Routes

1. **AI Prescription OCR Scanner (`/prescription-ocr`):**
   * Parses scanned prescription images/PDFs using Gemini Vision API and auto-fills dosage, frequency, and treatment duration.
2. **Medicine Cabinet & AI Safety Guard (`/medicines`):**
   * Strictly blocks illicit non-medicinal drugs (`cocaine`, `heroin`, `meth`, etc.) and gibberish.
   * Highlights Controlled Prescription Drugs (`Xanax`, `Alprazolam`, `Morphine`, etc.) with mandatory doctor prescription notices.
3. **Medical Records & Discontinuation Audit (`/medical-records`):**
   * `👨‍⚕️ STOPPED PER DOCTOR ADVICE`
   * `🎓 TREATMENT COURSE COMPLETED`
   * `🚫 MISTAKEN ENTRY (VOID)`
4. **Refill Tracker & Automated Email Dispatch (`/refill`):**
   * Dispatches direct refill reminder emails via SMTPLib when stock falls to $\le 2$ days or $\le 2$ pills.

---

## 🔒 Verification & Build Command

To verify that all TypeScript types and frontend assets compile cleanly without errors:

```bash
cd frontend
npm run build
```
