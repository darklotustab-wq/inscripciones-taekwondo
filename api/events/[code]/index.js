// api/events/[code]/index.js  →  GET /api/events/:code
const { getDb } = require('../../../lib/db');
const { methodNotAllowed } = require('../../../lib/helpers');

// Reemplaza {placeholders} en una cadena con datos reales del evento
function fillPlaceholders(text, event, categories) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\{fecha\}/g, event.date || 'fecha por confirmar')
    .replace(/\{lugar\}/g, event.location || 'lugar por confirmar')
    .replace(/\{evento\}/g, event.name || '')
    .replace(/\{categorias\}/g, (categories || []).map((c) => `• ${c}`).join('\n'));
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const { eventsCol } = await getDb();
    const code = (req.query.code || '').toUpperCase();
    const data = await eventsCol.findOne({ code });
    if (!data) return res.status(404).json({ error: 'Evento no encontrado' });

    // Procesar FAQs: reemplazar placeholders
    let processedFaqs = null;
    if (data.faqs) {
      processedFaqs = {
        welcome: fillPlaceholders(data.faqs.welcome, data.event, data.categories),
        whatsapp: data.faqs.whatsapp || '',
        items: (data.faqs.items || []).map((item) => ({
          id: item.id,
          emoji: item.emoji,
          question: item.question,
          answer: fillPlaceholders(item.answer, data.event, data.categories),
        })),
      };
    }

    res.json({
      code: data.code,
      event: data.event,
      categories: data.categories,
      schools: data.schools.map((s) => ({ name: s.name, hasLogo: !!s.logo })),
      registrationCount: data.registrations.length,
      faqs: processedFaqs,
    });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
};
