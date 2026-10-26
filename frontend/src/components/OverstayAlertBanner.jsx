import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const OverstayAlertBanner = ({ overstays = [], onAction }) => {
  if (!overstays || overstays.length === 0) return null;

  return (
    <div className="mb-6 rounded-md bg-status-redBg border border-status-redBorder p-3.5 animate-pulse-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded bg-status-red/20 text-status-red shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xs uppercase tracking-wider text-status-red font-bold px-1.5 py-0.5 bg-status-red/15 rounded border border-status-red/30">
                CRITICAL INCIDENT
              </span>
              <h4 className="text-xs font-semibold text-zinc-100 tracking-tight">
                {overstays.length} Active Visitor(s) Exceeded Permitted Window
              </h4>
            </div>
            <p className="text-2xs text-zinc-400 mt-1">
              Hostel visiting cutoff (19:00) or scheduled exit window breached. Immediate warden and gate security verification required.
            </p>
          </div>
        </div>

        {onAction && (
          <button
            onClick={onAction}
            className="self-end sm:self-center shrink-0 px-3 py-1.5 rounded-md bg-status-red hover:bg-red-600 text-white text-xs font-medium font-mono inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Review Overstays</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
