/**
 * RoadGuard AI - Complete End-to-End Workflow & Security Integration Test Suite
 * Covers Citizen lifecycle, Admin lifecycle, Security RBAC, AI Vision, GPS Mapping,
 * Repair Verification, and Municipal Analytics against live MongoDB Atlas.
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log('================================================================');
  console.log(' ROADGUARD AI: COMPLETE END-TO-END WORKFLOW & SECURITY AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // PHASE 1: Authentication & Authorization (RBAC) Audit
    // -------------------------------------------------------------
    console.log('[Phase 1: Security Audit & Role-Based Access Control]');
    const testTimestamp = Date.now();
    const citizenEmail = `citizen_${testTimestamp}@roadguard.test`;
    const adminEmail = `admin_${testTimestamp}@roadguard.test`;
    const crewEmail = `crew_${testTimestamp}@roadguard.test`;
    const password = 'StrongPassword2026!';

    // Register Citizen
    const regCitizenRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rahul Sharma Citizen',
        email: citizenEmail,
        password,
        role: 'citizen',
        phone: '+91 98765 43210',
        ward: 'Ward 04 - Indiranagar',
      }),
    });
    const citizenAuth = await regCitizenRes.json();
    assert(regCitizenRes.status === 201 && citizenAuth.token, `Citizen successfully registered with JWT token`);
    const citizenToken = citizenAuth.token;
    const citizenUserId = citizenAuth.user.id;

    // Register Admin
    const regAdminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ananya Deshmukh Admin',
        email: adminEmail,
        password,
        role: 'admin',
      }),
    });
    const adminAuth = await regAdminRes.json();
    assert(regAdminRes.status === 201 && adminAuth.token, `Admin successfully registered with JWT token`);
    const adminToken = adminAuth.token;

    // Register Crew
    const regCrewRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'K. Murthy Crew Foreman',
        email: crewEmail,
        password,
        role: 'crew',
        crewName: 'Central Zone Quick Patch Unit',
      }),
    });
    const crewAuth = await regCrewRes.json();
    assert(regCrewRes.status === 201 && crewAuth.token, `Crew member registered with JWT token`);
    const crewToken = crewAuth.token;

    // Test Login & /api/auth/me token verification
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.ok && meData.user.email === citizenEmail, `Token decoded and verified via /api/auth/me`);

    // -------------------------------------------------------------
    // PHASE 2: Citizen Workflow (AI Vision, GPS, Duplicates, Submit)
    // -------------------------------------------------------------
    console.log('\n[Phase 2: Citizen Workflow — AI Detection, GPS, Duplicates, Submission]');
    // 1. AI Vision inference test
    const uploadFiles = fs.readdirSync('backend/uploads').filter(f => !f.startsWith('.'));
    assert(uploadFiles.length > 0, `Local image files present in backend/uploads for detection`);
    const testImgPath = path.join('backend/uploads', uploadFiles[0]);
    const fileBuffer = fs.readFileSync(testImgPath);
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('image', blob, 'test_pothole.jpg');

    const detectRes = await fetch('http://localhost:5000/api/detect', {
      method: 'POST',
      body: formData,
    });
    const detectData = await detectRes.json();
    assert(detectRes.ok && detectData.success === true, `YOLO AI Detection successfully processed uploaded image`);
    assert(typeof detectData.detection.isRealInference === 'boolean', `AI inference mode clearly distinguished (isRealInference: ${detectData.detection.isRealInference})`);

    // 2. Pre-submission Duplicate Check
    const dupCheckRes = await fetch(`${BASE_URL}/complaints/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 12.9716,
        longitude: 77.5946,
        roadName: 'MG Road Metro Pillar 120',
        description: 'Large crater near metro pillar',
      }),
    });
    const dupData = await dupCheckRes.json();
    assert(dupCheckRes.ok && dupData.success === true, `Duplicate check successfully executed`);

    // 3. Citizen submits complaint (using their JWT token)
    const createRes = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        title: 'E2E Pothole Test Hazard',
        description: 'Severe roadway crater causing vehicular damage',
        roadName: 'MG Road Corridor',
        location: 'MG Road Corridor, Ward 4',
        ward: 'Ward 4',
        zone: 'Central Zone',
        priority: 'High',
        severity: 'Severe',
        latitude: 12.9716,
        longitude: 77.5946,
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      }),
    });
    const createData = await createRes.json();
    assert(createRes.ok, `Complaint created successfully`);
    const createdComplaint = createData.data;
    const complaintId = createdComplaint.complaintId;
    assert(createdComplaint.userId === citizenUserId, `Complaint ownership bound to citizen user ID (${createdComplaint.userId})`);
    assert(createdComplaint.beforeImage === createdComplaint.imageUrl, `beforeImage set to initial photo`);

    // -------------------------------------------------------------
    // PHASE 3: Admin Workflow (Review, Assign, Status, Rework)
    // -------------------------------------------------------------
    console.log('\n[Phase 3: Admin Workflow — Review, Assign Crew, Status Updates]');
    // 1. Assign Crew (using Admin Token)
    const assignRes = await fetch(`${BASE_URL}/complaints/${complaintId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        engineerName: 'Central Zone Quick Patch Unit',
        supervisor: 'Eng. K. Murthy',
        targetCompletion: 'Within 24 Hours',
        note: 'Assigned priority cold-mix asphalt patch team.',
      }),
    });
    const assignData = await assignRes.json();
    assert(assignRes.ok && assignData.data.status === 'assigned', `Admin assigned crew and status transitioned to 'assigned'`);
    assert(assignData.data.statusHistory.some(sh => sh.actor.includes('Ananya Deshmukh Admin')), `Admin actor verified from JWT token in audit log`);

    // 2. Crew records repair completion with AFTER image
    const afterImgUrl = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80';
    const repairRes = await fetch(`${BASE_URL}/complaints/${complaintId}/repair`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${crewToken}`,
      },
      body: JSON.stringify({
        afterImage: afterImgUrl,
        repairNotes: 'Applied dense hot bituminous mix, compacted with 8-ton vibratory roller.',
      }),
    });
    const repairData = await repairRes.json();
    assert(repairRes.ok, `Maintenance crew logged repair`);
    assert(repairData.data.status === 'repair_completed', `Status set to 'repair_completed'`);
    assert(repairData.data.verificationStatus === 'awaiting_citizen', `State machine flagged as 'awaiting_citizen'`);
    assert(repairData.data.beforeImage === createdComplaint.imageUrl, `Original beforeImage preserved without being overwritten`);
    assert(repairData.data.afterImage === afterImgUrl, `afterImage logged accurately`);

    // -------------------------------------------------------------
    // PHASE 4: Citizen Verification (Confirm / Dispute Ownership Check)
    // -------------------------------------------------------------
    console.log('\n[Phase 4: Citizen Verification & Ownership Validation]');
    // Test that an unauthorized citizen cannot verify someone else's complaint
    const imposterTokenRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Imposter Citizen',
        email: `imposter_${testTimestamp}@roadguard.test`,
        password,
        role: 'citizen',
      }),
    });
    const imposterAuth = await imposterTokenRes.json();
    const imposterToken = imposterAuth.token;

    const imposterVerifyRes = await fetch(`${BASE_URL}/complaints/${complaintId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${imposterToken}`,
      },
      body: JSON.stringify({ action: 'confirm' }),
    });
    assert(imposterVerifyRes.status === 403, `Unauthorized citizen verification blocked with HTTP 403 (Ownership Mismatch)`);

    // Valid citizen confirms the repair
    const validVerifyRes = await fetch(`${BASE_URL}/complaints/${complaintId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: JSON.stringify({
        action: 'confirm',
        rating: 5,
        comment: 'Excellent flush finish, road is completely safe again!',
      }),
    });
    const validVerifyData = await validVerifyRes.json();
    assert(validVerifyRes.ok && validVerifyData.data.status === 'resolved', `Citizen successfully verified repair -> status 'resolved'`);
    assert(validVerifyData.data.verificationStatus === 'citizen_verified', `verificationStatus set to 'citizen_verified'`);
    assert(validVerifyData.data.citizenRating === 5, `Citizen 5-star rating preserved`);

    // -------------------------------------------------------------
    // PHASE 5: Analytics & Data Integrity Audit
    // -------------------------------------------------------------
    console.log('\n[Phase 5: Analytics & Data Integrity Verification]');
    const analyticsRes = await fetch(`${BASE_URL}/complaints/analytics/advanced`);
    const analyticsData = await analyticsRes.json();
    assert(analyticsRes.ok && analyticsData.success === true, `Analytics pipeline refreshed with new data`);
    assert(analyticsData.kpis.successfullyRepaired >= 1, `KPI successfullyRepaired reflects closed work order`);
    assert(analyticsData.kpis.citizenVerifiedRepairs >= 1, `KPI citizenVerifiedRepairs reflects verified work order`);
    assert(analyticsData.geographicAnalytics.mappedPotholesCount >= 1, `Geographic analytics plots GPS coordinates without inventing fake locations`);

    // Verify timeline consistency
    const finalComplaintRes = await fetch(`${BASE_URL}/complaints/${complaintId}`);
    const finalDoc = (await finalComplaintRes.json()).data;
    assert(finalDoc.timeline.length >= 4, `Activity timeline contains complete milestone sequence (${finalDoc.timeline.length} steps)`);

    // -------------------------------------------------------------
    // Final Summary
    // -------------------------------------------------------------
    console.log(`\n================================================================`);
    console.log(` END-TO-END AUDIT RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log(`================================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('E2E Audit Error:', err);
    process.exit(1);
  }
}

runE2ETests();
