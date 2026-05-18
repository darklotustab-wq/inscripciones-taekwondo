// api/admin/[code]/registrations/[regId].js
const { getDb } = require('../../../../lib/db');
const { isAdmin, getBody, methodNotAllowed } = require('../../../../lib/helpers');

module.exports = async (req, res) => {
  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    return methodNotAllowed(res, ['PATCH', 'DELETE']);
  }
  try {
    const { eventsCol } = await getDb();
    const code = (req.query.code || '').toUpperCase();
    const regId = req.query.regId;
    const data = await eventsCol.findOne({ code });
    if (!data) return res.status(404).json({ error: 'Evento no encontrado' });
    if (!isAdmin(data, req.query.key)) return res.status(403).json({ error: 'Acceso denegado' });

    if (req.method === 'DELETE') {
      await eventsCol.updateOne(
        { code: data.code },
        { $pull: { registrations: { id: regId } } }
      );
      return res.json({ ok: true });
    }

    // PATCH: cambiar estado
    const body = getBody(req);
    if (!body.status || !['pending', 'confirmed', 'rejected'].includes(body.status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const result = await eventsCol.updateOne(
      { code: data.code, 'registrations.id': regId },
      { $set: { 'registrations.$.status': body.status } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Inscripción no encontrada' });
    const fresh = await eventsCol.findOne({ code: data.code });
    const reg = fresh.registrations.find((r) => r.id === regId);
    res.json({ ok: true, registration: reg });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
};
