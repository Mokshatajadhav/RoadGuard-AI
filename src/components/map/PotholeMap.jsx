import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Filter,
  Layers,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldAlert,
  Eye,
  ArrowRight,
  Maximize2,
  Navigation,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';

// Helper: Get priority color hex
function getPriorityColor(priorityLabel) {
  const p = String(priorityLabel || '').toLowerCase();
  if (p === 'critical') return '#dc2626'; // rose-600
  if (p === 'high') return '#ea580c';     // orange-600
  if (p === 'medium') return '#0284c7';   // sky-600
  return '#16a34a';                       // emerald-600
}

// Helper: Create custom Leaflet pin icon for priority
function createMarkerIcon(priorityLabel, isSelected = false) {
  const color = getPriorityColor(priorityLabel);
  const isCritical = String(priorityLabel || '').toLowerCase() === 'critical';

  const html = `
    <div style="position: relative; width: 32px; height: 38px; display: flex; align-items: center; justify-content: center;">
      ${isCritical ? `
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${color}; opacity: 0.3; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      ` : ''}
      <svg width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3)); transform: ${isSelected ? 'scale(1.18)' : 'scale(1)'}; transition: transform 0.2s;">
        <path d="M15 0C6.71573 0 0 6.71573 0 15C0 24.5 15 38 15 38C15 38 30 24.5 30 15C30 6.71573 23.2843 0 15 0Z" fill="${color}"/>
        <circle cx="15" cy="14" r="6" fill="#ffffff"/>
        <circle cx="15" cy="14" r="3.5" fill="${color}"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -36],
  });
}

export default function PotholeMap({
  complaints = [],
  onSelectComplaint,
  height = '560px',
  showFilters = true,
  adminMode = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [showUnmappedDrawer, setShowUnmappedDrawer] = useState(false);

  // Separate complaints into valid GPS vs unmapped
  const { mappedComplaints, unmappedComplaints } = useMemo(() => {
    const mapped = [];
    const unmapped = [];

    complaints.forEach((c) => {
      // Do not display confirmed duplicates as separate physical potholes on the map
      if (c.duplicateReviewStatus === 'confirmed_duplicate' || Boolean(c.duplicateOf)) {
        return;
      }

      // Check if real GPS numbers exist
      const lat = c.latitude ?? c.coordinates?.lat;
      const lng = c.longitude ?? c.coordinates?.lng;

      const hasValidLat = typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
      const hasValidLng = typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;

      // Ensure it's not a dummy 0,0
      if (hasValidLat && hasValidLng && (lat !== 0 || lng !== 0)) {
        mapped.push({ ...c, resolvedLat: lat, resolvedLng: lng });
      } else {
        unmapped.push(c);
      }
    });

    return { mappedComplaints: mapped, unmappedComplaints: unmapped };
  }, [complaints]);

  // Filter mapped complaints
  const filteredMapped = useMemo(() => {
    return mappedComplaints.filter((c) => {
      const id = (c.complaintId || c.id || '').toLowerCase();
      const loc = (c.location || c.address || c.roadName || '').toLowerCase();
      const title = (c.title || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || id.includes(q) || loc.includes(q) || title.includes(q);

      // Priority filter
      const p = (c.priority || c.priorityLabel || '').toLowerCase();
      const matchesPriority =
        priorityFilter === 'All' || p === priorityFilter.toLowerCase();

      // Status filter
      const s = (c.status || '').toLowerCase();
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'submitted' && (s === 'submitted' || s.includes('pending'))) ||
        (statusFilter === 'verified' && (s === 'verified' || s.includes('under review'))) ||
        (statusFilter === 'assigned' && (s === 'assigned' || s.includes('crew'))) ||
        (statusFilter === 'in_progress' && (s === 'in_progress' || s.includes('progress'))) ||
        (statusFilter === 'repair_completed' && (s === 'repair_completed' || s.includes('completed'))) ||
        (statusFilter === 'resolved' && (s === 'resolved' || s.includes('closed')));

      // Severity filter
      const sev = (c.severity || '').toLowerCase();
      const matchesSeverity =
        severityFilter === 'All' ||
        (severityFilter === 'high' && (sev === 'high' || sev === 'severe')) ||
        (severityFilter === 'medium' && (sev === 'medium' || sev === 'moderate')) ||
        (severityFilter === 'low' && (sev === 'low' || sev === 'minor'));

      return matchesSearch && matchesPriority && matchesStatus && matchesSeverity;
    });
  }, [mappedComplaints, searchQuery, priorityFilter, statusFilter, severityFilter]);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: Bangalore coordinates [12.9716, 77.5946]
      const map = L.map(mapContainerRef.current, {
        center: [12.9716, 77.5946],
        zoom: 12,
        zoomControl: false,
      });

      // Top-right zoom control
      L.control.zoom({ position: 'topright' }).addTo(map);

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Layer group for markers
      const markersLayer = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update map markers when filtered complaints change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (filteredMapped.length === 0) return;

    const latLngs = [];

    filteredMapped.forEach((c) => {
      const lat = c.resolvedLat;
      const lng = c.resolvedLng;
      latLngs.push([lat, lng]);

      const isSelected = selectedComplaintId === (c.complaintId || c.id);
      const icon = createMarkerIcon(c.priority || c.priorityLabel, isSelected);

      const marker = L.marker([lat, lng], { icon });

      // Generate HTML popup content
      const cId = c.complaintId || c.id;
      const cTitle = c.title || 'Road Hazard';
      const cLocation = c.location || c.address || c.roadName || 'City Sector';
      const cStatus = c.status || 'submitted';
      const cPriority = c.priority || c.priorityLabel || 'Medium';
      const cSeverity = c.severity || 'Medium';
      const cImg = c.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80';
      const cDetections = c.aiAnalysis?.detectionCount ?? c.aiAnalysis?.detections?.length ?? 0;
      const cHazard = c.aiAnalysis?.hazardScore ?? c.priorityScore ?? 50;
      const isRealAi = Boolean(c.aiAnalysis?.isRealInference);
      const isSuspectedDuplicate = Boolean(
        c.duplicateReviewStatus === 'flagged' ||
        (!c.duplicateOf && c.duplicateMatchScore >= 50 && c.duplicateReviewStatus !== 'marked_distinct')
      );
      const supportCount = c.supportCount || 1;

      const isVerifiedClosed = c.status === 'resolved' || c.verificationStatus === 'citizen_verified' || c.verificationStatus === 'admin_approved';
      const hasAfterImage = Boolean(c.afterImage);

      const popupHtml = `
        <div style="font-family: inherit; width: 260px; padding: 2px;">
          <div style="position: relative; height: 110px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; background: #0f172a;">
            <img src="${cImg}" alt="${cTitle}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80';" />
            <div style="position: absolute; top: 6px; left: 6px; background: rgba(15, 23, 42, 0.85); color: #fff; font-family: monospace; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">
              ${cId}
            </div>
            ${isVerifiedClosed ? `
              <div style="position: absolute; top: 6px; right: 6px; background: rgba(16, 185, 129, 0.95); color: #fff; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">
                ✓ Verified Closed
              </div>
            ` : isSuspectedDuplicate ? `
              <div style="position: absolute; top: 6px; right: 6px; background: rgba(225, 29, 72, 0.95); color: #fff; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">
                ⚠️ Dup ${c.duplicateMatchScore}%
              </div>
            ` : ''}
            <div style="position: absolute; bottom: 6px; right: 6px; background: rgba(15, 23, 42, 0.85); color: #34d399; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">
              ${isRealAi ? '⚡ YOLOv8 Live' : 'AI Simulated'}
            </div>
          </div>
          <h4 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">${cTitle}</h4>
          <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">📍 ${cLocation}</p>
          
          ${hasAfterImage ? `
            <div style="margin-bottom: 6px; background: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff; font-size: 10px; font-weight: bold; padding: 3px 6px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
              <span>📸 Repair Proof Logged</span>
              <span style="color: #059669; font-size: 9px;">${isVerifiedClosed ? 'Citizen Confirmed' : 'In Review'}</span>
            </div>
          ` : ''}

          ${supportCount > 1 ? `
            <div style="margin-bottom: 6px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-size: 10px; font-weight: bold; padding: 3px 6px; border-radius: 4px;">
              👍 ${supportCount} Citizen Reports (High Civic Endorsement)
            </div>
          ` : ''}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px; font-size: 10px;">
            <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 4px;">
              <span style="color: #64748b; display: block;">Status</span>
              <strong style="color: #0f172a; text-transform: capitalize;">${cStatus.replace('_', ' ')}</strong>
            </div>
            <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 4px;">
              <span style="color: #64748b; display: block;">Priority</span>
              <strong style="color: ${getPriorityColor(cPriority)};">${cPriority}</strong>
            </div>
            <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 4px;">
              <span style="color: #64748b; display: block;">Severity</span>
              <strong style="color: #0f172a;">${cSeverity}</strong>
            </div>
            <div style="background: #f1f5f9; padding: 4px 6px; border-radius: 4px;">
              <span style="color: #64748b; display: block;">Hazard Index</span>
              <strong style="color: #dc2626;">${cHazard}/100</strong>
            </div>
          </div>

          <div style="display: flex; gap: 4px;">
            <a href="/track?id=${cId}" style="flex: 1; text-align: center; background: #0f172a; color: #fff; font-size: 11px; font-weight: bold; padding: 6px; border-radius: 6px; text-decoration: none; display: block;">
              Track Grievance →
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280, className: 'roadguard-map-popup' });

      marker.on('click', () => {
        setSelectedComplaintId(cId);
        if (onSelectComplaint) onSelectComplaint(c);
      });

      markersLayer.addLayer(marker);
    });

    // Auto-fit map viewport to encompass all visible markers
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredMapped, selectedComplaintId, onSelectComplaint]);

  // Center on complaint if selected from outside
  const centerOnComplaint = (c) => {
    const lat = c.resolvedLat ?? c.latitude ?? c.coordinates?.lat;
    const lng = c.resolvedLng ?? c.longitude ?? c.coordinates?.lng;
    if (lat && lng && mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
      setSelectedComplaintId(c.complaintId || c.id);
      if (onSelectComplaint) onSelectComplaint(c);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Map Control Bar & Filters */}
      {showFilters && (
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search mapped potholes by ID, road or locality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden bg-white"
              />
            </div>

            {/* Live Counts & Status Pill */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                📍 <strong>{filteredMapped.length}</strong> of {mappedComplaints.length} Mapped
              </span>

              {unmappedComplaints.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowUnmappedDrawer((v) => !v)}
                  className={`font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
                    showUnmappedDrawer
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{unmappedComplaints.length} Unmapped (No GPS)</span>
                  {showUnmappedDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">🔴 Critical</option>
              <option value="High">🟠 High</option>
              <option value="Medium">🔵 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="verified">Under Review</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">Repair in Progress</option>
              <option value="repair_completed">Repair Completed</option>
              <option value="resolved">Verified / Closed</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="All">All Severities</option>
              <option value="high">High / Severe</option>
              <option value="medium">Medium / Moderate</option>
              <option value="low">Low / Minor</option>
            </select>

            {(searchQuery || priorityFilter !== 'All' || statusFilter !== 'All' || severityFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPriorityFilter('All');
                  setStatusFilter('All');
                  setSeverityFilter('All');
                }}
                className="text-[11px] font-semibold text-rose-600 hover:underline px-2 py-0.5"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Map Canvas Area */}
      <div className="relative w-full" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Legend Overlay at Bottom-Left */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200/90 shadow-md text-xs space-y-1.5 pointer-events-auto">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
            Priority Legend
          </span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Critical
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span> High
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span> Medium
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Low
            </span>
          </div>
        </div>

        {/* Empty Search Overlay */}
        {filteredMapped.length === 0 && (
          <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
            <h4 className="font-bold text-slate-900 text-sm">No Potholes Match Selected Filters</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-0.5">
              Try adjusting the priority or status filters above to view active road grievance pins.
            </p>
          </div>
        )}
      </div>

      {/* Drawer: Unmapped Complaints Fallback (No GPS records) */}
      {showUnmappedDrawer && unmappedComplaints.length > 0 && (
        <div className="p-4 border-t border-amber-200 bg-amber-50/60 text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <Info className="w-4 h-4 text-amber-700" />
              <span>Grievances with Manual Address Only (No GPS Pin Recorded)</span>
            </div>
            <span className="text-amber-800 text-[11px]">
              {unmappedComplaints.length} records cannot be pinned on map
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {unmappedComplaints.map((c) => {
              const cId = c.complaintId || c.id;
              return (
                <div
                  key={cId}
                  className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between gap-1.5"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{cId}</span>
                      <PriorityBadge priority={c.priority} size="sm" />
                    </div>
                    <p className="font-semibold text-slate-800 truncate">{c.title}</p>
                    <p className="text-slate-500 text-[11px] truncate">📍 {c.location || c.address}</p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <StatusBadge status={c.status} size="sm" />
                    <Link
                      to={`/track?id=${cId}`}
                      className="text-slate-900 hover:text-emerald-700 font-bold inline-flex items-center gap-0.5 text-[11px]"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
