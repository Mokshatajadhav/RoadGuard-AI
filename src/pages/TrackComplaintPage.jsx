import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  User,
  Wrench,
  Cpu,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Phone,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  ScanLine,
  ThumbsUp,
  ThumbsDown,
  Star,
  UploadCloud,
  X,
  AlertTriangle,
  Loader2,
  Camera,
  Check
} from 'lucide-react';
import { useComplaints } from '../context/ComplaintContext';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import DetectionOverlay from '../components/common/DetectionOverlay';
import Modal from '../components/common/Modal';

export default function TrackComplaintPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    complaints,
    getComplaintById,
    fetchComplaintDetails,
    verifyComplaintRepair,
    backendConnected
  } = useComplaints();

  const initialId = searchParams.get('id') || '';
  const [inputId, setInputId] = useState(initialId);
  const [activeComplaint, setActiveComplaint] = useState(() => {
    return initialId ? getComplaintById(initialId) : complaints[0] || null;
  });
  const [searchError, setSearchError] = useState(false);
  const [searching, setSearching] = useState(false);

  // Verification modal states
  const [showVerifyModal, setShowVerifyModal] = useState(null); // 'confirm' | 'unsatisfactory' | null
  const [verifyCitizenName, setVerifyCitizenName] = useState('');
  const [verifyRating, setVerifyRating] = useState(5);
  const [verifyComment, setVerifyComment] = useState('');
  const [unsatisfactoryImageFile, setUnsatisfactoryImageFile] = useState(null);
  const [unsatisfactoryPreview, setUnsatisfactoryPreview] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState(null);

  // Sync with URL params
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setInputId(idFromUrl);
      const found = getComplaintById(idFromUrl);
      if (found) {
        setActiveComplaint(found);
        setSearchError(false);
      } else if (fetchComplaintDetails) {
        fetchComplaintDetails(idFromUrl).then((res) => {
          if (res) {
            setActiveComplaint(res);
            setSearchError(false);
          } else {
            setSearchError(true);
          }
        });
      }
    } else if (!activeComplaint && complaints.length > 0) {
      setActiveComplaint(complaints[0]);
    }
  }, [searchParams, complaints]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!inputId.trim()) return;

    setSearching(true);
    setSearchError(false);

    try {
      let found = getComplaintById(inputId);
      if (!found && fetchComplaintDetails) {
        found = await fetchComplaintDetails(inputId);
      }
      if (found) {
        setActiveComplaint(found);
        setSearchError(false);
        setSearchParams({ id: found.complaintId || found.id });
      } else {
        setSearchError(true);
      }
    } catch (err) {
      setSearchError(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSample = async (sampleId) => {
    setInputId(sampleId);
    let found = getComplaintById(sampleId);
    if (!found && fetchComplaintDetails) {
      found = await fetchComplaintDetails(sampleId);
    }
    if (found) {
      setActiveComplaint(found);
      setSearchError(false);
      setSearchParams({ id: sampleId });
    }
  };

  const handleUnsatisfactoryFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setVerifyError('Please upload an image smaller than 8MB.');
        return;
      }
      setVerifyError(null);
      setUnsatisfactoryImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUnsatisfactoryPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!activeComplaint || !showVerifyModal) return;
    setVerifyLoading(true);
    setVerifyError(null);
    setVerifySuccessMsg(null);

    try {
      const targetId = activeComplaint.complaintId || activeComplaint.id;
      const payload = {
        action: showVerifyModal,
        citizenName: verifyCitizenName.trim() || activeComplaint.reporterName || 'Citizen Commuter',
        comment: verifyComment.trim(),
        rating: verifyRating,
        unsatisfactoryImageFile,
      };

      const res = await verifyComplaintRepair(targetId, payload);
      setVerifySuccessMsg(res?.message || 'Verification submitted successfully.');
      if (res?.data) {
        setActiveComplaint(res.data);
      }
      setTimeout(() => {
        setShowVerifyModal(null);
        setVerifySuccessMsg(null);
        setUnsatisfactoryImageFile(null);
        setUnsatisfactoryPreview(null);
        setVerifyComment('');
      }, 1800);
    } catch (err) {
      setVerifyError(err.message || 'Verification submission failed. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          Civic Audit & Progress Tracking
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Road Grievance Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Enter your unique RoadGuard Complaint ID to view real-time inspection, crew dispatch, and asphalt repair logs.
        </p>
      </div>

      {/* Search Bar Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Complaint ID (e.g. RG-2026-8491)..."
              value={inputId}
              onChange={(e) => {
                setInputId(e.target.value);
                setSearchError(false);
              }}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors text-sm shadow-xs"
          >
            Track Status
          </button>
        </form>

        {/* Quick-Pick Sample Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-500 font-medium">Quick Select Sample:</span>
          {complaints.slice(0, 4).map((c) => {
            const cid = c.complaintId || c.id;
            const activeCid = activeComplaint?.complaintId || activeComplaint?.id;
            return (
              <button
                key={cid}
                type="button"
                onClick={() => handleSelectSample(cid)}
                className={`font-mono px-2.5 py-1 rounded-lg transition-colors border ${
                  activeCid === cid
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {cid}
              </button>
            );
          })}
        </div>

        {searchError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Complaint ID "<strong>{inputId}</strong>" was not found in the civic repository. Please double-check the ID or choose one of the sample IDs above.
            </span>
          </div>
        )}
      </div>

      {/* Main Complaint Detail & Timeline View */}
      {activeComplaint ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header with status badges */}
            <div className="bg-slate-50/70 p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-300">
                    {activeComplaint.id}
                  </span>
                  <PriorityBadge priority={activeComplaint.priority} size="md" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 pt-1">
                  {activeComplaint.title}
                </h2>
              </div>

              <div className="self-start sm:self-center">
                <StatusBadge status={activeComplaint.status} size="lg" />
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Photo preview */}
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 min-h-56">
                  {activeComplaint.aiAnalysis?.detections?.length > 0 ? (
                    <DetectionOverlay
                      imageUrl={activeComplaint.imageUrl}
                      detections={activeComplaint.aiAnalysis.detections}
                      imageWidth={activeComplaint.aiAnalysis.imageWidth}
                      imageHeight={activeComplaint.aiAnalysis.imageHeight}
                    />
                  ) : (
                    <img
                      src={activeComplaint.imageUrl}
                      alt={activeComplaint.title}
                      className="w-full h-56 object-cover"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                  )}
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white p-2 rounded-lg text-[11px] flex items-center justify-between pointer-events-none">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      {activeComplaint.aiAnalysis?.isRealInference ? <ScanLine className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                      <span>{activeComplaint.aiAnalysis?.isRealInference ? 'YOLOv8 Geo-Tagged' : 'AI Geo-Tagged'}</span>
                    </span>
                    <span className="font-mono">
                      {activeComplaint.aiAnalysis?.confidence > 0 ? `${activeComplaint.aiAnalysis.confidence}% Confidence` : 'Analyzed'}
                    </span>
                  </div>
                </div>

                {/* AI Analysis Metrics */}
                {activeComplaint.aiAnalysis && (
                  <div className={`rounded-xl p-3 border space-y-1.5 text-xs ${
                    activeComplaint.aiAnalysis.isRealInference
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {activeComplaint.aiAnalysis.isRealInference ? <ScanLine className="w-3.5 h-3.5 text-emerald-600" /> : <Cpu className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{activeComplaint.aiAnalysis.isRealInference ? 'YOLOv8 Vision Diagnostics' : 'Simulated Vision Diagnostics'}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        activeComplaint.aiAnalysis.isRealInference
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {activeComplaint.aiAnalysis.isRealInference ? 'Real Inference' : 'Simulated'}
                      </span>
                    </div>
                    {activeComplaint.aiAnalysis.isRealInference && (
                      <div className="flex justify-between text-slate-600 font-semibold">
                        <span>Potholes Detected:</span>
                        <span className="font-bold text-slate-900">
                          {activeComplaint.aiAnalysis.detectionCount ?? activeComplaint.aiAnalysis.detections?.length ?? 0}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Cavity Depth:</span>
                      <span className="font-bold text-slate-900">{activeComplaint.aiAnalysis.estimatedDepth}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Surface Area:</span>
                      <span className="font-semibold text-slate-900">{activeComplaint.aiAnalysis.estimatedArea}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Pavement Type:</span>
                      <span className="font-semibold text-slate-900">{activeComplaint.aiAnalysis.surfaceType}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Spatial Duplicate Check:</span>
                      <span className="font-semibold text-emerald-700">{activeComplaint.aiAnalysis.duplicateCheck}</span>
                    </div>
                    {activeComplaint.aiAnalysis.modelInfo && (
                      <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-200/60 flex justify-between">
                        <span>Model:</span>
                        <span className="font-mono">{activeComplaint.aiAnalysis.modelInfo}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Middle & Right: Metadata & Timeline */}
              <div className="md:col-span-2 space-y-6">
                {/* Meta Attributes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 uppercase font-semibold text-[10px]">Location & Street</span>
                    <p className="font-bold text-slate-900 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{activeComplaint.location}</span>
                    </p>
                    <p className="font-mono text-slate-500 text-[11px] pl-5">
                      {activeComplaint.coordinates.lat}° N, {activeComplaint.coordinates.lng}° E
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 uppercase font-semibold text-[10px]">Ward & Zone</span>
                    <p className="font-bold text-slate-900">{activeComplaint.ward}</p>
                    <p className="text-slate-600 text-[11px]">{activeComplaint.zone}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 uppercase font-semibold text-[10px]">Reported On</span>
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeComplaint.reportedAt}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 uppercase font-semibold text-[10px]">Grievance Filed By</span>
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeComplaint.reporterName}</span>
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Citizen Observation Note
                  </h3>
                  <p className="text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                    {activeComplaint.description}
                  </p>
                </div>

                {/* Assigned Crew Highlight (if assigned) */}
                {activeComplaint.assignedCrew && (
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-800">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                          Assigned Repair Crew
                        </span>
                        <p className="font-extrabold text-sm text-indigo-950">{activeComplaint.assignedCrew.name}</p>
                        <p className="text-indigo-800 text-[11px]">
                          Lead: {activeComplaint.assignedCrew.supervisor} • Contact: {activeComplaint.assignedCrew.contact}
                        </p>
                      </div>
                    </div>
                    <div className="text-right sm:border-l sm:border-indigo-200 sm:pl-4">
                      <span className="text-[10px] text-indigo-600 uppercase font-semibold">Target SLA</span>
                      <p className="font-bold text-indigo-950">{activeComplaint.assignedCrew.targetCompletion || 'Within 48h'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Before-and-After Repair Evidence & Citizen Verification Section */}
          {(activeComplaint.afterImage ||
            activeComplaint.status === 'repair_completed' ||
            activeComplaint.verificationStatus === 'awaiting_citizen' ||
            activeComplaint.verificationStatus === 'unsatisfactory_reported' ||
            activeComplaint.status === 'resolved') && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                      Proof of Work Audit
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Work Order #{activeComplaint.complaintId || activeComplaint.id}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
                    Before & After Repair Evidence
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Spatial photographic proof comparing citizen complaint evidence against municipal contractor asphalt restoration.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={
                      activeComplaint.verificationStatus === 'awaiting_citizen'
                        ? 'awaiting_citizen'
                        : activeComplaint.verificationStatus === 'unsatisfactory_reported'
                        ? 'unsatisfactory_reported'
                        : activeComplaint.status
                    }
                    size="md"
                  />
                </div>
              </div>

              {/* Side-by-Side Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Before Image */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                      <span>Before Repair (Citizen Evidence)</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {activeComplaint.reportedAt}
                    </span>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-64">
                    <img
                      src={activeComplaint.beforeImage || activeComplaint.imageUrl}
                      alt="Before Repair"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white p-2 rounded-lg text-[11px] flex items-center justify-between pointer-events-none">
                      <span className="font-semibold text-rose-400">Original Road Defect</span>
                      <span className="font-mono text-[10px] text-slate-300">
                        Severity: {activeComplaint.severity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* After Image */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>After Repair (Contractor Sign-off)</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {activeComplaint.repairCompletedAt
                        ? new Date(activeComplaint.repairCompletedAt).toLocaleDateString()
                        : 'Recently Completed'}
                    </span>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-64 flex items-center justify-center">
                    {activeComplaint.afterImage ? (
                      <>
                        <img
                          src={activeComplaint.afterImage}
                          alt="After Repair"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                        <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white p-2 rounded-lg text-[11px] flex items-center justify-between pointer-events-none">
                          <span className="font-semibold text-emerald-400">Asphalt Restoration Complete</span>
                          <span className="font-mono text-[10px] text-slate-300">
                            Crew: {activeComplaint.assignedCrew?.name || 'PWD Depot Unit'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 space-y-2 text-slate-400">
                        <Wrench className="w-8 h-8 mx-auto text-slate-500 animate-bounce" />
                        <p className="text-xs font-semibold text-slate-300">Repair in Progress</p>
                        <p className="text-[11px] text-slate-500 max-w-xs">
                          Field crew has been dispatched. After-repair photo will be uploaded upon asphalt compaction.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Repair Notes */}
              {activeComplaint.repairNotes && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wide text-[10px] block mb-1">
                    Crew Completion Notes
                  </span>
                  <p className="text-slate-800 italic">"{activeComplaint.repairNotes}"</p>
                </div>
              )}

              {/* Citizen Verification Interactive Actions */}
              {(activeComplaint.status === 'repair_completed' ||
                activeComplaint.verificationStatus === 'awaiting_citizen') && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 border border-purple-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-900">
                        Awaiting Citizen Verification
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Public Works road restoration is complete. As a citizen commuter or local resident, please verify whether the road hazard has been satisfactorily repaired.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      onClick={() => {
                        setShowVerifyModal('confirm');
                        setVerifyComment('');
                        setVerifyRating(5);
                        setVerifyError(null);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm text-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Repair (Pothole Fixed)</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowVerifyModal('unsatisfactory');
                        setVerifyComment('');
                        setVerifyRating(1);
                        setUnsatisfactoryImageFile(null);
                        setUnsatisfactoryPreview(null);
                        setVerifyError(null);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 transition-colors text-xs"
                    >
                      <ThumbsDown className="w-4 h-4 text-rose-600" />
                      <span>Report Repair Not Satisfactory</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Verified Success State */}
              {activeComplaint.verificationStatus === 'citizen_verified' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-900">
                      Repair Verified & Closed by Citizen
                    </p>
                    <p className="text-emerald-800 text-[11px]">
                      Verified by <strong className="text-emerald-950">{activeComplaint.verifiedBy || 'Citizen'}</strong>
                      {activeComplaint.verifiedAt && ` on ${new Date(activeComplaint.verifiedAt).toLocaleDateString()}`}.
                    </p>
                    {activeComplaint.citizenRating && (
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="text-[11px] font-semibold">Citizen Rating:</span>
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < activeComplaint.citizenRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {activeComplaint.verificationFeedback?.comment && (
                      <p className="text-emerald-800 text-[11px] italic mt-0.5">
                        "{activeComplaint.verificationFeedback.comment}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Unsatisfactory Dispute State */}
              {activeComplaint.verificationStatus === 'unsatisfactory_reported' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <p className="font-bold text-amber-900">
                      Repair Dispute: Escalated for Administrative Review
                    </p>
                    <p className="text-amber-800 text-[11px]">
                      A citizen reported that this repair is unsatisfactory. The complaint has been returned to the municipal review queue for quality re-inspection.
                    </p>
                    {activeComplaint.verificationFeedback?.comment && (
                      <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200 text-[11px]">
                        <span className="font-bold text-slate-700 block">Citizen Reason:</span>
                        <p className="text-slate-800 italic mt-0.5">"{activeComplaint.verificationFeedback.comment}"</p>
                      </div>
                    )}
                    {activeComplaint.verificationFeedback?.unsatisfactoryImage && (
                      <div className="pt-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Citizen Evidence Attached</span>
                        <img
                          src={activeComplaint.verificationFeedback.unsatisfactoryImage}
                          alt="Citizen dispute evidence"
                          className="w-24 h-24 object-cover rounded-lg border border-amber-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Approved State */}
              {activeComplaint.verificationStatus === 'admin_approved' && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-900">
                      Administrative Sign-off & Closure Complete
                    </p>
                    <p className="text-emerald-800 text-[11px]">
                      Approved by <strong className="text-emerald-950">{activeComplaint.verifiedBy || 'Municipal Authority'}</strong>. Work order officially certified and archived.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Vertical Timeline of Updates */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Municipal Action & Tracking Timeline</h3>
                <p className="text-xs text-slate-500">
                  Step-by-step audit trail from citizen registration to repair sign-off
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                {activeComplaint.timeline.length} Milestones
              </span>
            </div>

            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {activeComplaint.timeline.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isInProgress = step.status === 'in-progress';

                return (
                  <div key={idx} className="relative group">
                    {/* Bullet marker */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                          : isInProgress
                          ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                          : 'bg-slate-300 text-slate-600'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">
                            {step.step}
                          </h4>
                          {isInProgress && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                              Active Stage
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-slate-500">
                          {step.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {step.description}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">Authority:</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                          {step.actor}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Citizen Verification Modal */}
      {showVerifyModal && (
        <Modal
          isOpen={!!showVerifyModal}
          onClose={() => {
            if (!verifyLoading) {
              setShowVerifyModal(null);
              setVerifyError(null);
              setVerifySuccessMsg(null);
            }
          }}
          title={
            showVerifyModal === 'confirm'
              ? 'Confirm Pothole Repair (Citizen Verification)'
              : 'Report Repair Not Satisfactory (Civic Dispute)'
          }
          maxWidth="max-w-lg"
        >
          {verifySuccessMsg ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Verification Submitted</h4>
              <p className="text-xs text-slate-600">{verifySuccessMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs">
              {verifyError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {verifyError}
                </div>
              )}

              <p className="text-slate-600 leading-relaxed">
                {showVerifyModal === 'confirm'
                  ? 'Confirming this repair closes the municipal work order and credits the assigned asphalt maintenance unit.'
                  : 'If the road defect was not properly compacted, still has cavities, or poses continuing hazards, let the Public Works engineering depot know.'}
              </p>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Your Name / Identifier</label>
                <input
                  type="text"
                  value={verifyCitizenName}
                  onChange={(e) => setVerifyCitizenName(e.target.value)}
                  placeholder={activeComplaint?.reporterName || 'Citizen Commuter'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                />
              </div>

              {showVerifyModal === 'confirm' ? (
                <>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Rate Repair Quality (1 to 5 Stars)</label>
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setVerifyRating(star)}
                          className="p-1 hover:scale-110 transition-transform focus:outline-hidden"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= verifyRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-slate-500 font-semibold ml-2">
                        {verifyRating === 5 ? 'Excellent' : verifyRating >= 4 ? 'Good' : verifyRating >= 3 ? 'Acceptable' : 'Substandard'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Feedback Note (Optional)</label>
                    <textarea
                      rows={3}
                      value={verifyComment}
                      onChange={(e) => setVerifyComment(e.target.value)}
                      placeholder="e.g. Smooth asphalt finish, road is completely safe to drive on now."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Reason Repair is Unsatisfactory <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={verifyComment}
                      onChange={(e) => setVerifyComment(e.target.value)}
                      placeholder="e.g. Loose bitumen gravel left behind, cavity still concave (>4cm depth), or edge of pothole not bonded."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 outline-hidden bg-white resize-none"
                    />
                  </div>

                  {/* Optional Photo of Poor Repair */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">
                      Attach Photo Evidence (Optional)
                    </label>
                    {unsatisfactoryPreview ? (
                      <div className="relative h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                        <img
                          src={unsatisfactoryPreview}
                          alt="Unsatisfactory proof"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUnsatisfactoryImageFile(null);
                            setUnsatisfactoryPreview(null);
                          }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50">
                        <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-slate-600 font-semibold text-[11px]">Upload defect photo</span>
                        <span className="text-slate-400 text-[10px]">PNG, JPG, WebP up to 8MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUnsatisfactoryFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  disabled={verifyLoading}
                  onClick={() => setShowVerifyModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyLoading}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50 ${
                    showVerifyModal === 'confirm'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {verifyLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{showVerifyModal === 'confirm' ? 'Submit Confirmation' : 'Escalate Dispute'}</span>
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
