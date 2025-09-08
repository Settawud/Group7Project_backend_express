import dotenv from "dotenv";
import { createClient } from "@libsql/client";

dotenv.config();

function clean(v = '') {
  return String(v).replace(/^['"]|['"]$/g, '').trim();
}

const TURSO_DB_URL = clean(process.env.TURSO_DB_URL);
const TURSO_AUTH_TOKEN = clean(process.env.TURSO_AUTH_TOKEN);

let _client = null;

export function getTursoClient() {
  if (_client) return _client;
  if (!TURSO_DB_URL) {
    console.warn('TURSO_DB_URL not set — Turso client disabled');
    return null;
  }
  try {
    _client = createClient({ url: TURSO_DB_URL, auth: { token: TURSO_AUTH_TOKEN } });
    return _client;
  } catch (err) {
    console.error('Failed to create Turso client:', err?.message || err);
    return null;
  }
}

export default getTursoClient;

export const db = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

export const connectTurso = async () => {
    // Ping Turso
  try {
    await db.execute("SELECT 1");
    console.log("Checked successful communication with Turso database ✅");
  } catch (err) {
    console.error("❌ Failed to connect to Turso:", err);
    process.exit(1);
  }
  // Initialize Turso tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
         tags TEXT, -- JSON-encoded array of strings
    is_pinned INTEGER DEFAULT 0, -- 0 = false, 1 = true
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    );
  `);
}

// // ...existing code...
// import dotenv from "dotenv";
// import { createClient } from "@libsql/client";

// dotenv.config();

// function clean(v = "") {
//   return String(v).replace(/^['"]|['"]$/g, "").trim();
// }

// const TURSO_DB_URL = clean(process.env.TURSO_DB_URL);
// const TURSO_AUTH_TOKEN = clean(process.env.TURSO_AUTH_TOKEN);

// let _client = null;

// export function getTursoClient() {
//   if (_client) return _client;
//   if (!TURSO_DB_URL) {
//     console.warn("TURSO_DB_URL not set — Turso client disabled");
//     return null;
//   }
//   try {
//     // createClient accepts authToken or auth: { token } depending on version
//     _client = createClient({ url: TURSO_DB_URL, authToken: TURSO_AUTH_TOKEN });
//     return _client;
//   } catch (err) {
//     console.error("Failed to create Turso client:", err?.message || err);
//     return null;
//   }
// }

// // export db (may be null if TURSO_DB_URL not set)
// export const db = getTursoClient();

// export async function connectTurso() {
//   const client = getTursoClient();
//   if (!client) {
//     console.warn("connectTurso skipped — no Turso client available");
//     return false;
//   }

//   try {
//     await client.execute("SELECT 1");
//     console.log("Checked successful communication with Turso database ✅");

//     // init tables if needed
//     await client.execute(`
//       CREATE TABLE IF NOT EXISTS notes (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         title TEXT NOT NULL,
//         content TEXT NOT NULL,
//         tags TEXT,
//         is_pinned INTEGER DEFAULT 0,
//         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//         user_id INTEGER
//       );
//     `);

//     await client.execute(`
//       CREATE TABLE IF NOT EXISTS users (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT NOT NULL,
//         email TEXT UNIQUE NOT NULL
//       );
//     `);

//     return true;
//   } catch (err) {
//     console.error("❌ Failed to connect/init Turso:", err);
//     return false;
//   }
// }

// export default getTursoClient;
// // ...existing code...