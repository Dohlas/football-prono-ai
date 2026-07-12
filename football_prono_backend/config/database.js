import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_NAME = process.env.NODE_ENV === "test" ? "database.test.sqlite" : "database.sqlite";
const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH, DB_NAME)
  : path.resolve(__dirname, "../", DB_NAME);

console.log(`[database.js] Initialisation de la base de données à : ${DB_PATH}`);

const db = new (sqlite3.verbose().Database)(DB_PATH, (err) => {
  if (err) {
    console.error("[database.js] Erreur de connexion à SQLite :", err.message);
  } else {
    console.log("[database.js] Connecté à la base de données SQLite.");
  }
});

// Helper pour exécuter des requêtes asynchrones qui ne retournent pas de lignes (INSERT, UPDATE, DELETE)
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        // 'this' contient lastID et changes dans le contexte d'exécution de sqlite3
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

// Helper pour récupérer une seule ligne (SELECT)
export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Helper pour récupérer toutes les lignes (SELECT)
export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Script d'initialisation des tables de la base de données
export async function initDatabase() {
  try {
    // Activation des clés étrangères pour garantir la cohérence référentielle
    await dbRun("PRAGMA foreign_keys = ON;");

    // Table des utilisateurs
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("[database.js] Table 'users' validée/créée.");

    // Table des prédictions (historique des analyses)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        match_url TEXT NOT NULL,
        equipe_domicile TEXT NOT NULL,
        equipe_exterieur TEXT NOT NULL,
        prediction_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("[database.js] Table 'predictions' validée/créée.");
    
  } catch (error) {
    console.error("[database.js] Erreur lors de l'initialisation des tables :", error.message);
    throw error;
  }
}

export default db;
