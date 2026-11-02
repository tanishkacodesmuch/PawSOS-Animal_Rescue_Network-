import React, { useState } from 'react';
import { useRescue } from '../../context/RescueContext';
import { RescueMap } from '../../components/common/RescueMap';
import { RescueCase } from '../../types/rescue';
import {
  Building2,
  Bed,
  Truck,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  MapPin,
  ExternalLink,
  FileText,
} from 'lucide-react';

export const ShelterDashboard: React.FC = () => {
  const { cases, currentUser, navigateTo } = useRescue();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Shelter Capacity state
  const [totalCapacity, setTotalCapacity] = useState<number>(30);
  const [occupiedBeds, setOccupiedBeds] = useState<number>(() => {
    return cases.filter((c) => c.status === 'Treated').length;
  });

  const filteredCases = cases.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        c.caseId.toLowerCase().includes(q) ||
        c.animalType.toLowerCase().includes(q) ||
        c.condition.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterUrgency !== 'all' && c.urgency !== filterUrgency) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = cases.filter((c) => c.status === 'Reported').length;
  const activeCount = cases.filter((c) => c.status !== 'Closed' && c.status !== 'Reported').length;
  const closedCount = cases.filter((c) => c.status === 'Closed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-[#145C4A] font-bold flex items-center justify-center text-lg shadow-2xs">
            <Building2 className="w-6 h-6 text-[#145C4A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-heading">
                {currentUser?.organizationName || 'Animal Welfare Shelter'}
              </h1>
              <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase">
                {currentUser?.role || 'NGO Partner'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manager: {currentUser?.fullName || 'Shelter Officer'} · Service Area: {currentUser?.city || 'Regional Sector'}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigateTo('/report')}
          className="px-4 py-2.5 text-xs font-bold text-white bg-[#145C4A] hover:bg-[#0e4336] rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Intake New Animal</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Total Database Records</span>
          <div className="text-2xl font-bold text-slate-900 tabular-nums font-heading mt-0.5">{cases.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Pending Triage</span>
          <div className="text-2xl font-bold text-[#E65353] tabular-nums font-heading mt-0.5">{pendingCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Active In Flight</span>
          <div className="text-2xl font-bold text-[#F2B84B] tabular-nums font-heading mt-0.5">{activeCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Successfully Rehabilitated</span>
          <div className="text-2xl font-bold text-[#20A67A] tabular-nums font-heading mt-0.5">{closedCount}</div>
        </div>
      </div>

      {/* Case Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Shelter Incident & Case Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Real database records of animals requiring foster or shelter care</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
              />
            </div>

            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-700 outline-none"
            >
              <option value="all">All Urgencies</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-700 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="On the Way">On the Way</option>
              <option value="Rescued">Rescued</option>
              <option value="Treated">Treated</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredCases.length > 0 ? (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#F8FAF7] text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Animal</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Assigned Rescuer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#145C4A] whitespace-nowrap">
                      {item.caseId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {item.animalType}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      {item.condition}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      {item.address}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          item.urgency === 'Critical'
                            ? 'bg-rose-50 text-[#E65353] border-rose-200'
                            : item.urgency === 'High'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-[#145C4A] border-emerald-200'
                        }`}
                      >
                        {item.urgency}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.assignedRescuer ? item.assignedRescuer.name : <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {item.status}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => navigateTo(`/track?id=${item.caseId}`)}
                        className="text-[#145C4A] hover:text-[#20A67A] font-semibold text-xs inline-flex items-center gap-1"
                      >
                        <span>Track</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <FileText className="w-6 h-6 mx-auto text-slate-300" />
              <p>No rescue records available in this query.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sector Map */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Incident Map Geolocation
        </h3>
        <RescueMap cases={filteredCases} zoom={12} height="340px" />
      </div>
    </div>
  );
};
