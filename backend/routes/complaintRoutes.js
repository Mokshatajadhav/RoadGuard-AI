import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignEngineer,
  recordRepair,
  verifyComplaint,
  adminVerifyComplaint,
  getAnalyticsSummary,
  checkDuplicateComplaint,
  supportComplaint,
  reviewDuplicateComplaint,
} from '../controllers/complaintController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

/**
 * Validation rules
 */
const createComplaintValidation = [
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required and cannot be empty'),
  body('latitude')
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid number between -90 and 90'),
  body('longitude')
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid number between -180 and 180'),
  body('severity')
    .optional({ checkFalsy: true })
    .isIn(['low', 'medium', 'high', 'severe', 'moderate', 'minor', 'Low', 'Medium', 'High', 'Severe', 'Moderate', 'Minor'])
    .withMessage('Severity must be low, medium, or high'),
];

const updateStatusValidation = [
  param('id').trim().notEmpty().withMessage('Complaint ID is required in URL'),
  body('status').trim().notEmpty().withMessage('Status is required'),
];

const assignEngineerValidation = [
  param('id').trim().notEmpty().withMessage('Complaint ID is required in URL'),
  body('engineerName')
    .optional()
    .trim(),
];

import { getAdvancedAnalytics } from '../controllers/analyticsController.js';
import { optionalAuthenticate, authenticate, authorize } from '../middleware/auth.js';

// Analytics endpoints
router.get('/analytics/advanced', optionalAuthenticate, getAdvancedAnalytics);
router.get('/analytics/summary', optionalAuthenticate, getAnalyticsSummary);

// Complaints CRUD
router.post('/check-duplicate', upload.single('image'), checkDuplicateComplaint);
router.post('/', upload.single('image'), optionalAuthenticate, createComplaintValidation, createComplaint);
router.get('/', optionalAuthenticate, getComplaints);
router.get('/:id', optionalAuthenticate, getComplaintById);
router.post('/:id/support', optionalAuthenticate, supportComplaint);
router.patch('/:id/status', optionalAuthenticate, updateStatusValidation, updateComplaintStatus);
router.patch('/:id/assign', optionalAuthenticate, assignEngineerValidation, assignEngineer);

// Repair Verification Routes
router.patch('/:id/repair', upload.single('afterImage'), optionalAuthenticate, recordRepair);
router.post('/:id/repair', upload.single('afterImage'), optionalAuthenticate, recordRepair);
router.post('/:id/verify', upload.single('unsatisfactoryImage'), optionalAuthenticate, verifyComplaint);
router.patch('/:id/verify', upload.single('unsatisfactoryImage'), optionalAuthenticate, verifyComplaint);
router.patch('/:id/admin-verify', optionalAuthenticate, adminVerifyComplaint);
router.post('/:id/admin-verify', optionalAuthenticate, adminVerifyComplaint);

router.patch('/:id/duplicate-review', optionalAuthenticate, reviewDuplicateComplaint);

export default router;
