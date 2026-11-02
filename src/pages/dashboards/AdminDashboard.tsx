import React, { useState, useEffect } from 'react';
import { useRescue } from '../../context/RescueContext';
import { RescueMap } from '../../components/common/RescueMap';
import { RescueCase, RescuerAvailability, PartnerApplication } from '../../types/rescue';
import { api } from '../../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  Activity,
  Filter,
  Search,
  ExternalLink,
  BarChart3,
  UserCheck,
  Loader2,
  FileText,
  HeartPulse,
  Clock,
  XCircle,
  HelpCircle,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const {
    cases,
    verifyCase,
    assignRescuer,
    currentUser,
    analytics,
    refreshAnalytics,
    refreshCases,
    addToast,
    testMode,
    seedTestAccounts,
  } = useRescue();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dispatch' | 'approvals' | 'analytics'>('dispatch');

  // Emergency Dispatch States
  const [selectedCase, setSelectedCase] = useState<RescueCase | null>(cases[0] || null);
  const [availableResponders, setAvailableResponders] = useState<RescuerAvailability[]>([]);
  const [selectedRescuerId, setSelectedRescuerId] = useState<string>('');
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);

  // Partner Approvals States
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [approvalFilter, setApprovalFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [roleFilter, setRoleFilter] = useState<'all' | 'rescuer' | 'vet' | 'ngo'>('all');
  const [loadingApplications, setLoadingApplications] = useState<boolean>(false);
  const [viewingApplication, setViewingApplication] = useState<PartnerApplication | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [rejectReasonPrompt, setRejectReasonPrompt] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  useEffect(() => {
    if (!selectedCase && cases.length > 0) {
      setSelectedCase(cases[0]);
    } else if (selectedCase) {
      const updated = cases.find((c) => c.id === selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  }, [cases]);

  // Load available verified rescuers from backend
  const fetchAvailableRescuers = async () => {
    try {
      const responders = await api.getAvailableRescuers();
      setAvailableResponders(responders);
      if (responders.length > 0 && !selectedRescuerId) {
        setSelectedRescuerId(responders[0].rescuerId);
      }
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchAvailableRescuers();
  }, []);

  // Load partner applications from backend
  const fetchApplications = async () => {
    setLoadingApplications(true);
    try {
      const apps = await api.getPartnerApplications(
        approvalFilter === 'all' ? undefined : approvalFilter,
        roleFilter === 'all' ? undefined : roleFilter
      );
      setApplications(apps);
    } catch (err: any) {
      console.error('Failed to load partner applications:', err);
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchApplications();
    }
  }, [activeTab, approvalFilter, roleFilter]);

  const handleVerifyCase = async (caseId: string) => {
    setVerifying(true);
    try {
      await verifyCase(caseId);
      await refreshCases();
      await refreshAnalytics();
    } finally {
      setVerifying(false);
    }
  };

  const handleAssignRescuer = async () => {
    if (!selectedCase || !selectedRescuerId) return;
    setDispatching(true);
    try {
      await assignRescuer(selectedCase.id, selectedRescuerId);
      await refreshCases();
      await refreshAnalytics();
      fetchAvailableRescuers();
    } finally {
      setDispatching(false);
    }
  };

  const handleApprovePartner = async (userId: string) => {
    setActionInProgress(userId);
    try {
      const res = await api.approvePartnerApplication(userId);
      addToast({
        type: 'success',
        title: 'Partner Approved',
        description: res.message,
      });
      await fetchApplications();
      await fetchAvailableRescuers();
      if (viewingApplication?.id === userId) {
        setViewingApplication((prev) => (prev ? { ...prev, verificationStatus: 'verified' } : null));
      }
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Approval Failed',
        description: err.message || 'Could not approve partner.',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectPartner = async (userId: string) => {
    if (!rejectReason.trim()) {
      addToast({
        type: 'warning',
        title: 'Reason Required',
        description: 'Please specify the rejection reason for the applicant.',
      });
      return;
    }
    setActionInProgress(userId);
    try {
      const res = await api.rejectPartnerApplication(userId, rejectReason.trim());
      addToast({
        type: 'info',
        title: 'Application Rejected',
        description: res.message,
      });
      setRejectReasonPrompt(null);
      setRejectReason('');
      await fetchApplications();
      if (viewingApplication?.id === userId) {
        setViewingApplication((prev) => (prev ? { ...prev, verificationStatus: 'rejected' } : null));
      }
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Rejection Failed',
        description: err.message || 'Could not reject application.',
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRequestInfo = async (userId: string) => {
    setActionInProgress(userId);
    try {
      const res = await api.requestPartnerInfo(userId, 'Please submit updated government accreditation certificate or clinic registration license.');
      addToast({
        type: 'info',
        title: 'Information Requested',
        description: res.message,
      });
    } catch (err: any) {
      addToast({
        type: 'emergency',
        title: 'Request Failed',
        description: err.message,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const pendingVerificationCases = cases.filter((c) => !c.verified);
  const activeCases = cases.filter((c) => c.status !== 'Closed');
  const criticalCases = cases.filter((c) => c.urgency === 'Critical');
  const pendingAppsCount = applications.filter((a) => a.verificationStatus === 'pending').length;

  // Chart data from real analytics
  const urgencyData = analytics?.urgencyDistribution || [
    { name: 'Critical', count: criticalCases.length },
    { name: 'High', count: cases.filter((c) => c.urgency === 'High').length },
    { name: 'Moderate', count: cases.filter((c) => c.urgency === 'Moderate').length },
  ];

  const speciesData = analytics?.speciesDistribution || [
    { name: 'Dog', count: cases.filter((c) => c.animalType === 'Dog').length },
    { name: 'Cat', count: cases.filter((c) => c.animalType === 'Cat').length },
    { name: 'Cow', count: cases.filter((c) => c.animalType === 'Cow').length },
    { name: 'Bird', count: cases.filter((c) => c.animalType === 'Bird').length },
  ];

  const SPECIES_COLORS = ['#145C4A', '#20A67A', '#F2B84B', '#E65353', '#0EA5E9'];

  return (
    <div className="min-h-screen bg-[#F8FAF7] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Test Mode Banner */}
      {testMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-xs text-amber-900">SAFE TEST MODE ACTIVE: </span>
                <span className="text-xs text-amber-800">
                  You can test approving test rescuers & veterinarians below, then immediately dispatching them to test cases.
                </span>
              </div>
            </div>
            <button
              onClick={async () => {
                await seedTestAccounts();
                fetchApplications();
                fetchAvailableRescuers();
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              Seed Sample Partner Applications
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#145C4A]/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#145C4A]/10 text-[#145C4A]">
              COMMAND DISPATCH CENTER
            </span>
            <span className="text-xs text-stone-400">Authenticated Administrator: {currentUser?.fullName}</span>
          </div>
          <h1 className="text-2xl font-black text-[#172B26] tracking-tight font-display">
            Emergency Dispatch & Partner Operations
          </h1>
          <p className="text-xs text-stone-500">
            Real-time emergency triage, verified responder dispatching, partner accreditation, and network analytics.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#F8FAF7] p-1.5 rounded-2xl border border-stone-200 gap-1 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'dispatch'
                ? 'bg-[#145C4A] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Emergency Operations</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeTab === 'approvals'
                ? 'bg-[#145C4A] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Partner Approvals</span>
            {pendingAppsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingAppsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-[#145C4A] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Network Analytics</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-stone-900">{pendingVerificationCases.length}</div>
            <div className="text-[11px] text-stone-500 font-medium">Pending Triage</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-stone-900">{criticalCases.length}</div>
            <div className="text-[11px] text-stone-500 font-medium">Critical Cases</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-stone-900">{availableResponders.length}</div>
            <div className="text-[11px] text-stone-500 font-medium">Verified Rescuers On-Duty</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-stone-900">{analytics?.partnerClinics || 0}</div>
            <div className="text-[11px] text-stone-500 font-medium">Partner Clinics</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EMERGENCY OPERATIONS & DISPATCH */}
      {/* ========================================================================= */}
      {activeTab === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Triage Queue List */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-[740px]">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#145C4A]" />
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Live Incident Queue ({cases.length})
                </span>
              </div>
              <button
                onClick={() => {
                  refreshCases();
                  fetchAvailableRescuers();
                }}
                className="text-[11px] font-semibold text-[#145C4A] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-stone-100 p-2 space-y-1">
              {cases.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  No rescue reports in database. Citizens can submit emergencies using the SOS form.
                </div>
              ) : (
                cases.map((c) => {
                  const isSelected = selectedCase?.id === c.id;
                  const isRejected = c.assignedRescuer?.assignmentStatus === 'declined' || c.assignedRescuer?.assignmentStatus === 'rejected';

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#145C4A]/5 border-[#145C4A] shadow-xs'
                          : 'border-transparent hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-stone-900 font-mono">{c.caseId}</span>
                          {c.isTestCase && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                              TEST
                            </span>
                          )}
                          {!c.verified && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.2 rounded font-bold">
                              UNVERIFIED
                            </span>
                          )}
                          {isRejected && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.2 rounded font-bold">
                              REASSIGN
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            c.urgency === 'Critical'
                              ? 'bg-rose-100 text-rose-700'
                              : c.urgency === 'High'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {c.urgency}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-stone-800 line-clamp-1 mb-1">
                        {c.animalType}: {c.condition}
                      </div>

                      <div className="text-[11px] text-stone-500 line-clamp-1 mb-2">
                        📍 {c.address}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-stone-100/80">
                        <span className="text-stone-400">
                          {new Date(c.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-semibold text-stone-700">
                          Status: {c.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Case Triage & Dispatch Action Panel */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between space-y-6">
            {selectedCase ? (
              <>
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold text-stone-900 font-mono">{selectedCase.caseId}</h2>
                        {selectedCase.isTestCase && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-bold">
                            TEST CASE
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            selectedCase.urgency === 'Critical'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {selectedCase.urgency} Priority
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-stone-100 text-stone-700">
                          {selectedCase.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Reported by {selectedCase.reporter?.name || 'Citizen'} • {new Date(selectedCase.reportedAt).toLocaleString()}
                      </p>
                    </div>

                    {!selectedCase.verified ? (
                      <button
                        onClick={() => handleVerifyCase(selectedCase.caseId)}
                        disabled={verifying}
                        className="px-4 py-2 bg-[#20A67A] hover:bg-[#1a8b66] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        <span>Verify Authenticity</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Verified Case</span>
                      </div>
                    )}
                  </div>

                  {/* Rejected Assignment Warning */}
                  {selectedCase.assignedRescuer?.assignmentStatus === 'rejected' && (
                    <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">⚠️ Assignment Declined by Responder: </span>
                        {selectedCase.assignedRescuer.rejectionReason || 'Unable to attend emergency at this time.'}
                        <div className="mt-1 font-semibold text-rose-900 underline">
                          Please select an alternate verified responder below to reassign.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Case Details & Photo */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    <div className="sm:col-span-1 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 h-36">
                      <img
                        src={selectedCase.photoUrl}
                        alt="Emergency victim"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-stone-700">Animal & Condition: </span>
                        <span className="text-stone-900 font-semibold">{selectedCase.animalType} — {selectedCase.condition}</span>
                      </div>
                      <div>
                        <span className="font-bold text-stone-700">Location Address: </span>
                        <span className="text-stone-900">📍 {selectedCase.address}</span>
                      </div>
                      {selectedCase.landmark && (
                        <div>
                          <span className="font-bold text-stone-700">Landmark: </span>
                          <span className="text-stone-900">{selectedCase.landmark}</span>
                        </div>
                      )}
                      {selectedCase.description && (
                        <div>
                          <span className="font-bold text-stone-700">Description: </span>
                          <span className="text-stone-600 italic">"{selectedCase.description}"</span>
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-stone-700">Reporter Contact: </span>
                        <span className="text-stone-900 font-mono">{selectedCase.reporter?.phone || 'Protected'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rescuer Dispatch Selector */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-[#145C4A]" />
                        <span>Dispatch Verified Rescuer</span>
                      </div>
                      <span className="text-[11px] text-stone-500">
                        {availableResponders.length} verified rescuers available
                      </span>
                    </div>

                    {availableResponders.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                        <span>No verified rescuers are currently on duty.</span>
                        <button
                          onClick={() => setActiveTab('approvals')}
                          className="font-bold text-[#145C4A] hover:underline"
                        >
                          Review Applications →
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={selectedRescuerId}
                          onChange={(e) => setSelectedRescuerId(e.target.value)}
                          className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 text-xs font-medium bg-white focus:ring-2 focus:ring-[#145C4A] focus:outline-none"
                        >
                          {availableResponders.map((r) => (
                            <option key={r.rescuerId} value={r.rescuerId}>
                              {r.name} ({r.serviceArea}) — {r.experienceYears}y exp • {r.capabilities?.join(', ') || 'General'}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={handleAssignRescuer}
                          disabled={dispatching || !selectedRescuerId}
                          className="px-5 py-2.5 bg-[#145C4A] hover:bg-[#104a3b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {dispatching ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {selectedCase.assignedRescuer ? 'Reassign Responder' : 'Dispatch Rescuer'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Incident Sector Map */}
                  <div>
                    <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                      Emergency Location Map
                    </div>
                    <RescueMap
                      cases={[selectedCase]}
                      selectedCaseId={selectedCase.id}
                      center={[selectedCase.lat, selectedCase.lng]}
                      zoom={15}
                      height="230px"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-stone-400">
                Select a rescue case from the incident queue to begin triage and dispatch.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PARTNER APPROVALS DASHBOARD (REQUIREMENT #3) */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Filter Sub-header */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-stone-500 uppercase mr-2">Status:</span>
              {(['pending', 'verified', 'rejected', 'all'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setApprovalFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                    approvalFilter === st
                      ? 'bg-[#145C4A] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st === 'pending' ? 'Pending Applications' : st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500 uppercase">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold bg-white"
              >
                <option value="all">All Partner Types</option>
                <option value="rescuer">Animal Rescuers</option>
                <option value="vet">Veterinary Doctors & Clinics</option>
                <option value="ngo">NGOs & Shelters</option>
              </select>

              <button
                onClick={fetchApplications}
                className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600"
                title="Refresh applications"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Applications Grid */}
          {loadingApplications ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-stone-200">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#145C4A] mb-2" />
              <span className="text-xs text-stone-500">Loading partner applications...</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
              <UserCheck className="w-10 h-10 mx-auto text-stone-300" />
              <div className="text-sm font-bold text-stone-800">No partner applications found.</div>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                No applications matching filter <span className="font-semibold">{approvalFilter}</span>.
                Prospective rescuers and veterinary clinics can apply on the registration portal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {applications.map((app) => {
                const isPending = app.verificationStatus === 'pending';
                const isVerified = app.verificationStatus === 'verified';
                const isRejected = app.verificationStatus === 'rejected';

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Top status & badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`p-1.5 rounded-lg ${
                              app.role === 'rescuer'
                                ? 'bg-emerald-50 text-emerald-700'
                                : app.role === 'vet'
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-teal-50 text-teal-700'
                            }`}
                          >
                            {app.role === 'rescuer' ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : app.role === 'vet' ? (
                              <HeartPulse className="w-4 h-4" />
                            ) : (
                              <Building2 className="w-4 h-4" />
                            )}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                            {app.role === 'vet' ? 'Veterinary Clinic' : app.role.toUpperCase()}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isPending
                              ? 'bg-amber-100 text-amber-800'
                              : isVerified
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {app.verificationStatus}
                        </span>
                      </div>

                      {/* Name & Contact */}
                      <h3 className="text-sm font-extrabold text-stone-900 mb-1">{app.fullName}</h3>
                      <div className="space-y-1 text-xs text-stone-500 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          <span className="truncate">{app.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{app.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{app.city}</span>
                        </div>
                      </div>

                      {/* Role Specific Details Card */}
                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs space-y-1.5 mb-4">
                        {app.role === 'rescuer' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-stone-500">Experience:</span>
                              <span className="font-bold text-stone-800">{app.experienceYears} Years</span>
                            </div>
                            {app.organizationName && (
                              <div className="flex justify-between">
                                <span className="text-stone-500">Affiliation:</span>
                                <span className="font-semibold text-stone-800 truncate max-w-[150px]">
                                  {app.organizationName}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-stone-500 block mb-1">Capabilities:</span>
                              <div className="flex flex-wrap gap-1">
                                {app.rescueCapabilities?.map((c) => (
                                  <span key={c} className="bg-emerald-100/80 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-medium">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {app.role === 'vet' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-stone-500">Facility:</span>
                              <span className="font-bold text-stone-800 truncate max-w-[150px]">
                                {app.clinicName || 'Clinic'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-500">License No:</span>
                              <span className="font-mono font-bold text-stone-800">{app.licenseNumber || 'Verified'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-500">24/7 Trauma:</span>
                              <span className={`font-bold ${app.emergency247 ? 'text-emerald-700' : 'text-stone-500'}`}>
                                {app.emergency247 ? '✓ Available 24/7' : 'Standard Hours'}
                              </span>
                            </div>
                          </>
                        )}

                        {app.role === 'ngo' && (
                          <div>
                            <span className="text-stone-500">Shelter Org:</span>
                            <span className="font-bold text-stone-800 block">{app.organizationName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-stone-100">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingApplication(app)}
                          className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          View Details
                        </button>

                        {isPending && (
                          <button
                            onClick={() => handleRequestInfo(app.id)}
                            disabled={actionInProgress === app.id}
                            className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors"
                            title="Request Additional Documentation"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {isPending && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleApprovePartner(app.id)}
                            disabled={actionInProgress === app.id}
                            className="py-2 bg-[#20A67A] hover:bg-[#1a8b66] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {actionInProgress === app.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => setRejectReasonPrompt({ id: app.id, name: app.fullName })}
                            disabled={actionInProgress === app.id}
                            className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NETWORK ANALYTICS & TRENDS */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Emergency Case Inflow by Urgency
                </h3>
                <p className="text-xs text-stone-500">Calculated dynamically from real database records</p>
              </div>
              <BarChart3 className="w-4 h-4 text-stone-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={urgencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#145C4A" radius={[6, 6, 0, 0]} name="Reports" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1">
                Species Case Distribution
              </h3>
              <p className="text-xs text-stone-500 mb-4">Dynamic species counts in PostgreSQL</p>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              {cases.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={speciesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {speciesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SPECIES_COLORS[index % SPECIES_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-stone-400">No report data yet</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-stone-100">
              {speciesData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: SPECIES_COLORS[idx % SPECIES_COLORS.length] }}
                  />
                  <span className="text-stone-600 truncate">{item.name} ({item.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View Application Modal */}
      {viewingApplication && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Partner Accreditation File
                </span>
                <h3 className="text-lg font-bold text-stone-900">{viewingApplication.fullName}</h3>
                <span className="text-xs text-stone-500 uppercase font-semibold">{viewingApplication.role}</span>
              </div>
              <button
                onClick={() => setViewingApplication(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-stone-500 block">Email:</span>
                  <span className="font-semibold text-stone-900">{viewingApplication.email}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Phone:</span>
                  <span className="font-semibold text-stone-900">{viewingApplication.phone}</span>
                </div>
              </div>

              <div>
                <span className="text-stone-500 block">Operational City / Service Area:</span>
                <span className="font-semibold text-stone-900">{viewingApplication.city}</span>
              </div>

              {viewingApplication.role === 'rescuer' && (
                <>
                  <div>
                    <span className="text-stone-500 block">Experience:</span>
                    <span className="font-semibold text-stone-900">{viewingApplication.experienceYears} Years</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Rescue Capabilities:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {viewingApplication.rescueCapabilities?.map((c) => (
                        <span key={c} className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {viewingApplication.role === 'vet' && (
                <>
                  <div>
                    <span className="text-stone-500 block">Clinic Name:</span>
                    <span className="font-semibold text-stone-900">{viewingApplication.clinicName}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Clinic Address:</span>
                    <span className="font-semibold text-stone-900">{viewingApplication.clinicAddress || 'Address on file'}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Veterinary License Number:</span>
                    <span className="font-mono font-bold text-stone-900">{viewingApplication.licenseNumber}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Emergency 24/7 Availability:</span>
                    <span className="font-semibold text-emerald-700">
                      {viewingApplication.emergency247 ? 'Yes, 24/7 Inpatient Trauma' : 'Standard Operating Hours'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {viewingApplication.verificationStatus === 'pending' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleApprovePartner(viewingApplication.id)}
                  disabled={actionInProgress === viewingApplication.id}
                  className="flex-1 py-2.5 bg-[#20A67A] hover:bg-[#1a8b66] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Confirm Official Approval
                </button>
                <button
                  onClick={() => {
                    setRejectReasonPrompt({ id: viewingApplication.id, name: viewingApplication.fullName });
                    setViewingApplication(null);
                  }}
                  className="px-4 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Application Reason Modal */}
      {rejectReasonPrompt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              Reject Application for {rejectReasonPrompt.name}
            </h3>
            <p className="text-xs text-stone-500">
              Please provide a clear reason for rejecting this partner accreditation. This will be recorded and sent to the applicant.
            </p>

            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Could not verify council license number / out of operational service zone."
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => handleRejectPartner(rejectReasonPrompt.id)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setRejectReasonPrompt(null);
                  setRejectReason('');
                }}
                className="px-4 py-2.5 bg-stone-100 text-stone-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
