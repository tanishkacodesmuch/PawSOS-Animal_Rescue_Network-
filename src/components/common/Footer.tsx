import React from 'react';
import { useRescue } from '../../context/RescueContext';
import { ShieldCheck, Heart, AlertCircle, PhoneCall, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo } = useRescue();

  return (
    <footer className="bg-[#103E33] text-white pt-14 pb-12 border-t border-emerald-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-emerald-800/40">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#20A67A] flex items-center justify-center text-white shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                    fill="currentColor"
                    fillOpacity="0.25"
                  />
                  <circle cx="12" cy="8" r="2.2" fill="white" stroke="none" />
                  <circle cx="9.2" cy="11.5" r="1.3" fill="white" stroke="none" />
                  <circle cx="14.8" cy="11.5" r="1.3" fill="white" stroke="none" />
                  <circle cx="8" cy="8.5" r="1.1" fill="white" stroke="none" />
                  <circle cx="16" cy="8.5" r="1.1" fill="white" stroke="none" />
                </svg>
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white uppercase font-heading block">
                  Animal Emergency
                </span>
                <span className="text-xs font-semibold text-[#20A67A] tracking-wider uppercase block">
                  & Rescue Network
                </span>
              </div>
            </div>

            <p className="text-xs text-emerald-100/80 leading-relaxed max-w-sm">
              A centralized digital emergency response platform bridging the critical gap between compassionate citizens,
              verified street animal rescuers, veterinary trauma centers, and sanctuary shelters.
            </p>

            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60 max-w-sm">
              <div className="text-[11px] font-semibold text-[#F2B84B] flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Demonstration Notice</span>
              </div>
              <p className="text-[11px] text-emerald-200/70 leading-normal">
                This platform is a functional prototype designed for emergency response workflow simulation. Sample data
                is simulated for evaluation.
              </p>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-emerald-100/70">
              <li>
                <button onClick={() => navigateTo('/report')} className="hover:text-white transition-colors">
                  Report Emergency SOS
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/track')} className="hover:text-white transition-colors">
                  Live Rescue Tracking
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/network')} className="hover:text-white transition-colors">
                  Rescue Partner Directory
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/impact')} className="hover:text-white transition-colors">
                  Impact & Transparency
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/support')} className="hover:text-white transition-colors">
                  Donations & CSR Grants
                </button>
              </li>
            </ul>
          </div>

          {/* Stakeholder Dashboards */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Stakeholder Portals</h4>
            <ul className="space-y-2 text-xs text-emerald-100/70">
              <li>
                <button onClick={() => navigateTo('/responder/dashboard')} className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Field Responders</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/vet/dashboard')} className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Veterinary Clinics</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/partner/dashboard')} className="hover:text-white transition-colors flex items-center gap-1">
                  <span>NGOs & Sanctuaries</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/admin/dashboard')} className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Command Center Triage</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/login')} className="hover:text-white transition-colors">
                  Portal Login & Auth
                </button>
              </li>
            </ul>
          </div>

          {/* Emergency Protocols */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Rescue Protocol</h4>
            <ul className="space-y-2 text-xs text-emerald-100/70">
              <li>1. Keep safe distance from frightened animal</li>
              <li>2. Note exact landmark and nearest crossroad</li>
              <li>3. Take clear photo without flash in eyes</li>
              <li>4. Stay nearby if safe until responder verifies</li>
            </ul>
            <div className="mt-4 pt-3 border-t border-emerald-800/40 text-[11px] text-emerald-300">
              24/7 Helpline: <strong>1800-AERN-CARE</strong>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-200/60">
          <div>
            <p className="font-heading font-medium text-white/90">
              One Report. One Response. One Animal Closer to Care.
            </p>
            <p className="mt-0.5 text-[11px]">
              &copy; {new Date().getFullYear()} Animal Emergency & Rescue Network. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => navigateTo('/network')} className="hover:text-white transition-colors">
              Terms of Response
            </button>
            <span>·</span>
            <button onClick={() => navigateTo('/network')} className="hover:text-white transition-colors">
              Privacy Notice
            </button>
            <span>·</span>
            <button onClick={() => navigateTo('/support')} className="hover:text-white transition-colors">
              CSR Sponsorship
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
