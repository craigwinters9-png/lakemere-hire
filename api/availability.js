const ADMIN_KEY = 'L4k3mere!!2026';
const STORAGE_KEY = 'lakemere_blocked_dates';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — return blocked dates (public)
  if (req.method === 'GET') {
    try {
      const { kv } = await import('@vercel/kv');
      const blocked = await kv.get(STORAGE_KEY) || [];
      return res.json({ blocked });
    } catch(e) {
      // If KV not set up yet, return empty
      return res.json({ blocked: [] });
    }
  }

  // POST — save blocked dates (admin only)
  if (req.method === 'POST') {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorised' });
    }
    try {
      const { blocked } = req.body;
      const { kv } = await import('@vercel/kv');
      await kv.set(STORAGE_KEY, blocked);
      return res.json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).end();
};
