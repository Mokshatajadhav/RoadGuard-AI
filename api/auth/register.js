/**
 * Vercel Serverless Function: /api/auth/register
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, role } = req.body || {};

    const user = {
      _id: 'usr_' + Date.now(),
      id: 'usr_' + Date.now(),
      name: name || 'Citizen Reporter',
      email: email || 'citizen@smartcity.gov.in',
      role: role || 'citizen',
    };

    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_token_' + Date.now();

    return res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server register error' });
  }
}
