import React, { useState, useEffect } from 'react';
import { useRescue } from '../context/RescueContext';
import { RescueMap } from '../components/common/RescueMap';
import { AnimalType, UrgencyLevel, RescueCase } from '../types/rescue';
import { api } from '../services/api';
import {
  AlertTriangle,
  Camera,
  Upload,
  MapPin,
  Crosshair,
  User,
  Phone,
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const ReportEmergencyPage: React.FC = () => {
  const { createReport, navigateTo, currentUser, isAuthenticated, testMode } = useRescue();

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [submittedCase, setSubmittedCase] = useState<RescueCase | null>(null);

  // Form State - Completely Blank by Default
  const [animalType, setAnimalType] = useState<AnimalType | ''>('');
  const [condition, setCondition] = useState<string>('');
  const [customCondition, setCustomCondition] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Photograph
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploadedStorageUrl, setUploadedStorageUrl] = useState<string>('');

  // Location - Starts Unset
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [locationError, setLocationError] = useState<string>('');

  // Urgency & Contact - Starts Unset
  const [urgency, setUrgency] = useState<UrgencyLevel | ''>('');
  const [reporterName, setReporterName] = useState<string>('');
  const [reporterPhone, setReporterPhone] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // If user is authenticated, prefill their actual verified profile details
  useEffect(() => {
    if (currentUser) {
      setReporterName(currentUser.fullName);
      setReporterPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Real Geolocation
  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationStatus('Requesting device GPS position...');
    setLocationError('');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setLat(latitude);
          setLng(longitude);
          setIsLocating(false);
          setLocationStatus(
            `GPS lock acquired: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(position.coords.accuracy)}m)`
          );
        },
        (error) => {
          setIsLocating(false);
          setLocationStatus('');
          let msg = 'Geolocation failed. Please click on the map to set the emergency pin manually.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission was denied. Please click on the interactive map to place the pin manually.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'Location request timed out. Please click on the map to place the pin manually.';
          }
          setLocationError(msg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      setLocationError('Geolocation is not supported by your browser. Please click on the map to place the pin.');
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Unsupported file format. Please upload a JPG, PNG, or WebP photo.');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit. Please upload a smaller photo.');
      return;
    }

    setErrorMessage('');
    setPhotoFile(file);

    // Create local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Upload to storage through API
    setUploadingPhoto(true);
    try {
      const uploadRes = await api.uploadPhoto(file);
      setUploadedStorageUrl(uploadRes.url);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not upload photograph. You may still proceed with local preview.');
      // Keep local preview as fallback
      setUploadedStorageUrl(photoPreview);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setUploadedStorageUrl('');
  };

  const validateStep1 = () => {
    if (!animalType) {
      setErrorMessage('Please select the type of animal.');
      return false;
    }
    const finalCondition = condition === 'Other urgent distress' ? customCondition : condition;
    if (!finalCondition) {
      setErrorMessage('Please specify the observed emergency condition.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const validateStep2 = () => {
    if (!photoPreview && !uploadedStorageUrl) {
      setErrorMessage('A real photograph of the animal is required for dispatchers to gauge rescue equipment.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const validateStep3 = () => {
    if (lat === null || lng === null) {
      setErrorMessage('Please select a rescue location using the map or device GPS.');
      return false;
    }
    if (!address.trim() && !landmark.trim()) {
      setErrorMessage('Please provide a street address, area name, or nearby landmark.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const validateStep4 = () => {
    if (!urgency) {
      setErrorMessage('Please indicate the urgency level.');
      return false;
    }
    if (!isAnonymous) {
      if (!reporterName.trim()) {
        setErrorMessage('Please enter your full name, or choose anonymous submission.');
        return false;
      }
      if (!reporterPhone.trim()) {
        setErrorMessage('Please enter your phone number so responders can reach you.');
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep4()) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const finalCondition = condition === 'Other urgent distress' ? customCondition : condition;
      const photoToSave = uploadedStorageUrl || photoPreview;

      const created = await createReport({
        animalType,
        condition: finalCondition,
        description: description.trim(),
        photoUrl: photoToSave,
        lat: lat!,
        lng: lng!,
        address: address.trim() || 'Reported Location',
        landmark: landmark.trim(),
        urgency,
        reporterName: isAnonymous ? 'Anonymous Good Samaritan' : reporterName.trim(),
        reporterPhone: isAnonymous ? 'Protected' : reporterPhone.trim(),
        isAnonymous,
        isTestCase: testMode,
      });

      setSubmittedCase(created);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed. Please check your network connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedCase) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#20A67A] flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#20A67A]">
              Emergency SOS Created
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B26] font-heading mt-1">
              Your Emergency Report Has Been Saved
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Recorded in database. Dispatch triage officers have been notified.
            </p>
          </div>

          {/* Case summary card */}
          <div className="p-5 rounded-xl bg-[#F8FAF7] border border-slate-200 text-left space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wide">Case Tracking ID</span>
                <div className="text-lg font-extrabold text-[#145C4A] font-heading font-mono">{submittedCase.caseId}</div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 uppercase tracking-wide">Initial Status</span>
                <div className="text-xs font-bold text-[#E65353] flex items-center gap-1 justify-end">
                  <span className="w-2 h-2 rounded-full bg-[#E65353] animate-pulse" />
                  <span>Reported</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Animal</span>
                <span className="font-semibold text-slate-900">{submittedCase.animalType} ({submittedCase.condition})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Urgency Tier</span>
                <span className="font-semibold text-rose-700">{submittedCase.urgency}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Location Coordinates</span>
                <span className="font-semibold text-slate-900">{submittedCase.address}</span>
                {submittedCase.landmark && (
                  <span className="text-slate-600 block text-[11px]">Landmark: {submittedCase.landmark}</span>
                )}
                <span className="text-[10px] text-slate-400 block font-mono">
                  GPS: {submittedCase.lat.toFixed(5)}, {submittedCase.lng.toFixed(5)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 text-left">
            <strong>Next Operational Step:</strong> An administrator will review your submitted photograph and coordinates
            to dispatch the nearest verified field responder.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigateTo(`/track?id=${submittedCase.caseId}`)}
              className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-white bg-[#145C4A] hover:bg-[#10483a] rounded-xl shadow transition-colors flex items-center justify-center gap-2"
            >
              <span>Track Rescue Progress Live</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateTo('/')}
              className="w-full sm:w-auto px-5 py-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-xs font-bold text-[#E65353] mb-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Priority Emergency SOS Intake</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B26] font-heading">
          Report an Injured or Sick Animal
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Complete this 4-step emergency brief. Every submission is saved to the central database and routed to verified responders.
        </p>

        {testMode && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
            <span>🧪 <strong>Test Mode Active:</strong> Incident will be tagged as an isolated TEST CASE.</span>
            <button
              type="button"
              onClick={() => {
                setAnimalType('Dog');
                setCondition('Severe Trauma / Hit by Vehicle');
                setDescription('Test indie dog rescued from median. Fractured front paw, needs splinting and veterinary admission.');
                setLat(19.0596);
                setLng(72.8295);
                setAddress('Linking Road, Bandra West, Mumbai');
                setLandmark('Opposite National College');
                setUrgency('High');
                setUploadedStorageUrl('/src/assets/images/hero_animal_rescue_1793530756080.jpg');
                setReporterName('Test Citizen (Good Samaritan)');
                setReporterPhone('+91 99000 00001');
                setStep(4);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] shadow-2xs"
            >
              Fill Sample Test Case
            </button>
          </div>
        )}
      </div>

      {/* 4-Step Progress Header */}
      <div className="mb-8">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { n: 1, title: 'Animal Details' },
            { n: 2, title: 'Photograph' },
            { n: 3, title: 'GPS Location' },
            { n: 4, title: 'Urgency & SOS' },
          ].map((s) => (
            <button
              key={s.n}
              onClick={() => {
                if (s.n === 1) setStep(1);
                else if (s.n === 2 && validateStep1()) setStep(2);
                else if (s.n === 3 && validateStep1() && validateStep2()) setStep(3);
                else if (s.n === 4 && validateStep1() && validateStep2() && validateStep3()) setStep(4);
              }}
              className={`pb-2 border-b-2 text-[11px] sm:text-xs font-semibold transition-all ${
                step === s.n
                  ? 'border-[#E65353] text-[#E65353]'
                  : step > s.n
                  ? 'border-[#20A67A] text-[#20A67A]'
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              <div className="truncate">
                Step {s.n}: {s.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* The Multi-Step Form */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Animal Details */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. Select Animal Species *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {(['Dog', 'Cat', 'Cow', 'Bird', 'Other'] as AnimalType[]).map((type) => {
                    const isSelected = animalType === type;
                    const emoji =
                      type === 'Dog' ? '🐕' : type === 'Cat' ? '🐈' : type === 'Cow' ? '🐄' : type === 'Bird' ? '🕊️' : '🐾';
                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => {
                          setAnimalType(type);
                          setErrorMessage('');
                        }}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-[#145C4A] bg-emerald-50/60 text-[#145C4A] font-bold shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <span className="text-xl">{emoji}</span>
                        <span className="text-xs">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  2. Primary Observed Emergency Condition *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    'Road accident / Hit & Run',
                    'Visible open injury / Bleeding',
                    'Severe illness / Maggot wound',
                    'Unable to walk or stand',
                    'Trapped / Entangled in wire or manja',
                    'Other urgent distress',
                  ].map((cond) => {
                    const isSelected = condition === cond;
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => {
                          setCondition(cond);
                          setErrorMessage('');
                        }}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[#145C4A] bg-emerald-50/60 text-[#145C4A] font-semibold shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span>{cond}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#20A67A] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {condition === 'Other urgent distress' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Specify emergency condition (e.g. poisoning, heatstroke, burn injury)..."
                      value={customCondition}
                      onChange={(e) => setCustomCondition(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  3. Description & Observed Behavior (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the animal's behavior, exact visible symptoms, whether it is responsive, or any hazards nearby..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-[#145C4A] focus:ring-1 focus:ring-[#145C4A] outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#145C4A] hover:bg-[#0e4336] rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Continue to Photo Upload</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Photograph Upload */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Upload Animal Photograph *
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Please attach a genuine photograph of the animal in its current state. Dispatched responders rely on
                  this to bring appropriate capture nets, size-rated crates, and emergency analgesics.
                </p>

                {/* Real File Input & Drag Box */}
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/60 transition-colors">
                  {photoPreview ? (
                    <div className="space-y-4">
                      <div className="relative max-w-sm mx-auto rounded-xl overflow-hidden shadow border border-slate-200 aspect-[4/3] bg-black">
                        <img
                          src={photoPreview}
                          alt="Animal Incident Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center justify-center gap-2">
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="w-4 h-4 text-[#145C4A] animate-spin" />
                            <span>Uploading photo to secure storage...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-[#20A67A]" />
                            <span>{photoFile?.name || 'Photo ready'} ({(photoFile ? (photoFile.size / 1024).toFixed(1) : 0)} KB)</span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#145C4A] flex items-center justify-center mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                          Select photo from camera or files
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Supported formats: JPG, PNG, WebP (up to 10MB)
                        </span>
                      </div>

                      <label className="inline-block px-4 py-2 text-xs font-semibold text-[#145C4A] bg-white border border-emerald-300 rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors shadow-2xs">
                        <span>Browse Device Camera / Gallery</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#145C4A] hover:bg-[#0e4336] rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Continue to GPS Location</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Location */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Pin Incident Location *
                    </label>
                    <p className="text-xs text-slate-500">
                      Use the GPS button or click anywhere on the map to set the exact animal location pin.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#145C4A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shrink-0 shadow-2xs"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Locating...' : 'Use Current Device GPS'}</span>
                  </button>
                </div>

                {locationStatus && (
                  <div className="text-[11px] text-[#145C4A] bg-emerald-50/80 px-3 py-1.5 rounded-lg border border-emerald-200 mb-2">
                    {locationStatus}
                  </div>
                )}

                {locationError && (
                  <div className="text-[11px] text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 mb-2">
                    {locationError}
                  </div>
                )}

                {/* Map in picker mode */}
                <RescueMap
                  center={lat !== null && lng !== null ? [lat, lng] : [20.5937, 78.9629]}
                  zoom={lat !== null && lng !== null ? 16 : 4}
                  height="340px"
                  interactiveMode="picker"
                  onLocationSelect={(newLat, newLng) => {
                    setLat(newLat);
                    setLng(newLng);
                    setLocationStatus(`Manual Pin Placed: ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
                    setLocationError('');
                    setErrorMessage('');
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Street Address / Sector / Road Name *
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="e.g. Near Bus Depot, Sector 4, MG Road"
                      required
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nearby Landmark Hint
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Opposite State Bank ATM, under flyover"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
                    />
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 font-mono">
                  Coordinates:{' '}
                  {lat !== null && lng !== null ? (
                    <span className="text-[#145C4A] font-bold">
                      {lat.toFixed(5)}, {lng.toFixed(5)}
                    </span>
                  ) : (
                    <span className="text-rose-500">Not set yet. Click on the map or tap Use Device GPS.</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep3()) setStep(4);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#145C4A] hover:bg-[#0e4336] rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Continue to Urgency & Contact</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Urgency and Contact */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Urgency selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. Urgency Level *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      level: 'Critical' as UrgencyLevel,
                      label: 'Critical',
                      desc: 'Active bleeding, severe hit & run, unconscious, immediate danger',
                      badgeColor: 'border-[#E65353] bg-rose-50/70 text-[#E65353]',
                    },
                    {
                      level: 'High' as UrgencyLevel,
                      label: 'High',
                      desc: 'Limping, deep wound, acute distress, unable to feed or move',
                      badgeColor: 'border-[#F2B84B] bg-amber-50/70 text-amber-800',
                    },
                    {
                      level: 'Moderate' as UrgencyLevel,
                      label: 'Moderate',
                      desc: 'Skin infection, mild malnutrition, non-life threatening condition',
                      badgeColor: 'border-[#20A67A] bg-emerald-50/70 text-[#145C4A]',
                    },
                  ].map((item) => {
                    const isSelected = urgency === item.level;
                    return (
                      <button
                        type="button"
                        key={item.level}
                        onClick={() => {
                          setUrgency(item.level);
                          setErrorMessage('');
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? `${item.badgeColor} ring-1 ring-current shadow-2xs`
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1">{item.label}</div>
                        <p className="text-[10px] text-slate-500 leading-snug">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reporter Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Reporter Contact Details
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded text-[#145C4A] focus:ring-0"
                    />
                    <span>Submit Anonymously</span>
                  </label>
                </div>

                {!isAnonymous ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        value={reporterName}
                        onChange={(e) => {
                          setReporterName(e.target.value);
                          setErrorMessage('');
                        }}
                        placeholder="e.g. Ramesh Kumar"
                        required
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone Number (WhatsApp) *</label>
                      <input
                        type="tel"
                        value={reporterPhone}
                        onChange={(e) => {
                          setReporterPhone(e.target.value);
                          setErrorMessage('');
                        }}
                        placeholder="e.g. +91 98765 43210"
                        required
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    Your contact information will not be shared with responders. Note that responders will not be able
                    to call you for gate pass access or landmark clarification.
                  </div>
                )}
              </div>

              {/* Review summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-900 pb-1.5 border-b border-slate-200 flex items-center justify-between">
                  <span>Emergency SOS Dispatch Summary</span>
                  {urgency && <span className="text-[#E65353] font-semibold uppercase text-[10px]">{urgency} Urgency</span>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div><strong>Animal:</strong> {animalType || 'Not set'} ({condition || 'Not set'})</div>
                  <div><strong>Location:</strong> {address || 'Not set'}</div>
                  <div className="col-span-2"><strong>Landmark:</strong> {landmark || 'None provided'}</div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-slate-500">
                <Shield className="w-4 h-4 text-[#20A67A] shrink-0 mt-0.5" />
                <span>
                  Your report triggers alerts directly to verified responders and command dispatchers. We enforce
                  strict data protection and never share details with commercial advertisers.
                </span>
              </div>

              {/* Submission Controls */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting || uploadingPhoto}
                  className="px-7 py-3.5 text-xs font-extrabold tracking-wider uppercase text-white bg-[#E65353] hover:bg-[#d83f3f] rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>SAVING TO DATABASE...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>SEND EMERGENCY SOS</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
