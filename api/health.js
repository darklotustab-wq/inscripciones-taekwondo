// api/health.js
const { getDb } = require('../lib/db');

module.exports = async (_req, res) => {
  try {
    const { db } = await getDb();
    await db.command({ ping: 1 });
    res.json({ ok: true, time: new Date().toISOString(), mongo: 'ok' });
  } catch (e) {
    res.status(500).json({ ok: false, mongo: 'down', error: e.message });
  }
};
