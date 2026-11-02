import React, { useState, useEffect } from 'react';
import { useRescue } from '../../context/RescueContext';
import { RescueMap } from '../../components/common/RescueMap';
import { RescueCase, RescueStage, OrganizationProfile } from '../../types/rescue';
import { api } from '../../services/api';
import {
  Compass,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  Check,
  Phone,
  Power,
  Truck,
  RotateCcw,
  ExternalLink,
  FileText,
  XCircle,
  HeartPulse,
  Send,
  Loader2,
  MessageSquare,
  Building,
} from 'lucide-react';

export const ResponderDashboard: React.FC = () => {
  const {
    cases,
    currentUser,
    updateCaseStatus,
    acceptCase,
    rejectCase,
    initiateHandoff,
    navigateTo,
    addToast,
    refreshCases,
  } = useRescue();

  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [selectedCase, setSelectedCase] = useState<RescueCase | null>(null);
  const [filterTab, setFilterTab] = useState<'assigned' | 'active' | 'completed'>('assigned');

  // Rejection modal
  const [rejectingCase, setRejectingCase] = useState<RescueCase | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  // Veterinary handoff modal
  const [handoffCase, setHandoffCase] = useState<RescueCase | null>(null);
  const [clinics, setClinics] = useState<OrganizationProfile[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [handoffNotes, setHandoffNotes] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  // Notes on current case
  const [customNote, setCustomNote] = useState<string>('');

  const isVerifiedRescuer = currentUser?.verificationStatus === 'verified' || currentUser?.role === 'admin';

  // Rescuer cases
  const myAssignedRescues = cases.filter(
    (c) =>
      c.assignedRescuer?.id === currentUser?.id ||
      (currentUser?.role === 'admin' && c.status !== 'Closed')
  );

  const pendingAcceptanceRescues = myAssignedRescues.filter(
    (c) => c.status === 'Assigned' && c.assignedRescuer?.assignmentStatus !== 'accepted'
  );

  const activeRescues = myAssignedRescues.filter(
    (c) =>
      c.status === 'On the Way' ||
      c.status === 'Rescued' ||
      (c.status === 'Assigned' && c.assignedRescuer?.assignmentStatus === 'accepted')
  );

  const completedRescues = myAssignedRescues.filter(
    (c) => c.status === 'Treated' || c.status === 'Closed'
  );

  // Synchronize selected case
  useEffect(() => {
    if (!selectedCase && myAssignedRescues.length > 0) {
      setSelectedCase(myAssignedRescues[0]);
    } else if (selectedCase) {
      const updated = cases.find((c) => c.id === selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  }, [cases]);

  // Load verified veterinary clinics for transfer
  useEffect(() => {
    const loadClinics = async () => {
      try {
        const orgs = await api.getOrganizations();
        const vetClinics = orgs.filter(
          (o) => o.organizationType === 'Veterinary Clinic' && o.verificationStatus === 'verified'
        );
        setClinics(vetClinics);
        if (vetClinics.length > 0) {
          setSelectedClinicId(vetClinics[0].id);
        }
      } catch {
        // non-blocking
      }
    };
    loadClinics();
  }, []);

  const handleToggleAvailability = async () => {
    if (!isVerifiedRescuer) {
      addToast({
        type: 'warning',
        title: 'Accreditation Pending',
        description: 'You cannot go on duty until your rescuer account is verified by an administrator.',
      });
      return;
    }

    const nextStatus = !isAvailable;
    setIsAvailable(nextStatus);
    try {
      await api.updateAvailability(
        nextStatus ? 'available' : 'unavailable',
        currentUser?.city || 'Default Service Sector'
      );
      addToast({
        type: 'info',
        title: 'Duty Status Updated',
        description: nextStatus
          ? 'You are now Available for emergency dispatch.'
          : 'You are now Standby / Off-Duty.',
      });
    } catch (err: any) {
      setIsAvailable(!nextStatus);
      addToast({
        type: 'emergency',
        title: 'Availability Update Failed',
        description: err.message || 'Could not update duty status.',
      });
    }
  };

  const handleAcceptAssignment = async (caseItem: RescueCase) => {
    try {
      await acceptCase(caseItem.id);
      await refreshCases();
    } catch {
      // handled
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingCase || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      await rejectCase(rejectingCase.id, rejectReason.trim());
      setRejectingCase(null);
      setRejectReason('');
      await refreshCases();
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAdvanceStatus = async (caseItem: RescueCase, nextStage: RescueStage, notes: string) => {
    try {
      await updateCaseStatus(caseItem.caseId, nextStage, notes);
      await refreshCases();
    } catch {
      // handled
    }
  };

  const handleConfirmHandoff = async () => {
    if (!handoffCase || !selectedClinicId) return;
    setIsTransferring(true);
    try {
      await initiateHandoff(handoffCase.caseId, selectedClinicId, handoffNotes.trim());
      setHandoffCase(null);
      setHandoffNotes('');
      await refreshCases();
    } finally {
      setIsTransferring(false);
    }
  };

  const handleAddNote = async (caseItem: RescueCase) => {
    if (!customNote.trim()) return;
    try {
      await updateCaseStatus(caseItem.caseId, caseItem.status, `Field Note: ${customNote.trim()}`);
      setCustomNote('');
      await refreshCases();
    } catch {
      // handled
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Accreditation Notice for Pending Rescuers */}
      {!isVerifiedRescuer && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3 shadow-xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <span className="font-bold">Application Status: Pending Administrator Accreditation</span>
            <p className="mt-1">
              Your field rescuer application is currently under review by command dispatchers. Once your capabilities and
              service area are verified, you will be authorized to go on duty and receive emergency dispatches.
            </p>
          </div>
        </div>
      )}

      {/* Top Welcome Bar */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#145C4A]/10 text-[#145C4A] font-extrabold flex items-center justify-center text-lg">
            {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'R'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900 font-display">
                {currentUser?.fullName || 'Field Rescuer'}
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isVerifiedRescuer
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {isVerifiedRescuer ? 'Verified Rescuer' : 'Accreditation Pending'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Sector: {currentUser?.city || 'General Area'} · Duty Status:{' '}
              <span className={isAvailable && isVerifiedRescuer ? 'text-[#20A67A] font-bold' : 'text-stone-400 font-semibold'}>
                {isAvailable && isVerifiedRescuer ? '● Active on Duty' : '○ Standby / Off-Duty'}
              </span>
            </p>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleAvailability}
            disabled={!isVerifiedRescuer}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
              !isVerifiedRescuer
                ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                : isAvailable
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isAvailable && isVerifiedRescuer ? 'On-Duty' : 'Off-Duty'}</span>
          </button>
        </div>
      </div>

      {/* Main Rescuer Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assigned Cases List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sub-Tabs */}
          <div className="bg-white p-1.5 rounded-2xl border border-stone-200 flex gap-1 shadow-xs">
            <button
              onClick={() => setFilterTab('assigned')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all relative ${
                filterTab === 'assigned'
                  ? 'bg-[#145C4A] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>New Dispatches</span>
              {pendingAcceptanceRescues.length > 0 && (
                <span className="ml-1.5 bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingAcceptanceRescues.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterTab('active')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                filterTab === 'active'
                  ? 'bg-[#145C4A] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>En Route / Rescued ({activeRescues.length})</span>
            </button>

            <button
              onClick={() => setFilterTab('completed')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                filterTab === 'completed'
                  ? 'bg-[#145C4A] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Completed ({completedRescues.length})</span>
            </button>
          </div>

          {/* Cases List */}
          <div className="space-y-3">
            {(filterTab === 'assigned'
              ? pendingAcceptanceRescues
              : filterTab === 'active'
              ? activeRescues
              : completedRescues
            ).map((item) => {
              const isSelected = selectedCase?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCase(item)}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all bg-white ${
                    isSelected
                      ? 'border-[#145C4A] ring-1 ring-[#145C4A]/20 shadow-sm'
                      : 'border-stone-200 hover:border-stone-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.photoUrl}
                      alt={item.animalType}
                      className="w-16 h-16 rounded-2xl object-cover border border-stone-100 shrink-0 bg-stone-100"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-[#145C4A] font-mono">{item.caseId}</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            item.urgency === 'Critical'
                              ? 'bg-rose-50 text-[#E65353]'
                              : item.urgency === 'High'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-emerald-50 text-[#145C4A]'
                          }`}
                        >
                          {item.urgency}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-stone-900 truncate">
                        {item.animalType} · {item.condition}
                      </h4>

                      <p className="text-[11px] text-stone-500 truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>{item.address}</span>
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400">
                        <span>Reported {new Date(item.reportedAt).toLocaleDateString()}</span>
                        <span className="font-semibold text-stone-700">Status: {item.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {(filterTab === 'assigned'
              ? pendingAcceptanceRescues
              : filterTab === 'active'
              ? activeRescues
              : completedRescues
            ).length === 0 && (
              <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-xs text-stone-400 space-y-2">
                <FileText className="w-6 h-6 mx-auto text-stone-300" />
                <p>
                  {filterTab === 'assigned'
                    ? 'No new dispatch assignments pending your response.'
                    : filterTab === 'active'
                    ? 'No active rescues in progress.'
                    : 'No completed rescue records available.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Case Action Center */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCase ? (
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
              {/* Header and Case Quick Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-[#145C4A] font-mono">{selectedCase.caseId}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                      {selectedCase.status}
                    </span>
                    {selectedCase.isTestCase && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                        TEST
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 mt-1">
                    {selectedCase.animalType} — {selectedCase.condition}
                  </h3>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{selectedCase.address} {selectedCase.landmark ? `· Landmark: ${selectedCase.landmark}` : ''}</span>
                  </p>
                </div>

                {/* Direct Google Maps Navigation Button */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCase.lat},${selectedCase.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 text-xs font-bold text-[#145C4A] bg-[#145C4A]/10 hover:bg-[#145C4A]/20 rounded-xl transition-colors flex items-center gap-1.5 self-start"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open GPS Directions</span>
                </a>
              </div>

              {/* Assignment Acceptance Bar (Requirement #5) */}
              {selectedCase.status === 'Assigned' && selectedCase.assignedRescuer?.assignmentStatus !== 'accepted' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-amber-900">New Emergency Dispatch Request</div>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Please accept to claim this rescue operation, or decline so dispatchers can reassign.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptAssignment(selectedCase)}
                      className="px-4 py-2 bg-[#145C4A] hover:bg-[#104a3b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Case</span>
                    </button>
                    <button
                      onClick={() => setRejectingCase(selectedCase)}
                      className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {/* Workflow Status Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedCase.status === 'Assigned' && selectedCase.assignedRescuer?.assignmentStatus === 'accepted' && (
                  <button
                    onClick={() =>
                      handleAdvanceStatus(
                        selectedCase,
                        'On the Way',
                        'Responder departed for emergency GPS coordinates.'
                      )
                    }
                    className="px-4 py-2.5 text-xs font-bold text-white bg-[#145C4A] hover:bg-[#0f4437] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Depart (Update to "On the Way")</span>
                  </button>
                )}

                {selectedCase.status === 'On the Way' && (
                  <button
                    onClick={() =>
                      handleAdvanceStatus(
                        selectedCase,
                        'Rescued',
                        'Animal secured safely into vehicle transport unit.'
                      )
                    }
                    className="px-4 py-2.5 text-xs font-bold text-white bg-[#20A67A] hover:bg-[#1a8864] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Animal Rescued</span>
                  </button>
                )}

                {selectedCase.status === 'Rescued' && (
                  <button
                    onClick={() => setHandoffCase(selectedCase)}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <HeartPulse className="w-4 h-4" />
                    <span>Initiate Veterinary Clinic Handoff</span>
                  </button>
                )}

                {selectedCase.assignedClinicName && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
                    <Building className="w-3.5 h-3.5 text-sky-600" />
                    <span>Transferred to: {selectedCase.assignedClinicName}</span>
                  </div>
                )}
              </div>

              {/* Interactive Location Map */}
              <div>
                <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  Emergency Incident Map
                </div>
                <RescueMap
                  cases={[selectedCase]}
                  selectedCaseId={selectedCase.id}
                  center={[selectedCase.lat, selectedCase.lng]}
                  zoom={15}
                  height="260px"
                />
              </div>

              {/* Add Rescue Notes */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#145C4A]" />
                  <span>Add Field Rescue Note</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g. Animal is calm, slight bleeding on left front leg. Applying antiseptic."
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#145C4A] focus:outline-none bg-white"
                  />
                  <button
                    onClick={() => handleAddNote(selectedCase)}
                    disabled={!customNote.trim()}
                    className="px-4 py-2 bg-[#145C4A] hover:bg-[#104a3b] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Post Note
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-stone-200 text-xs text-stone-400">
              Select an emergency dispatch to view incident location and operational actions.
            </div>
          )}
        </div>
      </div>

      {/* Reject Assignment Reason Modal */}
      {rejectingCase && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              Decline Emergency Case {rejectingCase.caseId}
            </h3>
            <p className="text-xs text-stone-500">
              Please specify why you cannot take this dispatch so triage operators can reassign to another responder immediately.
            </p>

            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Currently handling another severe case / outside my service sector."
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={handleConfirmReject}
                disabled={isRejecting || !rejectReason.trim()}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRejecting ? 'Declining...' : 'Confirm Decline & Reassign'}
              </button>
              <button
                onClick={() => {
                  setRejectingCase(null);
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

      {/* Veterinary Clinic Handoff Modal (Requirement #6) */}
      {handoffCase && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-bold text-stone-900">
                Initiate Veterinary Patient Handoff
              </h3>
            </div>
            <p className="text-xs text-stone-500">
              Select an accredited partner clinic to transfer case <span className="font-mono font-bold text-stone-800">{handoffCase.caseId}</span> ({handoffCase.animalType}). The clinic will be alerted of incoming arrival.
            </p>

            {clinics.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                No verified veterinary partner clinics are currently registered in the database.
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase">
                  Select Destination Clinic
                </label>
                <select
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs font-medium bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
                >
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.organizationName} — {c.address}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase">
                Transport Condition & Handover Notes
              </label>
              <textarea
                rows={3}
                value={handoffNotes}
                onChange={(e) => setHandoffNotes(e.target.value)}
                placeholder="e.g. Animal is stabilized in carrier. Front leg immobilized with temporary splint. Bleeding contained."
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-sky-600 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmHandoff}
                disabled={isTransferring || !selectedClinicId}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isTransferring ? 'Alerting Clinic...' : 'Confirm Transfer & Alert Clinic'}
              </button>
              <button
                onClick={() => setHandoffCase(null)}
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
