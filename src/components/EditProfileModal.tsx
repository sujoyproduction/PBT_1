import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { X, Camera, Trash2, Check, User, Mail, Briefcase, Phone, MapPin, Calendar, Home, Building, Globe, Loader2 } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  userEmail: string;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  userProfile,
  userEmail,
  onSaveProfile,
}: EditProfileModalProps) {
  if (!isOpen) return null;

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

  const [isPinLoading, setIsPinLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize with last saved user profile when modal opens or profile updates
  useEffect(() => {
    if (isOpen) {
      setFullName(userProfile?.fullName || userEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      setWorkDesignation(userProfile?.workDesignation || 'Production Member');
      setDob(userProfile?.dob || '');
      setContactNumber(userProfile?.contactNumber || '');
      setHouseStreet(userProfile?.houseStreet || '');
      setPinCode(userProfile?.pinCode || '');
      setCity(userProfile?.city || '');
      setState(userProfile?.state || '');
      setCountry(userProfile?.country || 'India');
      setPhotoUrl(userProfile?.photoUrl || '');
      setErrorMsg(null);
    }
  }, [isOpen, userProfile, userEmail]);

  // Handle India Postal Pin Code Auto Lookup
  const handlePinCodeChange = async (val: string) => {
    const cleanPin = val.replace(/\D/g, '').substring(0, 6);
    setPinCode(cleanPin);

    if (cleanPin.length === 6) {
      setIsPinLoading(true);
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

  // Resize and compress uploaded image to a lightweight base64 data URL
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10MB. Please select a smaller photo.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const updatedProfile: UserProfile = {
      id: userProfile?.id || userEmail.toLowerCase().trim(),
      fullName: fullName.trim() || userEmail.split('@')[0],
      workDesignation: workDesignation.trim() || 'Production Member',
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
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSaveProfile(updatedProfile);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMsg('Failed to save profile. Please try again.');
      setIsSaving(false);
    }
  };

  // Get user initials
  const initials = (fullName || userEmail)
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Edit Registration Profile</h3>
              <p className="text-xs text-slate-400">View &amp; update your last saved registration record &amp; photo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Profile Photo Uploader */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl gap-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500/60 bg-slate-800 flex items-center justify-center shadow-lg">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="User Profile"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-blue-400 font-mono tracking-wider">
                    {initials}
                  </span>
                )}
              </div>

              {/* Quick Camera Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full border-2 border-slate-900 shadow-md transition-all cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
              </button>

              {photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400">JPG or PNG (auto-compressed for database optimization)</p>
          </div>

          {/* Registration Form Fields */}
          <div className="space-y-4">
            {/* Full Name & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sujoy Production"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  <span>Work Designation</span>
                </label>
                <input
                  type="text"
                  value={workDesignation}
                  onChange={(e) => setWorkDesignation(e.target.value)}
                  placeholder="e.g. Production Manager / Line Producer"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* DOB & Contact Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>DOB (Date of Birth)</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Contact Number</span>
                </label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Email id (Read Only) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email id (Login User ID)</span>
                </label>
                <span className="text-[10px] text-blue-400 font-mono">(Verified Account ID)</span>
              </div>
              <input
                type="email"
                disabled
                value={userEmail}
                className="w-full px-3.5 py-2.5 bg-slate-800/40 border border-slate-800 rounded-xl text-xs font-mono font-semibold text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* House & Street */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-blue-400" />
                <span>House &amp; Street Address</span>
              </label>
              <input
                type="text"
                value={houseStreet}
                onChange={(e) => setHouseStreet(e.target.value)}
                placeholder="Building, Flat / Plot No., Street Address"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Pin code, City, State, Country */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Pin Code */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pin code</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => handlePinCodeChange(e.target.value)}
                    placeholder="700001"
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-mono font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  {isPinLoading && (
                    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
                  )}
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-400" />
                  <span>City</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Kolkata / Mumbai"
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-400" />
                  <span>State</span>
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="West Bengal"
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Country</span>
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="India"
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-semibold text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
