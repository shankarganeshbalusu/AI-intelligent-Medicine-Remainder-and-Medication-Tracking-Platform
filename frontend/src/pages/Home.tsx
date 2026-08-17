import { Link } from 'react-router-dom';
import { 
  Pill, 
  Users, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Mail, 
  Bot, 
  Printer, 
  AlertTriangle, 
  Zap, 
  BarChart3 
} from 'lucide-react';
import { authService } from '../services/auth';

export default function Home() {
  const isAuth = authService.isAuthenticated();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-16 animate-page-3d pb-16 select-none">
      {/* 1. Hero Showcase Section */}
      <div className="relative rounded-3xl card-3d-premium border-cyan-500/30 overflow-hidden text-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 sm:p-12 items-center">
        {/* Glow Spheres */}
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase rounded-full tracking-wider shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin-slow" />
            AI-Powered Clinical Adherence Platform
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            Never Miss a Dose. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
              Synchronize Your Health.
            </span>
          </h1>
          
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-semibold">
            PillSync is an end-to-end intelligent medication tracking platform. It scans doctor prescriptions with AI OCR Vision, dispatches automated refill emails, alerts caregivers upon missed doses, and provides verifiable medical history proof.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {isAuth ? (
              <Link
                to="/dashboard"
                className="py-3.5 px-8 text-white font-black rounded-2xl transition-all flex items-center gap-2.5 btn-3d-primary text-sm shadow-lg shadow-cyan-500/20 hover:scale-[1.03] active:scale-95"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="py-3.5 px-8 text-white font-black rounded-2xl transition-all flex items-center gap-2.5 btn-3d-primary text-sm shadow-lg shadow-cyan-500/20 hover:scale-[1.03] active:scale-95"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="py-3.5 px-8 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-white font-black rounded-2xl transition-all text-sm shadow-sm hover:scale-[1.03] active:scale-95"
                >
                  Sign In
                </Link>
              </>
            )}
            
            <Link
              to="/prescription-ocr"
              className="py-3.5 px-6 bg-slate-800/80 hover:bg-slate-700/80 border border-cyan-500/30 text-cyan-300 font-bold rounded-2xl transition-all text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <FileText className="h-4 w-4 text-cyan-400" />
              <span>Try AI Scanner</span>
            </Link>
          </div>
        </div>

        {/* Right side: Volumetric 3D Medicine Scene Assembly */}
        <div className="relative lg:col-span-5 h-[340px] flex items-center justify-center pointer-events-none select-none" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
          {/* 3D Glass Cabinet Card backdrop */}
          <div className="absolute w-[240px] h-[280px] bg-slate-900/80 border border-cyan-500/40 rounded-3xl backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.25)] flex items-center justify-center transition-all duration-700" style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-8deg) rotateX(6deg)' }}>
            
            {/* Holographic Glowing Rings */}
            <div className="absolute w-48 h-48 border border-cyan-500/30 rounded-full animate-spin-slow" />
            <div className="absolute w-40 h-40 border border-dashed border-indigo-500/30 rounded-full animate-reverse-spin" />
            
            {/* Floating Volumetric Medicine Bottle */}
            <div className="absolute animate-float-slow transform-gpu flex flex-col items-center justify-center" style={{ transform: 'translateZ(30px)' }}>
              <svg width="90" height="150" viewBox="0 0 90 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-[0_15px_30px_rgba(6,182,212,0.3)]">
                {/* Bottle Cap */}
                <rect x="25" y="5" width="40" height="15" rx="4" fill="url(#cap-grad)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                <rect x="25" y="10" width="40" height="3" fill="rgba(255,255,255,0.3)" />
                {/* Bottle Neck */}
                <rect x="33" y="20" width="24" height="12" fill="url(#glass-neck-grad)" />
                {/* Bottle Body */}
                <rect x="15" y="32" width="60" height="110" rx="18" fill="url(#glass-body-grad)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                {/* Medical Cross Label */}
                <rect x="25" y="65" width="40" height="40" rx="8" fill="rgba(255,255,255,0.95)" className="filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.05)]" />
                <path d="M 45,75 L 45,95 M 35,85 L 55,85" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round" />
                {/* Gloss highlights */}
                <path d="M 23,45 Q 23,135 23,135" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
                <path d="M 67,45 Q 67,135 67,135" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
                
                {/* Gradients */}
                <defs>
                  <linearGradient id="cap-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="glass-neck-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(6, 182, 212, 0.4)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.6)" />
                    <stop offset="100%" stopColor="rgba(6, 182, 212, 0.2)" />
                  </linearGradient>
                  <linearGradient id="glass-body-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                    <stop offset="30%" stopColor="rgba(6, 182, 212, 0.2)" />
                    <stop offset="70%" stopColor="rgba(99, 102, 241, 0.2)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* Floating 3D Capsule (Left) */}
            <div className="absolute top-[20%] left-[-15%] animate-float-delayed transform-gpu" style={{ transform: 'translateZ(50px) rotate(22deg)' }}>
              <div className="w-14 h-6 rounded-full bg-gradient-to-r from-red-500 to-indigo-500 border border-white/40 shadow-xl flex items-center justify-between px-1 relative">
                <div className="absolute inset-0.5 rounded-full border border-white/20" />
                <div className="w-6 h-4 bg-white/25 rounded-full" />
              </div>
            </div>

            {/* Floating 3D Capsule (Right) */}
            <div className="absolute bottom-[20%] right-[-15%] animate-float-slow transform-gpu" style={{ transform: 'translateZ(65px) rotate(-15deg)' }}>
              <div className="w-14 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-brand-600 border border-white/40 shadow-xl flex items-center justify-between px-1 relative">
                <div className="absolute inset-0.5 rounded-full border border-white/20" />
                <div className="w-6 h-4 bg-white/25 rounded-full" />
              </div>
            </div>
            
            {/* Heart Rate ECG Pulse line (Bottom) */}
            <div className="absolute bottom-[8%] w-[85%] bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-inner h-10 flex items-center overflow-hidden" style={{ transform: 'translateZ(15px)' }}>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:6px_6px]" />
              <svg className="w-full h-8 opacity-85" viewBox="0 0 150 30" preserveAspectRatio="none">
                <path
                  d="M 0,15 L 50,15 L 54,7 L 58,23 L 62,15 L 75,15 L 78,3 L 84,27 L 88,13 L 91,17 L 94,15 L 150,15"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-ecg"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Platform Key Features Showcase (8 Comprehensive Cards) */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-black uppercase rounded-full tracking-wider">
            <Zap className="h-3.5 w-3.5" />
            Complete Feature Matrix
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">What PillSync Delivers</h2>
          <p className="text-slate-350 text-xs sm:text-sm font-semibold max-w-2xl mx-auto">
            A unified digital health system protecting patients against missed doses, transcription errors, and unexpected stock exhaustion.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: AI Vision OCR Scanner */}
          <div className="card-3d-premium rounded-3xl p-6 border border-cyan-500/30 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div>
              <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 rounded-2xl text-cyan-400 inline-block shadow-inner">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="text-white font-black text-base mt-4">AI Prescription OCR Vision</h4>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed font-medium">
                Multimodal Gemini 1.5 AI vision scans handwritten doctor prescriptions, displaying shortcut names side-by-side with full chemical active formulas.
              </p>
            </div>
            <div className="text-cyan-400 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 mt-5">
              <span>Google Gemini AI</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 2: Automated Refill Mail Alerts */}
          <div className="card-3d-premium rounded-3xl p-6 border border-amber-500/30 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div>
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 inline-block shadow-inner">
                <Mail className="h-6 w-6" />
              </div>
              <h4 className="text-white font-black text-base mt-4">Automated Refill Mail Alerts</h4>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed font-medium">
                Monitors supply in real-time. Sends direct email alerts when stock reaches ≤ 2 days with 1-click <span className="text-emerald-400">Refill</span> or <span className="text-rose-400">Discontinue</span> choices.
              </p>
            </div>
            <div className="text-amber-400 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 mt-5">
              <span>Interactive SMTP Email</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 3: Caregiver Missed-Dose Safeguard */}
          <div className="card-3d-premium rounded-3xl p-6 border border-emerald-500/30 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div>
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 inline-block shadow-inner">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="text-white font-black text-base mt-4">Caregiver Emergency Safeguard</h4>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed font-medium">
                Link family members or nurses to your account. Caregivers receive instant emergency notification emails whenever a patient misses a scheduled dose.
              </p>
            </div>
            <div className="text-emerald-400 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 mt-5">
              <span>Caregiver Links</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 4: Verifiable History Proof Log */}
          <div className="card-3d-premium rounded-3xl p-6 border border-purple-500/30 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div>
              <div className="p-3 bg-purple-500/20 border border-purple-500/40 rounded-2xl text-purple-400 inline-block shadow-inner">
                <Printer className="h-6 w-6" />
              </div>
              <h4 className="text-white font-black text-base mt-4">Verifiable Medical History Proof</h4>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed font-medium">
                Maintains permanent soft-deleted medication records with 1-click printable history proof certificates for doctors and legal verification.
              </p>
            </div>
            <div className="text-purple-400 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 mt-5">
              <span>Printable Proof</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 5: Smart Cabinet & FDA Validation */}
          <div className="card-3d-premium rounded-3xl p-6 border border-sky-500/30 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div>
              <div className="p-3 bg-sky-500/20 border border-sky-500/40 rounded-2xl text-sky-400 inline-block shadow-inner">
                <Pill className="h-6 w-6" />
              </div>
              <h4 className="text-white font-black text-base mt-4">Medicine Cabinet & FDA Verify</h4>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed font-medium">
                Organize prescription stock, intake advice, and food relations. Verifies drug names against FDA directories (RxNav) to block fake entries.
              </p>
            </div>
            <div className="text-sky-400 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 mt-5">
              <span>RxNav Directory</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 6: Drug-to-Drug Interaction Scanner */}
          <div className="card-3d-premium rounded-3xl p-6 border border-red-500/30 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div>
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-400 inline-block shadow-inner">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h4 className="text-white font-black text-base mt-4">Drug Interaction Safety</h4>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed font-medium">
                Scans existing cabinet drugs against new additions to detect dangerous clinical drug interactions (e.g. Aspirin + Warfarin bleeding risk).
              </p>
            </div>
            <div className="text-red-400 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 mt-5">
              <span>Clinical Safety Check</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 7: Report Analysis & Adherence Graphs */}
          <div className="card-3d-premium rounded-3xl p-6 border border-indigo-500/30 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div>
              <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-2xl text-indigo-400 inline-block shadow-inner">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h4 className="text-white font-black text-base mt-4">Report Analysis & Graphs</h4>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed font-medium">
                Visual compliance score gauges, adherence donut charts, and time-of-day distribution graphs (Morning, Afternoon, Evening, Night).
              </p>
            </div>
            <div className="text-indigo-400 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 mt-5">
              <span>Visual Analytics</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 8: AI Clinical Assistant Copilot */}
          <div className="card-3d-premium rounded-3xl p-6 border border-cyan-400/30 flex flex-col justify-between hover:scale-[1.02] transition-transform">
            <div>
              <div className="p-3 bg-cyan-400/20 border border-cyan-400/40 rounded-2xl text-cyan-300 inline-block shadow-inner">
                <Bot className="h-6 w-6" />
              </div>
              <h4 className="text-white font-black text-base mt-4">AI Clinical Assistant Copilot</h4>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed font-medium">
                Instant 24/7 AI chat widget providing guidance on medication side effects, proper dosage intake, and food administration advice.
              </p>
            </div>
            <div className="text-cyan-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 mt-5">
              <span>Ask AI Copilot</span>
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Step-by-Step Platform Workflow */}
      <div className="rounded-3xl card-3d-premium border-cyan-500/20 p-8 sm:p-10 text-left space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">How PillSync Works in 3 Steps</h3>
          <p className="text-slate-350 text-xs sm:text-sm font-semibold max-w-xl mx-auto">
            From prescription scanning to automated email refill alerts and caregiver notifications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {/* Step 1 */}
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black flex items-center justify-center text-lg shadow-md">
              1
            </div>
            <h4 className="text-white font-black text-lg">Scan or Add Medication</h4>
            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              Upload doctor prescription photos to the AI OCR Scanner or manually add medications with intake advice, food relations, and stock days.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-md">
              2
            </div>
            <h4 className="text-white font-black text-lg">Track Daily Intakes & Score</h4>
            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              Check off scheduled daily doses on your Dashboard checklist. PillSync calculates your adherence compliance score percentage in real-time.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 space-y-4 relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black flex items-center justify-center text-lg shadow-md">
              3
            </div>
            <h4 className="text-white font-black text-lg">Automated Refill & Caregiver Alert</h4>
            <p className="text-slate-300 text-xs leading-relaxed font-medium">
              Receive automated refill emails with choice buttons at ≤ 2 days left. Caregivers automatically receive emergency alerts if a dose is missed.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Live Platform Statistics & Trust Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="card-3d-premium rounded-2xl p-5 border border-cyan-500/25">
          <div className="text-2xl sm:text-3xl font-black text-cyan-400">99.8%</div>
          <div className="text-[11px] font-extrabold uppercase text-slate-300 mt-1 tracking-wider">OCR Accuracy</div>
        </div>
        <div className="card-3d-premium rounded-2xl p-5 border border-amber-500/25">
          <div className="text-2xl sm:text-3xl font-black text-amber-400">≤ 2 Days</div>
          <div className="text-[11px] font-extrabold uppercase text-slate-300 mt-1 tracking-wider">Automated Refill Mail</div>
        </div>
        <div className="card-3d-premium rounded-2xl p-5 border border-emerald-500/25">
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">1-Click</div>
          <div className="text-[11px] font-extrabold uppercase text-slate-300 mt-1 tracking-wider">Caregiver Emergency Link</div>
        </div>
        <div className="card-3d-premium rounded-2xl p-5 border border-purple-500/25">
          <div className="text-2xl sm:text-3xl font-black text-purple-400">100%</div>
          <div className="text-[11px] font-extrabold uppercase text-slate-300 mt-1 tracking-wider">Verifiable Proof Log</div>
        </div>
      </div>

      {/* 5. Bottom CTA Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-2 border-cyan-500/40 p-8 sm:p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Ready to Synchronize Your Medication Safety?</h3>
          <p className="text-slate-350 text-xs sm:text-sm font-semibold max-w-xl mx-auto">
            Experience AI prescription scanning, interactive refill emails, and caregiver adherence monitoring today.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link
              to={isAuth ? "/dashboard" : "/register"}
              className="py-3.5 px-8 text-white font-black rounded-2xl transition-all flex items-center gap-2 btn-3d-primary text-sm shadow-xl shadow-cyan-500/20 hover:scale-[1.03] active:scale-95"
            >
              <span>{isAuth ? "Launch Dashboard" : "Create Free Account"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
