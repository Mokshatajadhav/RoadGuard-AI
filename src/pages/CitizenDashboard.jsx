import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  Camera,
  Search,
  Filter,
  MapPin,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Info,
  ChevronRight
} from 'lucide-react';
import { useComplaints } from '../context/ComplaintContext';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';

export default function CitizenDashboard() {
  const { complaints, stats, loading, backendConnected } = useComplaints();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter complaints
  const filteredComplaints = complaints.filter(item => {
    const idVal = item.complaintId || item.id || '';
    const locVal = item.location || item.address || item.roadName || '';
    const titleVal = item.title || '';
    const matchesQuery =
      idVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      titleVal.toLowerCase().includes(searchQuery.toLowerCase());

    const s = String(item.status || '').toLowerCase();
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Pending' && (s === 'submitted' || s === 'pending verification' || s === 'pending')) ||
      (statusFilter === 'InProgress' && (s === 'in_progress' || s === 'assigned' || s === 'in progress' || s === 'crew assigned')) ||
      (statusFilter === 'Resolved' && (s === 'resolved' || s === 'repair_completed'));

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Welcome / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Citizen Grievance Cell
            </span>
            <span className="text-xs text-slate-500">• Public Transparency Portal</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
              backendConnected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${backendConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`} />
              {backendConnected ? 'MongoDB Live' : 'Local Demo Mode'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Citizen Pothole Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track road repair progress across your city ward and file new road damage complaints.
          </p>
        </div>

        {/* Action Buttons: Report & Live Map */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <Link
            to="/map"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition-all hover:border-emerald-500"
          >
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>Live GPS Map</span>
          </Link>
          <Link
            to="/report"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20 transition-all transform hover:-translate-y-0.5"
          >
            <Camera className="w-5 h-5" />
            <span>Report a Pothole</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Reports"
          value={stats.total}
          subtitle="All grievances on record"
          icon={FileText}
          color="navy"
        />
        <StatCard
          title="Pending Verification"
          value={stats.pending}
          subtitle="Awaiting PWD inspection"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Repairs in Progress"
          value={stats.inProgress}
          subtitle="Crew deployed on site"
          icon={Wrench}
          color="sky"
        />
        <StatCard
          title="Resolved Complaints"
          value={stats.resolved}
          subtitle={`${stats.resolutionRate}% resolution rate`}
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Citizen Safety Notice */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold">Safety First When Reporting:</strong> Please never stop your vehicle in active traffic lanes to photograph road damage. Use a safe sidewalk or roadside shoulder when taking pictures. For emergency cave-ins posing immediate life hazards, contact the 24/7 Traffic Control Helpline (100 / 112).
        </div>
      </div>

      {/* Recent Complaints Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls: Search and Status Filters */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Pothole Grievances</h2>
            <p className="text-xs text-slate-500">
              Showing {filteredComplaints.length} of {complaints.length} civic grievance records
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ID, road, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              {[
                { key: 'All', label: 'All' },
                { key: 'Pending', label: 'Pending' },
                { key: 'InProgress', label: 'In Progress' },
                { key: 'Resolved', label: 'Resolved' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Complaint Cards Grid */}
        {filteredComplaints.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No complaints found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No reports match your search query or filter. Try clearing the filter or lodge a new complaint.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredComplaints.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-6 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Thumbnail and details */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.id}
                      </span>
                      <PriorityBadge priority={item.priority} size="sm" />
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-xs">{item.location}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.reportedAt}</span>
                      </span>
                    </div>

                    {item.assignedCrew && (
                      <p className="text-xs text-indigo-700 font-medium flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-indigo-500" />
                        <span>Assigned to: {item.assignedCrew.name}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Action Button */}
                <div className="shrink-0 flex items-center justify-end md:self-center">
                  <Link
                    to={`/track?id=${item.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 shadow-xs transition-colors"
                  >
                    <span>Track Live Status</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
