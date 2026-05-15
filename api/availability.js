const ADMIN_KEY = 'L4k3mere!!2026';
const KV_URL = process.env.KV_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.STORAGE_URL;
const KV_TOKEN = process.env.KV_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.STORAGE_TOKEN;
const STORAGE_KEY = 'lakemere_blocked_dates';

async function getBlocked() {
  if (!KV_URL || !KV_TOKEN) return [];
  try {
    const res = await fetch(`${KV_URL}/get/${STORAGE_KEY}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` }
    });
    const data = await res.json();
    return data.result ? JSON.parse(data.result) : [];
  } catch(e) { return []; }
}

async function setBlocked(dates) {
  const encoded = encodeURIComponent(JSON.stringify(dates));
  await fetch(`${KV_URL}/set/${STORAGE_KEY}/${encoded}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
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
