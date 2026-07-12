import { verifyToken } from "../services/authService.js";
import { findUserById } from "../models/userModel.js";

/**
 * Middleware qui sécurise une route en vérifiant la présence
 * et la validité d'un token JWT dans les en-têtes de la requête,
 * ainsi que son existence en base de données.
 * 
 * En-tête attendu : Authorization: Bearer <token>
 */
export default async function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      message: "Accès refusé. Aucun token d'authentification fourni.",
    });
  }

  // L'en-tête doit commencer par "Bearer "
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      message: "Format du token invalide. Le format attendu est : Bearer <token>.",
    });
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    
    // Vérification stricte de l'existence de l'utilisateur dans la base de données
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: "Votre compte n'a pas été trouvé (base de données réinitialisée). Veuillez vous ré-inscrire.",
      });
    }

    // On injecte les infos utilisateur décodées (id, email) dans l'objet req
    req.user = decoded;
    next();
  } catch (error) {
    console.warn("[authMiddleware.js] Échec de validation du token :", error.message);
    return res.status(401).json({
      message: "Session expirée ou token invalide. Veuillez vous reconnecter.",
      details: error.message,
    });
  }
}
