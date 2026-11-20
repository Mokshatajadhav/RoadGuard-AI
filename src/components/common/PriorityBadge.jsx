import React from 'react';
import { AlertOctagon, AlertTriangle, Info, ShieldCheck } from 'lucide-react';

export default function PriorityBadge({ priority, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-bold px-3 py-1.5 gap-2'
  };

  const getPriorityConfig = (val) => {
    const p = String(val || '').toLowerCase();
    switch (p) {
      case 'critical':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-200',
          icon: AlertOctagon,
          label: 'Critical Hazard'
        };
      case 'high':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: AlertTriangle,
          label: 'High Priority'
        };
      case 'medium':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: Info,
          label: 'Medium Priority'
        };
      case 'low':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: ShieldCheck,
          label: 'Low Priority'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Info,
          label: val || 'Normal'
        };
    }
  };


  const config = getPriorityConfig(priority);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.bg} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
