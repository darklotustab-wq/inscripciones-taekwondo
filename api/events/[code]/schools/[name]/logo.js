// api/events/[code]/schools/[name]/logo.js  →  GET school logo image
const { getDb } = require('../../../../../lib/db');
const { methodNotAllowed } = require('../../../../../lib/helpers');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const { eventsCol } = await getDb();
    const code = (req.query.code || '').toUpperCase();
    const schoolName = req.query.name;
    const data = await eventsCol.findOne({ code });
    if (!data) return res.status(404).end();
    const school = data.schools.find((s) => s.name === schoolName);
    if (!school || !school.logo) return res.status(404).end();
    const match = school.logo.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) return res.status(500).end();
    res.setHeader('Content-Type', match[1]);
    res.send(Buffer.from(match[2], 'base64'));
  } catch (e) {
    res.status(500).end();
  }
};
