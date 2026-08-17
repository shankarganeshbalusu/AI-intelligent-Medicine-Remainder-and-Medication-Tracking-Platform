# 🚀 PillSync — Milestone 4: Production Deployment Guide

This guide provides step-by-step instructions for deploying **PillSync** to live cloud hosting using **Vercel** (Frontend) and **Koyeb / Render** (Backend).

---

## ⚡ Deployment Architecture Overview

* **Frontend (React 18 + Vite + Tailwind CSS):** Deployed on **Vercel** *(Ultra-fast global Edge CDN)*.
* **Backend (Python FastAPI + SQLite):** Deployed on **Koyeb / Render** *(High-speed Python Web Service)*.
* **Cost:** **100% Free** for both services.

---

## 🛠️ Step 1: Deploy Frontend on Vercel (30 Seconds)

1. Go to [Vercel.com](https://vercel.com) and log in with GitHub / Email.
2. Click **"Add New"** $\rightarrow$ **"Project"**.
3. Import your PillSync GitHub repository (or upload the `frontend/` folder).
4. Configure Build Settings:
   * **Framework Preset:** Vite
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
5. Add Environment Variable:
   * `VITE_API_URL` = `https://pillsync-backend.koyeb.app/api` (or your backend cloud URL)
6. Click **Deploy**.

> **Live Frontend URL Generated:** `https://pillsync.vercel.app`

---

## 🛠️ Step 2: Deploy Backend on Koyeb / Render

1. Go to [Koyeb.com](https://koyeb.com) or [Render.com](https://render.com).
2. Click **"Create Web Service"**.
3. Select your repository and set Root Directory to `backend`.
4. Configure Settings:
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   * `GEMINI_API_KEY` = `YOUR_GEMINI_API_KEY_HERE`
   * `SMTP_SERVER` = `smtp.gmail.com`
   * `SMTP_PORT` = `587`
   * `SMTP_USER` = `maths4412@gmail.com`
   * `SMTP_PASSWORD` = `ffawgczfiszwouhu`
   * `SENDER_EMAIL` = `maths4412@gmail.com`
6. Click **Deploy**.

> **Live Backend API URL Generated:** `https://pillsync-backend.koyeb.app`

---

## 🌐 Alternative Instant Deployment: Localtunnel / ngrok

If you want to demo live during your presentation straight from your laptop with **0 cloud latency**:

```bash
# 1. Install localtunnel
npm install -g localtunnel

# 2. Expose Backend API
lt --port 8000 --subdomain pillsync-api

# 3. Expose Frontend Web App
lt --port 5173 --subdomain pillsync-app
```

> **Live Public HTTPS Links:**
> * Frontend: `https://pillsync-app.loca.lt`
> * Backend: `https://pillsync-api.loca.lt`
