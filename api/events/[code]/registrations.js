// api/events/[code]/registrations.js  →  POST /api/events/:code/registrations
const { getDb } = require('../../../lib/db');
const {
  newRegId, clean, validateBase64Image, getBody, methodNotAllowed,
} = require('../../../lib/helpers');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const { eventsCol } = await getDb();
    const code = (req.query.code || '').toUpperCase();
    const data = await eventsCol.findOne({ code });
    if (!data) return res.status(404).json({ error: 'Evento no encontrado' });

    const body = getBody(req);
    const name = clean(body.name, 80);
    const school = clean(body.school, 100);
    const category = clean(body.category, 80);
    const birthdate = clean(body.birthdate, 20);
    const weight = clean(body.weight, 20);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 120);
    const beltLevel = clean(body.beltLevel, 40);

    if (!name) return res.status(400).json({ error: 'Falta el nombre del competidor' });
    if (!category) return res.status(400).json({ error: 'Falta la categoría' });
    if (!data.categories.includes(category)) return res.status(400).json({ error: 'Categoría inválida' });

    const photo = validateBase64Image(body.photo);
    let schoolLogo = validateBase64Image(body.schoolLogo);
    if (!schoolLogo && school) {
      const predefined = data.schools.find((s) => s.name === school);
      if (predefined && predefined.logo) schoolLogo = predefined.logo;
    }

    const registration = {
      id: newRegId(),
      name, school, category, birthdate, weight, phone, email, beltLevel,
      photo, schoolLogo,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    await eventsCol.updateOne(
      { code: data.code },
      { $push: { registrations: registration } }
    );
    console.log(`[reg] ${data.code} <- ${name} (${category})`);
    res.json({ ok: true, id: registration.id });
  } catch (e) {
    console.error('[reg]', e.message);
    res.status(500).json({ error: 'Error guardando inscripción' });
  }
};
