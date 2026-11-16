import React from 'react';

const CONFIGS = {
  APPROVED: {
    dot: 'bg-green-600',
    text: 'text-green-800',
    bg: 'bg-green-50',
    border: 'border-green-300',
    label: 'APPROVED',
  },
  ACTIVE: {
    dot: 'bg-green-600 animate-led-blink',
    text: 'text-green-800',
    bg: 'bg-green-50',
    border: 'border-green-300',
    label: 'ACTIVE',
  },
  PENDING: {
    dot: 'bg-amber-500 animate-pulse-subtle',
    text: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    label: 'PENDING',
  },
  REJECTED: {
    dot: 'bg-red-600',
    text: 'text-red-800',
    bg: 'bg-red-50',
    border: 'border-red-300',
    label: 'REJECTED',
  },
  EXPIRED: {
    dot: 'bg-slate-500',
    text: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    label: 'EXPIRED',
  },
  CANCELLED: {
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    label: 'CANCELLED',
  },
  BLOCKED: {
    dot: 'bg-red-700',
    text: 'text-red-900',
    bg: 'bg-red-100',
    border: 'border-red-400',
    label: 'BLOCKED',
  },
  INACTIVE: {
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    label: 'INACTIVE',
  },
  OVERSTAY: {
    dot: 'bg-red-600 animate-pulse-subtle',
    text: 'text-red-800',
    bg: 'bg-red-100',
    border: 'border-red-400',
    label: 'OVERSTAY',
  },
  OVERDUE: {
    dot: 'bg-red-600 animate-pulse-subtle',
    text: 'text-red-800',
    bg: 'bg-red-100',
    border: 'border-red-400',
    label: 'OVERDUE',
  },
  CONSUMED: {
    dot: 'bg-slate-500',
    text: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    label: 'CONSUMED',
  },
  CLEARED: {
    dot: 'bg-green-600',
    text: 'text-green-800',
    bg: 'bg-green-50',
    border: 'border-green-300',
    label: 'CLEARED',
  },
  DENIED: {
    dot: 'bg-red-600',
    text: 'text-red-800',
    bg: 'bg-red-50',
    border: 'border-red-300',
    label: 'DENIED',
  },
};

export const StatusBadge = ({ status, className = '' }) => {
  const key = (status || '').toUpperCase();
  const config = CONFIGS[key] || {
    dot: 'bg-slate-400',
    text: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: key || '—',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-2xs font-mono font-semibold tracking-wider border shadow-sm ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  );
};
