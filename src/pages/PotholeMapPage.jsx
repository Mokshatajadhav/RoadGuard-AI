import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Camera,
  Layers,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Navigation,
  ArrowRight
} from 'lucide-react';
import { useComplaints } from '../context/ComplaintContext';
import PotholeMap from '../components/map/PotholeMap';

export default function PotholeMapPage() {
  const { complaints, stats, loading, backendConnected } = useComplaints();

  const criticalCount = complaints.filter(
    (c) => (c.priority || c.priorityLabel || '').toLowerCase() === 'critical'
  ).length;

  const inProgressCount = complaints.filter((c) => {
    const s = (c.status || '').toLowerCase();
    return s === 'in_progress' || s === 'assigned' || s.includes('progress');
  }).length;

  const resolvedCount = complaints.filter((c) => {
    const s = (c.status || '').toLowerCase();
    return s === 'resolved' || s === 'repair_completed';
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Interactive GIS Map
            </span>
            <span className="text-xs text-slate-500">• OpenStreetMap & GPS Telemetry</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
              backendConnected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${backendConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`} />
              {backendConnected ? 'MongoDB Live GPS' : 'Local Demo Mode'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Live City Pothole & Road Hazard Map
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time GPS coordinates of reported road potholes, AI severity scores, and public works repair statuses.
          </p>
        </div>

        {/* Action Button: Report a Pothole */}
        <Link
          to="/report"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20 transition-all transform hover:-translate-y-0.5 self-start md:self-auto"
        >
          <Camera className="w-5 h-5" />
          <span>Report a Hazard</span>
        </Link>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Grievances</span>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{complaints.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across municipal corridors</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">Critical Priority</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-1">{criticalCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Immediate risk to motorists</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600">Repairs Dispatched</span>
            <Wrench className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-1">{inProgressCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Assigned to field crews</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Restored & Audited</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Pothole patched & audited</p>
        </div>
      </div>

      {/* Main Map Component */}
      <PotholeMap complaints={complaints} height="600px" showFilters={true} />

      {/* Citizen Information Footer Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-extrabold text-slate-900 text-sm">
            Spotted an unlisted pothole or broken pavement?
          </h3>
          <p className="text-xs text-slate-600">
            Submit photo evidence with one click using your smartphone GPS. The AI engine automatically computes cavity hazard dimensions.
          </p>
        </div>
        <Link
          to="/report"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors shrink-0"
        >
          <span>File Quick Report</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
