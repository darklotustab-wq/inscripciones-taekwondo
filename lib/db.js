// lib/db.js
// Conexión a MongoDB con caché global para reusar entre invocaciones serverless.
// Vercel reusa el proceso de Node entre invocaciones cuando puede, así que cacheamos.

const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'inscripciones';

if (!MONGO_URL) {
  throw new Error('Falta MONGO_URL en las variables de entorno');
}

// Cache global (sobrevive entre invocaciones en la misma "warm" function)
let cached = global._mongoCache;
if (!cached) {
  cached = global._mongoCache = { conn: null, promise: null };
}

async function getDb() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const client = new MongoClient(MONGO_URL, {
      retryWrites: true,
      w: 'majority',
      // Ajustes para serverless: timeouts más cortos, mantener pocas conexiones
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    cached.promise = client.connect().then((c) => {
      const db = c.db(DB_NAME);
      // Asegurar index en code
      db.collection('events').createIndex({ code: 1 }, { unique: true }).catch(() => {});
      return { client: c, db, eventsCol: db.collection('events') };
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { getDb };
