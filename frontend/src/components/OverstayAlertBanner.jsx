import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const OverstayAlertBanner = ({ overstays = [], onAction }) => {
  if (!overstays || overstays.length === 0) return null;

  return (
    <div className="mb-6 rounded bg-red-50 border border-red-300 p-3.5 shadow-sm animate-pulse-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded bg-red-100 text-red-600 shrink-0 mt-0.5 border border-red-200">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xs uppercase tracking-wider text-red-700 font-bold px-1.5 py-0.5 bg-red-100 rounded border border-red-300">
                CRITICAL DISCIPLINARY INCIDENT
              </span>
              <h4 className="text-xs font-bold text-red-900 tracking-tight">
                {overstays.length} Active Visitor(s) Exceeded Permitted Window
              </h4>
            </div>
            <p className="text-2xs text-red-700 mt-1">
              Hostel visiting cutoff (19:00 IST) or scheduled exit window breached (`BR-010`). Immediate warden review and guard verification required.
            </p>
          </div>
        </div>

        {onAction && (
          <button
            onClick={onAction}
            className="self-end sm:self-center shrink-0 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Review Overstays</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
