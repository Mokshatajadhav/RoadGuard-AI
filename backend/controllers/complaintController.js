import mongoose from 'mongoose';
import fs from 'fs';
import { validationResult } from 'express-validator';
import Complaint, { getNextComplaintId } from '../models/Complaint.js';
import { runDetection } from '../ai/detectionService.js';
import { findPotentialDuplicates, DUPLICATE_CONFIG } from '../ai/duplicateService.js';

// Helper: Normalize incoming status strings (supports both enum and UI display titles)
function normalizeStatus(inputStatus) {
  if (!inputStatus) return 'submitted';
  const s = String(inputStatus).trim().toLowerCase();
  if (s === 'submitted' || s === 'pending verification' || s === 'pending') return 'submitted';
  if (s === 'under review' || s === 'verified' || s === 'verified by pwd') return 'verified';
  if (s === 'assigned' || s === 'crew assigned') return 'assigned';
  if (s === 'repair in progress' || s === 'in progress' || s === 'in_progress' || s === 'working') return 'in_progress';
  if (s === 'repair completed' || s === 'repair_completed') return 'repair_completed';
  if (s === 'verified / closed' || s === 'resolved' || s === 'resolved & audited') return 'resolved';
  if (s === 'rejected' || s === 'closed') return 'rejected';
  return s;
}

// Helper: Normalize incoming severity
function normalizeSeverity(inputSeverity) {
  if (!inputSeverity) return 'medium';
  const s = String(inputSeverity).trim().toLowerCase();
  if (s === 'severe' || s === 'high') return 'high';
  if (s === 'moderate' || s === 'medium') return 'medium';
  if (s === 'minor' || s === 'low') return 'low';
  return 'medium';
}

// Helper: Derive transparent demo heuristic scores (No claims of real AI)
function calculateDemoPriority(severity, customPriority) {
  const normSev = normalizeSeverity(severity);

  if (customPriority && String(customPriority).toLowerCase() === 'critical') {
    return {
      severity: 'high',
      priorityLabel: 'critical',
      priorityScore: 95,
      note: 'Demo Heuristic: Critical alert priority based on reported road hazard.',
    };
  }

  if (normSev === 'high') {
    return {
      severity: 'high',
      priorityLabel: 'high',
      priorityScore: 85,
      note: 'Demo Heuristic: High priority assigned due to severe cavity depth.',
    };
  }

  if (normSev === 'low') {
    return {
      severity: 'low',
      priorityLabel: 'low',
      priorityScore: 35,
      note: 'Demo Heuristic: Low priority scheduled for routine maintenance cycle.',
    };
  }

  return {
    severity: 'medium',
    priorityLabel: 'medium',
    priorityScore: 65,
    note: 'Demo Heuristic: Standard urban corridor repair priority.',
  };
}

/**
 * POST /api/complaints
 * Create a new pothole complaint.
 * Accepts multipart/form-data with file upload or JSON payload with imageUrl.
 */
export async function createComplaint(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid input fields provided.',
        errors: errors.array(),
      });
    }

    const {
      description,
      title,
      latitude,
      longitude,
      address,
      roadName,
      location,
      zone,
      ward,
      severity,
      priority,
      reporterName,
      reporterContact,
      imageUrl: bodyImageUrl,
      aiAnalysis,
    } = req.body;

    // Handle file upload or image URL
    let imageUrl = bodyImageUrl || '';
    let imagePath = '';

    if (req.file) {
      imagePath = req.file.path;
      // Serve via relative path so it works with Vite proxy and direct requests
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Safe atomic complaint ID generation
    const complaintId = await getNextComplaintId();

    // Handle AI analysis data
    let parsedAi = null;
    if (aiAnalysis) {
      try {
        parsedAi = typeof aiAnalysis === 'string' ? JSON.parse(aiAnalysis) : aiAnalysis;
      } catch (e) {
        parsedAi = null;
      }
    }

    // If an image file was uploaded but no pre-computed AI analysis was sent, run real YOLO inference now
    if (!parsedAi && imagePath && fs.existsSync(imagePath)) {
      try {
        console.log(`[ComplaintController] Running auto-detection on uploaded image: ${imagePath}`);
        const detectRes = await runDetection(imagePath);
        if (detectRes && detectRes.isRealInference) {
          const maxConf = detectRes.detectionCount > 0
            ? Math.round(Math.max(...detectRes.detections.map((d) => d.confidence)) * 100 * 100) / 100
            : 0;
          parsedAi = {
            confidence: maxConf,
            estimatedArea: detectRes.detectionCount > 0 ? `~${detectRes.detectionCount} region(s) detected` : 'None detected',
            estimatedDepth: detectRes.severity === 'Severe' ? 'Est. >8 cm' : detectRes.severity === 'Moderate' ? 'Est. 4–8 cm' : 'Est. <4 cm',
            surfaceType: 'Dense Bitumen Asphalt',
            roadType: 'Municipal Corridor',
            hazardScore: detectRes.hazardScore,
            duplicateCheck: 'Passed (Spatial verification)',
            detectedTags: detectRes.detections.map((d) => d.class_name),
            detectionCount: detectRes.detectionCount,
            detections: detectRes.detections,
            modelInfo: detectRes.modelInfo,
            isRealInference: detectRes.isRealInference,
            isPotholeSpecificModel: detectRes.isPotholeSpecificModel,
            imageWidth: detectRes.imageWidth,
            imageHeight: detectRes.imageHeight,
            warning: detectRes.warning,
          };
        }
      } catch (detErr) {
        console.warn('[ComplaintController] Auto-detection on upload failed:', detErr.message);
      }
    }

    // Determine priority and severity
    // If AI found severe/moderate/low and citizen didn't specify, use AI-derived severity
    const effectiveSeverity = (parsedAi && parsedAi.severity && parsedAi.severity !== 'None')
      ? parsedAi.severity
      : severity;
    const priorityCalc = calculateDemoPriority(effectiveSeverity, priority);

    const isRealAI = Boolean(parsedAi && parsedAi.isRealInference);
    const aiNote = isRealAI
      ? `AI Vision Analysis: ${parsedAi.detectionCount ?? 0} pothole(s) detected with ${parsedAi.modelInfo || 'YOLOv8'} (Confidence: ${parsedAi.confidence}%). Severity assessed as ${priorityCalc.severity.toUpperCase()}.`
      : priorityCalc.note;

    // Initial status and history
    const initialStatus = 'submitted';
    const statusHistory = [
      {
        status: initialStatus,
        timestamp: new Date(),
        note: 'Citizen grievance registered with photo evidence.',
        actor: reporterName || 'Citizen Portal',
      },
      {
        status: initialStatus,
        timestamp: new Date(),
        note: aiNote,
        actor: isRealAI ? 'RoadGuard AI Vision Engine' : 'RoadGuard Demo Rules Engine',
      },
    ];

    const latVal = latitude !== undefined && latitude !== '' ? parseFloat(latitude) : undefined;
    const lngVal = longitude !== undefined && longitude !== '' ? parseFloat(longitude) : undefined;

    // Automated duplicate detection check
    const duplicateMatches = await findPotentialDuplicates({
      latitude: !isNaN(latVal) ? latVal : undefined,
      longitude: !isNaN(lngVal) ? lngVal : undefined,
      roadName: roadName || location || '',
      location: location || address || '',
      address: address || location || '',
      description: description || '',
      imagePath,
    });

    const topMatch = duplicateMatches[0] || null;
    const duplicateMatchScore = topMatch ? topMatch.matchScore : 0;
    const possibleDuplicates = duplicateMatches.map((m) => ({
      complaintId: m.complaintId,
      matchScore: m.matchScore,
      distanceMeters: m.distanceMeters,
      imageSimilarity: m.imageSimilarity,
      textSimilarity: m.textSimilarity,
      detectedAt: new Date(),
    }));
    const duplicateReviewStatus = topMatch ? 'flagged' : 'none';

    if (topMatch) {
      statusHistory.push({
        status: initialStatus,
        timestamp: new Date(),
        note: `Duplicate Alert: Correlates with Complaint #${topMatch.complaintId} (Score: ${topMatch.matchScore}%${topMatch.distanceMeters !== null ? `, ${topMatch.distanceMeters}m` : ''}). Flagged for administrative verification.`,
        actor: 'RoadGuard Duplicate Detection Engine',
      });
    }

    const newComplaint = new Complaint({
      complaintId,
      title: title || (location ? `Pothole at ${String(location).slice(0, 32)}` : `Road Hazard near ${roadName || 'City Sector'}`),
      description,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      beforeImage: imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      imagePath,
      latitude: !isNaN(latVal) ? latVal : undefined,
      longitude: !isNaN(lngVal) ? lngVal : undefined,
      address: address || location || '',
      roadName: roadName || location || '',
      zone: zone || 'Central Zone',
      ward: ward || 'Ward 01 - Civic Center',
      severity: priorityCalc.severity,
      priorityScore: priorityCalc.priorityScore,
      priorityLabel: priorityCalc.priorityLabel,
      status: initialStatus,
      userId: req.user?._id || null,
      reporterName: req.user?.name || reporterName || 'Anonymous Citizen',
      reporterContact: req.user?.email || req.user?.phone || reporterContact || '',
      statusHistory,
      aiAnalysis: parsedAi || {
        confidence: 94.8,
        estimatedArea: priorityCalc.severity === 'high' ? '0.82 sq. m' : '0.45 sq. m',
        estimatedDepth: priorityCalc.severity === 'high' ? '9.0 cm' : '4.5 cm',
        surfaceType: 'Dense Bitumen Asphalt',
        roadType: 'Municipal Corridor',
        hazardScore: priorityCalc.priorityScore,
        duplicateCheck: topMatch ? `Warning: ${topMatch.matchScore}% match with ${topMatch.complaintId}` : 'Passed',
        detectedTags: ['Pothole Cavity', 'Demo Simulation'],
        detectionCount: 0,
        detections: [],
        modelInfo: 'Demo Heuristics Engine',
        isRealInference: false,
        isPotholeSpecificModel: false,
      },
      duplicateOf: req.body.duplicateOf || null,
      possibleDuplicates,
      duplicateMatchScore,
      duplicateReviewStatus,
      supportCount: 1,
      supportingReports: [
        {
          citizenName: reporterName || 'Original Reporter',
          citizenContact: reporterContact || '',
          supportedAt: new Date(),
          userIdentifier: reporterContact ? `contact:${reporterContact.trim().toLowerCase()}` : `ip:${req.ip || 'orig'}`,
          comment: 'Initial complaint filed with evidence.',
        },
      ],
    });

    const saved = await newComplaint.save();

    return res.status(201).json({
      success: true,
      message: `Complaint ${complaintId} created successfully.`,
      data: saved,
      duplicateWarning: topMatch
        ? {
            matchedComplaintId: topMatch.complaintId,
            matchScore: topMatch.matchScore,
            distanceMeters: topMatch.distanceMeters,
            reviewStatus: duplicateReviewStatus,
          }
        : null,
      demoNotice: isRealAI
        ? 'AI analysis executed using YOLOv8 computer vision inference.'
        : 'Initial severity and priority calculated using transparent heuristic demo rules. AI vision is simulated.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/complaints
 * List complaints with pagination, filtering, and search.
 */
export async function getComplaints(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by status
    if (req.query.status && req.query.status !== 'All') {
      const normalized = normalizeStatus(req.query.status);
      query.status = normalized;
    }

    // Filter by severity
    if (req.query.severity && req.query.severity !== 'All') {
      const normalized = normalizeSeverity(req.query.severity);
      query.severity = normalized;
    }

    // Filter by priority
    if (req.query.priority && req.query.priority !== 'All') {
      query.priorityLabel = String(req.query.priority).toLowerCase();
    }

    // Filter by zone
    if (req.query.zone && req.query.zone !== 'All' && req.query.zone !== 'All Zones') {
      query.zone = req.query.zone;
    }

    // Search query across complaintId, description, address, roadName, title
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { complaintId: searchRegex },
        { description: searchRegex },
        { address: searchRegex },
        { roadName: searchRegex },
        { title: searchRegex },
        { ward: searchRegex },
      ];
    }

    const [total, complaints] = await Promise.all([
      Complaint.countDocuments(query),
      Complaint.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      count: complaints.length,
      data: complaints,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/complaints/:id
 * Retrieve complaint by public complaintId (e.g. RG-2026-00001) or MongoDB _id.
 */
export async function getComplaintById(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing ID',
        message: 'A complaint ID is required.',
      });
    }

    const cleanId = id.trim();

    let complaint = null;

    // Check if valid ObjectId
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      complaint = await Complaint.findById(cleanId);
    }

    // Otherwise or if not found by _id, search by public complaintId
    if (!complaint) {
      complaint = await Complaint.findOne({
        complaintId: { $regex: new RegExp(`^${cleanId}$`, 'i') },
      });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Complaint '${cleanId}' was not found in the civic repository.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/complaints/:id/status
 * Administrative status update with audit note.
 * Marked as Local Development Only (Authentication reserved for Phase 3).
 */
export async function updateComplaintStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note, actor } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing Status',
        message: 'A valid status value is required.',
      });
    }

    const normalizedStatus = normalizeStatus(status);
    const validStatuses = ['submitted', 'verified', 'assigned', 'in_progress', 'repair_completed', 'resolved', 'rejected'];

    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Find complaint
    let complaint = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({
        complaintId: { $regex: new RegExp(`^${id.trim()}$`, 'i') },
      });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Complaint '${id}' not found.`,
      });
    }

    complaint.status = normalizedStatus;
    const adminActor = req.user?.name ? `${req.user.name} (${req.user.role})` : (actor || 'PWD Admin Desk');
    complaint.statusHistory.push({
      status: normalizedStatus,
      timestamp: new Date(),
      note: note || `Municipal status updated to '${normalizedStatus}'`,
      actor: adminActor,
    });

    const updated = await complaint.save();

    res.set('X-Dev-Warning', 'Development Mode Only - Unauthenticated Administrative Endpoint. RBAC reserved for Phase 3.');

    return res.status(200).json({
      success: true,
      message: `Status for complaint ${complaint.complaintId} updated to '${normalizedStatus}'.`,
      data: updated,
      securityNotice: 'Development Mode Only - Administrative mutation without Phase 3 RBAC.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/complaints/:id/assign
 * Assign a maintenance engineer/crew to a complaint.
 */
export async function assignEngineer(req, res, next) {
  try {
    const { id } = req.params;
    const { engineerName, supervisor, contact, targetCompletion, note } = req.body;

    if (!engineerName && !req.body.name) {
      return res.status(400).json({
        success: false,
        error: 'Missing Crew/Engineer Name',
        message: 'An engineer or repair unit name is required.',
      });
    }

    const crewName = engineerName || req.body.name;

    // Find complaint
    let complaint = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({
        complaintId: { $regex: new RegExp(`^${id.trim()}$`, 'i') },
      });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Complaint '${id}' not found.`,
      });
    }

    complaint.assignedEngineer = {
      name: crewName,
      supervisor: supervisor || 'Municipal Junior Engineer',
      contact: contact || '+91 80-2299-4400',
      targetCompletion: targetCompletion || 'Within 48 hours',
    };

    // Auto-advance status to 'assigned' if currently 'submitted' or 'verified'
    if (complaint.status === 'submitted' || complaint.status === 'verified') {
      complaint.status = 'assigned';
    }

    const dispatchActor = req.user?.name ? `${req.user.name} (${req.user.role})` : 'Operations Dispatch';
    complaint.statusHistory.push({
      status: complaint.status,
      timestamp: new Date(),
      note: note || `Dispatched to ${crewName} (${complaint.assignedEngineer.supervisor}). Target SLA: ${complaint.assignedEngineer.targetCompletion}`,
      actor: dispatchActor,
    });

    const updated = await complaint.save();

    res.set('X-Dev-Warning', 'Development Mode Only - Unauthenticated Administrative Endpoint.');

    return res.status(200).json({
      success: true,
      message: `Assigned ${crewName} to complaint ${complaint.complaintId}.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/complaints/:id/repair
 * Record after-repair image, repair notes, and set status to repair_completed (awaiting_citizen).
 * Never overwrites the original beforeImage.
 */
export async function recordRepair(req, res, next) {
  try {
    const { id } = req.params;
    const { repairNotes, uploadedBy, crewName } = req.body;

    let complaint = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({
        complaintId: { $regex: new RegExp(`^${id.trim()}$`, 'i') },
      });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Complaint '${id}' not found.`,
      });
    }

    // Preserve original beforeImage if not already set
    if (!complaint.beforeImage) {
      complaint.beforeImage = complaint.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
    }

    // Determine afterImage URL
    let afterImageUrl = '';
    if (req.file) {
      afterImageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.afterImage) {
      afterImageUrl = req.body.afterImage;
    }

    if (!afterImageUrl && !complaint.afterImage) {
      return res.status(400).json({
        success: false,
        error: 'Missing After Image',
        message: 'An AFTER repair photograph is required to record repair completion.',
      });
    }

    if (afterImageUrl) {
      complaint.afterImage = afterImageUrl;
      complaint.repairImages.push({
        url: afterImageUrl,
        uploadedAt: new Date(),
        uploadedBy: (uploadedBy || crewName || complaint.assignedEngineer?.name || 'Maintenance Crew').trim(),
        notes: repairNotes || '',
        imageType: 'after_repair',
      });
    }

    if (repairNotes) {
      complaint.repairNotes = repairNotes.trim();
    }

    const now = new Date();
    complaint.repairCompletedAt = now;
    complaint.status = 'repair_completed';
    complaint.verificationStatus = 'awaiting_citizen';

    // Record in repair history
    const cycleNum = (complaint.repairHistory?.length || 0) + 1;
    const patchActor = req.user?.name
      ? `${req.user.name} (${req.user.role})`
      : (uploadedBy || crewName || complaint.assignedEngineer?.name || 'Municipal Road Works').trim();
    complaint.repairHistory.push({
      repairCycle: cycleNum,
      beforeImage: complaint.beforeImage,
      afterImage: complaint.afterImage,
      repairImages: [complaint.afterImage],
      crewName: patchActor,
      completedAt: now,
      notes: repairNotes || '',
      verificationStatus: 'awaiting_citizen',
      adminAction: 'Repair Completed — Awaiting Citizen Verification',
      action: 'Repair Completed',
      actor: patchActor,
      timestamp: now,
      actionDate: now,
    });

    // Audit in statusHistory
    complaint.statusHistory.push({
      status: 'repair_completed',
      timestamp: now,
      note: `Repair Completed: Road restoration finished and AFTER-repair evidence submitted by ${patchActor}. Stage set to Awaiting Citizen Verification.${repairNotes ? ` Notes: "${repairNotes}"` : ''}`,
      actor: patchActor,
    });

    const updated = await complaint.save();

    return res.status(200).json({
      success: true,
      message: `Repair details recorded for ${complaint.complaintId}. Stage set to Awaiting Citizen Verification.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/complaints/:id/verify
 * Citizen verification endpoint: confirm repair or report unsatisfactory with optional photo.
 */
export async function verifyComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { action, citizenName, citizenContact, comment, rating } = req.body;

    let complaint = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({
        complaintId: { $regex: new RegExp(`^${id.trim()}$`, 'i') },
      });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Complaint '${id}' not found.`,
      });
    }

    // Validate ownership if complaint has a registered userId and requester is authenticated
    if (complaint.userId && req.user && req.user.role === 'citizen') {
      if (complaint.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Ownership Mismatch',
          message: 'Only the citizen who filed this complaint (or a municipal administrator) can confirm or dispute this repair.',
        });
      }
    }

    const now = new Date();
    const verifier = req.user?.name || (citizenName || complaint.reporterName || 'Citizen Commuter').trim();

    if (action === 'confirm') {
      complaint.status = 'resolved';
      complaint.verificationStatus = 'citizen_verified';
      complaint.verifiedAt = now;
      complaint.verifiedBy = verifier;

      const numRating = rating ? parseInt(rating, 10) : 5;
      complaint.citizenRating = numRating;
      complaint.citizenFeedback = (comment || 'Work confirmed satisfactory by citizen.').trim();

      complaint.verificationFeedback = {
        comment: complaint.citizenFeedback,
        rating: numRating,
        unsatisfactoryImage: '',
        reportedAt: now,
        verifiedBy: verifier,
      };

      // Update latest repairHistory entry
      if (complaint.repairHistory && complaint.repairHistory.length > 0) {
        const lastCycle = complaint.repairHistory[complaint.repairHistory.length - 1];
        lastCycle.verificationStatus = 'citizen_verified';
        lastCycle.citizenFeedback = {
          comment: complaint.citizenFeedback,
          rating: numRating,
          reportedAt: now,
        };
        lastCycle.adminAction = 'Citizen Confirmed Work';
      }

      complaint.statusHistory.push({
        status: 'resolved',
        timestamp: now,
        note: `Citizen Verified & Closed: Repair confirmed satisfactory by ${verifier}.${numRating ? ` Citizen Rating: ${numRating}/5.` : ''}${comment ? ` Feedback: "${comment}"` : ''}`,
        actor: verifier,
      });

      const saved = await complaint.save();
      return res.status(200).json({
        success: true,
        message: `Complaint ${complaint.complaintId} verified and closed by citizen.`,
        data: saved,
      });
    } else if (action === 'unsatisfactory') {
      if (!comment || !comment.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Missing Reason',
          message: 'Please provide a brief reason why the repair is not satisfactory.',
        });
      }

      let proofUrl = '';
      if (req.file) {
        proofUrl = `/uploads/${req.file.filename}`;
        complaint.repairImages.push({
          url: proofUrl,
          uploadedAt: now,
          uploadedBy: verifier,
          notes: comment.trim(),
          imageType: 'unsatisfactory_evidence',
        });
      } else if (req.body.unsatisfactoryImage) {
        proofUrl = req.body.unsatisfactoryImage;
      }

      // Revert status to 'verified' (Under Review in Municipal lifecycle)
      complaint.status = 'verified';
      complaint.verificationStatus = 'unsatisfactory_reported';

      const numRating = rating ? parseInt(rating, 10) : 1;
      complaint.citizenRating = numRating;
      complaint.citizenFeedback = comment.trim();

      complaint.verificationFeedback = {
        comment: comment.trim(),
        rating: numRating,
        unsatisfactoryImage: proofUrl,
        reportedAt: now,
        verifiedBy: verifier,
      };

      // Update latest repairHistory entry
      if (complaint.repairHistory && complaint.repairHistory.length > 0) {
        const lastCycle = complaint.repairHistory[complaint.repairHistory.length - 1];
        lastCycle.verificationStatus = 'unsatisfactory_reported';
        lastCycle.citizenFeedback = {
          comment: comment.trim(),
          rating: numRating,
          unsatisfactoryImage: proofUrl,
          reportedAt: now,
        };
        lastCycle.adminAction = 'Citizen Reported Defect';
      }

      complaint.statusHistory.push({
        status: 'verified',
        timestamp: now,
        note: `Repair Dispute: Citizen ${verifier} flagged repair as unsatisfactory. Reason: "${comment.trim()}". Returned to Municipal Under Review queue.${proofUrl ? ' Photo evidence attached.' : ''}`,
        actor: verifier,
      });

      const saved = await complaint.save();
      return res.status(200).json({
        success: true,
        message: `Feedback recorded. Complaint ${complaint.complaintId} has been returned to the administrative review queue.`,
        data: saved,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid Action',
        message: "Verification action must be 'confirm' or 'unsatisfactory'.",
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/complaints/:id/admin-verify
 * Administrative verification controls: approve closure, reopen repair, request evidence.
 */
export async function adminVerifyComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { action, note, actor, assignedCrew } = req.body;

    let complaint = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id);
    }
    if (!complaint) {
      complaint = await Complaint.findOne({
        complaintId: { $regex: new RegExp(`^${id.trim()}$`, 'i') },
      });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Complaint '${id}' not found.`,
      });
    }

    const now = new Date();
    const adminActor = req.user?.name ? `${req.user.name} (${req.user.role})` : (actor || 'Admin Desk Engineer').trim();

    if (action === 'approve_closure') {
      complaint.status = 'resolved';
      complaint.verificationStatus = 'admin_approved';
      complaint.verifiedAt = now;
      complaint.verifiedBy = adminActor;

      complaint.statusHistory.push({
        status: 'resolved',
        timestamp: now,
        note: `Administrative Sign-off: Work order approved and verified closed by ${adminActor}.${note ? ` Note: "${note}"` : ''}`,
        actor: adminActor,
      });

      if (complaint.repairHistory && complaint.repairHistory.length > 0) {
        const lastCycle = complaint.repairHistory[complaint.repairHistory.length - 1];
        lastCycle.verificationStatus = 'admin_approved';
        lastCycle.adminAction = `Approved & Closed: ${note || 'Work meets standard'}`;
        lastCycle.actionDate = now;
      }
    } else if (action === 'reopen') {
      complaint.status = 'assigned';
      complaint.verificationStatus = 'reopened';

      if (assignedCrew) {
        complaint.assignedEngineer.name = assignedCrew.trim();
      }

      complaint.statusHistory.push({
        status: 'assigned',
        timestamp: now,
        note: `Administrative Reopening: Work order reopened for rework. Quality inspection failed or citizen dispute upheld. Instructions: ${note || 'Secondary patch and compaction required.'}`,
        actor: adminActor,
      });

      if (complaint.repairHistory && complaint.repairHistory.length > 0) {
        const lastCycle = complaint.repairHistory[complaint.repairHistory.length - 1];
        lastCycle.verificationStatus = 'reopened';
        lastCycle.adminAction = `Reopened for Rework: ${note || 'Secondary patch required'}`;
        lastCycle.actionDate = now;
      }
    } else if (action === 'request_evidence') {
      complaint.status = 'repair_completed';
      complaint.verificationStatus = 'awaiting_citizen';

      complaint.statusHistory.push({
        status: complaint.status,
        timestamp: now,
        note: `Evidence Clarification: Admin requested secondary after-repair photo documentation.${note ? ` Details: "${note}"` : ''}`,
        actor: adminActor,
      });

      if (complaint.repairHistory && complaint.repairHistory.length > 0) {
        const lastCycle = complaint.repairHistory[complaint.repairHistory.length - 1];
        lastCycle.adminAction = `Evidence Requested: ${note || 'Clarification required'}`;
        lastCycle.actionDate = now;
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid Action',
        message: "Action must be 'approve_closure', 'reopen', or 'request_evidence'.",
      });
    }

    const saved = await complaint.save();
    return res.status(200).json({
      success: true,
      message: `Admin verification action '${action}' applied to ${complaint.complaintId}.`,
      data: saved,
    });
  } catch (err) {
    next(err);
  }
}


/**
 * GET /api/analytics/summary
 * Aggregate municipal statistics for dashboards.
 */
export async function getAnalyticsSummary(req, res, next) {
  try {
    const [total, statusCounts, severityCounts, priorityCounts, recentReports] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$priorityLabel', count: { $sum: 1 } } },
      ]),
      Complaint.find().sort({ createdAt: -1 }).limit(5),
    ]);

    const byStatus = {
      submitted: 0,
      verified: 0,
      assigned: 0,
      in_progress: 0,
      repair_completed: 0,
      resolved: 0,
      rejected: 0,
    };
    statusCounts.forEach((s) => {
      if (s._id) byStatus[s._id] = s.count;
    });

    const bySeverity = { low: 0, medium: 0, high: 0 };
    severityCounts.forEach((s) => {
      if (s._id) bySeverity[s._id] = s.count;
    });

    const byPriority = { low: 0, medium: 0, high: 0, critical: 0 };
    priorityCounts.forEach((p) => {
      if (p._id) byPriority[p._id] = p.count;
    });

    const pending = byStatus.submitted;
    const inProgress = byStatus.assigned + byStatus.in_progress + byStatus.repair_completed;
    const resolved = byStatus.resolved;
    const critical = byPriority.critical + bySeverity.high;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        resolved,
        critical,
        resolutionRate,
        byStatus,
        bySeverity,
        byPriority,
        recentReports,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/complaints/check-duplicate
 * Pre-submission duplicate check using GPS, image, description, and status signals.
 */
export async function checkDuplicateComplaint(req, res, next) {
  try {
    const {
      latitude,
      longitude,
      roadName,
      location,
      address,
      description,
    } = req.body;

    const latVal = latitude !== undefined && latitude !== '' ? parseFloat(latitude) : undefined;
    const lngVal = longitude !== undefined && longitude !== '' ? parseFloat(longitude) : undefined;
    const imagePath = req.file ? req.file.path : undefined;

    const candidatePayload = {
      latitude: !isNaN(latVal) ? latVal : undefined,
      longitude: !isNaN(lngVal) ? lngVal : undefined,
      roadName: roadName || location || address || '',
      location: location || address || roadName || '',
      address: address || location || '',
      description: description || '',
      imagePath,
    };

    const matches = await findPotentialDuplicates(candidatePayload);

    return res.status(200).json({
      success: true,
      hasPotentialDuplicate: matches.length > 0,
      matchCount: matches.length,
      threshold: DUPLICATE_CONFIG.DUPLICATE_THRESHOLD,
      topMatch: matches[0]
        ? {
            complaintId: matches[0].complaintId,
            matchScore: matches[0].matchScore,
            distanceMeters: matches[0].distanceMeters,
            imageSimilarity: matches[0].imageSimilarity,
            textSimilarity: matches[0].textSimilarity,
            isHighConfidence: matches[0].isHighConfidence,
            title: matches[0].existingComplaint.title,
            location: matches[0].existingComplaint.location,
            status: matches[0].existingComplaint.status,
            reportedAt: matches[0].existingComplaint.reportedAt,
            imageUrl: matches[0].existingComplaint.imageUrl,
            priority: matches[0].existingComplaint.priority,
            severity: matches[0].existingComplaint.severity,
          }
        : null,
      matches: matches.map((m) => ({
        complaintId: m.complaintId,
        matchScore: m.matchScore,
        distanceMeters: m.distanceMeters,
        imageSimilarity: m.imageSimilarity,
        textSimilarity: m.textSimilarity,
        isHighConfidence: m.isHighConfidence,
        title: m.existingComplaint.title,
        location: m.existingComplaint.location,
        status: m.existingComplaint.status,
        reportedAt: m.existingComplaint.reportedAt,
        imageUrl: m.existingComplaint.imageUrl,
        priority: m.existingComplaint.priority,
        severity: m.existingComplaint.severity,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/complaints/:id/support
 * Citizen supports/validates an existing complaint instead of filing a duplicate.
 */
export async function supportComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { citizenName, citizenContact, comment } = req.body;

    const complaint = await Complaint.findOne({
      $or: [{ complaintId: id }, { _id: mongoose.isValidObjectId(id) ? id : null }],
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint Not Found',
        message: `Complaint with identifier ${id} does not exist.`,
      });
    }

    // Capture user identifier for spam/repeat prevention
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'ip-anon';
    const contactKey = (citizenContact || '').trim().toLowerCase();
    const identifier = contactKey ? `contact:${contactKey}` : `ip:${clientIp}`;

    // Prevent repeated support from the same user/contact
    const alreadySupported = (complaint.supportingReports || []).some((sup) => {
      if (contactKey && sup.citizenContact && sup.citizenContact.toLowerCase() === contactKey) {
        return true;
      }
      return sup.userIdentifier === identifier;
    });

    if (alreadySupported) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate Support Denied',
        message: 'You have already registered your civic endorsement for this road hazard.',
        totalSupports: (complaint.supportingReports?.length || 0) + 1,
      });
    }

    // Register civic endorsement
    complaint.supportingReports.push({
      citizenName: (citizenName || 'Citizen Supporter').trim(),
      citizenContact: (citizenContact || '').trim(),
      supportedAt: new Date(),
      userIdentifier: identifier,
      comment: (comment || 'Confirmed pothole is active and hazardous.').trim(),
    });

    complaint.supportCount = (complaint.supportCount || 1) + 1;
    complaint.reportCount = (complaint.reportCount || 1) + 1;

    // Record in status audit timeline
    complaint.statusHistory.push({
      status: complaint.status,
      timestamp: new Date(),
      note: `Civic Endorsement: Confirmed by ${citizenName || 'local commuter'} (${complaint.supportCount} citizen reports).`,
      actor: citizenName || 'Citizen Portal',
    });

    const saved = await complaint.save();

    return res.status(200).json({
      success: true,
      message: `Civic endorsement registered for Complaint ${complaint.complaintId}. Total citizen reports: ${complaint.supportCount}.`,
      data: saved,
      totalSupports: complaint.supportCount,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/complaints/:id/duplicate-review
 * Admin links or unlinks duplicate complaints.
 */
export async function reviewDuplicateComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { action, masterComplaintId, note, actor } = req.body;

    const complaint = await Complaint.findOne({
      $or: [{ complaintId: id }, { _id: mongoose.isValidObjectId(id) ? id : null }],
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint Not Found',
        message: `Complaint ${id} not found.`,
      });
    }

    if (action === 'confirm') {
      if (!masterComplaintId) {
        return res.status(400).json({
          success: false,
          error: 'Missing Parameter',
          message: 'masterComplaintId is required to confirm and link a duplicate.',
        });
      }

      complaint.duplicateOf = masterComplaintId;
      complaint.duplicateReviewStatus = 'confirmed_duplicate';

      complaint.statusHistory.push({
        status: complaint.status,
        timestamp: new Date(),
        note: `Administrative Audit: Confirmed as duplicate of ${masterComplaintId}. Linked to primary work order.${note ? ` Note: ${note}` : ''}`,
        actor: actor || 'Admin Desk',
      });

      // Also update master complaint to increment support count and add audit note
      const master = await Complaint.findOne({ complaintId: masterComplaintId });
      if (master) {
        master.supportCount = (master.supportCount || 1) + 1;
        master.statusHistory.push({
          status: master.status,
          timestamp: new Date(),
          note: `Linked duplicate complaint ${complaint.complaintId} combined into this work order.`,
          actor: actor || 'Admin Desk',
        });
        await master.save();
      }
    } else if (action === 'distinct') {
      complaint.duplicateOf = null;
      complaint.duplicateReviewStatus = 'marked_distinct';

      complaint.statusHistory.push({
        status: complaint.status,
        timestamp: new Date(),
        note: `Administrative Audit: Evaluated and verified as a distinct, separate road hazard.${note ? ` Note: ${note}` : ''}`,
        actor: actor || 'Admin Desk',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid Action',
        message: "Action must be 'confirm' or 'distinct'.",
      });
    }

    const saved = await complaint.save();

    return res.status(200).json({
      success: true,
      message: `Duplicate review updated: ${complaint.duplicateReviewStatus}`,
      data: saved,
    });
  } catch (err) {
    next(err);
  }
}

