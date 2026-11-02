import React from 'react';
import { useRescue } from '../../context/RescueContext';
import { CheckCircle2, AlertCircle, Info, Siren, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useRescue();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icon =
          toast.type === 'emergency' ? (
            <Siren className="w-5 h-5 text-[#E65353] shrink-0 animate-bounce" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#20A67A] shrink-0" />
          ) : toast.type === 'warning' ? (
            <AlertCircle className="w-5 h-5 text-[#F2B84B] shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-sky-500 shrink-0" />
          );

        const borderClass =
          toast.type === 'emergency'
            ? 'border-[#E65353]/30 bg-rose-50/95'
            : toast.type === 'success'
            ? 'border-[#20A67A]/30 bg-emerald-50/95'
            : toast.type === 'warning'
            ? 'border-[#F2B84B]/30 bg-amber-50/95'
            : 'border-slate-200 bg-white/95';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl shadow-lg border backdrop-blur-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${borderClass}`}
          >
            <div className="flex items-start gap-3">
              {icon}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-slate-900 leading-tight">{toast.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.description}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
