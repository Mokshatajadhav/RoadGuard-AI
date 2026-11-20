/**
 * RoadGuard AI — Intelligent Duplicate Complaint Detection Service
 * -----------------------------------------------------------------
 * Evaluates multiple signals:
 * 1. GPS Proximity (Haversine distance with configurable ~30m radius)
 * 2. Image Similarity (Perceptual dHash/aHash + Color Histogram via Python)
 * 3. Text & Landmark Similarity (Token overlap & substring matching)
 * 4. Existing Status Urgency (Active repair work orders prioritized)
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Complaint from '../models/Complaint.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPARE_SCRIPT = path.join(__dirname, 'compareImages.py');

// Configurable thresholds & weights
export const DUPLICATE_CONFIG = {
  PRIMARY_RADIUS_METERS: 30,     // 30m target matching radius
  MAX_RADIUS_METERS: 75,         // Max cutoff radius for GPS consideration
  DUPLICATE_THRESHOLD: 65,       // Overall score >= 65 is considered a potential duplicate
  HIGH_CONFIDENCE_THRESHOLD: 80, // Score >= 80 is high probability duplicate
  WEIGHTS: {
    GPS: 0.35,
    IMAGE: 0.30,
    TEXT: 0.25,
    STATUS: 0.10,
  },
};

/**
 * Calculate geodesic distance between two points in meters using Haversine formula
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lat1 === null || isNaN(lat1) ||
    lon1 === undefined || lon1 === null || isNaN(lon1) ||
    lat2 === undefined || lat2 === null || isNaN(lat2) ||
    lon2 === undefined || lon2 === null || isNaN(lon2)
  ) {
    return null;
  }

  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // 1 decimal place
}

/**
 * Compute GPS Proximity Score [0, 100]
 */
export function computeGpsScore(distanceMeters) {
  if (distanceMeters === null || distanceMeters === undefined) return null;

  if (distanceMeters <= 8) return 100;
  if (distanceMeters <= DUPLICATE_CONFIG.PRIMARY_RADIUS_METERS) {
    // 8m to 30m: scales from 100 down to 75
    const ratio = (distanceMeters - 8) / (DUPLICATE_CONFIG.PRIMARY_RADIUS_METERS - 8);
    return Math.round(100 - ratio * 25);
  }
  if (distanceMeters <= DUPLICATE_CONFIG.MAX_RADIUS_METERS) {
    // 30m to 75m: scales from 75 down to 25
    const ratio = (distanceMeters - 30) / (DUPLICATE_CONFIG.MAX_RADIUS_METERS - 30);
    return Math.round(75 - ratio * 50);
  }
  return 0;
}

/**
 * Tokenize string and extract significant terms
 */
function tokenize(str) {
  if (!str) return [];
  const stopWords = new Set([
    'the', 'and', 'near', 'opp', 'opposite', 'road', 'street', 'cross', 'main',
    'pothole', 'lane', 'damage', 'ward', 'city', 'with', 'from', 'into'
  ]);
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));
}

/**
 * Compute Text & Landmark Similarity Score [0, 100]
 */
export function computeTextSimilarity(road1, desc1, road2, desc2) {
  const r1Tokens = new Set(tokenize(road1));
  const r2Tokens = new Set(tokenize(road2));
  const d1Tokens = new Set(tokenize(desc1));
  const d2Tokens = new Set(tokenize(desc2));

  // Road tokens intersection
  let roadScore = 0;
  if (r1Tokens.size > 0 && r2Tokens.size > 0) {
    const intersection = [...r1Tokens].filter((t) => r2Tokens.has(t)).length;
    const union = new Set([...r1Tokens, ...r2Tokens]).size;
    roadScore = union > 0 ? (intersection / union) * 100 : 0;
  }

  // Exact substring check on road names
  const cleanR1 = (road1 || '').trim().toLowerCase();
  const cleanR2 = (road2 || '').trim().toLowerCase();
  if (cleanR1 && cleanR2 && (cleanR1.includes(cleanR2) || cleanR2.includes(cleanR1))) {
    roadScore = Math.max(roadScore, 85);
  }

  // Description tokens intersection
  let descScore = 0;
  if (d1Tokens.size > 0 && d2Tokens.size > 0) {
    const intersection = [...d1Tokens].filter((t) => d2Tokens.has(t)).length;
    const union = new Set([...d1Tokens, ...d2Tokens]).size;
    descScore = union > 0 ? (intersection / union) * 100 : 0;
  }

  // 60% weight on road/location, 40% on description
  const combined = roadScore * 0.6 + descScore * 0.4;
  return Math.round(combined);
}

/**
 * Execute Python image similarity comparison
 */
export async function computeImageSimilarity(imagePath1, imagePath2, timeoutMs = 8000) {
  if (!imagePath1 || !imagePath2) return null;
  if (!fs.existsSync(imagePath1) || !fs.existsSync(imagePath2)) return null;

  return new Promise((resolve) => {
    const py = spawn('python', [COMPARE_SCRIPT, imagePath1, imagePath2], {
      timeout: timeoutMs,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    let stdoutData = '';
    py.stdout.on('data', (d) => {
      stdoutData += d.toString();
    });

    py.on('close', () => {
      try {
        const parsed = JSON.parse(stdoutData.trim());
        if (parsed.similarity !== undefined && !parsed.error) {
          resolve(Math.round(parsed.similarity * 100)); // 0 - 100
        } else {
          resolve(null);
        }
      } catch (e) {
        resolve(null);
      }
    });

    py.on('error', () => resolve(null));
  });
}

/**
 * Compute Status Urgency Score [0, 100]
 * Active municipal work orders (assigned/in progress) indicate ongoing physical pothole presence.
 */
export function computeStatusScore(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'in_progress' || s === 'assigned' || s.includes('progress') || s.includes('assigned')) {
    return 100; // Actively open/being worked on
  }
  if (s === 'repair_completed') {
    return 85; // Recently finished, citizen might be inspecting or re-reporting
  }
  if (s === 'submitted' || s === 'verified' || s.includes('pending') || s.includes('review')) {
    return 70; // Open queue
  }
  return 20; // Resolved or rejected
}

/**
 * Calculate multi-signal composite duplicate score between a new report and an existing complaint
 */
export async function evaluateDuplicateMatch(newReport, existingComplaint) {
  const lat1 = newReport.latitude ?? newReport.coordinates?.lat;
  const lon1 = newReport.longitude ?? newReport.coordinates?.lng;
  const lat2 = existingComplaint.latitude ?? existingComplaint.coordinates?.lat;
  const lon2 = existingComplaint.longitude ?? existingComplaint.coordinates?.lng;

  const distanceMeters = haversineDistance(lat1, lon1, lat2, lon2);
  const gpsScore = computeGpsScore(distanceMeters);

  const textScore = computeTextSimilarity(
    newReport.roadName || newReport.location || newReport.address,
    newReport.description,
    existingComplaint.roadName || existingComplaint.location || existingComplaint.address,
    existingComplaint.description
  );

  const statusScore = computeStatusScore(existingComplaint.status);

  // Compute image similarity if both images exist on disk
  const imgPath1 = newReport.imagePath;
  const imgPath2 = existingComplaint.imagePath;
  let imageScore = null;
  if (imgPath1 && imgPath2) {
    imageScore = await computeImageSimilarity(imgPath1, imgPath2);
  }

  // Weight re-normalization
  let totalWeight = 0;
  let weightedSum = 0;

  if (gpsScore !== null) {
    weightedSum += gpsScore * DUPLICATE_CONFIG.WEIGHTS.GPS;
    totalWeight += DUPLICATE_CONFIG.WEIGHTS.GPS;
  }

  if (imageScore !== null) {
    weightedSum += imageScore * DUPLICATE_CONFIG.WEIGHTS.IMAGE;
    totalWeight += DUPLICATE_CONFIG.WEIGHTS.IMAGE;
  }

  weightedSum += textScore * DUPLICATE_CONFIG.WEIGHTS.TEXT;
  totalWeight += DUPLICATE_CONFIG.WEIGHTS.TEXT;

  weightedSum += statusScore * DUPLICATE_CONFIG.WEIGHTS.STATUS;
  totalWeight += DUPLICATE_CONFIG.WEIGHTS.STATUS;

  let finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // IMPORTANT REQUIREMENT:
  // "Do not classify complaints as duplicates based only on proximity. Nearby potholes can be different potholes."
  // If proximity is close (< 30m) but BOTH image similarity is low (< 45%) AND text similarity is low (< 35%),
  // this is likely a separate physical pothole on the same road! Cap the score below the duplicate threshold.
  const isImageDifferent = imageScore !== null && imageScore < 45;
  const isTextDifferent = textScore < 35;
  if (distanceMeters !== null && distanceMeters <= DUPLICATE_CONFIG.PRIMARY_RADIUS_METERS) {
    if (isImageDifferent && isTextDifferent) {
      finalScore = Math.min(finalScore, 45); // Below DUPLICATE_THRESHOLD
    }
  }

  return {
    existingComplaint,
    complaintId: existingComplaint.complaintId || existingComplaint.id,
    matchScore: finalScore,
    distanceMeters,
    imageSimilarity: imageScore,
    textSimilarity: textScore,
    statusScore,
    isLikelyDuplicate: finalScore >= DUPLICATE_CONFIG.DUPLICATE_THRESHOLD,
    isHighConfidence: finalScore >= DUPLICATE_CONFIG.HIGH_CONFIDENCE_THRESHOLD,
  };
}

/**
 * Scan database for potential duplicates against a new complaint payload
 */
export async function findPotentialDuplicates(newReportData) {
  try {
    // Only compare against active/non-rejected complaints (or max 50 recent complaints)
    const candidates = await Complaint.find({
      status: { $ne: 'rejected' },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const matchPromises = candidates.map((cand) => evaluateDuplicateMatch(newReportData, cand));
    const results = await Promise.all(matchPromises);

    // Filter to only those with score >= DUPLICATE_CONFIG.DUPLICATE_THRESHOLD
    const matches = results
      .filter((r) => r.isLikelyDuplicate)
      .sort((a, b) => b.matchScore - a.matchScore);

    return matches;
  } catch (err) {
    console.error('[DuplicateService] findPotentialDuplicates error:', err.message);
    return [];
  }
}
