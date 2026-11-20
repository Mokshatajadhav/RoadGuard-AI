/**
 * RoadGuard AI — Detection Controller
 * -------------------------------------
 * POST /api/detect
 *   Accepts: multipart/form-data with field 'image'
 *   Returns: JSON detection results with bounding boxes, severity, confidence
 *
 * This endpoint:
 * 1. Receives an uploaded image via Multer
 * 2. Calls the Python YOLO detection service
 * 3. Returns the detection result (never hardcoded/random values)
 * 4. Clearly distinguishes real YOLO inference from fallback
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { runDetection } from '../ai/detectionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POST /api/detect
 * Run YOLO detection on an uploaded image.
 */
export async function detectPothole(req, res, next) {
  try {
    // Multer places the uploaded file at req.file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No Image Provided',
        message: 'Please upload an image file (JPEG, PNG, or WebP, max 8MB).',
      });
    }

    const imagePath = req.file.path; // Absolute path on disk
    const imageUrl = `/uploads/${req.file.filename}`;
    const imageSize = req.file.size;
    const imageMime = req.file.mimetype;

    console.log(`[Detection] Running YOLO on: ${imagePath}`);
    const startTime = Date.now();

    // Run the Python detector — this is the real YOLO inference
    const detectionResult = await runDetection(imagePath);

    const inferenceMs = Date.now() - startTime;
    console.log(`[Detection] Done in ${inferenceMs}ms. Detections: ${detectionResult.detectionCount}`);

    // If detection itself returned an error (Python failed), still return a 200
    // with isRealInference=false and a clear error message
    if (detectionResult.error) {
      console.error('[Detection] Python error:', detectionResult.error);
    }

    return res.status(200).json({
      success: true,
      imageUrl,
      imageSize,
      imageMime,
      inferenceMs,
      detection: {
        ...detectionResult,
        // Annotate with server-side timestamp
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}
