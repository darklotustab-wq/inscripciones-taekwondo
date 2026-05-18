// api/admin/[code]/schools/[name].js  →  DELETE /api/admin/:code/schools/:name
const { getDb } = require('../../../../lib/db');
const { isAdmin, methodNotAllowed } = require('../../../../lib/helpers');

module.exports = async (req, res) => {
  if (req.method !== 'DELETE') return methodNotAllowed(res, ['DELETE']);
  try {
    const { eventsCol } = await getDb();
    const code = (req.query.code || '').toUpperCase();
    const name = req.query.name;
    const data = await eventsCol.findOne({ code });
    if (!data) return res.status(404).json({ error: 'Evento no encontrado' });
    if (!isAdmin(data, req.query.key)) return res.status(403).json({ error: 'Acceso denegado' });

    await eventsCol.updateOne(
      { code: data.code },
      { $pull: { schools: { name } } }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
};
