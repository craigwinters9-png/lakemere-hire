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
    return data.result ? JSON.parse(data.result) : [];
  } catch(e) { return []; }
}

async function setBlocked(dates) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  const encoded = encodeURIComponent(JSON.stringify(dates));
  await fetch(`${url}/set/${STORAGE_KEY}/${encoded}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
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
    await setBlocked(req.body.blocked || []);
    return res.json({ success: true });
  }

  res.status(405).end();
};
