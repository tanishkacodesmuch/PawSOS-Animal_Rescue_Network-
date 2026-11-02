import React, { useState, useEffect } from 'react';
import { useRescue } from '../context/RescueContext';
import { OrganizationProfile } from '../types/rescue';
import { api } from '../services/api';
import {
  Search,
  ShieldCheck,
  MapPin,
  Building2,
  Stethoscope,
  Truck,
  HeartHandshake,
  CheckCircle2,
  X,
  FileText,
  Loader2,
} from 'lucide-react';

export const RescueNetworkPage: React.FC = () => {
  const { navigateTo, addToast } = useRescue();
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [organizations, setOrganizations] = useState<OrganizationProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);

  // Application form state
  const [appName, setAppName] = useState('');
  const [appCategory, setAppCategory] = useState<'Rescuer' | 'Veterinary Clinic' | 'NGO & Shelter' | 'Transport Partner'>('Rescuer');
  const [appArea, setAppArea] = useState('');
  const [appAddress, setAppAddress] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appEmail, setAppEmail] = useState('');

  const categories = ['All', 'Rescuer', 'Veterinary Clinic', 'NGO & Shelter', 'Transport Partner'];

  useEffect(() => {
    const fetchOrgs = async () => {
      setLoading(true);
      try {
        const data = await api.getOrganizations();
        setOrganizations(data);
      } catch {
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const filteredOrgs = organizations.filter((p) => {
    if (selectedCategory !== 'All' && p.organizationType !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.organizationName.toLowerCase().includes(q) ||
        p.serviceArea.toLowerCase().includes(q) ||
        p.organizationType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApplicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplyModalOpen(false);
    addToast({
      type: 'success',
      title: 'Partner Application Received',
      description: `Thank you, ${appName}. Our onboarding administrator will review your statutory credentials.`,
    });
    setAppName('');
    setAppArea('');
    setAppAddress('');
    setAppPhone('');
    setAppEmail('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-[#145C4A] mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#20A67A]" />
            <span>Verified Response Coalition</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B26] font-heading">
            Verified Rescue Network Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Explore verified rescue squads, veterinary trauma centers, and animal shelters registered in the network database.
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="px-5 py-3 text-xs font-bold text-white bg-[#145C4A] hover:bg-[#0e4336] rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
        >
          + Become a Verified Rescue Partner
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by organization name or sector..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#145C4A] outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-[#145C4A] text-white shadow-2xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#145C4A] mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading verified organizations from database...</p>
        </div>
      ) : filteredOrgs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrgs.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#20A67A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {org.organizationType}
                  </span>
                  {org.verificationStatus === 'verified' && (
                    <span className="text-[10px] font-semibold text-[#145C4A] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#20A67A]" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 font-heading mt-2">
                  {org.organizationName}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{org.serviceArea}</span>
                </p>

                {org.address && (
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {org.address}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{org.contactPhone || 'Contact on file'}</span>
                <button
                  onClick={() => navigateTo('/report')}
                  className="font-semibold text-[#145C4A] hover:underline"
                >
                  Dispatch SOS &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto space-y-3">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No verified rescue partners available.</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            New rescue organizations undergo credential audits before public listing. If you represent an NGO,
            clinic, or rescue squad, apply below.
          </p>
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="mt-2 px-4 py-2 text-xs font-bold text-white bg-[#145C4A] rounded-xl"
          >
            Submit Partner Credentials
          </button>
        </div>
      )}

      {/* Partner Application Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-[#20A67A] uppercase tracking-wider block">
                Network Accreditation
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                Apply to Become a Verified Partner
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Join the emergency animal triage and rescue coordination network.
              </p>
            </div>

            <form onSubmit={handleApplicationSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Organization / Shelter / Clinic Name *</label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. City Animal Rescue Trust"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Partner Category *</label>
                  <select
                    value={appCategory}
                    onChange={(e: any) => setAppCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none bg-white"
                  >
                    <option value="Rescuer">Field Rescuer Squad</option>
                    <option value="Veterinary Clinic">Veterinary Hospital</option>
                    <option value="NGO & Shelter">Animal Sanctuary / Shelter</option>
                    <option value="Transport Partner">Animal Ambulance Fleet</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Area / City *</label>
                  <input
                    type="text"
                    required
                    value={appArea}
                    onChange={(e) => setAppArea(e.target.value)}
                    placeholder="e.g. Western Zone"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Physical Address *</label>
                <input
                  type="text"
                  required
                  value={appAddress}
                  onChange={(e) => setAppAddress(e.target.value)}
                  placeholder="Full street address of clinic or shelter"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Phone *</label>
                  <input
                    type="tel"
                    required
                    value={appPhone}
                    onChange={(e) => setAppPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={appEmail}
                    onChange={(e) => setAppEmail(e.target.value)}
                    placeholder="contact@org.org"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                All applications are audited before dispatch permissions are activated.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#145C4A] hover:bg-[#0e4336] rounded-xl shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
