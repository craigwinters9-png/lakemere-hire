const ADMIN_KEY = 'L4k3mere!!2026';
const STORAGE_KEY = 'lakemere_blocked_dates';

async function getBlocked() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_READ_ONLY_TOKEN;
  if (!url || !token) return [];
  try {
    const res = await fetch(`${url}/get/${STORAGE_KEY}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.result) return [];
    return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  } catch(e) {
    console.error('getBlocked error:', e);
    return [];
  }
}

async function setBlocked(dates) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('No KV credentials');
  const body = JSON.stringify({ value: JSON.stringify(dates) });
  const res = await fetch(`${url}/set/${STORAGE_KEY}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const blocked = await getBlocked();
    return res.json({ blocked });
  }

  if (req.method === 'POST') {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorised' });
    }
    try {
      await setBlocked(req.body.blocked || []);
      return res.json({ success: true });
    } catch(e) {
      console.error('setBlocked error:', e);
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).end();
};
