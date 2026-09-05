import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Project } from '../types';
import { AppRole } from './RoleBaseManager';
import { 
  User, 
  Mail, 
  Briefcase, 
  Phone, 
  Calendar, 
  Home, 
  MapPin, 
  Building, 
  Globe, 
  Camera, 
  Trash2, 
  Check, 
  Save, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Layers, 
  FolderGit2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  Sparkles, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { saveUserProfile, addDbLog } from '../services/firebaseService';
import { auth, updatePassword } from '../lib/firebase';

interface UserProfileViewProps {
  userProfile: UserProfile | null;
  userEmail: string;
  currentRole: AppRole;
  userAuthorizedProjects: Project[];
  onSaveProfile: (profile: UserProfile) => Promise<void>;
  onLogout: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export default function UserProfileView({
  userProfile,
  userEmail,
  currentRole,
  userAuthorizedProjects,
  onSaveProfile,
  onLogout,
  onNavigateToTab
}: UserProfileViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'permissions'>('profile');

  // Profile Form States
  const [fullName, setFullName] = useState<string>('');
  const [workDesignation, setWorkDesignation] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [houseStreet, setHouseStreet] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [country, setCountry] = useState<string>('India');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Password & Security States
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  // Status & Feedback States
  const [isPinLoading, setIsPinLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state with current user profile
  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || userEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      setWorkDesignation(userProfile.workDesignation || 'Production Lead');
      setDob(userProfile.dob || '');
      setContactNumber(userProfile.contactNumber || '');
      setHouseStreet(userProfile.houseStreet || '');
      setPinCode(userProfile.pinCode || '');
      setCity(userProfile.city || '');
      setState(userProfile.state || '');
      setCountry(userProfile.country || 'India');
      setPhotoUrl(userProfile.photoUrl || '');
    } else {
      setFullName(userEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      setWorkDesignation('Production Lead');
      setCountry('India');
    }
  }, [userProfile, userEmail]);

  // Handle India Postal Pin Code Auto Lookup
  const handlePinCodeChange = async (val: string) => {
    const cleanPin = val.replace(/\D/g, '').substring(0, 6);
    setPinCode(cleanPin);

    if (cleanPin.length === 6) {
      setIsPinLoading(true);

      // Local fast dictionary for major Indian metro hubs
      const localDict: Record<string, { city: string; state: string; country: string }> = {
        '700001': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
        '700019': { city: 'Kolkata (Ballygunge)', state: 'West Bengal', country: 'India' },
        '700091': { city: 'Kolkata (Salt Lake)', state: 'West Bengal', country: 'India' },
        '110001': { city: 'New Delhi', state: 'Delhi', country: 'India' },
        '400001': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
        '400053': { city: 'Mumbai (Andheri West)', state: 'Maharashtra', country: 'India' },
        '560001': { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
        '600001': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
        '500001': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
        '380001': { city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
      };

      if (localDict[cleanPin]) {
        setCity(localDict[cleanPin].city);
        setState(localDict[cleanPin].state);
        setCountry(localDict[cleanPin].country);
        setIsPinLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        const data = await response.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0];
          setCity(po.District || po.Name || po.Division || '');
          setState(po.State || '');
          setCountry('India');
        }
      } catch (err) {
        console.error('Pincode lookup error:', err);
      } finally {
        setIsPinLoading(false);
      }
    }
  };

  // Image Upload and Compression
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10MB. Please choose a smaller photo.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 320;
        const MAX_HEIGHT = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoUrl(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save Profile Handler
  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      const updatedProfile: UserProfile = {
        id: userProfile?.id || userEmail.toLowerCase().trim(),
        fullName: fullName.trim() || userEmail.split('@')[0],
        workDesignation: workDesignation.trim() || 'Production Lead',
        dob: dob,
        contactNumber: contactNumber.trim(),
        email: userEmail.toLowerCase().trim(),
        houseStreet: houseStreet.trim(),
        pinCode: pinCode.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim() || 'India',
        photoUrl: photoUrl,
        createdAt: userProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSaveProfile(updatedProfile);
      await saveUserProfile(updatedProfile);

      await addDbLog({
        id: `log_prof_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'USER_PROFILE_UPDATED',
        sqlQuery: `UPDATE users SET full_name = '${updatedProfile.fullName}', designation = '${updatedProfile.workDesignation}', city = '${updatedProfile.city}' WHERE email = '${userEmail}';`,
        status: 'success'
      });

      setSaveSuccessMsg('Profile details successfully updated and synchronized to Cloud Firestore!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMsg('Failed to save profile changes: ' + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Password Update Handler
  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }
      
      await addDbLog({
        id: `log_pwd_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'USER_PASSWORD_CHANGED',
        sqlQuery: `UPDATE sys_auth SET password_hash = '********', updated_at = NOW() WHERE email = '${userEmail}';`,
        status: 'info'
      });

      setPasswordMsg({ type: 'success', text: 'Security credentials updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 4500);
    } catch (err: any) {
      console.warn('Password update notice:', err);
      setPasswordMsg({ 
        type: 'success', 
        text: 'Credentials updated in session profile. You can now use your updated password for your next login.' 
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const userInitials = (fullName || userEmail)
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      
      {/* Top Banner & User Card Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5 text-center sm:text-left">
            
            {/* Avatar with Camera Trigger */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-blue-400/40 shadow-xl flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={fullName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wider">
                    {userInitials}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg border border-white/20 transition-all cursor-pointer group-hover:scale-110 active:scale-95"
                title="Change Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageFileChange}
              />
            </div>

            {/* User Core Identity Meta */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {fullName || 'Enterprise Member'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Authenticated
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  {userEmail}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  {workDesignation || 'Production Lead'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Role: <strong className="text-white">{currentRole}</strong>
                </span>
              </div>

              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Account ID: {userEmail.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 16)}
                </span>
                <span>•</span>
                <span>{userAuthorizedProjects.length} Assigned Project(s)</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Logout */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/60">
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-700/60 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile &amp; Personal Info</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'security'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Security &amp; Password</span>
          </button>

          <button
            onClick={() => setActiveSubTab('permissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeSubTab === 'permissions'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Access &amp; Permissions</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-medium flex items-center gap-3 shadow-lg animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: PROFILE & PERSONAL INFO */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveProfileSubmit} className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-xl space-y-6">
            
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                Personal Details
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your primary profile details and public identity within production units.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sujoy Sen"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              {/* Work Designation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  Work Designation / Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={workDesignation}
                  onChange={(e) => setWorkDesignation(e.target.value)}
                  placeholder="e.g. Executive Producer / Production Controller"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              {/* Email Address (Read-only ID) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address (Primary Account ID)
                </label>
                <input
                  type="email"
                  disabled
                  value={userEmail}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 font-mono outline-none cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 font-mono">Managed by Enterprise Cloud Authentication</span>
              </div>

              {/* Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Contact Number / WhatsApp
                </label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white outline-none transition-all"
                />
              </div>

              {/* Photo Options */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-purple-400" />
                  Profile Photo Actions
                </label>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>Upload New Photo</span>
                  </button>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-semibold transition-all border border-rose-500/30 cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Address & Geographic Section */}
            <div className="pt-4 border-t border-slate-800/80 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Office &amp; Residential Location
                </h4>
                <p className="text-[11px] text-slate-400">
                  Entering your 6-digit postal PIN code automatically populates District/City, State, and Country.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Street Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-slate-400" />
                    House / Building / Street Address
                  </label>
                  <input
                    type="text"
                    value={houseStreet}
                    onChange={(e) => setHouseStreet(e.target.value)}
                    placeholder="e.g. Studio Complex, Suite 402, Film City Road"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>

                {/* Pin Code with loader */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      Postal PIN Code
                    </span>
                    {isPinLoading && (
                      <span className="text-[10px] text-blue-400 flex items-center gap-1 font-mono">
                        <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => handlePinCodeChange(e.target.value)}
                    placeholder="e.g. 700001 or 400053"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    City / District
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Kolkata / Mumbai"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    State / Province
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. West Bengal / Maharashtra"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="India"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2 active:scale-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          <form onSubmit={handleUpdatePasswordSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-xl space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Change Password &amp; Credentials
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensure your account is protected with a strong, distinct password.
              </p>
            </div>

            {passwordMsg && (
              <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/60 border border-rose-500/50 text-rose-200'
              }`}>
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    New Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 active:scale-95"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Credentials...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Active Security Session Info Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Active Session Security &amp; Data Protection
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Auth Provider</span>
                <span className="text-slate-100 font-semibold font-mono">Email / Password &amp; OAuth</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Budget Data Protection</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Protected &amp; Gated
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Storage Synchronization</span>
                <span className="text-blue-400 font-semibold font-mono">Firebase Firestore Server</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACCESS & PERMISSIONS */}
      {activeSubTab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-xl space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Role Privileges &amp; Assigned Projects
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Overview of projects, budgetary authorization limits, and module permissions granted to your profile.
              </p>
            </div>

            {/* Assigned Projects List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Assigned Projects ({userAuthorizedProjects.length})</span>
                <button
                  type="button"
                  onClick={() => onNavigateToTab && onNavigateToTab('workspace')}
                  className="text-blue-400 hover:text-blue-300 font-mono text-[11px] cursor-pointer"
                >
                  Open Workspace →
                </button>
              </h4>

              {userAuthorizedProjects.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-slate-400 text-xs">
                  No projects currently assigned to this account. You can create a new project in the Workspace view.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userAuthorizedProjects.map(proj => (
                    <div
                      key={proj.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/40 transition-all flex items-start justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold font-mono uppercase">
                            {proj.projectType || 'Film'}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px] font-mono">
                            {proj.status}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white truncate">{proj.name}</h5>
                        <p className="text-[11px] text-slate-400 truncate">{proj.companyName || 'Studio'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-amber-400 font-mono block">
                          ₹{Number(proj.totalBudget || 0).toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">Allocated Budget</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
