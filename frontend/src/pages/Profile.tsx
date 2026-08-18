import { useState, useEffect } from 'react';
import { User, Association } from '../types';
import { usersService } from '../services/users';
import { authService } from '../services/auth';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Users,
  Check,
  X,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState<User | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  // Profile update fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [role, setRole] = useState('patient');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  // Test email states
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailMessage, setTestEmailMessage] = useState({ text: '', type: '' });

  const handleSendTestEmail = async () => {
    const targetEmail = notificationEmail || email;
    if (!targetEmail) {
      setTestEmailMessage({ text: 'Please enter an email address first.', type: 'error' });
      return;
    }
    
    setSendingTestEmail(true);
    setTestEmailMessage({ text: '', type: '' });
    
    try {
      await usersService.sendTestEmail(targetEmail);
      setTestEmailMessage({ text: `Test email sent to ${targetEmail}! Check your inbox.`, type: 'success' });
    } catch (err: any) {
      setTestEmailMessage({ text: err.response?.data?.detail || 'Failed to send test email.', type: 'error' });
    } finally {
      setSendingTestEmail(false);
    }
  };
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });
  
  // Association link fields
  const [targetEmail, setTargetEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState({ text: '', type: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const userProfile = await usersService.getMe();
      setProfile(userProfile);
      setName(userProfile.name);
      setEmail(userProfile.email);
      setNotificationEmail(userProfile.notification_email || userProfile.email);
      setRole(userProfile.role);
      
      const links = await usersService.getAssociations();
      setAssociations(links);
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMessage({ text: '', type: '' });

    try {
      const updated = await usersService.updateProfile({
        name,
        email,
        notification_email: notificationEmail || email,
        role
      });
      setProfile(updated);
      localStorage.setItem('pillsync_user', JSON.stringify(updated));
      localStorage.setItem('pillsync_user_role', updated.role);
      setProfileMessage({ text: `Profile updated! Active role set to ${updated.role.toUpperCase()} Mode.`, type: 'success' });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      setProfileMessage({
        text: err.response?.data?.detail || 'Failed to update profile.',
        type: 'error'
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'New password and confirmation do not match.', type: 'error' });
      return;
    }
    
    setUpdatingPassword(true);
    setPasswordMessage({ text: '', type: '' });

    try {
      await usersService.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordMessage({ text: 'Password updated successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({
        text: err.response?.data?.detail || 'Failed to change password.',
        type: 'error'
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleCreateAssociation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) return;

    setLinking(true);
    setLinkMessage({ text: '', type: '' });

    try {
      if (profile?.role === 'caregiver') {
        await usersService.linkPatient(targetEmail.trim());
        setLinkMessage({
          text: `Connection request sent to patient (${targetEmail}). The patient must log into their patient account to ACCEPT your request.`,
          type: 'success'
        });
      } else {
        await usersService.linkCaregiver(targetEmail.trim());
        setLinkMessage({
          text: `Caregiver connection request sent to ${targetEmail}!`,
          type: 'success'
        });
      }
      setTargetEmail('');
      loadData();
    } catch (err: any) {
      setLinkMessage({
        text: err.response?.data?.detail || 'Failed to create caregiver connection request.',
        type: 'error'
      });
    } finally {
      setLinking(false);
    }
  };

  const handleRespondAssociation = async (linkId: number, newStatus: 'active' | 'rejected') => {
    try {
      await usersService.respondToAssociation(linkId, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update link status');
    }
  };

  const handleDeleteAssociation = async (linkId: number, otherName: string) => {
    if (!window.confirm(`Are you sure you want to remove connection with ${otherName}?`)) {
      return;
    }
    try {
      await usersService.deleteAssociation(linkId);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove caregiver association.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
        <p className="text-slate-300 text-sm font-bold mt-4">Loading your PillSync profile & settings...</p>
      </div>
    );
  }

  const isCurrentPatient = profile?.role === 'patient';

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-page-3d">
      {/* Profile Details and Update Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl border-2 border-cyan-500/40 p-6 shadow-2xl text-white space-y-6">
          <h3 className="text-xl font-black text-white flex items-center gap-2 border-b border-cyan-500/20 pb-4">
            <UserIcon className="h-5 w-5 text-cyan-400" />
            My Account & Profile
          </h3>

          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full flex items-center justify-center font-black text-3xl mb-3 shadow-[0_0_20px_rgba(6,182,212,0.4)] border-2 border-cyan-300/40">
              {profile?.name.charAt(0).toUpperCase()}
            </div>
            <h4 className="font-black text-white text-xl">{profile?.name}</h4>
            <span className="text-xs px-3 py-1 mt-1.5 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 rounded-full font-black uppercase tracking-wider">
              {profile?.role} Account
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-300 border-t border-b border-cyan-500/20 py-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-cyan-400" />
              <span className="truncate font-bold">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 shrink-0 text-cyan-400" />
              <span className="font-bold">Joined {new Date(profile?.created_at || '').toLocaleDateString()}</span>
            </div>
          </div>

          {profileMessage.text && (
            <div className={`p-3.5 rounded-2xl border text-xs font-bold flex gap-2.5 shadow-md ${
              profileMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
            }`}>
              {profileMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-cyan-400 uppercase tracking-widest mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border-2 border-cyan-500/40 rounded-xl text-sm font-bold bg-slate-950 text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-cyan-400 uppercase tracking-widest mb-1.5">Account & Alert Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setNotificationEmail(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 border-2 border-cyan-500/40 rounded-xl text-sm font-bold bg-slate-950 text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 font-bold">This email address is used for both Login Authentication and Medicine Refill/Dose Notifications.</p>
            </div>
            
            <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-4 space-y-3 text-left shadow-inner">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan-400 shrink-0" />
                <h4 className="text-xs font-black text-cyan-300 uppercase tracking-wider">Test Email Alerts</h4>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Click below to send a live test notification to <span className="font-bold text-cyan-300">{email || 'your email'}</span> to verify your inbox receives PillSync alerts.
              </p>
              {testEmailMessage.text && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  testEmailMessage.type === 'success' ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-200' : 'bg-rose-950/80 border border-rose-500/60 text-rose-200'
                }`}>
                  {testEmailMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />}
                  <span>{testEmailMessage.text}</span>
                </div>
              )}
              <button
                type="button"
                disabled={sendingTestEmail}
                onClick={handleSendTestEmail}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sendingTestEmail ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Mail className="h-4 w-4 text-white" />}
                <span>📧 Send Test Email Notification</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {updatingProfile && <Loader2 className="h-4 w-4 animate-spin text-white" />}
              <span>Save Profile Changes</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl border-2 border-cyan-500/40 p-6 shadow-2xl text-white space-y-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2 border-b border-cyan-500/20 pb-4">
            <Lock className="h-5 w-5 text-cyan-400" />
            Security & Password
          </h3>

          {passwordMessage.text && (
            <div className={`p-3.5 rounded-2xl border text-xs font-bold flex gap-2.5 shadow-md ${
              passwordMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
            }`}>
              {passwordMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-cyan-400 uppercase tracking-widest mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 border-2 border-cyan-500/40 rounded-xl text-sm font-bold bg-slate-950 text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-cyan-400 uppercase tracking-widest mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 border-2 border-cyan-500/40 rounded-xl text-sm font-bold bg-slate-950 text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-cyan-400 uppercase tracking-widest mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 border-2 border-cyan-500/40 rounded-xl text-sm font-bold bg-slate-950 text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 border-2 border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {updatingPassword && <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />}
              <span>Update Password</span>
            </button>
          </form>
        </div>

        {/* Delete Account Danger Zone Card */}
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl border-2 border-rose-500/50 p-6 shadow-2xl text-white space-y-4">
          <h3 className="text-xl font-black text-rose-400 flex items-center gap-2 border-b border-rose-500/20 pb-4">
            <Trash2 className="h-5 w-5 text-rose-400" />
            Delete Account
          </h3>
          <p className="text-xs text-rose-200 font-medium leading-relaxed">
            Permanently remove your PillSync user account, prescription records, and all adherence history logs from the platform.
          </p>
          <button
            type="button"
            disabled={deletingAccount}
            onClick={async () => {
              if (!window.confirm("⚠️ DANGER ZONE: Are you sure you want to permanently delete your PillSync account?\n\nThis will permanently erase all your medicine records, reminder schedules, and adherence logs. This action CANNOT be undone.")) {
                return;
              }
              try {
                setDeletingAccount(true);
                await usersService.deleteAccount();
                authService.logout();
                window.location.href = '/login';
              } catch (err: any) {
                alert(err.response?.data?.detail || 'Failed to delete account.');
              } finally {
                setDeletingAccount(false);
              }
            }}
            className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 active:scale-95 border border-rose-400/50 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {deletingAccount ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Trash2 className="h-4 w-4 text-white" />}
            <span>Permanently Delete My Account</span>
          </button>
        </div>
      </div>

      {/* Caregiver & Patient Connections Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl border-2 border-cyan-500/40 p-6 shadow-2xl text-white space-y-6">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-cyan-400" />
              {isCurrentPatient ? 'My Connected Caregivers' : 'My Monitored Patients'}
            </h3>
            <span className="text-xs px-3 py-1 rounded-full font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              {associations.length} Active Link(s)
            </span>
          </div>

          <p className="text-xs text-slate-300 font-bold leading-relaxed">
            {isCurrentPatient
              ? 'Connect with family members or caregivers so they can monitor your dose adherence and receive alerts when you miss a medicine or require a refill.'
              : 'Add patient email addresses to monitor their daily medication compliance and receive instant missed-dose and refill alert notifications.'}
          </p>

          {/* Add Connection Form */}
          <form onSubmit={handleCreateAssociation} className="p-5 bg-slate-950 border-2 border-cyan-500/30 rounded-2xl space-y-3 shadow-inner">
            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest">
              {isCurrentPatient ? '🔗 Connect New Caregiver' : '🔗 Connect New Patient'}
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder={isCurrentPatient ? "Enter Caregiver's Email" : "Enter Patient's Email"}
                className="flex-grow px-3.5 py-2.5 border-2 border-cyan-500/40 rounded-xl text-sm font-bold bg-slate-900 text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
              />
              <button
                type="submit"
                disabled={linking}
                className="py-2.5 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {linking ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Plus className="h-4 w-4 text-white" />}
                <span>Send Request</span>
              </button>
            </div>

            {linkMessage.text && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                linkMessage.type === 'success' ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-200' : 'bg-rose-950/80 border border-rose-500/60 text-rose-200'
              }`}>
                {linkMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />}
                <span>{linkMessage.text}</span>
              </div>
            )}
          </form>

          {/* Connection List */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Active Connection Records</h4>

            {associations.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/80 border-2 border-dashed border-cyan-500/30 rounded-2xl text-slate-400 text-xs font-bold">
                No connected caregivers or patients yet. Send a request above to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {associations.map((assoc) => {
                  const otherName = isCurrentPatient ? assoc.caregiver_name : assoc.patient_name;
                  const otherEmail = isCurrentPatient ? assoc.caregiver_email : assoc.patient_email;
                  const isPending = assoc.status === 'pending';

                  return (
                    <div
                      key={assoc.id}
                      className="p-4 bg-slate-950/90 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-xl bg-cyan-500/20 text-cyan-300 font-black text-lg flex items-center justify-center border border-cyan-400/40">
                          {otherName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h5 className="font-black text-white text-base">{otherName || 'User'}</h5>
                          <span className="text-xs text-cyan-300 font-bold">{otherEmail}</span>
                          <span className={`inline-block ml-2 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                            assoc.status === 'active'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                              : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                          }`}>
                            {assoc.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPending && (
                          <>
                            {isCurrentPatient ? (
                              <>
                                <button
                                  onClick={() => handleRespondAssociation(assoc.id, 'active')}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="h-4 w-4" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleRespondAssociation(assoc.id, 'rejected')}
                                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="h-4 w-4" />
                                  <span>Decline</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-amber-300 italic bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-500/40">
                                Waiting for Patient to accept in patient login
                              </span>
                            )}
                          </>
                        )}

                        <button
                          onClick={() => handleDeleteAssociation(assoc.id, otherName || 'this user')}
                          className="p-2 text-rose-400 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 rounded-xl transition-all cursor-pointer"
                          title="Remove Connection"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
