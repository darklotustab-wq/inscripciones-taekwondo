// api/admin/[code]/schools/index.js  →  POST /api/admin/:code/schools
const { getDb } = require('../../../../lib/db');
const { isAdmin, clean, validateBase64Image, getBody, methodNotAllowed } = require('../../../../lib/helpers');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const { eventsCol } = await getDb();
    const code = (req.query.code || '').toUpperCase();
    const data = await eventsCol.findOne({ code });
    if (!data) return res.status(404).json({ error: 'Evento no encontrado' });
    if (!isAdmin(data, req.query.key)) return res.status(403).json({ error: 'Acceso denegado' });

    const body = getBody(req);
    const name = clean(body.name, 100);
    const logo = validateBase64Image(body.logo);
    if (!name) return res.status(400).json({ error: 'Falta el nombre' });

    const existing = data.schools.findIndex((s) => s.name === name);
    if (existing >= 0) data.schools[existing] = { name, logo };
    else data.schools.push({ name, logo });

    await eventsCol.updateOne({ code: data.code }, { $set: { schools: data.schools } });
    res.json({ ok: true, schools: data.schools.map((s) => ({ name: s.name, hasLogo: !!s.logo })) });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
};
