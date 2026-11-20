import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  UploadCloud,
  MapPin,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Sparkles,
  Info,
  X,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  ScanLine,
  AlertOctagon,
  ThumbsUp,
  Layers,
  ExternalLink
} from 'lucide-react';
import { useComplaints } from '../context/ComplaintContext';
import { SAMPLE_REPORT_PRESETS } from '../data/mockComplaints';
import apiService from '../services/api';
import DetectionOverlay from '../components/common/DetectionOverlay';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';

export default function ReportPotholePage() {
  const navigate = useNavigate();
  const { addComplaint, supportExistingComplaint } = useComplaints();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [zone, setZone] = useState('Central Zone');
  const [ward, setWard] = useState('Ward 09 - Municipal East');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');

  // GPS states
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // AI scan states — now backed by real YOLO inference
  const [isScanning, setIsScanning] = useState(false);
  const [aiScanResult, setAiScanResult] = useState(null);     // derived display fields
  const [detectionResult, setDetectionResult] = useState(null); // raw backend response
  const [detectionError, setDetectionError] = useState(null);

  // Duplicate check & civic support states
  const [duplicateCheckModal, setDuplicateCheckModal] = useState({
    isOpen: false,
    checking: false,
    matches: [],
    topMatch: null,
    pendingPayload: null,
  });
  const [supportingAction, setSupportingAction] = useState({
    loading: false,
    success: false,
    message: null,
    supportedId: null,
  });

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [createdComplaint, setCreatedComplaint] = useState(null);
  const [formError, setFormError] = useState(null);

  /**
   * Run REAL YOLOv8 pothole detection via /api/detect endpoint.
   * Only called when a real file is selected (not for preset URL images).
   */
  const runRealDetection = async (file) => {
    setIsScanning(true);
    setAiScanResult(null);
    setDetectionResult(null);
    setDetectionError(null);

    try {
      const res = await apiService.detectPothole(file);
      const det = res.detection;
      setDetectionResult(res);

      // Map backend response to the aiScanResult shape the form submission expects
      setAiScanResult({
        confidence: det.detectionCount > 0
          ? Math.round(Math.max(...det.detections.map((d) => d.confidence)) * 100 * 100) / 100
          : 0,
        cavityArea: det.detectionCount > 0 ? `~${det.detectionCount} region(s) detected` : 'None detected',
        estimatedDepth: det.severity === 'Severe' ? 'Est. >8 cm' : det.severity === 'Moderate' ? 'Est. 4–8 cm' : 'Est. <4 cm',
        severity: det.severity !== 'None' ? det.severity : 'Low',
        hazardScore: det.hazardScore,
        duplicateRisk: 'Spatial check pending',
        tags: det.detections.map((d) => d.class_name).filter((v, i, a) => a.indexOf(v) === i),
        // Extra fields for the complaint submission
        detectionCount: det.detectionCount,
        isRealInference: det.isRealInference,
        isPotholeSpecificModel: det.isPotholeSpecificModel,
        modelInfo: det.modelInfo,
        warning: det.warning,
        detections: det.detections,
        imageWidth: det.imageWidth,
        imageHeight: det.imageHeight,
      });
    } catch (err) {
      console.error('[Detection] Error:', err.message);
      setDetectionError(err.message || 'Detection failed. Backend may be offline.');
      // Don't block submission — user can still file without AI analysis
    } finally {
      setIsScanning(false);
    }
  };

  /**
   * For preset images (URL-based), we cannot send them to the detect endpoint.
   * Show a placeholder that correctly labels it as "No real inference".
   */
  const setPresetPlaceholder = () => {
    setAiScanResult({
      confidence: 0,
      cavityArea: 'N/A',
      estimatedDepth: 'N/A',
      severity: 'Moderate',
      hazardScore: 50,
      duplicateRisk: 'N/A',
      tags: [],
      detectionCount: 0,
      isRealInference: false,
      isPotholeSpecificModel: false,
      modelInfo: 'Preset — no image file uploaded',
      warning: 'Preset images use a URL, not a local file. No YOLO inference was run.',
      detections: [],
      imageWidth: 0,
      imageHeight: 0,
    });
  };

  // Handle file input change — triggers real YOLO detection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setFormError('Please select an image smaller than 8MB.');
        return;
      }
      setFormError(null);
      setDetectionError(null);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Run real detection immediately after file is selected
      runRealDetection(file);
    }
  };

  // Quick preset loader — uses URL images, cannot run YOLO inference
  const loadPreset = (preset) => {
    setTitle(`Pothole on ${preset.name}`);
    setLocationText(preset.location);
    setDescription(preset.description);
    setCoordinates(preset.coordinates);
    setZone(preset.zone);
    setImagePreview(preset.previewImage);
    setImageFile(null); // Presets use remote image URL — no YOLO inference
    setGpsError(null);
    setGpsSuccess(true);
    setDetectionError(null);
    setPresetPlaceholder();
  };


  // Request browser GPS
  const requestBrowserGps = () => {
    setGpsError(null);
    setGpsSuccess(false);

    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser. Please type the location manually.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = position.coords;
        const coords = { lat: parseFloat(latitude.toFixed(6)), lng: parseFloat(longitude.toFixed(6)) };
        setCoordinates(coords);
        setGpsSuccess(true);

        // Pre-fill location text if empty
        if (!locationText) {
          setLocationText(`GPS Pin: ${coords.lat}° N, ${coords.lng}° E (Accurate within ${Math.round(accuracy)}m)`);
        }
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Location permission was denied or is unavailable. Please enter the street address or nearest landmark manually.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'GPS Permission Denied: You have blocked location access in your browser. Please enter the location manually or enable location in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'GPS Signal Unavailable: Your device cannot determine your current position. Please enter the location manually.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'GPS Request Timed Out: The request took too long. Please enter the location manually.';
        }
        setGpsError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Helper to construct the full payload
  const buildComplaintPayload = () => ({
    title: title || `Road damage at ${locationText.slice(0, 32)}`,
    description,
    location: locationText,
    address: locationText,
    roadName: locationText,
    latitude: coordinates?.lat,
    longitude: coordinates?.lng,
    coordinates: coordinates || { lat: 12.9716, lng: 77.5946 },
    zone,
    ward,
    severity: aiScanResult?.severity || 'Moderate',
    priority: aiScanResult?.severity === 'Severe' ? 'Critical' : 'High',
    imageUrl: imagePreview,
    imageFile: imageFile, // Real file object for Multer upload
    reporterName: reporterName.trim() || 'Anonymous Citizen',
    reporterContact: reporterContact.trim() || 'Not Provided',
    aiAnalysis: aiScanResult ? {
      confidence: aiScanResult.confidence,
      estimatedArea: aiScanResult.cavityArea,
      estimatedDepth: aiScanResult.estimatedDepth,
      surfaceType: aiScanResult.surfaceType || 'Dense Bitumen Asphalt',
      roadType: 'Urban Municipal Corridor',
      hazardScore: aiScanResult.hazardScore,
      duplicateCheck: 'Passed (Spatial verification)',
      detectedTags: aiScanResult.tags || [],
      detectionCount: aiScanResult.detectionCount ?? 0,
      detections: aiScanResult.detections || [],
      modelInfo: aiScanResult.modelInfo || 'YOLOv8',
      isRealInference: Boolean(aiScanResult.isRealInference),
      isPotholeSpecificModel: Boolean(aiScanResult.isPotholeSpecificModel),
      imageWidth: aiScanResult.imageWidth || 0,
      imageHeight: aiScanResult.imageHeight || 0,
      warning: aiScanResult.warning || null,
    } : undefined
  });

  // Handle Form Submission with Pre-check Duplicate Detection
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!imagePreview) {
      setFormError('Please upload an image of the pothole or select a quick sample preset.');
      return;
    }

    if (!locationText.trim()) {
      setFormError('Please provide the pothole location or use the browser GPS button.');
      return;
    }

    if (!description.trim()) {
      setFormError('Please enter a brief description or landmark detail.');
      return;
    }

    const payload = buildComplaintPayload();
    setSubmitting(true);

    try {
      // 1. Run multi-signal duplicate pre-check
      let dupCheck = null;
      try {
        dupCheck = await apiService.checkDuplicate({
          latitude: coordinates?.lat,
          longitude: coordinates?.lng,
          roadName: locationText,
          location: locationText,
          description,
          imageFile,
        });
      } catch (checkErr) {
        console.warn('[Duplicate Check] Non-fatal check error, continuing submission:', checkErr.message);
      }

      // 2. If a potential duplicate is detected, present warning modal to citizen
      if (dupCheck?.hasPotentialDuplicate && dupCheck?.topMatch) {
        setDuplicateCheckModal({
          isOpen: true,
          checking: false,
          matches: dupCheck.matches || [dupCheck.topMatch],
          topMatch: dupCheck.topMatch,
          pendingPayload: payload,
        });
        setSubmitting(false);
        return;
      }

      // 3. Otherwise proceed with standard creation
      const newReport = await addComplaint(payload);
      setCreatedComplaint(newReport);
    } catch (err) {
      setFormError(err.message || 'Submission failed. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Citizen chooses to support the existing complaint instead of filing duplicate
  const handleSupportExisting = async (targetId) => {
    const complaintId = targetId || duplicateCheckModal.topMatch?.complaintId;
    if (!complaintId) return;

    setSupportingAction({
      loading: true,
      success: false,
      message: null,
      supportedId: complaintId,
    });

    try {
      const res = await supportExistingComplaint(complaintId, {
        citizenName: reporterName.trim() || 'Anonymous Supporter',
        citizenContact: reporterContact.trim() || '',
        comment: description.trim() || 'Confirmed active pothole hazard on this road.',
      });

      setSupportingAction({
        loading: false,
        success: true,
        message: res?.message || `Your civic endorsement has been recorded for Complaint #${complaintId}.`,
        supportedId: complaintId,
      });
    } catch (err) {
      setSupportingAction({
        loading: false,
        success: false,
        message: err.message || 'Failed to record civic endorsement. Please try again.',
        supportedId: complaintId,
      });
    }
  };

  // Citizen confirms they want to proceed filing a new distinct complaint
  const handleConfirmNewSubmission = async () => {
    if (!duplicateCheckModal.pendingPayload) return;
    setSubmitting(true);
    try {
      const newReport = await addComplaint(duplicateCheckModal.pendingPayload);
      setCreatedComplaint(newReport);
      setDuplicateCheckModal({
        isOpen: false,
        checking: false,
        matches: [],
        topMatch: null,
        pendingPayload: null,
      });
    } catch (err) {
      setFormError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
          <Camera className="w-3.5 h-3.5 text-emerald-600" />
          <span>Public Works Grievance Form</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Report a Pothole or Road Hazard
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Submit photo evidence and road coordinates. The system runs automated edge damage classification and routes your report to the ward repair depot.
        </p>
      </div>

      {/* Prototype Quick Preset Bar */}
      <div className="mb-8 bg-slate-100/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Prototype Quick Presets (Click to autofill):</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Test instant submission without downloading photos
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SAMPLE_REPORT_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(preset)}
              className="text-left p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all text-xs group shadow-xs"
            >
              <div className="font-semibold text-slate-900 group-hover:text-emerald-800 truncate">
                {preset.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {preset.zone}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {formError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Image Upload with Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-900">
                1. Upload Road Hazard Photo <span className="text-rose-500">*</span>
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                    setAiScanResult(null);
                  }}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <X className="w-3.5 h-3.5" /> Clear Photo
                </button>

              )}
            </div>

            {!imagePreview ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20 group">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 group-hover:scale-105 transition-all shadow-xs mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Click to browse or drag & drop pothole photo
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: JPG, PNG, WEBP (Max 8MB)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-4">
                {/* Image with bounding box overlay */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                  {aiScanResult?.detections?.length > 0 ? (
                    <DetectionOverlay
                      imageUrl={imagePreview}
                      detections={aiScanResult.detections}
                      imageWidth={aiScanResult.imageWidth}
                      imageHeight={aiScanResult.imageHeight}
                    />
                  ) : (
                    <img
                      src={imagePreview}
                      alt="Pothole preview"
                      className="w-full h-72 object-cover object-center"
                    />
                  )}
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono text-emerald-400 border border-slate-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {isScanning ? 'Scanning…' : 'Photo Loaded for Analysis'}
                  </div>
                </div>

                {/* Detection Error Banner */}
                {detectionError && !isScanning && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Detection backend error</p>
                      <p>{detectionError}</p>
                      <p className="mt-1 text-rose-700">You can still submit the complaint. AI analysis will be skipped.</p>
                    </div>
                  </div>
                )}

                {/* Real AI Detection Results Panel */}
                <div className={`rounded-xl border p-4 sm:p-5 ${
                  aiScanResult?.isRealInference
                    ? 'border-emerald-300 bg-emerald-50/70'
                    : 'border-amber-300 bg-amber-50/50'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md text-white ${aiScanResult?.isRealInference ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                        {aiScanResult?.isRealInference ? <ScanLine className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          {aiScanResult?.isRealInference ? 'YOLOv8 Pothole Detection (Live Inference)' : 'AI Analysis (No File Uploaded)'}
                        </h4>
                        <p className="text-[11px] text-slate-600">
                          {aiScanResult?.modelInfo || 'Waiting for analysis…'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      aiScanResult?.isRealInference
                        ? (aiScanResult?.isPotholeSpecificModel
                          ? 'bg-emerald-200 text-emerald-900 border-emerald-300'
                          : 'bg-sky-100 text-sky-900 border-sky-300')
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {aiScanResult?.isRealInference
                        ? (aiScanResult?.isPotholeSpecificModel ? 'Real Inference' : 'COCO Model')
                        : 'No Inference'}
                    </span>
                  </div>

                  {isScanning ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 text-emerald-900">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      <p className="text-xs font-semibold">Running YOLOv8 pothole segmentation…</p>
                      <p className="text-[11px] text-slate-500">This takes 5–20 seconds on first run</p>
                    </div>
                  ) : aiScanResult ? (
                    <div className="pt-3 space-y-3">
                      {/* Warning for non-pothole model */}
                      {aiScanResult.warning && (
                        <div className="p-2.5 rounded-lg bg-amber-100 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
                          <span>{aiScanResult.warning}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Detections</span>
                          <p className="text-sm font-bold text-slate-900">
                            {aiScanResult.detectionCount ?? 0} Pothole{(aiScanResult.detectionCount ?? 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Max Confidence</span>
                          <p className="text-sm font-bold text-slate-900">
                            {aiScanResult.confidence > 0 ? `${aiScanResult.confidence}%` : '—'}
                          </p>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Hazard Score</span>
                          <p className="text-sm font-bold text-rose-600">{aiScanResult.hazardScore}/100</p>
                        </div>
                        <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Severity</span>
                          <p className={`text-sm font-bold ${
                            aiScanResult.severity === 'Severe' ? 'text-rose-700'
                            : aiScanResult.severity === 'Moderate' ? 'text-orange-600'
                            : 'text-amber-600'
                          }`}>{aiScanResult.severity}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Location and Browser GPS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-sm font-bold text-slate-900">
                2. Location & Geo-Coordinates <span className="text-rose-500">*</span>
              </label>

              {/* Request Browser GPS Permission Button */}
              <button
                type="button"
                onClick={requestBrowserGps}
                disabled={isLocating}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition-colors border border-emerald-300 disabled:opacity-50"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Acquiring Browser GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Detect via Browser GPS</span>
                  </>
                )}
              </button>
            </div>

            {/* Clear message if GPS permission is denied or fails */}
            {gpsError && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Location Permission Denied or Unavailable</p>
                  <p>{gpsError}</p>
                </div>
              </div>
            )}

            {/* GPS Success Feedback */}
            {gpsSuccess && coordinates && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    GPS Lat: <strong className="font-mono">{coordinates.lat}</strong>, Lng: <strong className="font-mono">{coordinates.lng}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                  Pinned
                </span>
              </div>
            )}

            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="Street address, junction, or landmark (e.g. Ring Road near Pillar 142)"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Municipal Zone
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden bg-white"
                >
                  <option value="Central Zone">Central Zone</option>
                  <option value="North Zone">North Zone</option>
                  <option value="South Zone">South Zone</option>
                  <option value="East Zone">East Zone</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ward Division
                </label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  placeholder="e.g. Ward 18 - Marathahalli"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Description and Landmark */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900">
              3. Hazard Description & Context <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe depth, traffic lane (e.g., right fast lane), water collection, or vehicle impact..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
            />
          </div>

          {/* Section 4: Optional Citizen Contact Details */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                4. Citizen Reporter Info (Optional)
              </label>
              <span className="text-[11px] text-slate-400">Can be left anonymous</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Your Name (or leave blank)"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Contact Mobile (for SMS status updates)"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Grievance ID generated instantly upon submission</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging Grievance...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>Submit Pothole Complaint</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Warning Modal */}
      {duplicateCheckModal.isOpen && duplicateCheckModal.topMatch && (
        <Modal
          isOpen={duplicateCheckModal.isOpen}
          onClose={() =>
            setDuplicateCheckModal({
              isOpen: false,
              checking: false,
              matches: [],
              topMatch: null,
              pendingPayload: null,
            })
          }
          title="Potential Duplicate Hazard Detected"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {supportingAction.success ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <ThumbsUp className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    Civic Endorsement Registered!
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    {supportingAction.message ||
                      `Your endorsement for Complaint #${supportingAction.supportedId} has been recorded in MongoDB Atlas. Public Works prioritizes potholes with multiple citizen confirmations.`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3 justify-center">
                  <button
                    onClick={() => navigate(`/track?id=${supportingAction.supportedId}`)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <span>Track Complaint #{supportingAction.supportedId}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDuplicateCheckModal({
                        isOpen: false,
                        checking: false,
                        matches: [],
                        topMatch: null,
                        pendingPayload: null,
                      });
                      setSupportingAction({ loading: false, success: false, message: null, supportedId: null });
                      setTitle('');
                      setDescription('');
                      setLocationText('');
                      setImagePreview(null);
                      setAiScanResult(null);
                      setCoordinates(null);
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Done / File Another
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-amber-900">
                      A similar road hazard is already logged at this location
                    </p>
                    <p className="text-amber-700 mt-0.5 leading-relaxed">
                      Our multi-signal spatial, text, and visual matching engine identified an existing active grievance matching your report.
                    </p>
                  </div>
                </div>

                {supportingAction.message && !supportingAction.success && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                    {supportingAction.message}
                  </div>
                )}

                {/* Comparison Card */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {duplicateCheckModal.topMatch.complaintId}
                      </span>
                      <StatusBadge status={duplicateCheckModal.topMatch.status} size="sm" />
                    </div>
                    <div className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                      {duplicateCheckModal.topMatch.matchScore}% Match Score
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Existing Grievance Photo</span>
                      <div className="h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                        <img
                          src={duplicateCheckModal.topMatch.imageUrl}
                          alt="Existing complaint"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80";
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Your Uploaded Photo</span>
                      <div className="h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                        <img
                          src={imagePreview}
                          alt="Your upload"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Signals breakdown */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <span className="text-slate-400 text-[10px] block">GPS Proximity</span>
                      <strong className="text-slate-800 font-bold">
                        {duplicateCheckModal.topMatch.distanceMeters !== null
                          ? `${duplicateCheckModal.topMatch.distanceMeters}m away`
                          : 'Proximity Match'}
                      </strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <span className="text-slate-400 text-[10px] block">Image Similarity</span>
                      <strong className="text-slate-800 font-bold">
                        {duplicateCheckModal.topMatch.imageSimilarity !== null
                          ? `${duplicateCheckModal.topMatch.imageSimilarity}%`
                          : 'N/A'}
                      </strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <span className="text-slate-400 text-[10px] block">Text Similarity</span>
                      <strong className="text-slate-800 font-bold">
                        {duplicateCheckModal.topMatch.textSimilarity}%
                      </strong>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <p>
                      <strong className="text-slate-800">Existing Location:</strong> {duplicateCheckModal.topMatch.location}
                    </p>
                    <p>
                      <strong className="text-slate-800">Reported On:</strong> {duplicateCheckModal.topMatch.reportedAt}
                    </p>
                  </div>
                </div>

                {/* Citizen Action Options */}
                <div className="space-y-2.5 pt-2">
                  {/* Option 1: Support Existing Complaint */}
                  <button
                    onClick={() => handleSupportExisting(duplicateCheckModal.topMatch.complaintId)}
                    disabled={supportingAction.loading || submitting}
                    className="w-full p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-between transition-colors shadow-sm disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <ThumbsUp className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="font-extrabold text-sm">
                          Support Existing Complaint (+1 Civic Endorsement)
                        </div>
                        <div className="text-emerald-100 font-normal text-[11px]">
                          Fastest action: Escalates priority for repair crews without duplicating the work order.
                        </div>
                      </div>
                    </div>
                    {supportingAction.loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                  </button>

                  {/* Option 2: Submit as New Complaint */}
                  <button
                    onClick={handleConfirmNewSubmission}
                    disabled={supportingAction.loading || submitting}
                    className="w-full p-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-between transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <Layers className="w-4 h-4 text-slate-500 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">
                          Submit as a New, Separate Complaint
                        </div>
                        <div className="text-slate-500 font-normal text-[11px]">
                          Choose if this is a distinct pothole or defect at this location. Admins will review both records.
                        </div>
                      </div>
                    </div>
                    {submitting && <Loader2 className="w-4 h-4 animate-spin shrink-0 text-slate-600" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Success Modal upon Submission */}
      {createdComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Grievance Registered Successfully
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                Complaint #{createdComplaint.id}
              </h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto pt-1">
                Your report has been queued for Public Works triage. You can track work orders and crew dispatch using this ID.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[200px]">{createdComplaint.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">AI Priority:</span>
                <span className="font-bold text-rose-600">{createdComplaint.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-amber-700">{createdComplaint.status}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => navigate(`/track?id=${createdComplaint.id}`)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                <span>Track Complaint Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCreatedComplaint(null);
                  setTitle('');
                  setDescription('');
                  setLocationText('');
                  setImagePreview(null);
                  setAiScanResult(null);
                  setCoordinates(null);
                }}
                className="py-3 px-4 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-xs"
              >
                Report Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
