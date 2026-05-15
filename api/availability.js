const { Redis } = require('@upstash/redis');

const ADMIN_KEY = 'L4k3mere!!2026';
const STORAGE_KEY = 'lakemere_blocked_dates';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = new Redis({
    url: process.env.STORAGE_URL,
    token: process.env.STORAGE_TOKEN,
  });

  if (req.method === 'GET') {
    try {
      const blocked = await redis.get(STORAGE_KEY) || [];
      return res.json({ blocked });
    } catch(e) {
      return res.json({ blocked: [] });
    }
  }

  if (req.method === 'POST') {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorised' });
    }
    try {
      const { blocked } = req.body;
      await redis.set(STORAGE_KEY, blocked);
      return res.json({ success: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).end();
};
