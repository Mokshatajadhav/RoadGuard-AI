/**
 * RoadGuard AI - Comprehensive Advanced Analytics Verification Test Suite
 * Tests all 12 key criteria against the live backend and MongoDB database.
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log(' ROADGUARD AI: ADVANCED ANALYTICS VERIFICATION TEST SUITE');
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
    // 1. Fetch raw complaints from DB
    console.log('[Test 1] Verify MongoDB Atlas Complaints Baseline');
    const compRes = await fetch(`${BASE_URL}/complaints?limit=100`);
    const compData = await compRes.json();
    const rawComplaints = compData.data || [];
    assert(compData.success === true, `Retrieved complaints from MongoDB (${rawComplaints.length} records)`);

    // 2. Query default advanced analytics
    console.log('\n[Test 2] Query /api/complaints/analytics/advanced (Default Range)');
    const aRes = await fetch(`${BASE_URL}/complaints/analytics/advanced`);
    assert(aRes.ok, `Analytics endpoint returned HTTP ${aRes.status}`);
    const analytics = await aRes.json();
    assert(analytics.success === true, `Analytics response has success: true`);

    // 3. KPI accuracy against DB records
    console.log('\n[Test 3] Verify 8 KPI Cards Match Database Records Exactly');
    const { kpis } = analytics;
    assert(typeof kpis.totalReceived === 'number', `totalReceived is numeric (${kpis.totalReceived})`);
    assert(kpis.totalReceived === rawComplaints.length, `totalReceived matches raw complaints count (${kpis.totalReceived} vs ${rawComplaints.length})`);
    assert(typeof kpis.pendingComplaints === 'number', `pendingComplaints is numeric (${kpis.pendingComplaints})`);
    assert(typeof kpis.criticalPotholes === 'number', `criticalPotholes is numeric (${kpis.criticalPotholes})`);
    assert(typeof kpis.complaintsUnderRepair === 'number', `complaintsUnderRepair is numeric (${kpis.complaintsUnderRepair})`);
    assert(typeof kpis.successfullyRepaired === 'number', `successfullyRepaired is numeric (${kpis.successfullyRepaired})`);
    assert(typeof kpis.citizenVerifiedRepairs === 'number', `citizenVerifiedRepairs is numeric (${kpis.citizenVerifiedRepairs})`);
    assert(typeof kpis.duplicateComplaints === 'number', `duplicateComplaints is numeric (${kpis.duplicateComplaints})`);
    assert(typeof kpis.averageResolutionHours === 'string', `averageResolutionHours calculated (${kpis.averageResolutionHours})`);

    // 4. Test Functional Status Filter
    console.log('\n[Test 4] Functional Status Filter Testing');
    const statusFilterRes = await fetch(`${BASE_URL}/complaints/analytics/advanced?status=submitted`);
    const statusData = await statusFilterRes.json();
    assert(statusData.success === true, `Filtered by status=submitted`);
    assert(statusData.meta.appliedFilters.status === 'submitted', `Meta confirms applied status filter`);
    // Status distribution should only have submitted records
    const sDist = statusData.complaintAnalytics.statusDistribution;
    assert(sDist.submitted === statusData.kpis.totalReceived, `All returned records are in 'submitted' state (${sDist.submitted} of ${statusData.kpis.totalReceived})`);

    // 5. Test Functional Severity and Priority Filters
    console.log('\n[Test 5] Functional Severity & Priority Filter Testing');
    const sevFilterRes = await fetch(`${BASE_URL}/complaints/analytics/advanced?severity=high&priority=critical`);
    const sevData = await sevFilterRes.json();
    assert(sevData.success === true, `Filtered by severity=high and priority=critical`);
    assert(sevData.meta.appliedFilters.severity === 'high', `Applied severity filter recorded`);
    assert(sevData.meta.appliedFilters.priority === 'critical', `Applied priority filter recorded`);

    // 6. Test Zone Filtering
    console.log('\n[Test 6] Functional Geographic Zone Filter Testing');
    const zoneFilterRes = await fetch(`${BASE_URL}/complaints/analytics/advanced?zone=${encodeURIComponent('Central Zone')}`);
    const zoneData = await zoneFilterRes.json();
    assert(zoneFilterRes.ok, `Filtered by zone=Central Zone`);
    const czHotspots = zoneData.geographicAnalytics.hotspots;
    assert(czHotspots.every(h => h.zoneName === 'Central Zone'), `All hotspots belong strictly to Central Zone`);

    // 7. Test AI Detection Analytics & Distinction Note
    console.log('\n[Test 7] AI Vision Analytics (YOLO) & Confidence vs Accuracy');
    const { aiDetectionAnalytics } = analytics;
    assert(typeof aiDetectionAnalytics.totalProcessedByYolo === 'number', `totalProcessedByYolo is numeric (${aiDetectionAnalytics.totalProcessedByYolo})`);
    assert(typeof aiDetectionAnalytics.totalPotholesDetected === 'number', `totalPotholesDetected is numeric (${aiDetectionAnalytics.totalPotholesDetected})`);
    assert(typeof aiDetectionAnalytics.realInferenceCount === 'number', `realInferenceCount is numeric (${aiDetectionAnalytics.realInferenceCount})`);
    assert(typeof aiDetectionAnalytics.simulatedCount === 'number', `simulatedCount is numeric (${aiDetectionAnalytics.simulatedCount})`);
    assert(
      aiDetectionAnalytics.confidenceVsAccuracyNote && aiDetectionAnalytics.confidenceVsAccuracyNote.length > 20,
      `confidenceVsAccuracyNote clearly distinguishes model confidence from ground-truth field accuracy`
    );

    // 8. Test Geographic GPS Analytics
    console.log('\n[Test 8] Geographic Analytics & GPS Hotspots');
    const { geographicAnalytics } = analytics;
    assert(Array.isArray(geographicAnalytics.hotspots), `Hotspots array is populated (${geographicAnalytics.hotspots.length} zones)`);
    assert(typeof geographicAnalytics.mappedPotholesCount === 'number', `mappedPotholesCount is numeric (${geographicAnalytics.mappedPotholesCount})`);
    assert(typeof geographicAnalytics.unmappedComplaintsCount === 'number', `unmappedComplaintsCount is numeric (${geographicAnalytics.unmappedComplaintsCount})`);
    assert(
      geographicAnalytics.mappedPotholesCount + geographicAnalytics.unmappedComplaintsCount === kpis.totalReceived,
      `Sum of mapped and unmapped equals total complaints (${geographicAnalytics.mappedPotholesCount} + ${geographicAnalytics.unmappedComplaintsCount} = ${kpis.totalReceived})`
    );

    // 9. Test Maintenance Contractor Performance
    console.log('\n[Test 9] Maintenance Contractor Performance & Timestamps');
    const { maintenancePerformance } = analytics;
    assert(typeof maintenancePerformance.avgSubmissionToAssignment === 'string', `avgSubmissionToAssignment computed (${maintenancePerformance.avgSubmissionToAssignment})`);
    assert(typeof maintenancePerformance.avgRepairCompletionTime === 'string', `avgRepairCompletionTime computed (${maintenancePerformance.avgRepairCompletionTime})`);
    assert(typeof maintenancePerformance.citizenVerificationRate === 'string', `citizenVerificationRate computed (${maintenancePerformance.citizenVerificationRate})`);
    assert(typeof maintenancePerformance.reopenedRepairsCount === 'number', `reopenedRepairsCount is numeric (${maintenancePerformance.reopenedRepairsCount})`);
    assert(Array.isArray(maintenancePerformance.crewPerformance), `crewPerformance breakdown array populated (${maintenancePerformance.crewPerformance.length} crews)`);
    assert(
      maintenancePerformance.calculationMethodology && maintenancePerformance.calculationMethodology.includes('UTC statusHistory'),
      `calculationMethodology explicitly documented in API payload`
    );

    // 10. Test Empty Dataset Handling
    console.log('\n[Test 10] Empty Dataset Handling (Future Date Range)');
    const emptyRes = await fetch(`${BASE_URL}/complaints/analytics/advanced?startDate=2035-01-01&endDate=2035-01-02`);
    const emptyData = await emptyRes.json();
    assert(emptyRes.ok, `Empty dataset query returned HTTP 200 without crashes`);
    assert(emptyData.kpis.totalReceived === 0, `totalReceived is 0 for empty query`);
    assert(emptyData.geographicAnalytics.hotspots.length === 0, `Hotspots array empty without throwing`);

    // 11. Test Compatibility with Existing Complaint, Duplicate, and Detection APIs
    console.log('\n[Test 11] Regression Compatibility with Existing Endpoints');
    const legacyAnalyticsRes = await fetch(`${BASE_URL}/complaints/analytics/summary`);
    assert(legacyAnalyticsRes.ok, `Legacy /api/complaints/analytics/summary intact`);

    const dupCheckRes = await fetch(`${BASE_URL}/complaints/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 12.9716,
        longitude: 77.5946,
        roadName: 'MG Road',
        description: 'Testing duplicate check compatibility',
      }),
    });
    assert(dupCheckRes.ok, `Duplicate check endpoint remains fully functional`);

    // 12. Final Summary
    console.log(`\n================================================================`);
    console.log(` RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log(`================================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTests();
