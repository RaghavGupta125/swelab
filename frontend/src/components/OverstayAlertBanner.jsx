import React from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';

export const OverstayAlertBanner = ({ overstays = [], onAction }) => {
  if (!overstays || overstays.length === 0) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-700/80 shadow-lg shadow-red-950/40 animate-pulse-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-600 text-white shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-red-200 text-sm tracking-wide">
                OVERSTAY DETECTED: {overstays.length} Visitor(s) Past Permitted Window
              </h4>
              <span className="bg-red-800 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                CRITICAL
              </span>
            </div>
            <p className="text-xs text-red-300/90 mt-1">
              Active visitors have exceeded their expected exit time or 19:00 hostel cutoff. Gate security and warden discipline alerted.
            </p>
          </div>
        </div>

        {onAction && (
          <button
            onClick={onAction}
            className="self-end sm:self-center px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
          >
            <span>Review Overstays</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
