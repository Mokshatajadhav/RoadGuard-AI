import mongoose from 'mongoose';

// Monotonic Counter Schema for atomic, race-condition-free sequential IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/**
 * Generate a safe unique complaint ID such as RG-2026-00001
 * Uses MongoDB findOneAndUpdate with $inc for concurrency safety.
 */
export async function getNextComplaintId() {
  const currentYear = new Date().getFullYear();
  const counterId = `complaints_${currentYear}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(5, '0');
  return `RG-${currentYear}-${paddedSeq}`;
}

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['submitted', 'verified', 'assigned', 'in_progress', 'repair_completed', 'resolved', 'rejected'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    actor: {
      type: String,
      default: 'Citizen Portal',
      trim: true,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    imagePath: {
      type: String,
      default: '',
      trim: true,
    },
    latitude: {
      type: Number,
      required: false,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: false,
      min: -180,
      max: 180,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    roadName: {
      type: String,
      default: '',
      trim: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      lowercase: true,
      index: true,
    },
    priorityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    priorityLabel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['submitted', 'verified', 'assigned', 'in_progress', 'repair_completed', 'resolved', 'rejected'],
      default: 'submitted',
      lowercase: true,
      index: true,
    },
    reportCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    assignedEngineer: {
      name: { type: String, default: '' },
      supervisor: { type: String, default: '' },
      contact: { type: String, default: '' },
      targetCompletion: { type: String, default: '' },
    },
    repairNotes: {
      type: String,
      default: '',
      trim: true,
    },
    beforeImage: {
      type: String,
      default: '',
      trim: true,
    },
    afterImage: {
      type: String,
      default: '',
      trim: true,
    },
    repairImages: [
      {
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: String, default: 'Maintenance Crew', trim: true },
        notes: { type: String, default: '', trim: true },
        imageType: {
          type: String,
          enum: ['after_repair', 'unsatisfactory_evidence', 'additional'],
          default: 'after_repair',
        },
        _id: false,
      },
    ],
    repairCompletedAt: {
      type: Date,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['none', 'awaiting_citizen', 'citizen_verified', 'unsatisfactory_reported', 'admin_approved', 'reopened'],
      default: 'none',
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: String,
      default: '',
      trim: true,
    },
    verificationFeedback: {
      comment: { type: String, default: '', trim: true },
      rating: { type: Number, min: 1, max: 5, default: null },
      unsatisfactoryImage: { type: String, default: '', trim: true },
      reportedAt: { type: Date, default: null },
      verifiedBy: { type: String, default: '', trim: true },
    },
    repairHistory: [
      {
        repairCycle: { type: Number, default: 1 },
        beforeImage: { type: String, default: '' },
        afterImage: { type: String, default: '' },
        repairImages: [{ type: String }],
        crewName: { type: String, default: '' },
        completedAt: { type: Date, default: null },
        notes: { type: String, default: '' },
        verificationStatus: { type: String, default: 'none' },
        citizenFeedback: {
          comment: { type: String, default: '' },
          rating: { type: Number, default: null },
          unsatisfactoryImage: { type: String, default: '' },
          reportedAt: { type: Date, default: null },
        },
        adminAction: { type: String, default: '' },
        action: { type: String, default: 'Repair Completed' },
        actor: { type: String, default: 'Municipal Crew' },
        timestamp: { type: Date, default: Date.now },
        actionDate: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    citizenFeedback: {
      type: String,
      default: '',
      trim: true,
    },
    citizenRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    statusHistory: [statusHistorySchema],

    // UI compatibility fields
    title: {
      type: String,
      default: '',
      trim: true,
    },
    zone: {
      type: String,
      default: 'Central Zone',
      trim: true,
      index: true,
    },
    ward: {
      type: String,
      default: 'Ward 01 - Civic Center',
      trim: true,
    },
    reporterName: {
      type: String,
      default: 'Anonymous Citizen',
      trim: true,
    },
    reporterContact: {
      type: String,
      default: '',
      trim: true,
    },
    aiAnalysis: {
      confidence: { type: Number, default: 94.0 },
      estimatedArea: { type: String, default: '0.50 sq. m' },
      estimatedDepth: { type: String, default: '5.0 cm' },
      surfaceType: { type: String, default: 'Dense Bitumen Asphalt' },
      roadType: { type: String, default: 'Municipal Corridor' },
      hazardScore: { type: Number, default: 60 },
      duplicateCheck: { type: String, default: 'Passed' },
      detectedTags: [{ type: String }],
      detectionCount: { type: Number, default: 0 },
      detections: [
        {
          class_id: { type: Number },
          class_name: { type: String },
          confidence: { type: Number },
          x1: { type: Number },
          y1: { type: Number },
          x2: { type: Number },
          y2: { type: Number },
          width: { type: Number },
          height: { type: Number },
          _id: false,
        },
      ],
      modelInfo: { type: String, default: '' },
      isRealInference: { type: Boolean, default: false },
      isPotholeSpecificModel: { type: Boolean, default: false },
      imageWidth: { type: Number, default: 0 },
      imageHeight: { type: Number, default: 0 },
      warning: { type: String, default: null },
    },

    // Duplicate detection and citizen support fields
    duplicateOf: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    possibleDuplicates: [
      {
        complaintId: { type: String, required: true },
        matchScore: { type: Number, required: true },
        distanceMeters: { type: Number, default: null },
        imageSimilarity: { type: Number, default: null },
        textSimilarity: { type: Number, default: null },
        detectedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    duplicateMatchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    supportingReports: [
      {
        citizenName: { type: String, default: 'Citizen Supporter', trim: true },
        citizenContact: { type: String, default: '', trim: true },
        supportedAt: { type: Date, default: Date.now },
        userIdentifier: { type: String, default: '', trim: true },
        comment: { type: String, default: 'Confirmed issue is active and hazardous.', trim: true },
        _id: false,
      },
    ],
    supportCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    duplicateReviewStatus: {
      type: String,
      enum: ['none', 'flagged', 'confirmed_duplicate', 'marked_distinct'],
      default: 'none',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: id (maps to complaintId)
complaintSchema.virtual('id').get(function () {
  return this.complaintId;
});

// Virtual field: location (maps to address / roadName)
complaintSchema.virtual('location').get(function () {
  if (this.roadName && this.address) {
    return `${this.roadName}, ${this.address}`;
  }
  return this.roadName || this.address || 'Unspecified Location';
});

// Virtual field: coordinates (returns real GPS numbers or null if unrecorded)
complaintSchema.virtual('coordinates').get(function () {
  const hasLat = this.latitude !== undefined && this.latitude !== null && !isNaN(this.latitude);
  const hasLng = this.longitude !== undefined && this.longitude !== null && !isNaN(this.longitude);
  if (hasLat && hasLng) {
    return {
      lat: this.latitude,
      lng: this.longitude,
      hasRealGps: true,
    };
  }
  return {
    lat: null,
    lng: null,
    hasRealGps: false,
  };
});

// Virtual field: priority (maps label to capitalized display version)
complaintSchema.virtual('priority').get(function () {
  if (this.priorityLabel === 'critical') return 'Critical';
  if (this.priorityLabel === 'high') return 'High';
  if (this.priorityLabel === 'medium') return 'Medium';
  return 'Low';
});

// Virtual field: assignedCrew (maps to assignedEngineer for UI compatibility)
complaintSchema.virtual('assignedCrew').get(function () {
  if (!this.assignedEngineer || !this.assignedEngineer.name) return null;
  return {
    name: this.assignedEngineer.name,
    supervisor: this.assignedEngineer.supervisor || '',
    contact: this.assignedEngineer.contact || '',
    targetCompletion: this.assignedEngineer.targetCompletion || '',
  };
});

// Virtual field: reportedAt (UI-friendly date string from createdAt)
complaintSchema.virtual('reportedAt').get(function () {
  if (!this.createdAt) return 'Unknown';
  return new Date(this.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
});

// Virtual field: timeline (maps statusHistory to UI timeline shape)
complaintSchema.virtual('timeline').get(function () {
  if (!this.statusHistory || this.statusHistory.length === 0) {
    return [
      {
        step: 'Complaint Logged',
        timestamp: this.createdAt ? new Date(this.createdAt).toLocaleString() : 'Recent',
        description: 'Citizen grievance registered.',
        actor: 'Citizen Portal',
        status: 'completed',
      },
    ];
  }

  const formatStatusStep = (status) => {
    switch (status) {
      case 'submitted':
        return 'Complaint Logged';
      case 'verified':
        return 'Under Review / Verified';
      case 'assigned':
        return 'Repair Crew Assigned';
      case 'in_progress':
        return 'Repair in Progress';
      case 'repair_completed':
        return 'Repair Completed';
      case 'resolved':
        return 'Verified / Closed';
      case 'rejected':
        return 'Complaint Closed / Duplicate';
      default:
        return status;
    }
  };

  // Track which milestone labels have already been used to avoid duplicates
  const usedLabels = new Set();

  return this.statusHistory.map((item, index) => {
    const isLast = index === this.statusHistory.length - 1;
    let stepLabel = formatStatusStep(item.status);

    // If this label was already used (e.g. two consecutive 'submitted' entries),
    // use a descriptive fallback from the note instead of a duplicate milestone name
    if (usedLabels.has(stepLabel)) {
      // Use the note as a short label, truncated if too long
      const noteLabel = item.note
        ? (item.note.length > 60 ? item.note.slice(0, 57) + '...' : item.note)
        : `Status: ${item.status}`;
      stepLabel = noteLabel;
    } else {
      usedLabels.add(stepLabel);
    }

    return {
      step: stepLabel,
      timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recorded',
      description: item.note || `Stage updated to ${item.status}`,
      actor: item.actor || 'Municipal Authority',
      status: isLast ? 'in-progress' : 'completed',
    };
  });
});

export const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
export default Complaint;
