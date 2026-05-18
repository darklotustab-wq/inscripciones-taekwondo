// api/admin/[code]/export.js
const { getDb } = require('../../../lib/db');
const { isAdmin, methodNotAllowed } = require('../../../lib/helpers');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const { eventsCol } = await getDb();
    const code = (req.query.code || '').toUpperCase();
    const data = await eventsCol.findOne({ code });
    if (!data) return res.status(404).json({ error: 'Evento no encontrado' });
    if (!isAdmin(data, req.query.key)) return res.status(403).json({ error: 'Acceso denegado' });
    delete data._id;
    res.setHeader('Content-Disposition', `attachment; filename="evento-${data.code}.json"`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
};
