import React, { useState } from 'react';
import { useRescue } from '../context/RescueContext';
import { UserRole } from '../types/rescue';
import {
  ShieldCheck,
  User,
  HeartPulse,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  MapPin,
  Building,
  AlertCircle,
  Loader2,
  FileBadge,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const { login, register, navigateTo, testMode, seedTestAccounts, addToast } = useRescue();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Common Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Rescuer-Specific Fields
  const [experienceYears, setExperienceYears] = useState<number>(1);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([
    'Dogs',
    'Cats',
    'First Aid',
  ]);

  // Vet-Specific Fields
  const [clinicName, setClinicName] = useState<string>('');
  const [clinicAddress, setClinicAddress] = useState<string>('');
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([
    'Emergency Trauma',
    'First Aid & Triage',
  ]);
  const [emergency247, setEmergency247] = useState<boolean>(false);

  const capabilityOptions = [
    'Dogs',
    'Cats',
    'Large Animals (Cows/Bulls)',
    'Birds / Avian',
    'First Aid & Bandaging',
    'Aggressive Animal Handling',
    'Snake Handling',
    'Emergency Transport Vehicle',
  ];

  const specializationOptions = [
    'Emergency Trauma',
    'First Aid & Triage',
    'Inpatient Surgery',
    'Orthopedics & Fracture Care',
    'Infectious Disease Ward',
    'Avian & Exotic Care',
    'Diagnostic X-Ray / Ultrasound',
  ];

  const toggleCapability = (cap: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const publicRoles: { role: UserRole; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      role: 'citizen',
      title: 'Citizen Good Samaritan',
      desc: 'Instant verification. Report street animal emergencies with GPS & photos, track medical recovery.',
      icon: <User className="w-5 h-5 text-[#145C4A]" />,
    },
    {
      role: 'rescuer',
      title: 'Animal Rescuer / Field Volunteer',
      desc: 'Requires admin accreditation. Receive triage dispatches, field navigation, and veterinary patient transfers.',
      icon: <ShieldCheck className="w-5 h-5 text-[#20A67A]" />,
    },
    {
      role: 'vet',
      title: 'Veterinary Professional / Clinic',
      desc: 'Requires credential verification. Inpatient trauma admission, clinical diagnosis charts, and recovery tracking.',
      icon: <HeartPulse className="w-5 h-5 text-sky-600" />,
    },
    {
      role: 'ngo',
      title: 'NGO / Animal Shelter',
      desc: 'Requires accreditation. Long-term shelter capacity, foster management, and rescue coordination.',
      icon: <Building2 className="w-5 h-5 text-teal-600" />,
    },
  ];

  const handleTestQuickFill = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('TestPassword123!');
    addToast({
      type: 'info',
      title: 'Test Credentials Filled',
      description: `Filled ${testEmail} with test password.`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify your entries.');
        return;
      }
      if (password.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
      if (selectedRole === 'rescuer' && selectedCapabilities.length === 0) {
        setErrorMsg('Please select at least one rescue capability.');
        return;
      }
      if (selectedRole === 'vet' && (!clinicName.trim() || !licenseNumber.trim())) {
        setErrorMsg('Veterinary clinic name and professional license number are required for accreditation.');
        return;
      }

      setLoading(true);
      try {
        await register({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city: city.trim(),
          organizationName: organizationName.trim() || undefined,
          role: selectedRole,
          password,
          experienceYears: selectedRole === 'rescuer' ? experienceYears : undefined,
          rescueCapabilities: selectedRole === 'rescuer' ? selectedCapabilities : undefined,
          clinicName: selectedRole === 'vet' ? clinicName.trim() : undefined,
          clinicAddress: selectedRole === 'vet' ? clinicAddress.trim() : undefined,
          licenseNumber: selectedRole === 'vet' ? licenseNumber.trim() : undefined,
          specializations: selectedRole === 'vet' ? selectedSpecializations : undefined,
          emergency247: selectedRole === 'vet' ? emergency247 : undefined,
        });
      } catch (err: any) {
        setErrorMsg(err.message || 'Registration failed.');
      } finally {
        setLoading(false);
      }
    } else {
      // Login
      setLoading(true);
      try {
        await login({
          email: email.trim(),
          password,
        });
      } catch (err: any) {
        setErrorMsg(err.message || 'Login failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* Test Mode Notification & Quick-Action Banner */}
        {testMode && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs">
                <div className="font-semibold text-amber-900 flex items-center gap-2">
                  <span>TEST MODE ACTIVE — ISOLATED TESTING ENVIRONMENT</span>
                  <span className="bg-amber-200 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    DEV
                  </span>
                </div>
                <p className="text-amber-700 mt-1">
                  You can seed isolated test accounts (Citizen, Admin, Rescuer, Vet, Shelter) to test the complete
                  registration, verification, dispatch, and veterinary handoff lifecycle.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await seedTestAccounts();
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
                  >
                    Seed Isolated Test Accounts
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestQuickFill('test.admin@pawsos.local')}
                    className="bg-white border border-amber-300 text-amber-800 hover:bg-amber-100/50 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    Fill Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestQuickFill('test.rescuer@pawsos.local')}
                    className="bg-white border border-amber-300 text-amber-800 hover:bg-amber-100/50 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    Fill Rescuer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestQuickFill('test.vet@pawsos.local')}
                    className="bg-white border border-amber-300 text-amber-800 hover:bg-amber-100/50 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    Fill Vet
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestQuickFill('test.citizen@pawsos.local')}
                    className="bg-white border border-amber-300 text-amber-800 hover:bg-amber-100/50 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    Fill Citizen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#145C4A]/10 text-[#145C4A] mb-4">
            <ShieldCheck className="w-7 h-7 text-[#145C4A]" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#172B26] font-display">
            {mode === 'login' ? 'Welcome Back to PawSOS' : 'Join the Rescue Network'}
          </h2>
          <p className="mt-2 text-sm text-[#172B26]/70">
            {mode === 'login'
              ? 'Sign in to access your response dashboard, active dispatches, or reported cases.'
              : 'Register as a citizen or apply for accredited partner verification.'}
          </p>

          <div className="mt-6 flex justify-center">
            <div className="bg-[#EAEFEA] p-1 rounded-xl flex items-center gap-1 border border-[#145C4A]/10">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-white text-[#145C4A] shadow-sm'
                    : 'text-[#172B26]/70 hover:text-[#172B26]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                }}
                className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-white text-[#145C4A] shadow-sm'
                    : 'text-[#172B26]/70 hover:text-[#172B26]'
                }`}
              >
                Create Account / Register Partner
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#145C4A]/15 rounded-3xl p-6 sm:p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <>
                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#172B26] mb-2 uppercase tracking-wider">
                    Select Your Operational Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {publicRoles.map((r) => {
                      const isSelected = selectedRole === r.role;
                      return (
                        <div
                          key={r.role}
                          onClick={() => setSelectedRole(r.role)}
                          className={`cursor-pointer rounded-2xl p-3.5 border transition-all text-left flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#145C4A] bg-[#145C4A]/5 ring-1 ring-[#145C4A]'
                              : 'border-stone-200 hover:border-stone-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="p-1.5 rounded-lg bg-stone-100">{r.icon}</div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#145C4A]" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#172B26]">{r.title}</div>
                            <div className="text-[11px] text-[#172B26]/60 line-clamp-2 mt-0.5">{r.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Role Accreditation Notice */}
                {selectedRole !== 'citizen' && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-800 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Administrative Review Required: </span>
                      Accounts for {selectedRole.toUpperCase()} partners require administrator credential review.
                      You will initially receive a <span className="font-semibold underline">Pending</span> status
                      until approved by a dispatcher.
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#172B26] mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#145C4A] focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[#172B26] mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#145C4A] focus:outline-none"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                {/* Phone & City Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#172B26] mb-1.5">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#145C4A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172B26] mb-1.5">
                      Operational City / Service Area <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Bandra West, Mumbai"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#145C4A] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Rescuer-Specific Fields */}
                {selectedRole === 'rescuer' && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-4">
                    <div className="text-xs font-bold text-[#145C4A] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#20A67A]" />
                      Rescuer Operational Capabilities & Experience
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Years of Rescue Experience
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={40}
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#145C4A] focus:outline-none bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Affiliated Group / Organization (Optional)
                        </label>
                        <input
                          type="text"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          placeholder="e.g. Bandra Animal Volunteers"
                          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#145C4A] focus:outline-none bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1.5">
                        Handled Capabilities (Select all that apply)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {capabilityOptions.map((cap) => {
                          const active = selectedCapabilities.includes(cap);
                          return (
                            <button
                              type="button"
                              key={cap}
                              onClick={() => toggleCapability(cap)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                                active
                                  ? 'bg-[#145C4A] text-white border-[#145C4A]'
                                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              {active ? `✓ ${cap}` : `+ ${cap}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Veterinary-Specific Fields */}
                {selectedRole === 'vet' && (
                  <div className="p-4 bg-sky-50/50 border border-sky-200/80 rounded-2xl space-y-4">
                    <div className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-sky-600" />
                      Veterinary Clinic & Professional Credentials
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Clinic / Hospital Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
                          <input
                            type="text"
                            required
                            value={clinicName}
                            onChange={(e) => setClinicName(e.target.value)}
                            placeholder="e.g. Bandra Pet Trauma Center"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-sky-600 focus:outline-none bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Veterinary License / Reg. No. <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <FileBadge className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
                          <input
                            type="text"
                            required
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            placeholder="e.g. VET-MH-2022-7719"
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-sky-600 focus:outline-none bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Clinic Physical Address
                      </label>
                      <input
                        type="text"
                        value={clinicAddress}
                        onChange={(e) => setClinicAddress(e.target.value)}
                        placeholder="Street, Landmark, City"
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-sky-600 focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1.5">
                        Clinical Specializations & Facilities
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {specializationOptions.map((spec) => {
                          const active = selectedSpecializations.includes(spec);
                          return (
                            <button
                              type="button"
                              key={spec}
                              onClick={() => toggleSpecialization(spec)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                                active
                                  ? 'bg-sky-600 text-white border-sky-600'
                                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              {active ? `✓ ${spec}` : `+ ${spec}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="emergency247"
                        checked={emergency247}
                        onChange={(e) => setEmergency247(e.target.checked)}
                        className="rounded border-stone-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                      />
                      <label htmlFor="emergency247" className="text-xs text-stone-700 cursor-pointer select-none">
                        Clinic provides <span className="font-semibold">24/7 Emergency Trauma Intake</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* NGO / Shelter Specific Fields */}
                {selectedRole === 'ngo' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#172B26] mb-1.5">
                      Shelter / Organization Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="e.g. Save Our Strays Foundation"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#145C4A] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-[#172B26] mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#145C4A] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#172B26] mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#145C4A] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#145C4A] hover:bg-[#104a3b] text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Submit Application / Register</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
