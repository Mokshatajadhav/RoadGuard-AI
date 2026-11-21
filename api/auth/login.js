/**
 * Vercel Serverless Function: /api/auth/login
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
    const { email } = req.body || {};
    const lower = (email || '').toLowerCase();

    let role = 'citizen';
    let name = 'Citizen Reporter';

    if (lower.includes('admin')) {
      role = 'admin';
      name = 'Municipal Administrator';
    } else if (lower.includes('crew') || lower.includes('engineer') || lower.includes('pwd')) {
      role = 'crew';
      name = 'PWD Rapid Response Unit';
    } else if (email && email.includes('@')) {
      const prefix = email.split('@')[0];
      name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    const user = {
      _id: 'usr_' + Date.now(),
      id: 'usr_' + Date.now(),
      name,
      email: email || 'citizen@smartcity.gov.in',
      role,
    };

    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_token_' + Date.now();

    return res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server login error' });
  }
}
