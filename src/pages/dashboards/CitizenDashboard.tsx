import React from 'react';
import { useRescue } from '../../context/RescueContext';
import { RescueMap } from '../../components/common/RescueMap';
import {
  User,
  Plus,
  AlertTriangle,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { currentUser, myCases, navigateTo } = useRescue();

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Please Sign In</h2>
        <p className="text-xs text-slate-500">
          You must be logged in to view your submitted rescue reports and tracking ledger.
        </p>
        <button
          onClick={() => navigateTo('/login')}
          className="px-5 py-2.5 text-xs font-bold text-white bg-[#145C4A] rounded-xl"
        >
          Sign In
        </button>
      </div>
    );
  }

  const activeReports = myCases.filter((c) => c.status !== 'Closed');
  const closedReports = myCases.filter((c) => c.status === 'Closed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#145C4A] font-bold flex items-center justify-center text-lg">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-heading">
                {currentUser.fullName}
              </h1>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                Citizen Caregiver
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Email: {currentUser.email} · City: {currentUser.city || 'Not specified'}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigateTo('/report')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#E65353] hover:bg-[#d83f3f] rounded-xl shadow-xs transition-colors self-start md:self-auto"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Report New Emergency SOS</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">My Submitted Reports</span>
          <div className="text-2xl font-bold text-slate-900 tabular-nums font-heading mt-0.5">
            {myCases.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Active In-Progress Rescues</span>
          <div className="text-2xl font-bold text-[#E65353] tabular-nums font-heading mt-0.5">
            {activeReports.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Cases Successfully Closed</span>
          <div className="text-2xl font-bold text-[#20A67A] tabular-nums font-heading mt-0.5">
            {closedReports.length}
          </div>
        </div>
      </div>

      {/* My Reports List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              My Rescue Reports & Resolution Ledger
            </h3>
            <p className="text-xs text-slate-500">Live operational status of animals you reported</p>
          </div>
        </div>

        {myCases.length > 0 ? (
          <div className="space-y-3">
            {myCases.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.animalType}
                      className="w-16 h-16 rounded-lg object-cover border border-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs shrink-0">
                      No Photo
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#145C4A]">{item.caseId}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                          item.urgency === 'Critical'
                            ? 'bg-rose-50 text-[#E65353] border-rose-200'
                            : 'bg-emerald-50 text-[#145C4A] border-emerald-200'
                        }`}
                      >
                        {item.urgency}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                      {item.animalType} — {item.condition}
                    </h4>

                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.address}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Current Status</span>
                    <span className="text-xs font-bold text-[#145C4A]">{item.status}</span>
                  </div>

                  <button
                    onClick={() => navigateTo(`/track?id=${item.caseId}`)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#145C4A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <span>Track</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-700">No rescue reports yet.</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven&apos;t logged any emergency reports with this account. If you spot an animal in distress, submit
              an emergency report to mobilize responders.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
