import React, { useState } from 'react';
import { useRescue } from '../context/RescueContext';
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  HeartHandshake,
  Stethoscope,
  Building2,
  Users,
  Compass,
  CheckCircle2,
  Activity,
  Award,
} from 'lucide-react';

import heroImage from '../assets/images/hero_animal_rescue_1793530756080.jpg';

const HERO_PHOTO = heroImage;

export const LandingPage: React.FC = () => {
  const { navigateTo, cases, analytics } = useRescue();
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  const latestCase = cases.length > 0 ? cases[0] : null;

  const workflowSteps = [
    {
      num: '01',
      title: 'Report',
      subtitle: 'Citizen SOS Submission',
      desc: 'Citizen captures a real photo, specifies species and injury severity, and drops a precise GPS pin.',
      action: 'Try Reporting Flow',
      route: '/report',
      icon: <AlertTriangle className="w-5 h-5 text-[#E65353]" />,
    },
    {
      num: '02',
      title: 'Verify',
      subtitle: 'Central Triage Verification',
      desc: 'Central dispatch verifies authenticity, checks duplicate submissions in the sector, and classifies urgency.',
      action: 'Inspect Admin Queue',
      route: '/admin/dashboard',
      icon: <ShieldCheck className="w-5 h-5 text-[#20A67A]" />,
    },
    {
      num: '03',
      title: 'Dispatch',
      subtitle: 'Geospatial Rescuer Routing',
      desc: 'System identifies verified field rescuers in the sector with route navigation and animal condition notes.',
      action: 'View Rescuer Inbox',
      route: '/responder/dashboard',
      icon: <Compass className="w-5 h-5 text-[#145C4A]" />,
    },
    {
      num: '04',
      title: 'Rescue',
      subtitle: 'Humane Capture & Stabilization',
      desc: 'Trained responder reaches site, applies field stabilization, and safely secures the animal in a transport unit.',
      action: 'Track Rescue Status',
      route: '/track',
      icon: <HeartHandshake className="w-5 h-5 text-[#F2B84B]" />,
    },
    {
      num: '05',
      title: 'Treat',
      subtitle: 'Veterinary Trauma Intake',
      desc: 'Direct handoff to partner veterinary clinics for diagnostic X-rays, emergency wound debridement, or surgery.',
      action: 'Open Vet Treatment Log',
      route: '/vet/dashboard',
      icon: <Stethoscope className="w-5 h-5 text-sky-600" />,
    },
    {
      num: '06',
      title: 'Track',
      subtitle: 'End-to-End Transparency',
      desc: 'The reporting citizen, donor, and NGO team follow recovery milestones through medical discharge and foster release.',
      action: 'Track Live Status',
      route: '/track',
      icon: <Activity className="w-5 h-5 text-[#20A67A]" />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-200/60 bg-gradient-to-b from-[#F8FAF7] via-emerald-50/20 to-[#F8FAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/70 border border-emerald-200/80 rounded-full text-xs font-semibold text-[#145C4A]">
                <span className="w-2 h-2 rounded-full bg-[#20A67A]" />
                <span>Unified Animal Emergency Response Grid</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#172B26] font-heading leading-[1.15]">
                Every Second Matters. <br />
                <span className="text-[#145C4A]">Every Animal Deserves Care.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-xl">
                When a street animal is hurt or sick, finding the right rescuer shouldn&apos;t be another emergency.
                Report street animals in distress and connect instantly with verified rescuers, trauma clinics, and animal
                sanctuaries.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => navigateTo('/report')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold text-white bg-[#E65353] hover:bg-[#d44343] rounded-xl shadow-md hover:shadow-lg transition-all active:scale-98"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>REPORT AN EMERGENCY</span>
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('how-it-works');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-[#145C4A] bg-white hover:bg-emerald-50 border border-emerald-200/80 rounded-xl transition-colors shadow-2xs"
                >
                  <span>HOW IT WORKS</span>
                  <ArrowRight className="w-4 h-4 text-[#20A67A]" />
                </button>
              </div>

              <div className="pt-2 flex items-center gap-3 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-[#20A67A] shrink-0" />
                <span>Emergency reporting is always free · 24/7 volunteer triage dispatch</span>
              </div>
            </div>

            {/* Right Visual Column */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative overflow-hidden rounded-2xl shadow-xl border border-slate-200/80 bg-slate-100 aspect-[4/3] lg:aspect-[16/11]">
                  <img
                    src={HERO_PHOTO}
                    alt="Animal rescuer comforting an injured street dog on city sidewalk"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating Emergency Case Card - Connected to Database */}
                <div className="absolute -bottom-6 sm:-bottom-8 -left-2 sm:-left-6 right-2 sm:right-6 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-slate-200/90">
                  {latestCase ? (
                    <>
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#145C4A] font-mono">Case #{latestCase.caseId}</span>
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/70">
                            {latestCase.urgency}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Live Database Record</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-500 block">Animal & Condition</span>
                          <span className="font-semibold text-slate-900 block truncate">
                            {latestCase.animalType} · {latestCase.condition}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 block">Current Status</span>
                          <span className="font-semibold text-[#20A67A] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#20A67A]" />
                            <span>{latestCase.status}</span>
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{latestCase.address}</span>
                        </span>
                        <button
                          onClick={() => navigateTo(`/track?id=${latestCase.caseId}`)}
                          className="text-[11px] font-semibold text-[#145C4A] hover:text-[#20A67A] transition-colors"
                        >
                          Track Live &rarr;
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-2 text-center space-y-1">
                      <div className="text-xs font-bold text-[#145C4A]">Network Ready for Emergency Dispatches</div>
                      <p className="text-[11px] text-slate-500">
                        No active reports in queue. Tap Report Emergency above to file an SOS.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REAL IMPACT STATISTICS SECTION */}
      <section className="pt-16 pb-12 bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-[#172B26] font-heading">
              Platform Activity & Transparency
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Real metrics calculated dynamically from database records.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-[#F8FAF7] border border-slate-200/80">
              <div className="text-3xl font-extrabold text-[#145C4A] font-heading tabular-nums">
                {analytics?.totalReports ?? cases.length}
              </div>
              <div className="text-xs font-semibold text-slate-900 mt-1">Emergency Reports Logged</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Stored in PostgreSQL</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAF7] border border-slate-200/80">
              <div className="text-3xl font-extrabold text-[#145C4A] font-heading tabular-nums">
                {analytics?.verifiedRescuers ?? 0}
              </div>
              <div className="text-xs font-semibold text-slate-900 mt-1">Verified Field Responders</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Admin authenticated profiles</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAF7] border border-slate-200/80">
              <div className="text-3xl font-extrabold text-[#145C4A] font-heading tabular-nums">
                {analytics?.partnerClinics ?? 0}
              </div>
              <div className="text-xs font-semibold text-slate-900 mt-1">Partner Veterinary Centers</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Triage network beds</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAF7] border border-slate-200/80">
              <div className="text-3xl font-extrabold text-[#20A67A] font-heading tabular-nums">
                {analytics?.completedCases ?? cases.filter((c) => c.status === 'Closed').length}
              </div>
              <div className="text-xs font-semibold text-slate-900 mt-1">Cases Successfully Closed</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Complete recovery outcomes</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS: 6-STEP WORKFLOW */}
      <section id="how-it-works" className="py-16 lg:py-20 bg-[#F8FAF7] border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#20A67A] block mb-1">
              Standard Operating Procedure
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172B26] font-heading">
              The Six-Stage Rescue Lifecycle
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              From citizen distress intake to veterinary release, every step is coordinated through a structured digital
              chain of custody.
            </p>
          </div>

          {/* Interactive Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step, idx) => (
              <div
                key={step.num}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`p-6 rounded-2xl transition-all cursor-pointer border ${
                  activeWorkflowStep === idx
                    ? 'bg-white shadow-md border-[#20A67A] ring-1 ring-[#20A67A]/30'
                    : 'bg-white/70 hover:bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold tracking-widest text-[#145C4A] font-heading">{step.num}</span>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">{step.icon}</div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 font-heading mb-1">{step.title}</h3>
                <div className="text-xs font-semibold text-[#20A67A] mb-2">{step.subtitle}</div>
                <p className="text-xs text-slate-600 leading-relaxed mb-5">{step.desc}</p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo(step.route);
                  }}
                  className="text-xs font-semibold text-[#145C4A] hover:text-[#20A67A] inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>{step.action}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON SECTION */}
      <section className="py-16 bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E65353] block mb-1">
              Transforming Animal Welfare
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172B26] font-heading">
              Why Centralized Coordination Is Critical
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Fragmented rescue efforts cost innocent lives. Here is how our network solves the five fundamental failure points.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="p-6 sm:p-8 rounded-2xl bg-rose-50/50 border border-rose-200/70">
              <div className="flex items-center gap-2 text-rose-800 font-bold font-heading mb-6 text-lg">
                <AlertTriangle className="w-5 h-5 text-[#E65353]" />
                <span>Current Fragmented Reality</span>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-rose-950/80">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-200/60 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                  <div><strong>Scattered Phone Trees:</strong> Citizens frantically call 6 different helplines while animals bleed out on road medians.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-200/60 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                  <div><strong>Vague Landmark Guidance:</strong> Descriptions like &quot;near the tea stall behind the bank&quot; waste precious response minutes.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-200/60 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</span>
                  <div><strong>Zero Status Visibility:</strong> Citizens never find out whether the animal was picked up, treated, or succumbed to shock.</div>
                </li>
              </ul>
            </div>

            <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
              <div className="flex items-center gap-2 text-[#145C4A] font-bold font-heading mb-6 text-lg">
                <ShieldCheck className="w-5 h-5 text-[#20A67A]" />
                <span>The PawSOS Network</span>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-emerald-950/80">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-200/70 text-[#145C4A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <div><strong>Single Digital SOS Intake:</strong> Structured reporting with photo upload and triage priority in under 60 seconds.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-200/70 text-[#145C4A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <div><strong>Sub-Meter GPS Pinning:</strong> Interactive maps guide responders directly to the exact alley or median strip.</div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-200/70 text-[#145C4A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <div><strong>Live Case Tracking:</strong> Transparent 6-stage lifecycle gives citizens and clinics complete medical transparency.</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 bg-[#145C4A] text-white">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-emerald-200">
            <span>One Network · Infinite Compassion</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
            Be the Reason an Animal Gets Help Today.
          </h2>

          <p className="text-base text-emerald-100/90 max-w-xl mx-auto leading-relaxed">
            Report a distress case in your neighborhood, register as a verified responder, or support veterinary care.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <button
              onClick={() => navigateTo('/report')}
              className="px-6 py-3.5 text-sm font-bold text-white bg-[#E65353] hover:bg-[#d64545] rounded-xl shadow-lg transition-transform active:scale-98"
            >
              Report an Emergency
            </button>
            <button
              onClick={() => navigateTo('/register')}
              className="px-6 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors"
            >
              Register as Partner
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
