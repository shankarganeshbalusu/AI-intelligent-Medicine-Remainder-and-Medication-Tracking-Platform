import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import History from './pages/History';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import GoogleAuth from './pages/GoogleAuth';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import PrescriptionOCR from './pages/PrescriptionOCR';
import RefillTracker from './pages/RefillTracker';
import MedicalRecords from './pages/MedicalRecords';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPatients from './pages/admin/AdminPatients';
import AdminCaregivers from './pages/admin/AdminCaregivers';
import AdminMedicines from './pages/admin/AdminMedicines';
import AdminActivity from './pages/admin/AdminActivity';
import AdminRefillTracker from './pages/admin/AdminRefillTracker';
import AdminMedicalRecords from './pages/admin/AdminMedicalRecords';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProfile from './pages/admin/AdminProfile';
import { authService } from './services/auth';
import { usersService } from './services/users';
import {
  Pill,
  Activity,
  HeartPulse,
  Plus,
  Heart,
  Send,
  Sparkles,
  X,
  Loader2
} from 'lucide-react';

// Helper component to guard routes that require authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = authService.isAuthenticated();
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const [user, setUser] = useState<any>(null);
  
  // Global Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hi! I am your PillSync AI Assistant. Ask me anything about your active medications, food instructions, side effects, or compliance score!' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const handleAuthChange = () => {
    setUser(authService.getCurrentUser());
  };

  const handleSendChatMessage = async (msgText?: string) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim()) return;

    const updatedMessages = [...chatMessages, { sender: 'user' as const, text: textToSend }];
    setChatMessages(updatedMessages);
    if (!msgText) setChatInput('');
    setChatLoading(true);

    try {
      const response = await usersService.askChatbot(textToSend);
      setChatMessages(prev => [...prev, { sender: 'ai' as const, text: response.reply }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { sender: 'ai' as const, text: 'Sorry, I am having trouble connecting right now. Please check back soon!' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen vibrant-mesh-bg text-slate-100 relative overflow-hidden">
        {/* 3D Animated Grid Floor */}
        <div className="grid-floor-3d" />

        {/* Ambient Volumetric Glow Spheres */}
        <div className="light-sphere-cyan top-[5%] left-[-10%] animate-sphere-1" />
        <div className="light-sphere-purple bottom-[15%] right-[-10%] animate-sphere-2" />

        {/* Floating Medicine Background Logos */}
        <div className="absolute top-[12%] left-[8%] text-brand-500/10 animate-float-slow pointer-events-none">
          <Pill className="h-28 w-28 rotate-45 filter drop-shadow-[0_0_15px_rgba(14,144,233,0.1)]" />
        </div>
        <div className="absolute top-[48%] right-[6%] text-brand-600/10 animate-float-delayed pointer-events-none">
          <Activity className="h-32 w-32 filter drop-shadow-[0_0_15px_rgba(2,114,199,0.1)]" />
        </div>
        <div className="absolute bottom-[18%] left-[6%] text-emerald-500/10 animate-float-slow pointer-events-none">
          <HeartPulse className="h-28 w-28 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]" />
        </div>
        <div className="absolute top-[22%] right-[32%] text-cyan-500/10 animate-float-delayed pointer-events-none">
          <Plus className="h-24 w-24 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.1)]" />
        </div>
        <div className="absolute bottom-[35%] right-[22%] text-indigo-500/10 animate-float-slow pointer-events-none">
          <Pill className="h-24 w-24 -rotate-12 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.1)]" />
        </div>
        <div className="absolute top-[65%] left-[25%] text-brand-500/10 animate-float-delayed pointer-events-none">
          <Heart className="h-20 w-20 filter drop-shadow-[0_0_15px_rgba(14,144,233,0.08)]" />
        </div>

        <Sidebar user={user} onLogout={handleAuthChange} onAskAI={() => setChatOpen(prev => !prev)} />
        <main className={`flex-grow min-h-screen py-8 px-4 sm:px-6 relative z-10 transition-all duration-300 ${user ? 'md:pl-56' : ''}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={
                authService.isAuthenticated() ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLoginSuccess={handleAuthChange} />
                )
              } 
            />
            <Route 
              path="/register" 
              element={
                authService.isAuthenticated() ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Register onLoginSuccess={handleAuthChange} />
                )
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                authService.isAuthenticated() ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <ForgotPassword />
                )
              } 
            />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/google-auth" element={<GoogleAuth onLoginSuccess={handleAuthChange} />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/medicines" 
              element={
                <ProtectedRoute>
                  <Medicines />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/refill" 
              element={
                <ProtectedRoute>
                  <RefillTracker />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/medical-records" 
              element={
                <ProtectedRoute>
                  <MedicalRecords />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prescription-ocr" 
              element={
                <ProtectedRoute>
                  <PrescriptionOCR />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } 
            />

            {/* Admin Dashboard & Management Routes */}
            <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/patients" element={<AdminProtectedRoute><AdminPatients /></AdminProtectedRoute>} />
            <Route path="/admin/caregivers" element={<AdminProtectedRoute><AdminCaregivers /></AdminProtectedRoute>} />
            <Route path="/admin/medicines" element={<AdminProtectedRoute><AdminMedicines /></AdminProtectedRoute>} />
            <Route path="/admin/activity" element={<AdminProtectedRoute><AdminActivity /></AdminProtectedRoute>} />
            <Route path="/admin/refill" element={<AdminProtectedRoute><AdminRefillTracker /></AdminProtectedRoute>} />
            <Route path="/admin/medical-records" element={<AdminProtectedRoute><AdminMedicalRecords /></AdminProtectedRoute>} />
            <Route path="/admin/notifications" element={<AdminProtectedRoute><AdminNotifications /></AdminProtectedRoute>} />
            <Route path="/admin/reports" element={<AdminProtectedRoute><AdminReports /></AdminProtectedRoute>} />
            <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />
            <Route path="/admin/profile" element={<AdminProtectedRoute><AdminProfile /></AdminProtectedRoute>} />

            {/* Fallback route */}
            <Route 
              path="*" 
              element={<Navigate to="/" replace />} 
            />
          </Routes>
        </main>
        
        {/* Global Floating AI Chatbot Assistant Widget */}
        {(user?.role === 'patient' || user?.role === 'caregiver') && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Panel */}
            {chatOpen && (
              <div className="mb-4 w-[360px] sm:w-[380px] h-[500px] bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up select-none">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-600 to-indigo-600 p-4 text-white flex justify-between items-center shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full ai-hologram-orb flex items-center justify-center relative shrink-0">
                      <div className="absolute inset-0.5 rounded-full border border-white/35 animate-spin-slow" />
                      <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-wide text-white">PillSync AI Assistant</h4>
                      <span className="text-[10px] text-brand-100 font-bold uppercase tracking-wider block">Clinical Safety Copilot</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Chat Message list */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 flex flex-col text-slate-800">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm font-medium ${
                        msg.sender === 'user'
                          ? 'bg-brand-600 text-white self-end rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-800 self-start rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="bg-white border border-slate-200 text-slate-500 self-start rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-1.5 shadow-sm animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin text-brand-500" />
                      <span>AI is formulating advice...</span>
                    </div>
                  )}
                </div>

                {/* Suggestions shortcuts */}
                <div className="px-4 py-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
                  <button
                    onClick={() => handleSendChatMessage('Check my compliance score')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-colors"
                  >
                    📊 Compliance Report
                  </button>
                  <button
                    onClick={() => handleSendChatMessage('What are common medication side effects?')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-colors"
                  >
                    💊 Side Effects Info
                  </button>
                  <button
                    onClick={() => handleSendChatMessage('Tips for taking Metformin')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-colors"
                  >
                    🍽️ Food Guide
                  </button>
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-slate-150 bg-white flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a medical safety question..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendChatMessage();
                    }}
                    className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
                  />
                  <button
                    onClick={() => handleSendChatMessage()}
                    className="p-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl shadow-sm transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Toggle Button */}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="h-14 w-14 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-2xl shadow-brand-500/10 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-95 relative"
              title="AI Health Assistant"
            >
              <div className={`h-10 w-10 rounded-full ai-hologram-orb flex items-center justify-center relative ${chatLoading ? 'animate-pulse' : ''}`}>
                <Sparkles className="h-4.5 w-4.5 text-white animate-pulse" />
              </div>
            </button>
          </div>
        )}
        
        <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} PillSync. Intelligent Medicine Reminder & Tracking Platform.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
