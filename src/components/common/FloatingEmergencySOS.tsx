import React from 'react';
import { useRescue } from '../../context/RescueContext';
import { AlertTriangle, Siren } from 'lucide-react';

export const FloatingEmergencySOS: React.FC = () => {
  const { currentRoute, navigateTo } = useRescue();

  // Hide on reporting page to avoid duplicate CTA
  if (currentRoute === '/report') return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-4 z-40">
      <button
        onClick={() => navigateTo('/report')}
        aria-label="Report Injured Animal Emergency SOS"
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#E65353] hover:bg-[#d64343] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 border-2 border-white/60"
      >
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <Siren className="w-4 h-4 animate-bounce" />
        <span className="text-xs font-extrabold uppercase tracking-wider font-heading pr-1">
          Report SOS
        </span>
      </button>
    </div>
  );
};
