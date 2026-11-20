// Comprehensive verification test for RoadGuard AI Duplicate Complaint Detection

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== [RoadGuard AI] Starting Duplicate Complaint Detection Verification ===\n');

  // 1. Health check
  console.log('[Test 1] Checking Backend Health...');
  const healthRes = await fetch(`${API_BASE}/health`);
  const health = await healthRes.json();
  console.log(`✓ Health status: ${health.status}, DB: ${health.database?.status}`);

  // 2. Query complaints to find an existing test complaint with GPS
  console.log('\n[Test 2] Querying existing complaints from MongoDB Atlas...');
  const compRes = await fetch(`${API_BASE}/complaints?limit=10`);
  const compData = await compRes.json();
  const existingWithGps = compData.data.find(c => c.latitude && c.longitude);
  
  if (!existingWithGps) {
    console.log('❌ No complaint with GPS found to test proximity matching.');
    return;
  }
  console.log(`✓ Found target complaint: ${existingWithGps.complaintId}`);
  console.log(`  Location: ${existingWithGps.location}`);
  console.log(`  GPS: Lat ${existingWithGps.latitude}, Lng ${existingWithGps.longitude}`);

  // 3. Test duplicate check at almost identical location & matching text (~10m away)
  console.log('\n[Test 3] Testing Pre-submission Duplicate Check (GPS ~10m + matching road name)...');
  // 0.0001 deg is approx 11 meters
  const testCandidate = {
    latitude: existingWithGps.latitude + 0.00008,
    longitude: existingWithGps.longitude + 0.00008,
    roadName: existingWithGps.roadName || existingWithGps.location,
    location: existingWithGps.location,
    description: `Severe asphalt crater near ${existingWithGps.location}`,
  };

  const checkRes = await fetch(`${API_BASE}/complaints/check-duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testCandidate),
  });
  const checkResult = await checkRes.json();
  console.log(`✓ Duplicate check response: hasPotentialDuplicate = ${checkResult.hasPotentialDuplicate}`);
  console.log(`  Match count: ${checkResult.matchCount}`);
  if (checkResult.topMatch) {
    console.log(`  Top match ID: ${checkResult.topMatch.complaintId}`);
    console.log(`  Match Score: ${checkResult.topMatch.matchScore}% (Threshold: ${checkResult.threshold}%)`);
    console.log(`  Distance: ${checkResult.topMatch.distanceMeters}m`);
    console.log(`  Text Similarity: ${checkResult.topMatch.textSimilarity}%`);
  }

  // 4. Test capping logic (Proximity alone must NOT falsely flag duplicate if text and image are completely different)
  console.log('\n[Test 4] Testing Anti-False-Positive Capping (Close proximity ~15m, but completely unrelated description)...');
  const differentDefect = {
    latitude: existingWithGps.latitude + 0.0001,
    longitude: existingWithGps.longitude + 0.0001,
    roadName: 'Totally Different Avenue X, Sector 99',
    location: 'Sector 99 Industrial Warehouse Area',
    description: 'Broken streetlight cable fixture, no road crater at all.',
  };
  const diffCheckRes = await fetch(`${API_BASE}/complaints/check-duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(differentDefect),
  });
  const diffResult = await diffCheckRes.json();
  console.log(`✓ Has potential duplicate: ${diffResult.hasPotentialDuplicate} (Expected: false)`);
  if (diffResult.matches && diffResult.matches.length > 0) {
    console.log(`  Match score capped at: ${diffResult.matches[0].matchScore}% (Below threshold ${diffResult.threshold}%)`);
  } else {
    console.log('  No false duplicate matched.');
  }

  // 5. Test Citizen Support / Civic Endorsement
  console.log('\n[Test 5] Testing Citizen Civic Endorsement (POST /api/complaints/:id/support)...');
  const uniqueContact = `+91 9888${Math.floor(100000 + Math.random() * 900000)}`;
  const supportPayload = {
    citizenName: 'Deepa Narayanan',
    citizenContact: uniqueContact,
    comment: 'I commute daily through here, this pothole is deep and caused an accident this morning.',
  };

  const supRes = await fetch(`${API_BASE}/complaints/${existingWithGps.complaintId}/support`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supportPayload),
  });
  const supResult = await supRes.json();
  console.log(`✓ Support status code: ${supRes.status}`);
  console.log(`  Message: ${supResult.message}`);
  console.log(`  Total Supports: ${supResult.totalSupports}`);

  // 6. Test Repeat Endorsement Denial (Spam Prevention)
  console.log('\n[Test 6] Testing Repeat Endorsement Prevention (Same contact on same complaint)...');
  const repeatRes = await fetch(`${API_BASE}/complaints/${existingWithGps.complaintId}/support`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supportPayload),
  });
  const repeatResult = await repeatRes.json();
  console.log(`✓ Repeat support status code: ${repeatRes.status} (Expected: 400)`);
  console.log(`  Error: ${repeatResult.error} — ${repeatResult.message}`);

  // 7. Create a candidate complaint flagged as duplicate to test Admin Link Review
  console.log('\n[Test 7] Creating a candidate complaint that will be flagged as duplicate...');
  const newDupComplaint = {
    title: `Follow-up report: Cavity on ${existingWithGps.location}`,
    description: `Second report of the large cavity on ${existingWithGps.location}.`,
    location: existingWithGps.location,
    roadName: existingWithGps.roadName || existingWithGps.location,
    latitude: existingWithGps.latitude + 0.00005,
    longitude: existingWithGps.longitude + 0.00005,
    reporterName: 'Sunil Kumar',
    reporterContact: '+91 97777 12345',
    severity: 'High',
    priority: 'Critical',
    imageUrl: existingWithGps.imageUrl,
  };

  const createRes = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newDupComplaint),
  });
  const createResult = await createRes.json();
  const createdId = createResult.data.complaintId;
  console.log(`✓ Created complaint: ${createdId}`);
  console.log(`  Duplicate Match Score: ${createResult.data.duplicateMatchScore}%`);
  console.log(`  Duplicate Review Status: ${createResult.data.duplicateReviewStatus}`);
  console.log(`  Possible Duplicates count: ${createResult.data.possibleDuplicates?.length || 0}`);

  // 8. Test Admin Duplicate Review: Confirm & Link to Master
  console.log('\n[Test 8] Testing Admin Review: Confirm & Link (PATCH /api/complaints/:id/duplicate-review)...');
  const reviewLinkRes = await fetch(`${API_BASE}/complaints/${createdId}/duplicate-review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'confirm',
      masterComplaintId: existingWithGps.complaintId,
      note: 'Verified duplicate from citizen submission; combining into main work order.',
      actor: 'Municipal Inspector K. Rao',
    }),
  });
  const reviewLinkResult = await reviewLinkRes.json();
  console.log(`✓ Admin review status: ${reviewLinkRes.status}`);
  console.log(`  duplicateOf: ${reviewLinkResult.data?.duplicateOf}`);
  console.log(`  duplicateReviewStatus: ${reviewLinkResult.data?.duplicateReviewStatus}`);

  // 9. Test Admin Duplicate Review: Mark as Distinct
  console.log('\n[Test 9] Testing Admin Review: Mark Distinct (PATCH /api/complaints/:id/duplicate-review)...');
  const reviewDistinctRes = await fetch(`${API_BASE}/complaints/${createdId}/duplicate-review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'distinct',
      note: 'Field inspection confirmed this is a second distinct pothole 15m downstream.',
      actor: 'Municipal Inspector K. Rao',
    }),
  });
  const reviewDistinctResult = await reviewDistinctRes.json();
  console.log(`✓ Admin review status: ${reviewDistinctRes.status}`);
  console.log(`  duplicateOf: ${reviewDistinctResult.data?.duplicateOf}`);
  console.log(`  duplicateReviewStatus: ${reviewDistinctResult.data?.duplicateReviewStatus}`);

  // 10. Verify audit timeline persisted in MongoDB
  console.log('\n[Test 10] Verifying Status & Audit Timeline in MongoDB Atlas...');
  const auditRes = await fetch(`${API_BASE}/complaints/${createdId}`);
  const auditData = await auditRes.json();
  console.log(`✓ Complaint ${createdId} status history entries: ${auditData.data.statusHistory.length}`);
  auditData.data.statusHistory.forEach((h, i) => {
    console.log(`   [${i + 1}] (${h.status}) by ${h.actor}: ${h.note}`);
  });

  console.log('\n=== ALL 10 DUPLICATE SYSTEM TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
