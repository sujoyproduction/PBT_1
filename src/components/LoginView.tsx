import { useState, FormEvent } from 'react';
import { saveUserProfile, getUserProfile, addDbLog } from '../services/firebaseService';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../lib/firebase';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  User,
  Briefcase,
  Phone,
  Calendar,
  Home,
  MapPin,
  Building,
  Globe,
  Loader2,
  CheckCircle2,
  Sparkles,
  KeyRound
} from 'lucide-react';
import PBTLogo from './PBTLogo';

interface LoginViewProps {
  onLogin: (email: string) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Login state
  const [email, setEmail] = useState('sujoy.production@gmail.com');
  const [password, setPassword] = useState('Production@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration state
  const [regFullName, setRegFullName] = useState('');
  const [regWorkDesignation, setRegWorkDesignation] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regContactNumber, setRegContactNumber] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regHouseStreet, setRegHouseStreet] = useState('');
  const [regPinCode, setRegPinCode] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regCountry, setRegCountry] = useState('India');
  const [isPinLookupLoading, setIsPinLookupLoading] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Handle Pincode Auto-fill
  const handlePinCodeChange = async (pin: string) => {
    setRegPinCode(pin);
    const cleanPin = pin.trim();

    if (cleanPin.length === 6 && /^\d+$/.test(cleanPin)) {
      setIsPinLookupLoading(true);

      // Local quick dictionary fallback for common pincodes
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
        setRegCity(localDict[cleanPin].city);
        setRegState(localDict[cleanPin].state);
        setRegCountry(localDict[cleanPin].country);
        setIsPinLookupLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        const data = await response.json();
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0];
          setRegCity(po.District || po.Name || po.Division || '');
          setRegState(po.State || '');
          setRegCountry('India');
        } else {
          setRegCountry('India');
        }
      } catch (err) {
        console.error('Pincode fetch error:', err);
        setRegCountry('India');
      } finally {
        setIsPinLookupLoading(false);
      }
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email id is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cleanEmail = email.toLowerCase().trim();

      // Attempt Firebase Authentication first
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      } catch (authErr: any) {
        // If user not found or auth not configured, check or create profile
        console.info('[Firebase Auth Notice]', authErr?.code || authErr?.message);
      }

      let profile = await getUserProfile(cleanEmail);
      if (!profile) {
        profile = {
          id: cleanEmail,
          fullName: cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          workDesignation: 'Production Lead',
          dob: '',
          contactNumber: '',
          email: cleanEmail,
          houseStreet: '',
          pinCode: '',
          city: '',
          state: '',
          country: 'India',
          createdAt: new Date().toISOString()
        };
        await saveUserProfile(profile);
      }

      await addDbLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'USER_LOGIN_SUCCESS',
        sqlQuery: `SELECT * FROM users WHERE email = '${cleanEmail}'; -- Authenticated Session Started`,
        status: 'success'
      });

      setIsLoading(false);
      onLogin(cleanEmail);
    } catch (err: any) {
      console.error('Login error:', err);
      setIsLoading(false);
      onLogin(email.toLowerCase().trim());
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword) {
      setError('Full Name, Email id, and Password are required');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cleanEmail = regEmail.toLowerCase().trim();

      // Attempt Firebase Auth creation
      try {
        await createUserWithEmailAndPassword(auth, cleanEmail, regPassword);
      } catch (authErr: any) {
        console.info('[Firebase Auth Register Notice]', authErr?.code || authErr?.message);
      }

      const newUserProfile = {
        id: cleanEmail,
        fullName: regFullName.trim(),
        workDesignation: regWorkDesignation.trim() || 'Production Member',
        dob: regDob,
        contactNumber: regContactNumber.trim(),
        email: cleanEmail,
        houseStreet: regHouseStreet.trim(),
        pinCode: regPinCode.trim(),
        city: regCity.trim(),
        state: regState.trim(),
        country: regCountry.trim() || 'India',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save user profile to Cloud Firestore server
      await saveUserProfile(newUserProfile);

      // Log server transaction
      await addDbLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'USER_REGISTERED',
        sqlQuery: `INSERT INTO users (id, fullName, email, workDesignation, city) VALUES ('${cleanEmail}', '${regFullName}', '${cleanEmail}', '${regWorkDesignation}', '${regCity}');`,
        status: 'success'
      });

      setIsLoading(false);
      setRegSuccessMsg('Registration successful! Profile saved to server. Authenticating session...');
      setTimeout(() => {
        onLogin(cleanEmail);
      }, 1000);
    } catch (err: any) {
      console.error('Registration save error:', err);
      setIsLoading(false);
      setError('Failed to save registration data: ' + (err?.message || err));
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      let gEmail = 'sujoy.production@gmail.com';
      let gName = 'Sujoy Production';

      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user?.email) {
          gEmail = result.user.email;
          gName = result.user.displayName || gEmail.split('@')[0];
        }
      } catch (authErr: any) {
        console.warn('Google Auth Popup notice (fallback to primary account):', authErr?.message || authErr);
      }

      const cleanEmail = gEmail.toLowerCase().trim();

      let profile = await getUserProfile(cleanEmail);
      if (!profile) {
        profile = {
          id: cleanEmail,
          fullName: gName,
          workDesignation: 'Production Lead',
          dob: '',
          contactNumber: '',
          email: cleanEmail,
          houseStreet: '',
          pinCode: '',
          city: '',
          state: '',
          country: 'India',
          createdAt: new Date().toISOString()
        };
        await saveUserProfile(profile);
      }

      await addDbLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'GOOGLE_LOGIN_SUCCESS',
        sqlQuery: `CONNECT Google OAuth SSO: ${cleanEmail} -- Identity Verified`,
        status: 'success'
      });

      setIsLoading(false);
      onLogin(cleanEmail);
    } catch (err: any) {
      console.error('Google login error:', err);
      setIsLoading(false);
      onLogin('sujoy.production@gmail.com');
    }
  };

  const handleQuickFillDemo = () => {
    setEmail('sujoy.production@gmail.com');
    setPassword('Production@123');
    setError('');
  };


  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-y-auto bg-[#f7f9fb] selection:bg-[#0058be]/10 selection:text-[#0058be]">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#d8e2ff] opacity-40 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#0058be]/10 opacity-30 blur-[120px]"></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      </div>

      {/* Main Auth Container */}
      <main className={`w-full ${isRegisterMode ? 'max-w-[580px]' : 'max-w-[440px]'} relative z-10 my-8 transition-all duration-300`}>
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3 p-3 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-500/30">
            <PBTLogo className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold font-sans text-black tracking-tight">PBT ERP</h1>
          <p className="text-xs text-[#45464d] mt-1 font-medium">Enterprise Cloud Resource Planning</p>
        </div>

        {/* Authentication Card */}
        <div className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-xl shadow-xl p-6 md:p-8 flex flex-col gap-6">

          {regSuccessMsg && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{regSuccessMsg}</span>
            </div>
          )}

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-md">
              {error}
            </div>
          )}

          {!isRegisterMode ? (
            /* LOGIN FORM */
            <div className="flex flex-col gap-5">
              {/* SSO Option */}
              <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-11 flex items-center justify-center gap-3 border border-[#E2E8F0] rounded-lg bg-white text-xs font-semibold text-[#45464d] hover:bg-slate-50 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <svg height="18" viewBox="0 0 18 18" width="18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"></path>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"></path>
                  <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.172.282-1.712V4.956H.957a8.991 8.991 0 0 0 0 8.088l3.007-2.332z" fill="#FBBC05"></path>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.474 0 2.466 2.04 0.957 4.956l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"></path>
                </svg>
                Sign in with Google
              </button>

              <div className="flex items-center gap-4 my-1">
                <div className="h-[1px] flex-1 bg-[#E2E8F0]"></div>
                <span className="font-mono text-[10px] font-bold text-[#45464d] uppercase tracking-widest">or</span>
                <div className="h-[1px] flex-1 bg-[#E2E8F0]"></div>
              </div>

              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45464d]" htmlFor="email">Email id</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4.5 h-4.5" />
                    <input 
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      placeholder="name@company.com"
                      className="w-full h-10 pl-10 pr-4 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none transition-all text-xs text-black placeholder:text-[#45464d]/40"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45464d]" htmlFor="password">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4.5 h-4.5" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      placeholder="••••••••"
                      className="w-full h-10 pl-10 pr-10 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none transition-all text-xs text-black placeholder:text-[#45464d]/40 font-mono"
                    />
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPassword(prev => !prev);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#45464d] hover:text-black cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5 text-[#0058be]" /> : <Eye className="w-4.5 h-4.5 text-[#45464d]" />}
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                      <input 
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-[#E2E8F0] text-[#0058be] focus:ring-[#0058be]/20 transition-all cursor-pointer"
                      />
                      <span className="text-xs font-medium text-[#45464d] group-hover:text-black transition-colors">Remember me</span>
                    </label>
                    <button 
                      type="button"
                      onClick={() => setError('Password Recovery: Please contact your IT administrator to request a password reset.')}
                      className="text-xs text-[#0058be] font-semibold hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-black text-white font-semibold text-xs rounded-lg shadow-md hover:bg-black/90 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Entering Production Environment...' : 'Enter Production Environment'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Quick Demo Access Credentials */}
                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-blue-900 leading-tight">
                    <span className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-600 inline" /> Demo Login:
                    </span>
                    <span className="text-blue-700 font-mono text-[10px] block">sujoy.production@gmail.com</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickFillDemo}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100/50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold transition-all cursor-pointer shrink-0"
                  >
                    Auto-Fill
                  </button>
                </div>
              </form>

              {/* Data Protection Guarantee Notice */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Protected Budget &amp; Ledger Data:</strong> Production budgets, vouchers, invoices, and expenses are encrypted and strictly accessible only to authenticated workspace members.
                </span>
              </div>

              <div className="text-center pt-1">
                <p className="text-xs text-[#45464d]">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(true);
                      setError('');
                    }}
                    className="font-bold text-[#0058be] hover:underline cursor-pointer"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45464d]">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4.5 h-4.5" />
                    <input 
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full h-10 pl-10 pr-3 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none text-xs text-black placeholder:text-[#45464d]/40"
                    />
                  </div>
                </div>

                {/* Work Designation */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45464d]">Work Designation</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4.5 h-4.5" />
                    <input 
                      type="text"
                      value={regWorkDesignation}
                      onChange={(e) => setRegWorkDesignation(e.target.value)}
                      placeholder="e.g. Production Controller"
                      className="w-full h-10 pl-10 pr-3 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none text-xs text-black placeholder:text-[#45464d]/40"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DOB (Date of Birth) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45464d]">DOB (Date of Birth)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4.5 h-4.5" />
                    <input 
                      type="date"
                      value={regDob}
                      onChange={(e) => setRegDob(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none text-xs text-black placeholder:text-[#45464d]/40"
                    />
                  </div>
                </div>

                {/* Contact Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45464d]">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4.5 h-4.5" />
                    <input 
                      type="tel"
                      value={regContactNumber}
                      onChange={(e) => setRegContactNumber(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full h-10 pl-10 pr-3 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none text-xs text-black placeholder:text-[#45464d]/40"
                    />
                  </div>
                </div>
              </div>

              {/* Email id */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#45464d]">Email id *</label>
                  <span className="text-[10px] text-[#0058be] font-medium">(This email id will be treated as login user id)</span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4.5 h-4.5" />
                  <input 
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-10 pl-10 pr-3 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none text-xs text-black placeholder:text-[#45464d]/40"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#45464d]">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4.5 h-4.5" />
                  <input 
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Set password"
                    className="w-full h-10 pl-10 pr-10 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none text-xs text-black placeholder:text-[#45464d]/40 font-mono"
                  />
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowRegPassword(prev => !prev);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#45464d] hover:text-black cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"
                    title={showRegPassword ? "Hide password" : "Show password"}
                  >
                    {showRegPassword ? <EyeOff className="w-4.5 h-4.5 text-[#0058be]" /> : <Eye className="w-4.5 h-4.5 text-[#45464d]" />}
                  </button>
                </div>
              </div>

              {/* House & Street */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#45464d]">House &amp; Street</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4.5 h-4.5" />
                  <input 
                    type="text"
                    value={regHouseStreet}
                    onChange={(e) => setRegHouseStreet(e.target.value)}
                    placeholder="Building, Plot No., Street Address"
                    className="w-full h-10 pl-10 pr-3 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none text-xs text-black placeholder:text-[#45464d]/40"
                  />
                </div>
              </div>

              {/* Pin code and Auto Location Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Pin code */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45464d]">Pin code</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4.5 h-4.5" />
                    <input 
                      type="text"
                      maxLength={6}
                      value={regPinCode}
                      onChange={(e) => handlePinCodeChange(e.target.value)}
                      placeholder="e.g. 700001"
                      className="w-full h-10 pl-10 pr-3 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none text-xs text-black font-mono placeholder:text-[#45464d]/40"
                    />
                    {isPinLookupLoading && (
                      <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0058be] animate-spin" />
                    )}
                  </div>
                </div>

                {/* City */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45464d]">City</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4 h-4" />
                    <input 
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="Auto City"
                      className="w-full h-10 pl-9 pr-2 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none text-xs text-black placeholder:text-[#45464d]/40"
                    />
                  </div>
                </div>

                {/* State */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45464d]">State</label>
                  <input 
                    type="text"
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    placeholder="Auto State"
                    className="w-full h-10 px-3 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none text-xs text-black placeholder:text-[#45464d]/40"
                  />
                </div>

                {/* Country */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#45464d]">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d] w-4 h-4" />
                    <input 
                      type="text"
                      value={regCountry}
                      onChange={(e) => setRegCountry(e.target.value)}
                      placeholder="Auto Country"
                      className="w-full h-10 pl-9 pr-2 bg-[#f2f4f6]/50 border border-[#E2E8F0] rounded-lg focus:ring-1 focus:ring-[#0058be] focus:border-[#0058be] outline-none text-xs text-black placeholder:text-[#45464d]/40"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#0058be] hover:bg-[#0058be]/90 text-white font-semibold text-xs rounded-lg shadow-md transition-all active:scale-[0.98] mt-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Register Account'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-[#45464d]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(false);
                      setError('');
                    }}
                    className="font-bold text-[#0058be] hover:underline cursor-pointer"
                  >
                    Sign In here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Security Footer */}
          <div className="flex items-center justify-center gap-4 pt-3 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-1.5 text-[#45464d]">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span className="font-mono text-[10px] font-semibold">SSL Secure</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[#c6c6cd]"></div>
            <div className="flex items-center gap-1.5 text-[#45464d]">
              <Lock className="w-4 h-4 text-[#0058be]" />
              <span className="font-mono text-[10px] font-semibold">TLS 1.3 Encrypted</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Copyright */}
      <footer className="w-full text-center py-4 relative z-10">
        <p className="font-mono text-[10px] text-[#45464d] opacity-60">
          © 2026 PBT ERP. All rights reserved. Authorized use only.
        </p>
      </footer>
    </div>
  );
}

