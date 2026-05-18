// api/admin/[code]/index.js  →  GET y PATCH /api/admin/:code
const { getDb } = require('../../../lib/db');
const { isAdmin, clean, getBody, methodNotAllowed } = require('../../../lib/helpers');

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'PATCH') return methodNotAllowed(res, ['GET', 'PATCH']);
  try {
    const { eventsCol } = await getDb();
    const code = (req.query.code || '').toUpperCase();
    const data = await eventsCol.findOne({ code });
    if (!data) return res.status(404).json({ error: 'Evento no encontrado' });
    if (!isAdmin(data, req.query.key)) return res.status(403).json({ error: 'Acceso denegado' });

    if (req.method === 'GET') {
      delete data._id;
      return res.json(data);
    }

    // PATCH: editar datos del evento
    const body = getBody(req);
    const updates = {};
    if (typeof body.name === 'string') updates['event.name'] = clean(body.name, 120);
    if (typeof body.date === 'string') updates['event.date'] = clean(body.date, 30);
    if (typeof body.location === 'string') updates['event.location'] = clean(body.location, 200);
    if (Array.isArray(body.categories)) {
      const cats = body.categories.map((c) => clean(c, 80)).filter(Boolean).slice(0, 30);
      if (cats.length > 0) updates['categories'] = cats;
    }
    // FAQs: aceptar update completo del objeto
    if (body.faqs && typeof body.faqs === 'object') {
      const cleanFaqs = {
        welcome: clean(body.faqs.welcome, 500),
        whatsapp: clean(body.faqs.whatsapp, 30).replace(/[^0-9]/g, ''),  // solo dígitos
        items: Array.isArray(body.faqs.items)
          ? body.faqs.items.slice(0, 40).map((it) => ({
              id: clean(it.id, 20) || ('q' + Math.random().toString(36).slice(2, 8)),
              emoji: clean(it.emoji, 8),
              question: clean(it.question, 150),
              answer: clean(it.answer, 2000),
            })).filter((it) => it.question && it.answer)
          : [],
      };
      updates['faqs'] = cleanFaqs;
    }
    if (Object.keys(updates).length > 0) {
      await eventsCol.updateOne({ code: data.code }, { $set: updates });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
};
