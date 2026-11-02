import React, { useState } from 'react';
import { useRescue } from '../../context/RescueContext';
import { RescueCase } from '../../types/rescue';
import {
  Stethoscope,
  Activity,
  HeartPulse,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Save,
  Plus,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Building,
  Check,
  AlertCircle,
  FileBadge,
} from 'lucide-react';

export const VetDashboard: React.FC = () => {
  const { cases, currentUser, updateVetTreatment, acceptHandoff, navigateTo, refreshCases, addToast } = useRescue();

  const [selectedCase, setSelectedCase] = useState<RescueCase | null>(cases[0] || null);
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [treatment, setTreatment] = useState<string>('');
  const [recoveryStatus, setRecoveryStatus] = useState<string>('Under Observation');
  const [saving, setSaving] = useState<boolean>(false);
  const [admitting, setAdmitting] = useState<boolean>(false);

  const isVerifiedVet = currentUser?.verificationStatus === 'verified' || currentUser?.role === 'admin';

  // Sync inputs when selecting case
  const handleSelectCase = (c: RescueCase) => {
    setSelectedCase(c);
    setDiagnosis(c.veterinaryRecord?.diagnosis || '');
    setTreatment(c.veterinaryRecord?.treatment || '');
    setRecoveryStatus(c.veterinaryRecord?.recoveryStatus || 'Under Observation');
  };

  const handleAcceptHandoff = async (caseItem: RescueCase) => {
    setAdmitting(true);
    try {
      await acceptHandoff(caseItem.caseId);
      await refreshCases();
    } finally {
      setAdmitting(false);
    }
  };

  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    if (!isVerifiedVet) {
      addToast({
        type: 'warning',
        title: 'Accreditation Pending',
        description: 'Your veterinary account must be verified by an administrator before signing medical charts.',
      });
      return;
    }

    setSaving(true);
    try {
      await updateVetTreatment(selectedCase.id, {
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim(),
        recoveryStatus,
      });
      await refreshCases();
    } finally {
      setSaving(false);
    }
  };

  const incomingCases = cases.filter(
    (c) =>
      c.status === 'On the Way' ||
      (c.status === 'Rescued' && c.handoffStatus === 'pending')
  );

  const admittedCases = cases.filter(
    (c) =>
      (c.status === 'Rescued' && c.handoffStatus === 'accepted') ||
      c.status === 'Treated'
  );

  const dischargedCases = cases.filter((c) => c.status === 'Closed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Accreditation Notice */}
      {!isVerifiedVet && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3 shadow-xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <span className="font-bold">Clinic Application Status: Pending Administrator Verification</span>
            <p className="mt-1">
              Your veterinary clinic license and council registration credentials are under review by PawSOS
              administrators. You can review incoming patient alerts below; clinical chart recording will be enabled
              upon verification.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 font-extrabold flex items-center justify-center text-lg">
            <Stethoscope className="w-6 h-6 text-sky-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900 font-display">
                {currentUser?.clinicName || currentUser?.organizationName || 'Veterinary Trauma Clinic'}
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isVerifiedVet
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {isVerifiedVet ? 'Accredited Veterinary Partner' : 'Verification Pending'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Doctor: Dr. {currentUser?.fullName || 'Attending Physician'} · License:{' '}
              <span className="font-mono font-semibold">{currentUser?.licenseNumber || 'Verified on File'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-semibold flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-stone-500" />
            <span>{currentUser?.city || 'Operational Sector'}</span>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-2xl font-bold text-[#E65353] tabular-nums font-mono">
            {incomingCases.length}
          </div>
          <div className="text-xs font-bold text-stone-800 mt-0.5">Incoming Patient Alerts</div>
          <p className="text-[11px] text-stone-400">En route with field rescuers</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-2xl font-bold text-sky-600 tabular-nums font-mono">
            {admittedCases.length}
          </div>
          <div className="text-xs font-bold text-stone-800 mt-0.5">Inpatient Trauma Care</div>
          <p className="text-[11px] text-stone-400">Admitted under clinical treatment</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-2xl font-bold text-[#20A67A] tabular-nums font-mono">
            {dischargedCases.length}
          </div>
          <div className="text-xs font-bold text-stone-800 mt-0.5">Discharged / Closed</div>
          <p className="text-[11px] text-stone-400">Successfully rehabilitated</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-2xl font-bold text-[#145C4A] tabular-nums font-mono">
            {cases.length}
          </div>
          <div className="text-xs font-bold text-stone-800 mt-0.5">Total Network Cases</div>
          <p className="text-[11px] text-stone-400">Live PostgreSQL records</p>
        </div>
      </div>

      {/* Main Clinical Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patients List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-[680px]">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-sky-600" />
                <span>Patient Triage & Inpatient Roster</span>
              </span>
              <button
                onClick={() => refreshCases()}
                className="text-[11px] font-semibold text-sky-700 hover:underline"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-stone-100 p-2 space-y-1">
              {cases.length === 0 ? (
                <div className="p-10 text-center text-xs text-stone-400">
                  No treatment records available.
                </div>
              ) : (
                cases.map((item) => {
                  const isSelected = selectedCase?.id === item.id;
                  const isIncoming = item.status === 'On the Way' || (item.status === 'Rescued' && item.handoffStatus === 'pending');

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectCase(item)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-sky-50/60 border-sky-400 shadow-xs'
                          : 'border-transparent hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-stone-900 font-mono">{item.caseId}</span>
                          {item.isTestCase && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                              TEST
                            </span>
                          )}
                          {isIncoming && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold animate-pulse">
                              INCOMING
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            item.urgency === 'Critical'
                              ? 'bg-rose-100 text-rose-700'
                              : item.urgency === 'High'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.urgency}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-stone-900 truncate">
                        {item.animalType} · {item.condition}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 pt-2 border-t border-stone-100">
                        <span>Responder: {item.assignedRescuer?.name || 'Unassigned'}</span>
                        <span className="font-semibold text-stone-800">Stage: {item.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Inpatient Chart & Medical Records */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCase ? (
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
              {/* Patient Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-stone-900 font-mono">{selectedCase.caseId}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                      {selectedCase.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 mt-1">
                    {selectedCase.animalType} — {selectedCase.condition}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    📍 {selectedCase.address} • Dispatched Responder: {selectedCase.assignedRescuer?.name || 'None'}
                  </p>
                </div>

                {/* Inpatient Admission Action */}
                {selectedCase.status === 'Rescued' && selectedCase.handoffStatus !== 'accepted' && (
                  <button
                    onClick={() => handleAcceptHandoff(selectedCase)}
                    disabled={admitting || !isVerifiedVet}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {admitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Admit Patient to Clinic</span>
                  </button>
                )}

                {selectedCase.handoffStatus === 'accepted' && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Admitted Inpatient</span>
                  </div>
                )}
              </div>

              {/* Case Visual & Report Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <img
                  src={selectedCase.photoUrl}
                  alt={selectedCase.animalType}
                  className="rounded-2xl object-cover h-32 w-full border border-stone-200 bg-stone-100"
                />
                <div className="sm:col-span-2 space-y-1.5 text-xs">
                  <div>
                    <span className="font-bold text-stone-700">Injury Description: </span>
                    <span className="text-stone-600 italic">"{selectedCase.description || selectedCase.condition}"</span>
                  </div>
                  <div>
                    <span className="font-bold text-stone-700">Assigned Clinic: </span>
                    <span className="text-stone-800 font-semibold">{selectedCase.assignedClinicName || 'General Receiving Clinic'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-stone-700">Triage Authentication: </span>
                    <span className={selectedCase.verified ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                      {selectedCase.verified ? 'Verified by Command Dispatch' : 'Citizen SOS Submission'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clinical Chart Form (Requirement #6) */}
              <form onSubmit={handleSaveTreatment} className="space-y-4 pt-4 border-t border-stone-100">
                <div className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-sky-600" />
                  <span>Physician Clinical Chart & Treatment Record</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Veterinary Clinical Diagnosis <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    disabled={!isVerifiedVet}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Compound fracture of left radius/ulna. Dehydration and moderate blood loss."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-sky-600 focus:outline-none disabled:bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Treatment Protocol & Medication Plan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    disabled={!isVerifiedVet}
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    placeholder="e.g. Wound debridement, splint stabilization, IV fluids, amoxicillin 250mg, meloxicam analgesia."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-sky-600 focus:outline-none disabled:bg-stone-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Patient Recovery Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={recoveryStatus}
                      disabled={!isVerifiedVet}
                      onChange={(e) => setRecoveryStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none disabled:bg-stone-50"
                    >
                      <option value="Under Observation">Under Observation (Inpatient)</option>
                      <option value="Critical Care / ICU">Critical Care / ICU</option>
                      <option value="Stable - In Recovery">Stable - In Recovery</option>
                      <option value="Ready for Shelter Transfer">Ready for Shelter Transfer</option>
                      <option value="Discharged / Closed">Discharged / Closed (Treatment Complete)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={saving || !isVerifiedVet || !diagnosis.trim() || !treatment.trim()}
                      className="w-full py-2.5 bg-[#145C4A] hover:bg-[#104a3b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Save Clinical Record</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Past Timeline Log */}
              {selectedCase.veterinaryRecord && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Signed Clinical Record on File</span>
                  </div>
                  <div className="text-emerald-800">
                    Physician: {selectedCase.veterinaryRecord.veterinarianName} • Status: {selectedCase.veterinaryRecord.recoveryStatus}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-stone-200 text-xs text-stone-400">
              Select an admitted patient or incoming rescue case to review clinical diagnosis and treatment plans.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
