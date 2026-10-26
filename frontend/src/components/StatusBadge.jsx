import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

export const StatusBadge = ({ status, className = '' }) => {
  const s = (status || '').toUpperCase();

  switch (s) {
    case 'APPROVED':
    case 'ACTIVE':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 ${className}`}>
          <CheckCircle className="w-3 h-3" />
          {s}
        </span>
      );

    case 'PENDING':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/80 ${className}`}>
          <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
          PENDING
        </span>
      );

    case 'REJECTED':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/80 ${className}`}>
          <XCircle className="w-3 h-3" />
          REJECTED
        </span>
      );

    case 'EXPIRED':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 ${className}`}>
          <Clock className="w-3 h-3" />
          EXPIRED
        </span>
      );

    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-700 ${className}`}>
          CANCELLED
        </span>
      );

    case 'BLOCKED':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/90 text-red-300 border border-red-700 ${className}`}>
          <ShieldAlert className="w-3 h-3" />
          BLOCKED
        </span>
      );

    case 'INACTIVE':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 ${className}`}>
          INACTIVE
        </span>
      );

    case 'OVERSTAY':
    case 'OVERDUE':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white border border-red-500 shadow-sm shadow-red-900 animate-pulse-subtle ${className}`}>
          <AlertTriangle className="w-3 h-3" />
          OVERSTAY
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 ${className}`}>
          {s}
        </span>
      );
  }
};
