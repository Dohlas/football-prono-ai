import { scrapeMatchData } from "../services/scraperService.js";
import { callAIModel, parseAIResponse, cleanScrapedData } from "../services/aiService.js";
import {
  createPrediction,
  getPredictionsByUserId,
  deletePrediction
} from "../models/predModel.js";
import { logError } from "../services/logger.js";

/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  SÉPARATION DES MESSAGES D'ERREUR
 *
 *  Messages INTERNES (logs serveur) : console.error / logError
 *    → Techniques, contiennent les stack traces, codes HTTP bruts, noms de
 *      variables d'environnement, etc. Jamais vus par l'utilisateur.
 *
 *  Messages UTILISATEUR (friendlyMessage → envoyés au frontend) :
 *    → Chaleureux, clairs, sans jargon technique.
 *    → Commencent par "Oups" si c'est une erreur de notre côté.
 *    → Proposent toujours une action (réessayer, vérifier, patienter).
 *    → Ne contiennent JAMAIS de error.message brut pour éviter les fuites.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Traduit un message d'erreur technique en message UX-friendly pour l'utilisateur.
 * Le message brut reste dans les logs serveur (logError / console.error).
 *
 * Invariant : retourne toujours un message non-vide, sans jargon technique.
 *
 * @param {string} technicalMessage - Le error.message brut (usage logs uniquement)
 * @returns {string} Message destiné à l'affichage UI
 */
function toUserMessage(technicalMessage) {
  const msg = (technicalMessage || "").toLowerCase();

  // IA — clé API manquante ou service indisponible
  if (msg.includes("gemini_api_key") || msg.includes("clé d'api") || msg.includes("googlegenai") || msg.includes("non configurée")) {
    return "Oups, notre service d'analyse est temporairement indisponible. Réessayez dans quelques minutes.";
  }

  // IA — surcharge temporaire (503 Service Unavailable)
  if (msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand") || msg.includes("overloaded")) {
    return "Oups, l'IA est temporairement surchargée. Réessayez dans 30 secondes.";
  }

  // IA — quota épuisé (429 Too Many Requests)
  if (msg.includes("429") || msg.includes("resource_exhausted") || msg.includes("quota")) {
    return "Oups, nous avons atteint notre limite de requêtes pour le moment. Réessayez dans quelques minutes.";
  }

  // IA — erreur interne du modèle (500, INTERNAL, safety block)
  if (msg.includes("500") || msg.includes("internal") || msg.includes("safety") || msg.includes("blocked")) {
    return "Oups, l'IA n'a pas pu traiter cette demande. Réessayez ou essayez un autre match.";
  }

  // Scraping — timeout, playwright, page introuvable
  if (msg.includes("timeout") || msg.includes("playwright") || msg.includes("navigu") || msg.includes("365scores") || msg.includes("scraping") || msg.includes("introuvable")) {
    return "Impossible de récupérer les données de ce match. Vérifiez le lien ou réessayez dans quelques instants.";
  }

  // Parsing — validation Zod ou parsing du résultat IA
  if (msg.includes("validation") || msg.includes("parsing") || msg.includes("zod")) {
    return "L'analyse n'a pas produit un résultat exploitable. Réessayez.";
  }

  // Fallback — JAMAIS de message technique brut vers l'utilisateur
  return "Oups, une erreur inattendue s'est produite. Réessayez dans quelques instants.";
}

/**
 * Endpoint de traitement d'un match (Scraping -> IA -> Parsing -> Persistence).
 * Supporte le mode synchrone standard et le mode streaming en temps réel (NDJSON).
 */
export async function analyzeMatch(req, res) {
  const matchUrl = req.body.matchUrl || req.body.url;
  const userId = req.user.id; // injecté par authMiddleware.js
  const isStream = req.body.stream === true;

  if (!matchUrl) {
    const userMsg = "Veuillez coller le lien d'un match 365Scores pour lancer l'analyse.";
    if (isStream) {
      res.setHeader("Content-Type", "application/x-ndjson");
      res.write(JSON.stringify({ type: "error", message: userMsg }) + "\n");
      return res.end();
    }
    return res.status(400).json({ error: userMsg });
  }

  if (!matchUrl.includes("365scores.com")) {
    const userMsg = "Ce lien ne provient pas de 365Scores. Vérifiez l'adresse et réessayez.";
    if (isStream) {
      res.setHeader("Content-Type", "application/x-ndjson");
      res.write(JSON.stringify({ type: "error", message: userMsg }) + "\n");
      return res.end();
    }
    return res.status(400).json({ error: userMsg });
  }

  if (isStream) {
    // Mode streaming en temps réel (NDJSON)
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendProgress = (type, data) => {
      res.write(JSON.stringify({ type, ...data }) + "\n");
    };

    try {
      // LOG INTERNE — technique, invisible pour l'utilisateur
      console.log(`[predController] Analyse stream — user:${userId} url:${matchUrl}`);

      sendProgress("status", { step: "scraping", message: "On récupère les statistiques du match sur 365Scores..." });
      const scrapedText = await scrapeMatchData(matchUrl);

      sendProgress("status", { step: "clean", message: "On nettoie et on filtre les données du match..." });
      const cleanedText = await cleanScrapedData(scrapedText);

      sendProgress("status", { step: "ai", message: "On calcule les probabilités et on projette les résultats..." });
      const rawAiText = await callAIModel(cleanedText);

      sendProgress("status", { step: "parsing", message: "On valide et on formate l'analyse..." });
      const predictionData = parseAIResponse(rawAiText);

      sendProgress("status", { step: "saving", message: "On enregistre l'analyse dans votre tableau de bord..." });
      const savedPrediction = await createPrediction(
        userId,
        matchUrl,
        predictionData.equipe_domicile,
        predictionData.equipe_exterieur,
        predictionData
      );

      sendProgress("result", { prediction: savedPrediction });
      res.end();
    } catch (error) {
      // LOG INTERNE — technique complet, invisible pour l'utilisateur
      await logError(`[predController] Erreur stream — user:${userId} url:${matchUrl}`, error);

      // MESSAGE UTILISATEUR — chaleureux, sans jargon
      const userMsg = toUserMessage(error.message);
      sendProgress("error", { message: userMsg });
      res.end();
    }
  } else {
    // Mode synchrone classique (conservé pour rétrocompatibilité)
    try {
      // LOG INTERNE
      console.log(`[predController] Analyse sync — user:${userId} url:${matchUrl}`);

      const scrapedText = await scrapeMatchData(matchUrl);
      const cleanedText = await cleanScrapedData(scrapedText);
      const rawAiText = await callAIModel(cleanedText);
      const predictionData = parseAIResponse(rawAiText);

      const savedPrediction = await createPrediction(
        userId,
        matchUrl,
        predictionData.equipe_domicile,
        predictionData.equipe_exterieur,
        predictionData
      );

      return res.status(200).json(savedPrediction);
    } catch (error) {
      // LOG INTERNE
      await logError(`[predController] Erreur sync — user:${userId} url:${matchUrl}`, error);

      // MESSAGE UTILISATEUR
      const userMsg = toUserMessage(error.message);
      return res.status(500).json({ error: userMsg });
    }
  }
}

/**
 * Récupère l'historique complet des prédictions de l'utilisateur.
 */
export async function getHistory(req, res) {
  const userId = req.user.id;
  try {
    const history = await getPredictionsByUserId(userId);
    return res.status(200).json(history);
  } catch (error) {
    // LOG INTERNE
    console.error("[predController] Erreur getHistory :", error.message);
    // MESSAGE UTILISATEUR
    return res.status(500).json({ error: "Impossible de charger votre historique pour le moment. Réessayez." });
  }
}

/**
 * Supprime une prédiction spécifique de l'historique de l'utilisateur.
 */
export async function deleteHistoryItem(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Impossible de supprimer : identifiant manquant." });
  }

  try {
    const deleted = await deletePrediction(parseInt(id), userId);
    if (!deleted) {
      return res.status(404).json({ error: "Cette analyse n'existe plus ou a déjà été supprimée." });
    }
    return res.status(200).json({ message: "Analyse supprimée." });
  } catch (error) {
    // LOG INTERNE
    console.error("[predController] Erreur deleteHistoryItem :", error.message);
    // MESSAGE UTILISATEUR
    return res.status(500).json({ error: "Impossible de supprimer cette analyse pour le moment. Réessayez." });
  }
}
