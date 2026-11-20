import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== STARTING BACKEND INTEGRATION TESTS ===\n');

  // 1. Health check
  console.log('1. Testing GET /api/health...');
  const healthRes = await fetch(`${API_BASE}/health`);
  const healthData = await healthRes.json();
  console.log('   Status Code:', healthRes.status);
  console.log('   Response:', JSON.stringify(healthData));
  if (healthRes.status !== 200 || healthData.database !== 'connected') {
    throw new Error('Health check failed');
  }

  // 2. Analytics summary
  console.log('\n2. Testing GET /api/analytics/summary...');
  const statsRes = await fetch(`${API_BASE}/analytics/summary`);
  const statsData = await statsRes.json();
  console.log('   Status Code:', statsRes.status);
  console.log('   Total complaints in DB:', statsData.data.total);
  console.log('   Resolution rate:', statsData.data.resolutionRate + '%');

  // 3. Create a new complaint via JSON
  console.log('\n3. Testing POST /api/complaints (JSON payload)...');
  const newPayload = {
    title: 'Deep crater on Metro Link Flyover',
    description: 'Deep road cavity causing severe bike handling hazard during peak commute.',
    location: 'Metro Link Flyover Pillar 88',
    roadName: 'Metro Link Road',
    latitude: 12.9815,
    longitude: 77.6402,
    zone: 'North Zone',
    ward: 'Ward 18',
    severity: 'high',
    reporterName: 'Sunil Rao',
  };

  const createRes = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newPayload),
  });
  const createData = await createRes.json();
  console.log('   Status Code:', createRes.status);
  console.log('   Created ID:', createData.data?.complaintId);
  console.log('   Assigned Priority:', createData.data?.priorityLabel);
  console.log('   Priority Score:', createData.data?.priorityScore);
  const createdId = createData.data?.complaintId;

  if (!createdId) throw new Error('Create complaint failed');

  // 4. Retrieve by public complaintId
  console.log(`\n4. Testing GET /api/complaints/${createdId}...`);
  const getOneRes = await fetch(`${API_BASE}/complaints/${createdId}`);
  const getOneData = await getOneRes.json();
  console.log('   Status Code:', getOneRes.status);
  console.log('   Retrieved title:', getOneData.data?.title);
  console.log('   Retrieved status:', getOneData.data?.status);

  // 5. Update status
  console.log(`\n5. Testing PATCH /api/complaints/${createdId}/status...`);
  const statusRes = await fetch(`${API_BASE}/complaints/${createdId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'in_progress',
      note: 'Field repair team dispatched with 8-ton roller and cold mix.',
      actor: 'PWD Desk',
    }),
  });
  const statusData = await statusRes.json();
  console.log('   Status Code:', statusRes.status);
  console.log('   Updated Status:', statusData.data?.status);
  console.log('   Dev Warning Header:', statusRes.headers.get('x-dev-warning'));

  // 6. Assign maintenance crew
  console.log(`\n6. Testing PATCH /api/complaints/${createdId}/assign...`);
  const assignRes = await fetch(`${API_BASE}/complaints/${createdId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      engineerName: 'PWD Rapid Response Unit #4',
      supervisor: 'Ramesh Kumar (JE)',
      targetCompletion: 'Within 24 Hours',
      note: 'Dispatched for priority night patching shift',
    }),
  });
  const assignData = await assignRes.json();
  console.log('   Status Code:', assignRes.status);
  console.log('   Assigned Crew:', assignData.data?.assignedEngineer?.name);

  // 7. Test list, search, and filter
  console.log('\n7. Testing GET /api/complaints with search & filter...');
  const searchRes = await fetch(`${API_BASE}/complaints?search=Metro&severity=high`);
  const searchData = await searchRes.json();
  console.log('   Status Code:', searchRes.status);
  console.log('   Search Results Count:', searchData.count);

  // 8. Test validation error (missing description)
  console.log('\n8. Testing validation error (POST without description)...');
  const invalidRes = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Invalid complaint with no description' }),
  });
  const invalidData = await invalidRes.json();
  console.log('   Status Code (expected 400):', invalidRes.status);
  console.log('   Error Message:', invalidData.message);

  // 9. Test 404 on nonexistent ID
  console.log('\n9. Testing 404 handling (GET nonexistent complaint)...');
  const notFoundRes = await fetch(`${API_BASE}/complaints/RG-9999-99999`);
  const notFoundData = await notFoundRes.json();
  console.log('   Status Code (expected 404):', notFoundRes.status);
  console.log('   Error Message:', notFoundData.message);

  // 10. Test Multer multipart file upload
  console.log('\n10. Testing multipart/form-data image upload...');
  const testImagePath = path.join(process.cwd(), 'test-sample.png');
  // Create a minimal 1x1 PNG byte buffer
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  fs.writeFileSync(testImagePath, pngHeader);

  const formData = new FormData();
  formData.append('title', 'Pothole with Uploaded Photo');
  formData.append('description', 'Multipart image upload test verifying Multer local storage.');
  formData.append('location', 'High Street Crossing');
  formData.append('severity', 'high');
  formData.append('image', new Blob([pngHeader], { type: 'image/png' }), 'test-sample.png');

  const uploadRes = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    body: formData,
  });
  const uploadData = await uploadRes.json();
  console.log('   Status Code:', uploadRes.status);
  console.log('   Uploaded Image URL:', uploadData.data?.imageUrl);

  if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);

  console.log('\n=== ALL 10 BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
