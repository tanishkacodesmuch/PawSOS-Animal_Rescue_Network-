import React, { useState } from 'react';
import { useRescue } from '../context/RescueContext';
import {
  Heart,
  ShieldCheck,
  Building2,
  Truck,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Award,
  DollarSign,
  FileCheck,
} from 'lucide-react';

const SHELTER_PHOTO = '/src/assets/images/shelter_sanctuary_1793530757092.jpg';
const TEAM_PHOTO = '/src/assets/images/rescue_team_community_1793530758082.jpg';

export const SupportPage: React.FC = () => {
  const { addToast } = useRescue();
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [sponsorProgram, setSponsorProgram] = useState<string>('trauma');
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);

  const programs = [
    {
      id: 'zone',
      title: 'Sponsor an Urban Rescue Zone',
      desc: 'Fund 24/7 dedicated fuel, medical crates, and volunteer gear for a 5km suburban sector.',
      icon: <Building2 className="w-5 h-5 text-[#145C4A]" />,
      cost: '₹15,000 / month',
    },
    {
      id: 'transport',
      title: 'Support Animal Ambulance Fleet',
      desc: 'Sponsor hydraulic stretcher maintenance, sterile wraps, and GPS hardware across 12 mobile units.',
      icon: <Truck className="w-5 h-5 text-[#20A67A]" />,
      cost: '₹5,000 / unit',
    },
    {
      id: 'trauma',
      title: 'Fund Critical Veterinary Treatment',
      desc: 'Directly underwrite surgical trauma debridement, bone pinning, rabies vaccines, and post-op stays.',
      icon: <Stethoscope className="w-5 h-5 text-sky-600" />,
      cost: '₹1,500 / surgery',
    },
    {
      id: 'shelter',
      title: 'Support Sanctuary Recovery Beds',
      desc: 'Provide food, bedding, and wound care for recovering stray animals before community release.',
      icon: <Heart className="w-5 h-5 text-[#E65353]" />,
      cost: '₹2,500 / kennel',
    },
  ];

  const handleSimulateDonation = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDemoModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-900">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>Voluntary Impact & CSR Sponsorship</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172B26] font-heading">
          Support the Network That Saves Lives.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Every rupee powers field ambulance fuel, sterile surgical triage kits, and rehabilitation sanctuaries for
          street animals who have nobody else to turn to.
        </p>
      </div>

      {/* Main Donation Card & Program Selector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 4 Sponsorship Programs */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Choose Where Your Support Goes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {programs.map((prog) => {
              const isSelected = sponsorProgram === prog.id;
              return (
                <div
                  key={prog.id}
                  onClick={() => setSponsorProgram(prog.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-[#145C4A] ring-1 ring-[#145C4A] shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                      {prog.icon}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading mb-1">{prog.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{prog.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-xs font-bold text-[#145C4A]">
                    {prog.cost}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transparent Assurance */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-[#145C4A]">
              <ShieldCheck className="w-4 h-4 text-[#20A67A]" />
              <span>100% Directed Animal Relief</span>
            </div>
            <p className="text-[11px] text-emerald-900/80 leading-relaxed">
              All financial donations are governed under registered non-profit trusteeship. Tax exemption certificates
              under Section 80G are issued automatically upon receipt.
            </p>
          </div>
        </div>

        {/* Right: Donation Checkout Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-7 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-heading">Make a Contribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Voluntary tax-deductible charitable support</p>
          </div>

          <form onSubmit={handleSimulateDonation} className="space-y-4">
            {/* Preset Indian Rupee amounts */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Amount (INR)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((amt) => {
                  const isSelected = selectedAmount === amt;
                  return (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#145C4A] text-white border-[#145C4A] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5">
                <input
                  type="number"
                  placeholder="Or enter custom amount in ₹"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount('custom');
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#145C4A] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Donor Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Chandra"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email for 80G Receipt</label>
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-[#145C4A] outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 text-xs font-bold uppercase tracking-wider text-white bg-[#20A67A] hover:bg-[#1a8e68] rounded-xl shadow-sm transition-all active:scale-98"
            >
              Proceed to Support (Demo Flow)
            </button>
          </form>
        </div>
      </div>

      {/* CSR Corporate Partnerships Section */}
      <div className="bg-[#145C4A] rounded-3xl text-white p-8 sm:p-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-emerald-700/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-emerald-200 mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>ESG & Schedule VII Compliance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading">
              Corporate CSR Animal Welfare Partnerships
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
              Enable your enterprise to meet mandatory CSR mandates by underwriting regional animal rescue fleets,
              canine sterilization drives, and veterinary trauma infrastructure.
            </p>
          </div>

          <button
            onClick={() => {
              addToast({
                type: 'info',
                title: 'CSR Proposal Kit Requested',
                description: 'Our corporate partnerships liaison will share the 2026 audit impact brochure.',
              });
            }}
            className="px-6 py-3 text-xs font-bold text-[#145C4A] bg-white hover:bg-emerald-50 rounded-xl transition-colors shadow-sm whitespace-nowrap shrink-0 self-start md:self-auto"
          >
            Download CSR Dossier
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-emerald-100/90">
          <div className="p-4 rounded-xl bg-emerald-900/50 border border-emerald-700/50">
            <h4 className="font-bold text-white mb-1">Direct GPS Telemetry Audit</h4>
            <p className="leading-relaxed">
              Real-time audit dashboard showing exact rescue coordinates, clinical treatment vouchers, and verified case closure stamps.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-900/50 border border-emerald-700/50">
            <h4 className="font-bold text-white mb-1">Fleet Branding & Recognition</h4>
            <p className="leading-relaxed">
              Co-branded rapid response ambulances and recognition across participating animal shelters and municipal boards.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-900/50 border border-emerald-700/50">
            <h4 className="font-bold text-white mb-1">Tax Exemption & Formal Audit</h4>
            <p className="leading-relaxed">
              Full statutory reporting under MCA CSR regulations with chartered accountant certified expense allocation statements.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Donation Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#20A67A] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 font-heading">
              Demonstration Donation Flow
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Thank you, <strong>{donorName || 'Generous Donor'}</strong>. You selected an illustrative pledge of{' '}
              <strong>₹{selectedAmount === 'custom' ? customAmount || '0' : selectedAmount}</strong> toward{' '}
              <strong>
                {programs.find((p) => p.id === sponsorProgram)?.title || 'Critical Animal Relief'}
              </strong>
              .
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> This is a prototype demonstration. Real payment gateway integrations (Razorpay, UPI)
                will be connected in production. No real money has been charged.
              </span>
            </div>

            <button
              onClick={() => setShowDemoModal(false)}
              className="w-full py-2.5 text-xs font-bold text-white bg-[#145C4A] hover:bg-[#0e4336] rounded-xl transition-colors shadow-xs"
            >
              Close Demonstration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
