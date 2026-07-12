import { dbRun, dbGet } from "../config/database.js";

/**
 * Insère un nouvel utilisateur dans la base de données.
 * 
 * @param {string} email 
 * @param {string} passwordHash 
 * @returns {Promise<{id: number, email: string}>}
 */
export async function createUser(email, passwordHash) {
  const sql = `
    INSERT INTO users (email, password_hash)
    VALUES (?, ?)
  `;
  try {
    const result = await dbRun(sql, [email.toLowerCase().trim(), passwordHash]);
    return { id: result.lastID, email };
  } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      throw new Error("Cet email est déjà enregistré.");
    }
    throw error;
  }
}

/**
 * Recherche un utilisateur par son email.
 * 
 * @param {string} email 
 * @returns {Promise<object|null>}
 */
export async function findUserByEmail(email) {
  const sql = "SELECT * FROM users WHERE email = ?";
  try {
    const row = await dbGet(sql, [email.toLowerCase().trim()]);
    return row || null;
  } catch (error) {
    console.error("[userModel.js] Erreur findUserByEmail :", error.message);
    throw error;
  }
}

/**
 * Recherche un utilisateur par son ID.
 * 
 * @param {number} id 
 * @returns {Promise<object|null>}
 */
export async function findUserById(id) {
  const sql = "SELECT id, email, created_at FROM users WHERE id = ?";
  try {
    const row = await dbGet(sql, [id]);
    return row || null;
  } catch (error) {
    console.error("[userModel.js] Erreur findUserById :", error.message);
    throw error;
  }
}
