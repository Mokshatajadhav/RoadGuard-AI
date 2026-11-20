import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Wrench, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function StatusBadge({ status, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2'
  };

  const getStatusConfig = (val) => {
    const s = String(val || '').toLowerCase().trim();

    // submitted / pending
    if (s === 'submitted' || s === 'pending verification' || s === 'pending') {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        icon: Clock,
        label: 'Submitted'
      };
    }

    // verified / under review
    if (s === 'verified' || s === 'under review' || s === 'verified by pwd') {
      return {
        bg: 'bg-sky-50 text-sky-800 border-sky-200',
        dot: 'bg-sky-500',
        icon: AlertCircle,
        label: 'Under Review'
      };
    }

    // assigned
    if (s === 'assigned' || s === 'crew assigned') {
      return {
        bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        dot: 'bg-indigo-500',
        icon: Wrench,
        label: 'Assigned'
      };
    }

    // in_progress / repair in progress
    if (s === 'in_progress' || s === 'in progress' || s === 'repair in progress') {
      return {
        bg: 'bg-orange-50 text-orange-800 border-orange-200',
        dot: 'bg-orange-500',
        icon: Wrench,
        label: 'Repair in Progress'
      };
    }

    // repair_completed / awaiting verification
    if (s === 'repair_completed' || s === 'repair completed') {
      return {
        bg: 'bg-teal-50 text-teal-800 border-teal-200',
        dot: 'bg-teal-500',
        icon: CheckCircle2,
        label: 'Repair Completed'
      };
    }

    // awaiting_citizen
    if (s === 'awaiting_citizen' || s === 'awaiting citizen verification' || s === 'awaiting verification') {
      return {
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        dot: 'bg-purple-500',
        icon: Clock,
        label: 'Awaiting Citizen Verification'
      };
    }

    // citizen_verified / admin_approved
    if (s === 'citizen_verified' || s === 'admin_approved') {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-600',
        icon: ShieldCheck,
        label: s === 'citizen_verified' ? 'Citizen Verified' : 'Admin Approved & Closed'
      };
    }

    // unsatisfactory_reported / dispute
    if (s === 'unsatisfactory_reported' || s === 'repair unsatisfactory') {
      return {
        bg: 'bg-amber-50 text-amber-900 border-amber-300',
        dot: 'bg-amber-600',
        icon: AlertCircle,
        label: 'Repair Dispute (Under Review)'
      };
    }

    // reopened
    if (s === 'reopened') {
      return {
        bg: 'bg-orange-50 text-orange-900 border-orange-300',
        dot: 'bg-orange-600',
        icon: Wrench,
        label: 'Repair Reopened for Rework'
      };
    }

    // resolved / verified / closed
    if (s === 'resolved' || s === 'resolved & audited' || s === 'verified / closed') {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-600',
        icon: ShieldCheck,
        label: 'Verified / Closed'
      };
    }

    // rejected
    if (s === 'rejected' || s === 'closed') {
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
        icon: ShieldAlert,
        label: 'Rejected / Closed'
      };
    }

    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
      icon: AlertCircle,
      label: val || 'Unknown'
    };
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses[size] || sizeClasses.md} transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
      <span>{config.label}</span>
    </span>
  );
}
