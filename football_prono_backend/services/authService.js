import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "football_prono_secret_key_change_me_in_prod";
const SALT_ROUNDS = 10;

/**
 * Hache un mot de passe en utilisant bcrypt.
 * 
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  if (!password || password.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare un mot de passe en clair avec son hash stocké.
 * 
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Génère un token JWT pour un utilisateur.
 * Le token expire après 24 heures.
 * 
 * @param {object} user 
 * @returns {string}
 */
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

/**
 * Décode et vérifie un token JWT.
 * 
 * @param {string} token 
 * @returns {object} charge utile décodée
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
