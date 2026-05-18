// lib/helpers.js
// Funciones utilitarias compartidas entre todos los endpoints.

const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(len = 6) {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

function randomSecret(len = 16) {
  return crypto.randomBytes(len).toString('base64url').slice(0, 20);
}

function newRegId() {
  return 'R' + crypto.randomBytes(4).toString('hex');
}

function isAdmin(eventData, key) {
  return eventData && eventData.adminKey === key;
}

function clean(value, maxLen = 200) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function validateBase64Image(dataUrl) {
  if (!dataUrl) return null;
  if (typeof dataUrl !== 'string') return null;
  if (!dataUrl.startsWith('data:image/')) return null;
  if (dataUrl.length > 6 * 1024 * 1024) return null;
  return dataUrl;
}

// Helper para parsear body en serverless functions (Vercel)
// Vercel ya parsea JSON automáticamente, pero por compatibilidad doble-check
function getBody(req) {
  return req.body && typeof req.body === 'object' ? req.body : {};
}

// CORS / método handler común
function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  return res.status(405).json({ error: 'Method not allowed' });
}

module.exports = {
  randomCode,
  randomSecret,
  newRegId,
  isAdmin,
  clean,
  validateBase64Image,
  getBody,
  methodNotAllowed,
};
