import React from 'react';

const CONFIGS = {
  APPROVED: {
    dot: 'bg-status-green',
    text: 'text-status-green',
    bg: 'bg-status-greenBg',
    border: 'border-status-greenBorder',
    label: 'APPROVED',
  },
  ACTIVE: {
    dot: 'bg-status-green animate-led-blink',
    text: 'text-status-green',
    bg: 'bg-status-greenBg',
    border: 'border-status-greenBorder',
    label: 'ACTIVE',
  },
  PENDING: {
    dot: 'bg-status-amber animate-pulse-subtle',
    text: 'text-status-amber',
    bg: 'bg-status-amberBg',
    border: 'border-status-amberBorder',
    label: 'PENDING',
  },
  REJECTED: {
    dot: 'bg-status-red',
    text: 'text-status-red',
    bg: 'bg-status-redBg',
    border: 'border-status-redBorder',
    label: 'REJECTED',
  },
  EXPIRED: {
    dot: 'bg-status-gray',
    text: 'text-status-gray',
    bg: 'bg-status-grayBg',
    border: 'border-status-grayBorder',
    label: 'EXPIRED',
  },
  CANCELLED: {
    dot: 'bg-zinc-600',
    text: 'text-zinc-500',
    bg: 'bg-zinc-900',
    border: 'border-zinc-800',
    label: 'CANCELLED',
  },
  BLOCKED: {
    dot: 'bg-status-red',
    text: 'text-status-red',
    bg: 'bg-status-redBg',
    border: 'border-status-redBorder',
    label: 'BLOCKED',
  },
  INACTIVE: {
    dot: 'bg-zinc-600',
    text: 'text-zinc-500',
    bg: 'bg-zinc-900',
    border: 'border-zinc-800',
    label: 'INACTIVE',
  },
  OVERSTAY: {
    dot: 'bg-status-red animate-pulse-subtle',
    text: 'text-status-red',
    bg: 'bg-status-redBg',
    border: 'border-status-redBorder',
    label: 'OVERSTAY',
  },
  OVERDUE: {
    dot: 'bg-status-red animate-pulse-subtle',
    text: 'text-status-red',
    bg: 'bg-status-redBg',
    border: 'border-status-redBorder',
    label: 'OVERDUE',
  },
  CONSUMED: {
    dot: 'bg-zinc-600',
    text: 'text-zinc-400',
    bg: 'bg-zinc-900',
    border: 'border-zinc-700',
    label: 'CONSUMED',
  },
  CLEARED: {
    dot: 'bg-status-green',
    text: 'text-status-green',
    bg: 'bg-status-greenBg',
    border: 'border-status-greenBorder',
    label: 'CLEARED',
  },
  DENIED: {
    dot: 'bg-status-red',
    text: 'text-status-red',
    bg: 'bg-status-redBg',
    border: 'border-status-redBorder',
    label: 'DENIED',
  },
};

export const StatusBadge = ({ status, className = '' }) => {
  const key = (status || '').toUpperCase();
  const config = CONFIGS[key] || {
    dot: 'bg-zinc-500',
    text: 'text-zinc-300',
    bg: 'bg-zinc-900',
    border: 'border-zinc-700',
    label: key || '—',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-2xs font-mono font-semibold tracking-wider border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      {config.label}
    </span>
  );
};
