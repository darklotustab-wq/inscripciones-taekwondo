// api/events/index.js  →  POST /api/events
const { getDb } = require('../../lib/db');
const {
  randomCode, randomSecret, clean, validateBase64Image, getBody, methodNotAllowed,
} = require('../../lib/helpers');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const body = getBody(req);
    const name = clean(body.name, 120);
    const date = clean(body.date, 30);
    const location = clean(body.location, 200);
    if (!name) return res.status(400).json({ error: 'Falta el nombre del evento' });

    let categories = body.categories;
    if (!Array.isArray(categories) || categories.length === 0) {
      categories = ['Combate', 'Formas', 'Forma en grupo', 'Rotura', 'Patada en alto'];
    } else {
      categories = categories.map((c) => clean(c, 80)).filter(Boolean).slice(0, 30);
    }

    let schools = body.schools;
    if (!Array.isArray(schools)) schools = [];
    schools = schools.map((s) => ({
      name: clean(s.name, 100),
      logo: validateBase64Image(s.logo),
    })).filter((s) => s.name).slice(0, 50);

    // FAQs por defecto: plantilla típica de un torneo de taekwondo
    const defaultFaqs = {
      welcome: '¡Hola! 👋 Soy el bot del torneo. Tocá una pregunta para ver la respuesta:',
      whatsapp: '',  // número de WhatsApp para el botón "Hablar con un humano" (sin +, sin espacios)
      items: [
        { id: 'q1', emoji: '📅', question: '¿Cuándo es el torneo?', answer: 'El torneo se realiza el {fecha}. Te esperamos!' },
        { id: 'q2', emoji: '📍', question: '¿Dónde es?', answer: 'El torneo se realiza en {lugar}.' },
        { id: 'q3', emoji: '📝', question: '¿Cómo me inscribo?', answer: 'Para inscribirte hacé click en el botón "Inscribirme" 👇 o vení al sitio oficial del torneo.\n\nNecesitás:\n- Foto del competidor\n- Logo o nombre de tu escuela\n- Datos personales básicos' },
        { id: 'q4', emoji: '💰', question: '¿Cuánto cuesta la inscripción?', answer: 'El valor de la inscripción es $XXXX por categoría. Si competís en más de una, consultá descuentos.' },
        { id: 'q5', emoji: '🥋', question: '¿Qué categorías hay?', answer: 'Las categorías disponibles son:\n{categorias}\n\nPodés inscribirte en más de una.' },
        { id: 'q6', emoji: '⏰', question: '¿Hasta cuándo me puedo inscribir?', answer: 'Las inscripciones cierran el día anterior al torneo. Tratá de hacerlo con anticipación para asegurar tu cupo.' },
        { id: 'q7', emoji: '👕', question: '¿Qué tengo que llevar?', answer: '- Dobok (uniforme) limpio\n- Protectores reglamentarios\n- Documento de identidad\n- Botella de agua\n- Comprobante de inscripción' },
        { id: 'q8', emoji: '🅿️', question: '¿Hay estacionamiento?', answer: 'En el lugar del torneo hay estacionamiento. Te recomendamos llegar con tiempo.' },
        { id: 'q9', emoji: '🏥', question: '¿Necesito seguro médico?', answer: 'Sí, es obligatorio contar con cobertura médica vigente. Verificá que tu obra social o prepaga esté al día antes del torneo.' },
        { id: 'q10', emoji: '🎖️', question: '¿Hay premios?', answer: 'Sí! Habrá medallas para el 1°, 2° y 3° lugar de cada categoría. También trofeos especiales para mejor escuela y mejor competidor.' },
      ],
    };

    const { eventsCol } = await getDb();

    let code;
    for (let i = 0; i < 30; i++) {
      code = randomCode();
      const existing = await eventsCol.findOne({ code });
      if (!existing) break;
    }

    const adminKey = randomSecret();
    const eventData = {
      code, adminKey,
      event: { name, date, location, createdAt: new Date().toISOString() },
      categories, schools,
      faqs: defaultFaqs,
      registrations: [],
    };
    await eventsCol.insertOne(eventData);
    console.log(`[event] created ${code}: "${name}"`);
    res.json({ code, adminKey, event: eventData.event, categories, schools });
  } catch (e) {
    console.error('[create event]', e.message);
    res.status(500).json({ error: 'Error creando evento' });
  }
};
