# 🚀 PillSync Personal Cloud Deployment Guide

This guide walks you through deploying PillSync to the cloud for free with a new personal GitHub repository.

---

## 🛠️ Stack & Infrastructure Overview

| Layer | Recommended Cloud Platform | Configuration |
| :--- | :--- | :--- |
| **Frontend Web App** | **Vercel** or **Render Static Site** | Vite Build (`dist`), SPA rewrite routing rules (`vercel.json`) |
| **Backend REST API** | **Render Web Service** (or Railway/Koyeb) | Python 3.10+, Uvicorn (`backend/Procfile`) |
| **Database** | **SQLite (Persistent Volume on Render)** or **Supabase PostgreSQL** | `pillsync.db` with pre-seeded Admin, Patient & Caregiver accounts |
| **AI Vision & Chatbot** | **Google Gemini API** | `GEMINI_API_KEY` configured in Cloud Dashboard Environment Variables |
| **Email Service** | **Google SMTP** | `SMTP_USER` & `SMTP_PASSWORD` configured in Cloud Dashboard |

---

## 📌 STEP 1: Create Your New Personal GitHub Repository

1. Open browser and go to: [https://github.com/new](https://github.com/new)
2. Enter Repository Name: `AI-intelligent-Medicine-Remainder-and-Medication-Tracking-Platform`
3. Choose **Public** or **Private**.
4. Click **Create repository**.

---

## 📌 STEP 2: Push Folder `Intelligent-Medicine-Reminder-and-Medication-Tracking-Platform1` to GitHub

Open Command Prompt (`cmd`) inside `C:\Users\MY PC\Downloads\Intelligent-Medicine-Reminder-and-Medication-Tracking-Platform1` and run:

```cmd
git push -u origin main
```

---

## 📌 STEP 3: Deploy Backend on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository `AI-intelligent-Medicine-Remainder-and-Medication-Tracking-Platform`.
3. Set Settings:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = `YOUR_GEMINI_API_KEY_HERE`
   - `SMTP_SERVER` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `maths4412@gmail.com`
   - `SMTP_PASSWORD` = `ffawgczfiszwouhu`
   - `SENDER_EMAIL` = `maths4412@gmail.com`
5. Click **Create Web Service**. Your live backend URL will look like: `https://pillsync-backend.onrender.com`.

---

## 📌 STEP 4: Deploy Frontend on Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new) and log in with GitHub.
2. Select your repository `AI-intelligent-Medicine-Remainder-and-Medication-Tracking-Platform`.
3. Set Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://pillsync-backend.onrender.com`
5. Click **Deploy**. Vercel will give you a live production HTTPS URL for your website!
