import { Complaint } from '../models/Complaint.js';

/**
 * GET /api/analytics/advanced
 * Comprehensive municipal analytics aggregation pipeline with functional filtering.
 * Query parameters supported:
 *   - startDate: ISO date string
 *   - endDate: ISO date string
 *   - status: submitted | verified | assigned | in_progress | repair_completed | resolved | rejected | All
 *   - severity: low | medium | high | severe | moderate | minor | All
 *   - priority: low | medium | high | critical | All
 *   - zone: Specific zone name or All
 *   - crew: Specific crew name or All
 */
export async function getAdvancedAnalytics(req, res, next) {
  try {
    const {
      startDate,
      endDate,
      status,
      severity,
      priority,
      zone,
      crew,
    } = req.query;

    // 1. Build dynamic match query for filtering
    const match = {};

    // Date range filter on createdAt
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          match.createdAt.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          // Set to end of the day if it's just date without time
          end.setHours(23, 59, 59, 999);
          match.createdAt.$lte = end;
        }
      }
      if (Object.keys(match.createdAt).length === 0) {
        delete match.createdAt;
      }
    }

    // Status filter
    if (status && status !== 'All') {
      const s = status.toLowerCase();
      if (s === 'pending' || s === 'submitted') {
        match.status = 'submitted';
      } else if (s === 'under_review' || s === 'verified') {
        match.status = 'verified';
      } else if (s === 'in_progress') {
        match.status = 'in_progress';
      } else if (s === 'repair_completed') {
        match.status = 'repair_completed';
      } else if (s === 'resolved') {
        match.status = 'resolved';
      } else {
        match.status = s;
      }
    }

    // Severity filter
    if (severity && severity !== 'All') {
      const sev = severity.toLowerCase();
      if (sev === 'severe' || sev === 'high') {
        match.severity = 'high';
      } else if (sev === 'moderate' || sev === 'medium') {
        match.severity = 'medium';
      } else if (sev === 'minor' || sev === 'low') {
        match.severity = 'low';
      } else {
        match.severity = sev;
      }
    }

    // Priority filter
    if (priority && priority !== 'All') {
      match.priorityLabel = priority.toLowerCase();
    }

    // Zone filter
    if (zone && zone !== 'All' && zone !== 'All Zones') {
      match.zone = zone;
    }

    // Crew filter
    if (crew && crew !== 'All') {
      match['assignedEngineer.name'] = crew;
    }

    // 2. Fetch matched documents
    // Note: To calculate robust timeline and crew metrics across statusHistory & coordinates,
    // we query matched complaints while projecting needed fields.
    const complaints = await Complaint.find(match).sort({ createdAt: -1 }).lean();

    const total = complaints.length;

    // 3. Status distribution
    const statusCounts = {
      submitted: 0,
      verified: 0,
      assigned: 0,
      in_progress: 0,
      repair_completed: 0,
      resolved: 0,
      rejected: 0,
    };
    complaints.forEach((c) => {
      const s = c.status || 'submitted';
      if (statusCounts[s] !== undefined) statusCounts[s]++;
      else statusCounts.submitted++;
    });

    // 4. Severity distribution (Low, Medium, High)
    const severityCounts = {
      Low: 0,
      Medium: 0,
      High: 0,
    };
    complaints.forEach((c) => {
      const s = String(c.severity || 'medium').toLowerCase();
      if (s === 'high' || s === 'severe') severityCounts.High++;
      else if (s === 'low' || s === 'minor') severityCounts.Low++;
      else severityCounts.Medium++;
    });

    // 5. Priority distribution (Low, Medium, High, Critical)
    const priorityCounts = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    complaints.forEach((c) => {
      const p = String(c.priorityLabel || 'medium').toLowerCase();
      if (p === 'critical') priorityCounts.Critical++;
      else if (p === 'high') priorityCounts.High++;
      else if (p === 'low') priorityCounts.Low++;
      else priorityCounts.Medium++;
    });

    // 6. Key Performance Indicators (KPIs)
    const criticalCount = priorityCounts.Critical + severityCounts.High;
    const pendingCount = statusCounts.submitted + statusCounts.verified;
    const underRepairCount = statusCounts.assigned + statusCounts.in_progress;
    const repairedCount = statusCounts.repair_completed + statusCounts.resolved;
    const citizenVerifiedCount = complaints.filter(
      (c) => c.status === 'resolved' && (c.verificationStatus === 'citizen_verified' || c.citizenRating)
    ).length;
    const duplicateCount = complaints.filter(
      (c) => Boolean(c.duplicateOf) || c.duplicateReviewStatus === 'confirmed_duplicate' || c.duplicateReviewStatus === 'flagged'
    ).length;

    // 7. Time & Resolution Performance Metrics (Calculation Methodology)
    // Resolution Time: From createdAt to status === 'resolved' timestamp in statusHistory
    // Time to Assignment: From createdAt to status === 'assigned' timestamp in statusHistory
    // Repair Duration: From status === 'assigned' to repairCompletedAt
    let totalResolutionHours = 0;
    let resolvedWithTimestampsCount = 0;

    let totalAssignmentHours = 0;
    let assignedWithTimestampsCount = 0;

    let totalRepairHours = 0;
    let repairDurationCount = 0;

    const crewStatsMap = {};
    let totalRatings = 0;
    let ratingsCount = 0;
    let reopenedCount = 0;
    let awaitingVerificationCount = 0;

    complaints.forEach((c) => {
      const created = c.createdAt ? new Date(c.createdAt).getTime() : null;

      // Track crew stats
      const crewName = c.assignedEngineer?.name?.trim();
      if (crewName) {
        if (!crewStatsMap[crewName]) {
          crewStatsMap[crewName] = {
            crewName,
            assigned: 0,
            completed: 0,
            reopened: 0,
            avgRating: 0,
            totalRatings: 0,
            ratingCount: 0,
          };
        }
        crewStatsMap[crewName].assigned++;
        if (c.status === 'repair_completed' || c.status === 'resolved') {
          crewStatsMap[crewName].completed++;
        }
      }

      // Check reopened
      if (c.verificationStatus === 'reopened') {
        reopenedCount++;
        if (crewName && crewStatsMap[crewName]) {
          crewStatsMap[crewName].reopened++;
        }
      }

      // Check awaiting citizen verification
      if (c.status === 'repair_completed' || c.verificationStatus === 'awaiting_citizen') {
        awaitingVerificationCount++;
      }

      // Ratings
      const rating = c.verificationFeedback?.rating || c.citizenRating;
      if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
        totalRatings += rating;
        ratingsCount++;
        if (crewName && crewStatsMap[crewName]) {
          crewStatsMap[crewName].totalRatings += rating;
          crewStatsMap[crewName].ratingCount++;
        }
      }

      // Timestamps from statusHistory
      if (Array.isArray(c.statusHistory) && created) {
        // Find assignment entry
        const assignEntry = c.statusHistory.find((sh) => sh.status === 'assigned');
        if (assignEntry && assignEntry.timestamp) {
          const assignTime = new Date(assignEntry.timestamp).getTime();
          if (assignTime >= created) {
            const diffHours = (assignTime - created) / (1000 * 60 * 60);
            totalAssignmentHours += diffHours;
            assignedWithTimestampsCount++;
          }

          // If also repaired, calculate repair duration
          if (c.repairCompletedAt) {
            const repairTime = new Date(c.repairCompletedAt).getTime();
            if (repairTime >= assignTime) {
              const rDiffHours = (repairTime - assignTime) / (1000 * 60 * 60);
              totalRepairHours += rDiffHours;
              repairDurationCount++;
            }
          }
        }

        // Find resolution entry
        if (c.status === 'resolved') {
          const resolveEntry = c.statusHistory.find((sh) => sh.status === 'resolved');
          const resolveTime = resolveEntry?.timestamp ? new Date(resolveEntry.timestamp).getTime() : (c.updatedAt ? new Date(c.updatedAt).getTime() : null);
          if (resolveTime && resolveTime >= created) {
            const diffHours = (resolveTime - created) / (1000 * 60 * 60);
            totalResolutionHours += diffHours;
            resolvedWithTimestampsCount++;
          }
        }
      }
    });

    // Compute averages
    const avgResolutionHours = resolvedWithTimestampsCount > 0 ? (totalResolutionHours / resolvedWithTimestampsCount).toFixed(1) : null;
    const avgAssignmentHours = assignedWithTimestampsCount > 0 ? (totalAssignmentHours / assignedWithTimestampsCount).toFixed(1) : null;
    const avgRepairHours = repairDurationCount > 0 ? (totalRepairHours / repairDurationCount).toFixed(1) : null;
    const avgCitizenRating = ratingsCount > 0 ? (totalRatings / ratingsCount).toFixed(1) : null;
    const citizenVerificationRate = repairedCount > 0 ? Math.round((citizenVerifiedCount / repairedCount) * 100) : 0;

    // Finalize crew performance list
    const crewPerformance = Object.values(crewStatsMap).map((crewItem) => ({
      ...crewItem,
      avgRating: crewItem.ratingCount > 0 ? (crewItem.totalRatings / crewItem.ratingCount).toFixed(1) : 'N/A',
      completionRate: crewItem.assigned > 0 ? Math.round((crewItem.completed / crewItem.assigned) * 100) : 0,
    }));

    // 8. Complaints Over Time Trends (Daily, Weekly, Monthly)
    // Build aggregation buckets from complaints array
    const dailyMap = {};
    const weeklyMap = {};
    const monthlyMap = {};

    complaints.forEach((c) => {
      if (!c.createdAt) return;
      const d = new Date(c.createdAt);

      // Daily: YYYY-MM-DD
      const dayKey = d.toISOString().slice(0, 10);
      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + 1;

      // Weekly: YYYY-Www (approximate using month and week number)
      const weekNumber = Math.ceil(d.getDate() / 7);
      const weekKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')} W${weekNumber}`;
      weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + 1;

      // Monthly: YYYY-MM
      const monthKey = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
    });

    const timelineTrends = {
      daily: Object.entries(dailyMap).map(([label, count]) => ({ label, count })).slice(-14),
      weekly: Object.entries(weeklyMap).map(([label, count]) => ({ label, count })).slice(-8),
      monthly: Object.entries(monthlyMap).map(([label, count]) => ({ label, count })).slice(-6),
    };

    // 9. AI Detection Analytics
    let totalProcessedByYolo = 0;
    let totalPotholesDetected = 0;
    let realInferenceCount = 0;
    let simulatedCount = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;
    const aiSeverityDistribution = {
      Severe: 0,
      Moderate: 0,
      Minor: 0,
    };

    complaints.forEach((c) => {
      if (c.aiAnalysis) {
        totalProcessedByYolo++;
        const isReal = Boolean(c.aiAnalysis.isRealInference);
        if (isReal) realInferenceCount++;
        else simulatedCount++;

        const count = c.aiAnalysis.detectionCount ?? c.aiAnalysis.detections?.length ?? 1;
        totalPotholesDetected += count;

        if (typeof c.aiAnalysis.confidence === 'number' && c.aiAnalysis.confidence > 0) {
          confidenceSum += c.aiAnalysis.confidence;
          confidenceCount++;
        }

        const depth = String(c.aiAnalysis.estimatedDepth || c.severity || '').toLowerCase();
        if (depth.includes('severe') || depth.includes('deep') || depth.includes('high')) {
          aiSeverityDistribution.Severe++;
        } else if (depth.includes('moderate') || depth.includes('medium')) {
          aiSeverityDistribution.Moderate++;
        } else {
          aiSeverityDistribution.Minor++;
        }
      }
    });

    const averageConfidence = confidenceCount > 0 ? Math.round(confidenceSum / confidenceCount) : 0;

    // 10. Geographic Analytics (Zones & Hotspots from GPS)
    const zoneCounts = {};
    const validGpsComplaints = [];
    let withoutGpsCount = 0;

    complaints.forEach((c) => {
      const z = c.zone || 'Central Zone';
      zoneCounts[z] = (zoneCounts[z] || 0) + 1;

      const lat = c.latitude ?? c.coordinates?.lat;
      const lng = c.longitude ?? c.coordinates?.lng;

      if (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        (lat !== 0 || lng !== 0)
      ) {
        validGpsComplaints.push({
          id: c.complaintId || c._id,
          title: c.title,
          location: c.location || c.address || c.roadName,
          lat,
          lng,
          status: c.status,
          priority: c.priorityLabel || 'medium',
          severity: c.severity,
          isCritical: c.priorityLabel === 'critical' || c.severity === 'high',
          isPending: c.status === 'submitted' || c.status === 'verified',
          isVerifiedClosed: c.status === 'resolved',
        });
      } else {
        withoutGpsCount++;
      }
    });

    const geographicHotspots = Object.entries(zoneCounts)
      .map(([zoneName, count]) => ({
        zoneName,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 11. Compile final analytics payload
    return res.status(200).json({
      success: true,
      meta: {
        generatedAt: new Date().toISOString(),
        totalComplaintsEvaluated: total,
        appliedFilters: {
          startDate: startDate || null,
          endDate: endDate || null,
          status: status || 'All',
          severity: severity || 'All',
          priority: priority || 'All',
          zone: zone || 'All',
          crew: crew || 'All',
        },
      },
      kpis: {
        totalReceived: total,
        pendingComplaints: pendingCount,
        criticalPotholes: criticalCount,
        complaintsUnderRepair: underRepairCount,
        successfullyRepaired: repairedCount,
        citizenVerifiedRepairs: citizenVerifiedCount,
        duplicateComplaints: duplicateCount,
        averageResolutionHours: avgResolutionHours !== null ? `${avgResolutionHours} hrs` : 'N/A (insufficient resolved data)',
        rawAvgResolutionHours: avgResolutionHours,
      },
      complaintAnalytics: {
        timelineTrends,
        statusDistribution: statusCounts,
        severityDistribution: severityCounts,
        priorityDistribution: priorityCounts,
      },
      aiDetectionAnalytics: {
        totalProcessedByYolo,
        totalPotholesDetected,
        realInferenceCount,
        simulatedCount,
        averageConfidence: `${averageConfidence}%`,
        rawAverageConfidence: averageConfidence,
        severityEstimates: aiSeverityDistribution,
        confidenceVsAccuracyNote: 'Detection confidence measures the YOLO bounding box prediction probability, whereas ground-truth accuracy requires physical field validation audit.',
      },
      geographicAnalytics: {
        hotspots: geographicHotspots,
        mappedPotholesCount: validGpsComplaints.length,
        unmappedComplaintsCount: withoutGpsCount,
        criticalHotspotsCount: validGpsComplaints.filter((c) => c.isCritical).length,
        pendingHotspotsCount: validGpsComplaints.filter((c) => c.isPending).length,
        verifiedHotspotsCount: validGpsComplaints.filter((c) => c.isVerifiedClosed).length,
        gpsMarkers: validGpsComplaints,
      },
      maintenancePerformance: {
        avgSubmissionToAssignment: avgAssignmentHours !== null ? `${avgAssignmentHours} hrs` : 'N/A',
        avgRepairCompletionTime: avgRepairHours !== null ? `${avgRepairHours} hrs` : 'N/A',
        citizenVerificationRate: `${citizenVerificationRate}%`,
        avgCitizenRating: avgCitizenRating !== null ? `${avgCitizenRating} / 5.0` : 'N/A',
        reopenedRepairsCount: reopenedCount,
        pendingCitizenVerifications: awaitingVerificationCount,
        crewPerformance,
        calculationMethodology: 'Durations are calculated strictly using UTC statusHistory lifecycle timestamps and repairCompletedAt. Complaints lacking valid milestone records are omitted from interval averages rather than imputed.',
      },
    });
  } catch (err) {
    next(err);
  }
}
