# PillSync: Intelligent Medicine Reminder and Medication Tracking Platform

PillSync is a full-stack medication management and compliance tracking web application. It is designed to assist patients in organizing their daily medicine schedules, logging their adherence (taken/missed doses), and enabling caregivers to monitor compliance, stock levels, and refill predictions.

---

## 🌟 Project Architecture & Milestones Summary

### 🔑 Milestone 1: Authentication & Core Setup
* **Backend Foundation**: Structured FastAPI Python server with modular routers, schemas, SQLAlchemy models, and security utilities.
* **Database Design**: Implemented relational schema for user accounts, role-based profiles (Patient/Caregiver), and pairing connections.
* **Authentication**: Developed JWT (JSON Web Token) authentication with secure password hashing (`bcrypt`).
* **Caregiver Portal**: Built secure connection portals (inviting, accepting, and listing caregiver-patient relationships).

### 🗄️ Milestone 2: Medication Cabinet & Scheduling
* **Medication Cabinet**: Developed full CRUD operations (add, edit, delete, view) for patient medications.
* **Intake Instructions**: Designed prominent, color-coded visual cards for intake advice (**`Before Food`**, **`After Food`**, **`At Night`**).
* **Scheduling Engine**: Created background processes to automatically compute daily schedules and instantiate logging states.

### 🤖 Milestone 3: AI Vision OCR, Chatbot & Notifications
* **AI Multimodal OCR Scanner**: Integrates **Google Gemini API (`gemini-2.0-flash`)** to parse handwritten/printed prescriptions, extract dosages, and translate brand names to generic names.
* **AI Chatbot**: Created a conversational health assistant trained on patient medication history and adherence data.
* **Interactive Email Notifications**: Formatted styled Nodemailer SMTP daily emails with custom buttons directing users back to compliance logs.
* **Caregiver Alerts**: Dispatches automated email notifications to caregivers if a daily dose goes unlogged 1 hour past the scheduled time.
* **Inline Controls**: Implemented immediate bell toggles (**`🔔 Enabled`** / **`🔕 Disabled`**) directly on the dashboard cards to pause alerts without opening edit forms.

---

## 🛠️ Technology Stack

* **Backend**: FastAPI (Python), SQLAlchemy ORM, SQLite Database, Uvicorn Server, Pytest.
* **Frontend**: React (TypeScript), Vite Build Tool, Tailwind CSS, Axios Client, Lucide Icons.
* **AI Engine**: Google Gemini API (`gemini-2.0-flash`, `gemini-1.5-flash`).
* **SMTP Worker**: Node.js & Nodemailer (Background Scheduler).

---

## 📂 Project Directory Structure

```text
Intelligent-Medicine-Reminder-and-Medication-Tracking-Platform/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py          # Registration & login routers
│   │   │   ├── medicines.py     # Cabinet CRUD & OCR extraction endpoints
│   │   │   └── users.py         # Caregiver & chatbot endpoints
│   │   ├── ai_service.py        # Gemini Vision parser & chatbot logic
│   │   ├── auth.py              # Cryptography and JWT utilities
│   │   ├── config.py            # Environment configurations
│   │   ├── database.py          # Session and engine config
│   │   ├── email_worker.py      # Background email worker scheduler
│   │   ├── main.py              # FastAPI startup & registration
│   │   ├── models.py            # Database tables schema definition
│   │   └── schemas.py           # Pydantic validation schemas
│   ├── requirements.txt         # Backend Python packages
│   └── pillsync.db              # SQLite development database file
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Navbar.tsx       # Main header navigation bar
    │   ├── pages/
    │   │   ├── Dashboard.tsx    # Live patient / caregiver metrics & logs
    │   │   ├── Home.tsx         # Branding landing page
    │   │   ├── Medicines.tsx    # Medicine cabinet with inline toggle controls
    │   │   ├── PrescriptionOCR.tsx # Interactive prescription OCR review panel
    │   │   ├── Login.tsx        # Sign-in portal page
    │   │   ├── Register.tsx     # Sign-up page (roles selection)
    │   │   └── Profile.tsx      # Profile details & caregiver pairing page
    │   ├── services/
    │   │   ├── api.ts           # Axios client configuration
    │   │   ├── medicines.ts     # Cabinet API communication layer
    │   │   └── users.ts         # User API communication layer
    │   ├── types/
    │   │   └── index.ts         # TypeScript interface definitions
    │   ├── App.tsx              # Routing logic & private route protection
    │   └── index.css            # Tailwind CSS directives & custom styling
    ├── package.json             # Frontend dependency packages
    ├── vite.config.ts           # Vite compile configurations
    └── index.html               # Main root HTML file
```

---

## 🛡️ Setup & Running Locally

### 1. Backend Server
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside `backend/` and configure:
   ```env
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   SENDER_EMAIL=your_email@gmail.com
   GEMINI_API_KEY=your_gemini_api_key
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### 2. Frontend Development Server
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
4. Open the application in your browser at `http://localhost:5173`.

---

*PillSync Medication Platform — Fully Prepared for Milestone 4 Deployment.*
