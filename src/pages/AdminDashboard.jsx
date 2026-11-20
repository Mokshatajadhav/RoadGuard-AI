import React, { useState } from 'react';
import {
  ShieldCheck,
  Filter,
  Search,
  Eye,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Wrench,
  ChevronDown,
  Layers,
  MapPin,
  Calendar,
  AlertOctagon,
  Download,
  Building2,
  Plus,
  ScanLine,
  Cpu,
  ThumbsUp,
  Link2,
  ExternalLink,
  UploadCloud,
  Check,
  X,
  Camera,
  RefreshCw,
  ThumbsDown,
  Star,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { useComplaints } from '../context/ComplaintContext';
import { MUNICIPAL_CREWS, MUNICIPAL_ZONES } from '../data/mockComplaints';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import Modal from '../components/common/Modal';
import DetectionOverlay from '../components/common/DetectionOverlay';
import PotholeMap from '../components/map/PotholeMap';
import AnalyticsDashboardView from '../components/analytics/AnalyticsDashboardView';

export default function AdminDashboard() {
  const {
    complaints,
    stats,
    backendConnected,
    updateComplaintStatus,
    assignCrew,
    reviewDuplicateComplaint,
    recordComplaintRepair,
    adminVerifyComplaint,
    resetToSampleData,
    refreshComplaints
  } = useComplaints();

  // Duplicate review state
  const [dupReviewLoading, setDupReviewLoading] = useState(false);
  const [dupReviewFeedback, setDupReviewFeedback] = useState(null);

  // Repair upload modal state (crew/admin uploads AFTER image)
  const [repairUploadComplaint, setRepairUploadComplaint] = useState(null);
  const [repairAfterFile, setRepairAfterFile] = useState(null);
  const [repairAfterPreview, setRepairAfterPreview] = useState(null);
  const [repairNotesInput, setRepairNotesInput] = useState('');
  const [repairCrewInput, setRepairCrewInput] = useState('');
  const [repairUploadLoading, setRepairUploadLoading] = useState(false);
  const [repairUploadError, setRepairUploadError] = useState(null);

  // Admin Verification action modal state (approve closure, reopen, request evidence)
  const [adminActionModal, setAdminActionModal] = useState({
    isOpen: false,
    complaint: null,
    action: 'approve_closure',
  });
  const [adminActionNote, setAdminActionNote] = useState('');
  const [adminReopenCrew, setAdminReopenCrew] = useState(MUNICIPAL_CREWS[0].name);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [zoneFilter, setZoneFilter] = useState('All Zones');

  // Modal states
  const [viewComplaint, setViewComplaint] = useState(null);
  const [assigningComplaint, setAssigningComplaint] = useState(null);
  const [statusModalComplaint, setStatusModalComplaint] = useState(null);

  // Form states for modals
  const [selectedCrew, setSelectedCrew] = useState(MUNICIPAL_CREWS[0].name);
  const [targetSla, setTargetSla] = useState('Within 24 Hours (Critical)');
  const [newStatusValue, setNewStatusValue] = useState('submitted');
  const [statusNote, setStatusNote] = useState('');

  // Loading and feedback states
  const [assignLoading, setAssignLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null); // { type: 'success'|'error', message }
  const [adminViewMode, setAdminViewMode] = useState('table'); // 'table' | 'map' | 'verification'

  // Verification queue complaints
  const verificationQueue = complaints.filter(
    (c) =>
      c.status === 'repair_completed' ||
      c.verificationStatus === 'awaiting_citizen' ||
      c.verificationStatus === 'unsatisfactory_reported' ||
      c.verificationStatus === 'reopened'
  );

  // Filter logic
  const filteredReports = complaints.filter((item) => {
    const idVal = item.complaintId || item.id || '';
    const locVal = item.location || item.address || item.roadName || '';
    const titleVal = item.title || '';

    const matchesSearch =
      idVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locVal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      titleVal.toLowerCase().includes(searchQuery.toLowerCase());

    const s = String(item.status || '').toLowerCase();
    const filterS = statusFilter.toLowerCase();
    const matchesStatus =
      statusFilter === 'All' ||
      s === filterS ||
      (filterS === 'pending verification' && (s === 'submitted' || s === 'pending verification')) ||
      (filterS === 'in progress' && (s === 'in_progress' || s === 'in progress')) ||
      (filterS === 'crew assigned' && (s === 'assigned' || s === 'crew assigned')) ||
      (filterS === 'repair completed' && (s === 'repair_completed' || s === 'repair completed')) ||
      (filterS === 'resolved' && (s === 'resolved' || s === 'repair_completed'));

    const p = String(item.priority || item.priorityLabel || '').toLowerCase();
    const filterP = priorityFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'All' || p === filterP;

    const sev = String(item.severity || '').toLowerCase();
    const filterSev = severityFilter.toLowerCase();
    const matchesSeverity =
      severityFilter === 'All' ||
      sev === filterSev ||
      (filterSev === 'severe' && sev === 'high') ||
      (filterSev === 'moderate' && sev === 'medium') ||
      (filterSev === 'minor' && sev === 'low');

    const matchesZone = zoneFilter === 'All Zones' || item.zone === zoneFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesSeverity && matchesZone;
  });

  // Handle Assign Crew Submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assigningComplaint) return;
    setAssignLoading(true);
    setActionFeedback(null);
    try {
      const targetId = assigningComplaint.complaintId || assigningComplaint.id;
      await assignCrew(targetId, selectedCrew, targetSla);
      setActionFeedback({ type: 'success', message: `Crew "${selectedCrew}" assigned to ${targetId} successfully!` });
      setTimeout(() => setActionFeedback(null), 4000);
      setAssigningComplaint(null);
    } catch (err) {
      setActionFeedback({ type: 'error', message: `Failed to assign crew: ${err.message}` });
      setTimeout(() => setActionFeedback(null), 5000);
    } finally {
      setAssignLoading(false);
    }
  };

  // Handle Status Update Submit
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModalComplaint) return;
    setStatusLoading(true);
    setActionFeedback(null);
    try {
      const targetId = statusModalComplaint.complaintId || statusModalComplaint.id;
      await updateComplaintStatus(targetId, newStatusValue, statusNote);
      setActionFeedback({ type: 'success', message: `Status of ${targetId} updated successfully!` });
      setTimeout(() => setActionFeedback(null), 4000);
      setStatusModalComplaint(null);
      setStatusNote('');
    } catch (err) {
      setActionFeedback({ type: 'error', message: `Failed to update status: ${err.message}` });
      setTimeout(() => setActionFeedback(null), 5000);
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle Admin Duplicate Review (Confirm/Link or Mark Distinct)
  const handleDuplicateReviewAction = async (complaintId, action, masterComplaintId) => {
    setDupReviewLoading(true);
    setDupReviewFeedback(null);
    try {
      const res = await reviewDuplicateComplaint(complaintId, {
        action,
        masterComplaintId,
        actor: 'Admin Desk Operations',
      });
      setDupReviewFeedback({
        type: 'success',
        message: res?.message || (action === 'confirm' ? `Linked to master complaint #${masterComplaintId}` : 'Marked as distinct hazard'),
      });
      if (viewComplaint && (viewComplaint.complaintId === complaintId || viewComplaint.id === complaintId)) {
        setViewComplaint((prev) => ({
          ...prev,
          duplicateOf: action === 'confirm' ? masterComplaintId : null,
          duplicateReviewStatus: action === 'confirm' ? 'confirmed_duplicate' : 'marked_distinct',
        }));
      }
      setTimeout(() => setDupReviewFeedback(null), 4000);
    } catch (err) {
      setDupReviewFeedback({
        type: 'error',
        message: err.message || 'Failed to update duplicate review status.',
      });
      setTimeout(() => setDupReviewFeedback(null), 5000);
    } finally {
      setDupReviewLoading(false);
    }
  };

  // Handle Crew/Admin Upload of AFTER Repair Image
  const handleRepairUploadSubmit = async (e) => {
    e.preventDefault();
    if (!repairUploadComplaint) return;
    if (!repairAfterFile && !repairAfterPreview) {
      setRepairUploadError('Please select or upload an AFTER repair photograph.');
      return;
    }
    setRepairUploadLoading(true);
    setRepairUploadError(null);
    try {
      const targetId = repairUploadComplaint.complaintId || repairUploadComplaint.id;
      await recordComplaintRepair(targetId, {
        afterImageFile: repairAfterFile,
        afterImage: repairAfterPreview,
        repairNotes: repairNotesInput.trim(),
        crewName: repairCrewInput || repairUploadComplaint.assignedCrew?.name || 'Municipal Works Crew',
        uploadedBy: 'Admin Desk Operations',
      });
      setActionFeedback({
        type: 'success',
        message: `AFTER repair photograph logged for ${targetId}. Stage set to Awaiting Citizen Verification.`,
      });
      setTimeout(() => setActionFeedback(null), 5000);
      setRepairUploadComplaint(null);
      setRepairAfterFile(null);
      setRepairAfterPreview(null);
      setRepairNotesInput('');
    } catch (err) {
      setRepairUploadError(err.message || 'Failed to record repair evidence.');
    } finally {
      setRepairUploadLoading(false);
    }
  };

  // Handle Admin Verification Action (Approve Closure, Reopen, Request Evidence)
  const handleAdminVerificationAction = async (e) => {
    e.preventDefault();
    if (!adminActionModal.complaint) return;
    setAdminActionLoading(true);
    try {
      const targetId = adminActionModal.complaint.complaintId || adminActionModal.complaint.id;
      await adminVerifyComplaint(targetId, {
        action: adminActionModal.action,
        note: adminActionNote.trim(),
        actor: 'Municipal Operations Desk',
        assignedCrew: adminActionModal.action === 'reopen' ? adminReopenCrew : undefined,
      });
      setActionFeedback({
        type: 'success',
        message:
          adminActionModal.action === 'approve_closure'
            ? `Work order ${targetId} verified closed by administrator.`
            : adminActionModal.action === 'reopen'
            ? `Work order ${targetId} reopened for rework and dispatched to ${adminReopenCrew}.`
            : `Evidence clarification requested for ${targetId}.`,
      });
      setTimeout(() => setActionFeedback(null), 5000);
      setAdminActionModal({ isOpen: false, complaint: null, action: 'approve_closure' });
      setAdminActionNote('');
      if (viewComplaint && (viewComplaint.complaintId === targetId || viewComplaint.id === targetId)) {
        setViewComplaint(null);
      }
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'Action failed.' });
      setTimeout(() => setActionFeedback(null), 5000);
    } finally {
      setAdminActionLoading(false);
    }
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
              Municipal PWD Operations
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Admin Command Console
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
              ⚠️ Local Dev Only — Auth & RBAC Reserved for Phase 3
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Road Infrastructure & Pothole Triage Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Dispatch repair units, audit AI damage scores, and control work-order lifecycle across city zones.
          </p>
        </div>


        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={resetToSampleData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Sample Data</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Reports"
          value={stats.total}
          subtitle="All grievances"
          icon={Layers}
          color="navy"
        />
        <StatCard
          title="Critical Hazards"
          value={stats.critical}
          subtitle="Requires immediate patch"
          icon={AlertOctagon}
          color="rose"
        />
        <StatCard
          title="Pending Triage"
          value={stats.pending}
          subtitle="Awaiting inspection"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Repairs Active"
          value={stats.inProgress}
          subtitle="Crew on field"
          icon={Wrench}
          color="sky"
        />
        <StatCard
          title="Resolution Rate"
          value={`${stats.resolutionRate}%`}
          subtitle={`${stats.resolved} completed audits`}
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className={`rounded-xl border p-3.5 text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-500 hover:text-slate-800 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Complaint ID, road, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-700 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Verified">Verified</option>
              <option value="Crew Assigned">Crew Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Repair Completed">Repair Completed</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-700 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-700 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="All">All Severities</option>
              <option value="Severe">Severe</option>
              <option value="Moderate">Moderate</option>
              <option value="Minor">Minor</option>
            </select>

            {/* Zone Filter */}
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-700 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              {MUNICIPAL_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>

            {(statusFilter !== 'All' || priorityFilter !== 'All' || severityFilter !== 'All' || zoneFilter !== 'All Zones' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('All');
                  setPriorityFilter('All');
                  setSeverityFilter('All');
                  setZoneFilter('All Zones');
                  setSearchQuery('');
                }}
                className="text-xs text-rose-600 hover:underline font-semibold px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>
              Displaying <strong className="text-slate-800">{filteredReports.length}</strong> of {complaints.length} work orders
            </span>
            <span className={`font-mono text-[11px] hidden sm:inline ${
              backendConnected ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              • {backendConnected ? 'MongoDB Cloud: CONNECTED' : 'Demo Mode: ACTIVE (Sample Data)'}
            </span>
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setAdminViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                adminViewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminViewMode('verification')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                adminViewMode === 'verification'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Repair Verification Queue</span>
              {verificationQueue.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  adminViewMode === 'verification'
                    ? 'bg-white text-purple-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {verificationQueue.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setAdminViewMode('map')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                adminViewMode === 'map'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>GIS Map View</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminViewMode('analytics')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                adminViewMode === 'analytics'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Analytics Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: Verification Queue, Map, or Table */}
      {adminViewMode === 'verification' ? (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-white rounded-2xl border border-purple-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-purple-950 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  <span>Municipal Repair Verification & Quality Control Queue</span>
                </h3>
                <p className="text-xs text-purple-800 mt-0.5">
                  Inspect contractor completion photos, evaluate citizen dispute reports, and authorize official closure or rework orders.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold border border-purple-200">
                  Total in Review: {verificationQueue.length}
                </span>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
                  Disputes: {verificationQueue.filter(c => c.verificationStatus === 'unsatisfactory_reported').length}
                </span>
              </div>
            </div>
          </div>

          {verificationQueue.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">No Repairs Awaiting Verification</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                All maintenance repairs have been verified and closed, or no work orders currently have completed asphalt patch uploads.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verificationQueue.map((item) => {
                const isDisputed = item.verificationStatus === 'unsatisfactory_reported';
                const isAwaiting = item.verificationStatus === 'awaiting_citizen';
                const isReopened = item.verificationStatus === 'reopened';

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition-all ${
                      isDisputed
                        ? 'border-rose-300 ring-1 ring-rose-200'
                        : isReopened
                        ? 'border-amber-300'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs">{item.id}</span>
                          <StatusBadge status={item.status} size="sm" />
                          <PriorityBadge priority={item.priority} size="sm" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{item.title}</h4>
                        <p className="text-slate-500 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.location}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isDisputed
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isReopened
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                          {isDisputed ? 'Citizen Disputed' : isReopened ? 'Reopened' : 'Awaiting Citizen'}
                        </span>
                        {item.repairCompletedAt && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Repaired: {new Date(item.repairCompletedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Side-by-side Before & After Images */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Before (Original)</span>
                        </div>
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                          <img
                            src={item.beforeImage || item.imageUrl}
                            alt="Before repair"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">After (Repair)</span>
                        </div>
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-emerald-300 bg-slate-900">
                          {item.afterImage ? (
                            <img
                              src={item.afterImage}
                              alt="After repair"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400">
                              <Camera className="w-6 h-6 mb-1 text-slate-500" />
                              <span className="text-[10px]">No after image yet</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Crew & Details info */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-semibold">Crew: {item.assignedCrew?.name || 'Municipal Works Crew'}</span>
                        <span className="text-[10px] text-slate-500">Zone: {item.zone}</span>
                      </div>
                      {item.repairHistory && item.repairHistory.length > 0 && item.repairHistory[item.repairHistory.length - 1].notes && (
                        <p className="text-[11px] text-slate-600 italic">
                          "{item.repairHistory[item.repairHistory.length - 1].notes}"
                        </p>
                      )}
                    </div>

                    {/* Citizen Feedback if disputed */}
                    {item.verificationFeedback && (
                      <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                        isDisputed ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-[11px] ${isDisputed ? 'text-rose-900' : 'text-emerald-900'}`}>
                            {isDisputed ? 'Citizen Dispute Feedback' : 'Citizen Verification Rating'}
                          </span>
                          {item.verificationFeedback.rating && (
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {[...Array(item.verificationFeedback.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          )}
                        </div>
                        {item.verificationFeedback.comment && (
                          <p className="text-[11px] text-slate-700">
                            "{item.verificationFeedback.comment}"
                          </p>
                        )}
                        {item.verificationFeedback.proofImage && (
                          <div className="pt-1">
                            <span className="text-[10px] font-semibold text-slate-500">Citizen Dispute Photo:</span>
                            <img
                              src={item.verificationFeedback.proofImage}
                              alt="Citizen dispute proof"
                              className="mt-1 w-24 h-16 object-cover rounded-lg border border-rose-300"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewComplaint(item)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          View Dossier
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRepairUploadComplaint(item);
                            setRepairCrewInput(item.assignedCrew?.name || '');
                            setRepairAfterFile(null);
                            setRepairAfterPreview(null);
                            setRepairNotesInput('');
                            setRepairUploadError(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors inline-flex items-center gap-1"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Re-upload Photo</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAdminActionModal({
                              isOpen: true,
                              complaint: item,
                              action: 'reopen',
                            });
                            setAdminActionNote(isDisputed ? `Rework requested due to citizen dispute: ${item.verificationFeedback?.comment || 'Incomplete patch'}` : 'Quality audit rework required.');
                            setAdminReopenCrew(item.assignedCrew?.name || MUNICIPAL_CREWS[0].name);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition-colors inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reopen / Rework</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAdminActionModal({
                              isOpen: true,
                              complaint: item,
                              action: 'approve_closure',
                            });
                            setAdminActionNote('Verified repaired as per municipal asphalt patch specifications.');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Closure</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : adminViewMode === 'analytics' ? (
        <AnalyticsDashboardView complaints={complaints} />
      ) : adminViewMode === 'map' ? (
        <div className="space-y-4">
          <PotholeMap
            complaints={complaints}
            onSelectComplaint={(item) => setViewComplaint(item)}
            height="580px"
            showFilters={true}
            adminMode={true}
          />
        </div>
      ) : (
        /* Reports Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Complaint ID</th>
                <th className="py-3.5 px-4">Road & Location</th>
                <th className="py-3.5 px-4">AI Severity</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4">Assigned Crew</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-slate-600 font-medium text-sm">
                        {complaints.length === 0
                          ? 'No grievances loaded currently.'
                          : 'No complaints match the specified filter criteria.'}
                      </p>
                      {complaints.length === 0 ? (
                        <button
                          type="button"
                          onClick={resetToSampleData}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Load 6 Sample Demo Complaints
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('All');
                            setPriorityFilter('All');
                            setSeverityFilter('All');
                            setZoneFilter('All Zones');
                          }}
                          className="mt-1 text-xs text-emerald-600 hover:text-emerald-700 underline font-semibold"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((item) => (
                  <tr
                    key={item.complaintId || item.id || item._id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* ID & thumbnail */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.imageUrl}
                          alt="thumb"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                        <div>
                          <span>{item.id}</span>
                          <p className="text-[10px] text-slate-400 font-sans font-normal truncate max-w-[120px]">
                            {item.reportedAt}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            {item.duplicateOf && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Link2 className="w-2.5 h-2.5 text-amber-600" />
                                Dup of {item.duplicateOf}
                              </span>
                            )}
                            {item.duplicateReviewStatus === 'flagged' && !item.duplicateOf && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Dup Flag {item.duplicateMatchScore}%
                              </span>
                            )}
                            {item.supportCount > 1 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                <ThumbsUp className="w-2.5 h-2.5 text-sky-600" />
                                {item.supportCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                      <p className="text-slate-500 text-[11px] truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.location}</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">{item.zone}</span>
                    </td>

                    {/* AI Severity */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className={`font-bold ${
                          item.severity === 'Severe' ? 'text-rose-600' : item.severity === 'Moderate' ? 'text-amber-600' : 'text-slate-700'
                        }`}>
                          {item.severity}
                        </span>
                        {item.aiAnalysis && (
                          <p className="text-[10px] text-slate-500">
                            Depth: {item.aiAnalysis.estimatedDepth}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={item.priority} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>

                    {/* Assigned Crew */}
                    <td className="py-3.5 px-4 text-slate-700">
                      {item.assignedCrew ? (
                        <div className="space-y-0.5">
                          <p className="font-semibold text-indigo-900 truncate max-w-[140px]">
                            {item.assignedCrew.name}
                          </p>
                          <p className="text-[10px] text-indigo-700">
                            {item.assignedCrew.supervisor}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Button */}
                        <button
                          onClick={() => setViewComplaint(item)}
                          title="View Full Grievance Dossier"
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Assign Crew Button */}
                        <button
                          onClick={() => {
                            setAssigningComplaint(item);
                            setSelectedCrew(MUNICIPAL_CREWS[0].name);
                          }}
                          title="Assign Maintenance Crew"
                          className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>

                        {/* Upload After-Repair Photo Button */}
                        <button
                          onClick={() => {
                            setRepairUploadComplaint(item);
                            setRepairCrewInput(item.assignedCrew?.name || '');
                            setRepairAfterFile(null);
                            setRepairAfterPreview(null);
                            setRepairNotesInput('');
                            setRepairUploadError(null);
                          }}
                          title="Upload AFTER Repair Evidence"
                          className="p-1.5 rounded-lg text-purple-600 hover:text-purple-900 hover:bg-purple-50 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                        </button>

                        {/* Update Status Button */}
                        <button
                          onClick={() => {
                            setStatusModalComplaint(item);
                            setNewStatusValue(item.status);
                            setStatusNote('');
                          }}
                          title="Update Status"
                          className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal 1: View Complaint Dossier */}
      {viewComplaint && (
        <Modal
          isOpen={!!viewComplaint}
          onClose={() => setViewComplaint(null)}
          title={`Grievance Dossier: ${viewComplaint.id}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">{viewComplaint.title}</h3>
                <p className="text-xs text-slate-500">{viewComplaint.reportedAt}</p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={viewComplaint.priority} size="md" />
                <StatusBadge status={viewComplaint.status} size="md" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-slate-200 min-h-52 bg-slate-900 flex items-center justify-center">
                {viewComplaint.aiAnalysis?.detections?.length > 0 ? (
                  <DetectionOverlay
                    imageUrl={viewComplaint.imageUrl}
                    detections={viewComplaint.aiAnalysis.detections}
                    imageWidth={viewComplaint.aiAnalysis.imageWidth}
                    imageHeight={viewComplaint.aiAnalysis.imageHeight}
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={viewComplaint.imageUrl}
                    alt={viewComplaint.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Location Details</span>
                  <p className="font-bold text-slate-900">{viewComplaint.location}</p>
                  <p className="text-slate-600">{viewComplaint.ward} • {viewComplaint.zone}</p>
                  <p className="font-mono text-slate-500 text-[11px]">
                    Lat: {viewComplaint.coordinates?.lat}, Lng: {viewComplaint.coordinates?.lng}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Reporter Info</span>
                  <p className="font-semibold text-slate-900">{viewComplaint.reporterName}</p>
                  <p className="text-slate-600">{viewComplaint.reporterContact}</p>
                </div>

                {viewComplaint.assignedCrew && (
                  <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 space-y-1">
                    <span className="text-indigo-600 uppercase font-bold text-[10px]">Assigned Contractor / Crew</span>
                    <p className="font-extrabold text-indigo-950">{viewComplaint.assignedCrew.name}</p>
                    <p className="text-indigo-800 text-[11px]">Lead: {viewComplaint.assignedCrew.supervisor}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">Citizen Description</h4>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                {viewComplaint.description}
              </p>
            </div>

            {/* AI Diagnostics details */}
            {viewComplaint.aiAnalysis && (
              <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                viewComplaint.aiAnalysis.isRealInference
                  ? 'border-emerald-300 bg-emerald-50/70'
                  : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-center justify-between pb-1">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    {viewComplaint.aiAnalysis.isRealInference ? (
                      <>
                        <ScanLine className="w-4 h-4 text-emerald-600" />
                        <span>YOLOv8 AI Vision Audit (Real Model Inference)</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4 text-slate-500" />
                        <span>Simulated AI Damage Audit</span>
                      </>
                    )}
                  </h4>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    viewComplaint.aiAnalysis.isRealInference
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {viewComplaint.aiAnalysis.isRealInference ? 'Real Inference' : 'Simulated'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px]">
                      {viewComplaint.aiAnalysis.isRealInference ? 'Detections:' : 'Confidence:'}
                    </span>
                    <p className="font-bold text-slate-900">
                      {viewComplaint.aiAnalysis.isRealInference
                        ? `${viewComplaint.aiAnalysis.detectionCount ?? viewComplaint.aiAnalysis.detections?.length ?? 0} Pothole(s)`
                        : `${viewComplaint.aiAnalysis.confidence}%`}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px]">Confidence:</span>
                    <p className="font-bold text-slate-900">
                      {viewComplaint.aiAnalysis.confidence > 0 ? `${viewComplaint.aiAnalysis.confidence}%` : '—'}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px]">Damage Severity:</span>
                    <p className="font-bold text-rose-600">{viewComplaint.aiAnalysis.estimatedDepth || viewComplaint.severity}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 text-[10px]">Hazard Index:</span>
                    <p className="font-bold text-slate-900">{viewComplaint.aiAnalysis.hazardScore}/100</p>
                  </div>
                </div>
                {viewComplaint.aiAnalysis.modelInfo && (
                  <p className="text-[10px] text-slate-500 pt-1">
                    Model: <span className="font-mono">{viewComplaint.aiAnalysis.modelInfo}</span>
                  </p>
                )}
              </div>
            )}

            {/* Duplicate Detection Audit & Civic Support */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Duplicate Detection & Civic Support Audit</span>
                </h4>
                {viewComplaint.duplicateOf ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    Linked Duplicate
                  </span>
                ) : viewComplaint.duplicateReviewStatus === 'marked_distinct' ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Verified Distinct
                  </span>
                ) : (viewComplaint.possibleDuplicates?.length > 0 || viewComplaint.duplicateMatchScore >= 50) ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                    Flagged For Review ({viewComplaint.duplicateMatchScore}%)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    Distinct Record
                  </span>
                )}
              </div>

              {dupReviewFeedback && (
                <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                  dupReviewFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {dupReviewFeedback.message}
                </div>
              )}

              {/* Linked to Master Complaint Banner */}
              {viewComplaint.duplicateOf && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-bold text-amber-900">
                      Confirmed duplicate of Primary Grievance #{viewComplaint.duplicateOf}
                    </p>
                    <p className="text-amber-700 text-[11px]">
                      This report has been linked to the primary work order to prevent redundant contractor dispatch.
                    </p>
                  </div>
                </div>
              )}

              {/* Potential Duplicate Matches List */}
              {viewComplaint.possibleDuplicates && viewComplaint.possibleDuplicates.length > 0 && !viewComplaint.duplicateOf && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-700">
                    Matched Potential Duplicates ({viewComplaint.possibleDuplicates.length} found):
                  </div>
                  <div className="space-y-1.5">
                    {viewComplaint.possibleDuplicates.map((dup, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{dup.complaintId}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                              {dup.matchScore}% Match
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Distance: {dup.distanceMeters !== null ? `${dup.distanceMeters}m` : 'N/A'} • Image Sim: {dup.imageSimilarity !== null ? `${dup.imageSimilarity}%` : 'N/A'} • Text Sim: {dup.textSimilarity}%
                          </p>
                        </div>

                        {/* Admin Action Buttons */}
                        {viewComplaint.duplicateReviewStatus !== 'confirmed_duplicate' && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={dupReviewLoading}
                              onClick={() => handleDuplicateReviewAction(viewComplaint.complaintId || viewComplaint.id, 'confirm', dup.complaintId)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                              Confirm & Link
                            </button>
                            {viewComplaint.duplicateReviewStatus !== 'marked_distinct' && (
                              <button
                                type="button"
                                disabled={dupReviewLoading}
                                onClick={() => handleDuplicateReviewAction(viewComplaint.complaintId || viewComplaint.id, 'distinct')}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors disabled:opacity-50"
                              >
                                Mark Distinct
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Civic Endorsements / Supporter Count */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <ThumbsUp className="w-3.5 h-3.5 text-sky-600" />
                    <span>Civic Endorsements & Supporter Count</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
                    {viewComplaint.supportCount || 1} Citizen Report{(viewComplaint.supportCount || 1) > 1 ? 's' : ''}
                  </span>
                </div>

                {viewComplaint.supportingReports && viewComplaint.supportingReports.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {viewComplaint.supportingReports.map((sup, sIdx) => (
                      <div key={sIdx} className="bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                        <div className="flex justify-between items-center text-slate-800 font-semibold">
                          <span>{sup.citizenName || 'Citizen Supporter'}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {sup.supportedAt ? new Date(sup.supportedAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        {sup.comment && (
                          <p className="text-slate-600 text-[10px] italic mt-0.5">"{sup.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Initial report filed by {viewComplaint.reporterName || 'Citizen'}. No additional endorsements yet.
                  </p>
                )}
              </div>
            </div>

            {/* Before-and-After Repair Evidence & Quality Verification Block */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-purple-200">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Proof of Work: Before & After Repair Evidence</span>
                </h4>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  viewComplaint.status === 'resolved' || viewComplaint.verificationStatus === 'citizen_verified' || viewComplaint.verificationStatus === 'admin_approved'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : viewComplaint.verificationStatus === 'unsatisfactory_reported'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : viewComplaint.afterImage
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}>
                  {viewComplaint.status === 'resolved'
                    ? 'Verified & Closed'
                    : viewComplaint.verificationStatus === 'unsatisfactory_reported'
                    ? 'Citizen Disputed'
                    : viewComplaint.afterImage
                    ? 'Awaiting Citizen Verification'
                    : 'Repair In Progress'}
                </span>
              </div>

              {/* Side by side comparison images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-rose-800">
                    <span>1. BEFORE (Original Pothole)</span>
                    <span className="text-[10px] font-normal text-slate-500">Unmodified Record</span>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                    <img
                      src={viewComplaint.beforeImage || viewComplaint.imageUrl}
                      alt="Before Repair"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-emerald-800">
                    <span>2. AFTER (Contractor Patch)</span>
                    {viewComplaint.repairCompletedAt && (
                      <span className="text-[10px] font-normal text-slate-500">
                        {new Date(viewComplaint.repairCompletedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden border border-emerald-300 bg-slate-900 flex items-center justify-center">
                    {viewComplaint.afterImage ? (
                      <img
                        src={viewComplaint.afterImage}
                        alt="After Repair"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    ) : (
                      <div className="text-center p-3 text-slate-400 space-y-1">
                        <Camera className="w-6 h-6 mx-auto text-slate-500" />
                        <p className="text-[11px]">No AFTER photograph uploaded yet.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setRepairUploadComplaint(viewComplaint);
                            setRepairCrewInput(viewComplaint.assignedCrew?.name || '');
                            setRepairAfterFile(null);
                            setRepairAfterPreview(null);
                            setRepairNotesInput('');
                            setRepairUploadError(null);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold text-purple-700 bg-white rounded-lg border border-purple-300 hover:bg-purple-50 inline-flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Upload After Photo Now</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Citizen Dispute or Rating */}
              {viewComplaint.verificationFeedback && (
                <div className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                  viewComplaint.verificationStatus === 'unsatisfactory_reported'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {viewComplaint.verificationStatus === 'unsatisfactory_reported'
                        ? 'Citizen Dispute Feedback'
                        : 'Citizen Verification Rating'}
                    </span>
                    {viewComplaint.verificationFeedback.rating && (
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(viewComplaint.verificationFeedback.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>
                  {viewComplaint.verificationFeedback.comment && (
                    <p className="italic text-[11px]">"{viewComplaint.verificationFeedback.comment}"</p>
                  )}
                  {viewComplaint.verificationFeedback.proofImage && (
                    <div className="pt-1">
                      <span className="text-[10px] font-semibold text-slate-500">Citizen Dispute Photo:</span>
                      <img
                        src={viewComplaint.verificationFeedback.proofImage}
                        alt="Citizen proof"
                        className="mt-1 w-24 h-16 object-cover rounded-lg border border-rose-300"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Repair History Audit Trail */}
              {viewComplaint.repairHistory && viewComplaint.repairHistory.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Repair History & Audit Entries</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {viewComplaint.repairHistory.map((rh, rhIdx) => (
                      <div key={rhIdx} className="bg-white p-2 rounded-lg border border-slate-200 text-[10px] space-y-0.5">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-bold">{rh.action}</span>
                          <span className="text-slate-400">{new Date(rh.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600">Actor: <span className="font-medium text-slate-800">{rh.actor || 'System'}</span> • {rh.notes || 'No note recorded'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions inside Dossier */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-purple-200">
                <button
                  type="button"
                  onClick={() => {
                    setRepairUploadComplaint(viewComplaint);
                    setRepairCrewInput(viewComplaint.assignedCrew?.name || '');
                    setRepairAfterFile(null);
                    setRepairAfterPreview(null);
                    setRepairNotesInput('');
                    setRepairUploadError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-white border border-purple-300 hover:bg-purple-100 transition-colors inline-flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload / Replace After Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminActionModal({
                      isOpen: true,
                      complaint: viewComplaint,
                      action: 'reopen',
                    });
                    setAdminActionNote('Quality audit rework required.');
                    setAdminReopenCrew(viewComplaint.assignedCrew?.name || MUNICIPAL_CREWS[0].name);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition-colors inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen / Dispatch Rework</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminActionModal({
                      isOpen: true,
                      complaint: viewComplaint,
                      action: 'approve_closure',
                    });
                    setAdminActionNote('Official municipal verification approved.');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Close Work Order</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setViewComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 2: Assign Maintenance Crew */}
      {assigningComplaint && (
        <Modal
          isOpen={!!assigningComplaint}
          onClose={() => setAssigningComplaint(null)}
          title={`Assign Maintenance Crew: ${assigningComplaint.id}`}
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Dispatch a Public Works asphalt repair unit for <strong className="text-slate-900">{assigningComplaint.location}</strong>.
            </p>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Select Road Repair Crew</label>
              <select
                value={selectedCrew}
                onChange={(e) => setSelectedCrew(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
              >
                {MUNICIPAL_CREWS.map((crew) => (
                  <option key={crew.id} value={crew.name}>
                    {crew.name} ({crew.zone} • Lead: {crew.lead})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Target SLA Completion Window</label>
              <select
                value={targetSla}
                onChange={(e) => setTargetSla(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
              >
                <option value="Within 12 Hours (Emergency Cave-in)">Within 12 Hours (Emergency Cave-in)</option>
                <option value="Within 24 Hours (Critical Hazard)">Within 24 Hours (Critical Hazard)</option>
                <option value="Within 48 Hours (High Priority)">Within 48 Hours (High Priority)</option>
                <option value="Within 5 Working Days (Standard Batch)">Within 5 Working Days (Standard Batch)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAssigningComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assignLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {assignLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Dispatching…
                  </>
                ) : (
                  'Confirm Crew Dispatch'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 3: Update Complaint Status */}
      {statusModalComplaint && (
        <Modal
          isOpen={!!statusModalComplaint}
          onClose={() => setStatusModalComplaint(null)}
          title={`Update Status: ${statusModalComplaint.id}`}
        >
          <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Change official municipal stage for <strong className="text-slate-900">{statusModalComplaint.id}</strong>.
            </p>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">New Stage / Status</label>
              <select
                value={newStatusValue}
                onChange={(e) => setNewStatusValue(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
              >
                <option value="submitted">Submitted</option>
                <option value="verified">Under Review</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">Repair in Progress</option>
                <option value="repair_completed">Repair Completed</option>
                <option value="resolved">Verified / Closed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Inspector / Operational Note</label>
              <textarea
                rows={3}
                placeholder="e.g., Cold asphalt mix applied, compacted with 8-ton vibratory roller, citizen grievance closed."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStatusModalComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={statusLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {statusLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Update Status Record'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Modal 4: Upload Repair Evidence (AFTER Image) */}
      {repairUploadComplaint && (
        <Modal
          isOpen={!!repairUploadComplaint}
          onClose={() => setRepairUploadComplaint(null)}
          title={`Log AFTER-Repair Evidence: ${repairUploadComplaint.id}`}
        >
          <form onSubmit={handleRepairUploadSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Submit proof of asphalt repair for <strong className="text-slate-900">{repairUploadComplaint.location}</strong>. This updates the work order to <strong className="text-purple-700">Repair Completed</strong> and flags it for citizen verification.
            </p>

            {/* Original Pothole Image reference */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-3">
              <img
                src={repairUploadComplaint.beforeImage || repairUploadComplaint.imageUrl}
                alt="Original"
                className="w-16 h-12 object-cover rounded-lg border border-slate-300 shrink-0"
              />
              <div className="text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">Original Pothole (BEFORE)</span>
                <p className="text-[10px] text-slate-500">Will be preserved permanently. Your upload will be stored as the AFTER photograph.</p>
              </div>
            </div>

            {/* File Upload or Preview */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700">AFTER-Repair Photograph (Required)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-purple-400 bg-slate-50/50 transition-colors">
                {repairAfterPreview ? (
                  <div className="space-y-2">
                    <img
                      src={repairAfterPreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg object-contain border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setRepairAfterFile(null);
                        setRepairAfterPreview(null);
                      }}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Remove & Choose Another
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <UploadCloud className="w-8 h-8 text-purple-600 mx-auto mb-1" />
                    <span className="font-bold text-slate-700 block">Click to select AFTER repair image</span>
                    <span className="text-[10px] text-slate-500 block">JPEG, PNG, WebP up to 8MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 8 * 1024 * 1024) {
                            setRepairUploadError('File size exceeds 8MB limit.');
                            return;
                          }
                          setRepairAfterFile(file);
                          setRepairAfterPreview(URL.createObjectURL(file));
                          setRepairUploadError(null);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Repairing Maintenance Crew</label>
              <input
                type="text"
                value={repairCrewInput}
                onChange={(e) => setRepairCrewInput(e.target.value)}
                placeholder="e.g. Zone 1 Rapid Asphalt Patch Unit"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Repair Notes / Materials Applied</label>
              <textarea
                rows={2}
                value={repairNotesInput}
                onChange={(e) => setRepairNotesInput(e.target.value)}
                placeholder="e.g., Excavated damaged edges, applied tack coat, filled with hot asphalt mix and compacted."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            {repairUploadError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {repairUploadError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRepairUploadComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={repairUploadLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {repairUploadLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading Proof…
                  </>
                ) : (
                  'Log Completion & Send to Citizen'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 5: Admin Verification Action (Approve Closure / Reopen Rework) */}
      {adminActionModal.isOpen && adminActionModal.complaint && (
        <Modal
          isOpen={adminActionModal.isOpen}
          onClose={() => setAdminActionModal({ isOpen: false, complaint: null, action: 'approve_closure' })}
          title={
            adminActionModal.action === 'approve_closure'
              ? `Authorize Grievance Closure: ${adminActionModal.complaint.id}`
              : `Dispatch Rework Order: ${adminActionModal.complaint.id}`
          }
        >
          <form onSubmit={handleAdminVerificationAction} className="space-y-4 text-xs">
            <p className="text-slate-600">
              {adminActionModal.action === 'approve_closure' ? (
                <>
                  You are performing an administrative sign-off on work order <strong className="text-slate-900">{adminActionModal.complaint.id}</strong>. This transitions the status to <strong className="text-emerald-700">Verified / Closed</strong>.
                </>
              ) : (
                <>
                  You are reopening work order <strong className="text-slate-900">{adminActionModal.complaint.id}</strong> due to quality defects or citizen dissatisfaction. This returns status to <strong className="text-amber-700">Assigned</strong>.
                </>
              )}
            </p>

            {adminActionModal.action === 'reopen' && (
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Assign Maintenance Crew for Rework</label>
                <select
                  value={adminReopenCrew}
                  onChange={(e) => setAdminReopenCrew(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden bg-white"
                >
                  {MUNICIPAL_CREWS.map((crew) => (
                    <option key={crew.id} value={crew.name}>
                      {crew.name} ({crew.zone} • Lead: {crew.lead})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">
                {adminActionModal.action === 'approve_closure' ? 'Supervisory Sign-off Note' : 'Rework Instructions & Defect Description'}
              </label>
              <textarea
                rows={3}
                required
                value={adminActionNote}
                onChange={(e) => setAdminActionNote(e.target.value)}
                placeholder={
                  adminActionModal.action === 'approve_closure'
                    ? 'e.g., Visual inspection of after-image confirms flush patch with roadway. Approved for closure.'
                    : 'e.g., Citizen dispute valid: pothole edge still broken. Re-compact with hot mix asphalt.'
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAdminActionModal({ isOpen: false, complaint: null, action: 'approve_closure' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adminActionLoading}
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  adminActionModal.action === 'approve_closure'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {adminActionLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing…
                  </>
                ) : adminActionModal.action === 'approve_closure' ? (
                  'Authorize Closure'
                ) : (
                  'Issue Rework Order'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
