import { dbRun, dbGet, dbAll } from "../config/database.js";

/**
 * Insère un nouveau rapport de prédiction dans la base de données.
 * 
 * @param {number} userId - ID de l'utilisateur
 * @param {string} matchUrl - URL du match analysé
 * @param {string} equipeDomicile - Nom de l'équipe à domicile
 * @param {string} equipeExterieur - Nom de l'équipe à l'extérieur
 * @param {object} predictionData - Données structurées de prédiction (JSON)
 * @returns {Promise<object>} La prédiction insérée
 */
export async function createPrediction(userId, matchUrl, equipeDomicile, equipeExterieur, predictionData) {
  const sql = `
    INSERT INTO predictions (user_id, match_url, equipe_domicile, equipe_exterieur, prediction_json)
    VALUES (?, ?, ?, ?, ?)
  `;
  try {
    const predictionJsonString = JSON.stringify(predictionData);
    const result = await dbRun(sql, [
      userId,
      matchUrl.trim(),
      equipeDomicile.trim(),
      equipeExterieur.trim(),
      predictionJsonString
    ]);
    
    return {
      id: result.lastID,
      user_id: userId,
      match_url: matchUrl,
      equipe_domicile: equipeDomicile,
      equipe_exterieur: equipeExterieur,
      prediction_json: predictionData
    };
  } catch (error) {
    console.error("[predModel.js] Erreur lors de l'insertion de la prédiction :", error.message);
    throw error;
  }
}

/**
 * Récupère une prédiction spécifique par son ID.
 * 
 * @param {number} id - ID de la prédiction
 * @returns {Promise<object|null>}
 */
export async function getPredictionById(id) {
  const sql = "SELECT * FROM predictions WHERE id = ?";
  try {
    const row = await dbGet(sql, [id]);
    if (!row) return null;
    return {
      ...row,
      prediction_json: JSON.parse(row.prediction_json)
    };
  } catch (error) {
    console.error("[predModel.js] Erreur getPredictionById :", error.message);
    throw error;
  }
}

/**
 * Récupère toutes les prédictions d'un utilisateur par son ID utilisateur (historique).
 * 
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<object[]>}
 */
export async function getPredictionsByUserId(userId) {
  const sql = "SELECT * FROM predictions WHERE user_id = ? ORDER BY id DESC";
  try {
    const rows = await dbAll(sql, [userId]);
    return rows.map((row) => ({
      ...row,
      prediction_json: JSON.parse(row.prediction_json)
    }));
  } catch (error) {
    console.error("[predModel.js] Erreur getPredictionsByUserId :", error.message);
    throw error;
  }
}

/**
 * Supprime une prédiction de l'historique d'un utilisateur.
 * 
 * @param {number} id - ID de la prédiction à supprimer
 * @param {number} userId - ID de l'utilisateur (pour vérification de sécurité)
 * @returns {Promise<boolean>} true si supprimé, false sinon
 */
export async function deletePrediction(id, userId) {
  const sql = "DELETE FROM predictions WHERE id = ? AND user_id = ?";
  try {
    const result = await dbRun(sql, [id, userId]);
    return result.changes > 0;
  } catch (error) {
    console.error("[predModel.js] Erreur deletePrediction :", error.message);
    throw error;
  }
}
