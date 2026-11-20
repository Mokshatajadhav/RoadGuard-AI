/**
 * RoadGuard AI — Detection Service
 * ---------------------------------
 * Calls the Python YOLO detection script as a child process.
 * Returns structured detection results to the Express controller.
 *
 * Usage:
 *   import { runDetection } from './detectionService.js';
 *   const result = await runDetection('/abs/path/to/image.jpg');
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Python detector script
const DETECT_SCRIPT = path.join(__dirname, '..', 'ai', 'detect.py');

// Optional: path to a pothole-specific YOLO model .pt file
// Place your fine-tuned weights here as 'pothole.pt' and they'll be used automatically
const CUSTOM_MODEL_PATH = path.join(__dirname, '..', 'ai', 'pothole.pt');

/**
 * Run YOLO detection on an image file.
 * @param {string} imagePath  Absolute path to the uploaded image
 * @param {number} timeoutMs  Max milliseconds to wait for Python inference (default 60s)
 * @returns {Promise<DetectionResult>}
 */
export async function runDetection(imagePath, timeoutMs = 60000) {
  return new Promise((resolve) => {
    if (!fs.existsSync(imagePath)) {
      resolve({
        detections: [],
        detectionCount: 0,
        severity: 'Unknown',
        hazardScore: 0,
        modelInfo: 'N/A',
        isPotholeSpecificModel: false,
        isRealInference: false,
        error: `Image not found at path: ${imagePath}`,
        warning: null,
      });
      return;
    }

    // Build Python command args
    const args = [DETECT_SCRIPT, imagePath];
    if (fs.existsSync(CUSTOM_MODEL_PATH)) {
      args.push('--model', CUSTOM_MODEL_PATH);
      console.log('[Detection] Using custom pothole model:', CUSTOM_MODEL_PATH);
    } else {
      console.log('[Detection] No custom pothole.pt found — using YOLOv8n COCO pretrained.');
    }

    console.log('[Detection] Spawning Python:', 'python', args.join(' '));

    const py = spawn('python', args, {
      timeout: timeoutMs,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    let stdoutData = '';
    let stderrData = '';

    py.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    py.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    // Set a manual timeout as a safety net
    const timer = setTimeout(() => {
      py.kill('SIGTERM');
      resolve({
        detections: [],
        detectionCount: 0,
        severity: 'Unknown',
        hazardScore: 0,
        modelInfo: 'Timeout',
        isPotholeSpecificModel: false,
        isRealInference: false,
        error: `Detection timed out after ${timeoutMs / 1000}s`,
        warning: null,
      });
    }, timeoutMs);

    py.on('close', (code) => {
      clearTimeout(timer);

      if (stderrData.trim()) {
        console.error('[Detection Python stderr]:', stderrData.trim());
      }

      const rawOutput = stdoutData.trim();
      if (!rawOutput) {
        resolve({
          detections: [],
          detectionCount: 0,
          severity: 'Unknown',
          hazardScore: 0,
          modelInfo: 'N/A',
          isPotholeSpecificModel: false,
          isRealInference: false,
          error: `Python script produced no output (exit code ${code}). Stderr: ${stderrData.slice(0, 300)}`,
          warning: null,
        });
        return;
      }

      try {
        const parsed = JSON.parse(rawOutput);
        resolve(parsed);
      } catch (parseErr) {
        resolve({
          detections: [],
          detectionCount: 0,
          severity: 'Unknown',
          hazardScore: 0,
          modelInfo: 'N/A',
          isPotholeSpecificModel: false,
          isRealInference: false,
          error: `Failed to parse detection output: ${parseErr.message}. Raw: ${rawOutput.slice(0, 200)}`,
          warning: null,
        });
      }
    });

    py.on('error', (spawnErr) => {
      clearTimeout(timer);
      resolve({
        detections: [],
        detectionCount: 0,
        severity: 'Unknown',
        hazardScore: 0,
        modelInfo: 'N/A',
        isPotholeSpecificModel: false,
        isRealInference: false,
        error: `Failed to spawn Python: ${spawnErr.message}. Make sure Python is installed and in PATH.`,
        warning: null,
      });
    });
  });
}
