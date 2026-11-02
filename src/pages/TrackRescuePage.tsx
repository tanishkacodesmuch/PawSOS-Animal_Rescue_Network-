import React, { useState, useEffect } from 'react';
import { useRescue } from '../context/RescueContext';
import { RescueMap } from '../components/common/RescueMap';
import { RescueCase, RescueStage } from '../types/rescue';
import { api } from '../services/api';
import {
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  Stethoscope,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Phone,
  User,
  Loader2,
  AlertCircle,
  FileQuestion,
} from 'lucide-react';

const STAGES: { stage: RescueStage; label: string; desc: string }[] = [
  { stage: 'Reported', label: 'Reported', desc: 'Emergency SOS recorded' },
  { stage: 'Assigned', label: 'Assigned', desc: 'Rescuer verified & assigned' },
  { stage: 'On the Way', label: 'On the Way', desc: 'Responder navigating to GPS' },
  { stage: 'Rescued', label: 'Rescued', desc: 'Animal secured in transport unit' },
  { stage: 'Treated', label: 'Treated', desc: 'Veterinary care administered' },
  { stage: 'Closed', label: 'Closed', desc: 'Discharged or rehabilitated' },
];

export const TrackRescuePage: React.FC = () => {
  const { currentUser, updateCaseStatus } = useRescue();

  const getUrlCaseId = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('id') || '';
    }
    return '';
  };

  const [searchId, setSearchId] = useState<string>(getUrlCaseId());
  const [searchedCase, setSearchedCase] = useState<RescueCase | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');
  const [statusUpdateNotes, setStatusUpdateNotes] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  const fetchCase = async (caseIdToFetch: string) => {
    const clean = caseIdToFetch.trim().toUpperCase();
    if (!clean) {
      setSearchedCase(null);
      setSearchError('');
      return;
    }

    setLoading(true);
    setSearchError('');

    try {
      const result = await api.getReportByCaseId(clean);
      setSearchedCase(result);
    } catch (err: any) {
      setSearchedCase(null);
      setSearchError(err.message || `No case found matching ID "${clean}". Please verify the identifier.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialId = getUrlCaseId();
    if (initialId) {
      setSearchId(initialId);
      fetchCase(initialId);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCase(searchId);
  };

  const handleAdvanceStatus = async (nextStage: RescueStage) => {
    if (!searchedCase) return;
    setUpdatingStatus(true);
    try {
      const updated = await api.updateReportStatus(
        searchedCase.caseId,
        nextStage,
        statusUpdateNotes.trim() || undefined
      );
      setSearchedCase(updated);
      setStatusUpdateNotes('');
    } catch (err: any) {
      setSearchError(err.message || 'Could not update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentStageIndex = searchedCase ? STAGES.findIndex((s) => s.stage === searchedCase.status) : -1;
  const canUpdateStatus = currentUser && ['admin', 'rescuer', 'vet'].includes(currentUser.role);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Search Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-[#145C4A] mb-2">
              <span className="w-2 h-2 rounded-full bg-[#20A67A]" />
              <span>Database Rescue Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B26] font-heading">
              Track Emergency Case
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter the unique Case ID generated during emergency SOS reporting to review official status and updates.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Case ID (e.g. AER-8492)"
                required
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-[#145C4A] uppercase font-mono tracking-wider outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#145C4A] hover:bg-[#0e4437] rounded-xl transition-colors shadow-2xs shrink-0 flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Lookup</span>
            </button>
          </form>
        </div>

        {searchError && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Case Details View */}
      {searchedCase ? (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Main Case Overview Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                {searchedCase.photoUrl ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                    <img
                      src={searchedCase.photoUrl}
                      alt={searchedCase.animalType}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs shrink-0">
                    No photo
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-[#145C4A] font-heading font-mono">
                      {searchedCase.caseId}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        searchedCase.urgency === 'Critical'
                          ? 'bg-rose-50 text-[#E65353] border-rose-200'
                          : searchedCase.urgency === 'High'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-[#145C4A] border-emerald-200'
                      }`}
                    >
                      {searchedCase.urgency} Urgency
                    </span>
                    {searchedCase.verified && (
                      <span className="text-[10px] font-semibold text-[#20A67A] bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Case</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    {searchedCase.animalType} — {searchedCase.condition}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{searchedCase.address} {searchedCase.landmark ? `· (${searchedCase.landmark})` : ''}</span>
                  </p>
                </div>
              </div>

              {/* Authorized Status Controller */}
              {canUpdateStatus && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md w-full">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Authorized Status Action</span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {currentUser?.role.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Add status update note (optional)..."
                      value={statusUpdateNotes}
                      onChange={(e) => setStatusUpdateNotes(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white outline-none"
                    />

                    <div className="flex flex-wrap gap-1.5">
                      {STAGES.map((s, idx) => {
                        const isCurrent = s.stage === searchedCase.status;
                        return (
                          <button
                            key={s.stage}
                            disabled={updatingStatus || isCurrent}
                            onClick={() => handleAdvanceStatus(s.stage)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                              isCurrent
                                ? 'bg-[#145C4A] text-white'
                                : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6-Stage Timeline Stepper */}
            <div className="pt-8 pb-4">
              <div className="relative">
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
                <div
                  className="hidden md:block absolute top-1/2 left-0 h-1 bg-[#20A67A] -translate-y-1/2 z-0 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, (currentStageIndex / (STAGES.length - 1)) * 100)}%`,
                  }}
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 relative z-10">
                  {STAGES.map((s, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;

                    return (
                      <div
                        key={s.stage}
                        className={`flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                          isCurrent
                            ? 'bg-emerald-50/80 ring-1 ring-[#20A67A] shadow-xs'
                            : 'bg-white'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-2 ${
                            isCompleted
                              ? 'bg-[#20A67A] text-white shadow-2xs'
                              : isCurrent
                              ? 'bg-[#145C4A] text-white ring-4 ring-emerald-200 shadow-md animate-pulse'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div
                          className={`text-xs font-bold ${
                            isCurrent ? 'text-[#145C4A]' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                          }`}
                        >
                          {s.label}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5 hidden sm:block">
                          {s.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Details & Location Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Responder & Medical Status */}
            <div className="lg:col-span-5 space-y-6">
              {/* Rescuer Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#20A67A]" />
                    <span>Rescuer Assignment</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {searchedCase.assignedRescuer ? 'Assigned' : 'Unassigned'}
                  </span>
                </div>

                {searchedCase.assignedRescuer ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#145C4A] font-bold flex items-center justify-center">
                        {searchedCase.assignedRescuer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{searchedCase.assignedRescuer.name}</div>
                        <div className="text-slate-500 text-[11px]">
                          Assigned: {new Date(searchedCase.assignedRescuer.assignedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {searchedCase.assignedRescuer.phone && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span>Phone / Helpline:</span>
                        <a
                          href={`tel:${searchedCase.assignedRescuer.phone}`}
                          className="font-bold text-[#145C4A] hover:underline"
                        >
                          {searchedCase.assignedRescuer.phone}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No active rescue assignments recorded yet. Case is currently in triage queue.
                  </div>
                )}
              </div>

              {/* Veterinary Clinic Record */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-sky-600" />
                    <span>Veterinary Record</span>
                  </h3>
                  <span className="text-[10px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded">
                    {searchedCase.veterinaryRecord ? searchedCase.veterinaryRecord.recoveryStatus : 'Pending Exam'}
                  </span>
                </div>

                {searchedCase.veterinaryRecord ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Attending Veterinarian</span>
                      <span className="font-semibold text-slate-900">{searchedCase.veterinaryRecord.veterinarianName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Diagnosis</span>
                      <p className="font-medium text-slate-800">{searchedCase.veterinaryRecord.diagnosis}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Treatment Administered</span>
                      <p className="text-slate-600 leading-relaxed">{searchedCase.veterinaryRecord.treatment}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No treatment records available yet.
                  </div>
                )}
              </div>
            </div>

            {/* Right: GPS Location Map & Case History */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#145C4A]" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Incident Location Coordinates
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Lat {searchedCase.lat.toFixed(5)}, Lng {searchedCase.lng.toFixed(5)}
                  </span>
                </div>

                <RescueMap
                  cases={[searchedCase]}
                  selectedCaseId={searchedCase.id}
                  center={[searchedCase.lat, searchedCase.lng]}
                  zoom={15}
                  height="300px"
                />
              </div>

              {/* Status History */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                  Rescue Status History
                </h3>

                {searchedCase.timeline && searchedCase.timeline.length > 0 ? (
                  <div className="space-y-4 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {searchedCase.timeline.map((event) => (
                      <div key={event.id} className="relative pl-3 text-xs">
                        <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#20A67A] ring-4 ring-white" />
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{event.title}</span>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-slate-600 text-[11px] mt-0.5">{event.description}</p>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">Updated by: {event.actor}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No status history recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileQuestion className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Ready to Lookup Emergency Rescue Cases
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Please enter your unique Case Tracking ID in the search bar above to fetch live records from the database.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
