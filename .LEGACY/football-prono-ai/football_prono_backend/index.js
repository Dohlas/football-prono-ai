import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { scrapeMatchData, getPredictionFromGemini } from "./scraper.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * Route de vérification rapide que le serveur tourne bien.
 */
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Football Prono AI backend opérationnel." });
});

/**
 * Route principale : reçoit l'URL d'un match 365Scores,
 * scrape les données, les envoie à Gemini, et renvoie le pronostic.
 *
 * Body attendu : { "url": "https://www.365scores.com/fr/football/match/..." }
 */
app.post("/api/analyser", async (req, res) => {
  const { url } = req.body;

  // --- Validation de l'entrée ---
  if (!url || typeof url !== "string") {
    return res.status(400).json({
      message: "Le champ 'url' est requis et doit être une chaîne de caractères.",
    });
  }

  if (!url.includes("365scores.com")) {
    return res.status(400).json({
      message: "L'URL fournie doit provenir du site 365Scores.",
    });
  }

  try {
    console.log(`[index.js] Analyse demandée pour : ${url}`);

    // Étape 1 : scraping de la page du match
    const scrapedData = await scrapeMatchData(url);

    if (!scrapedData || scrapedData.trim().length === 0) {
      return res.status(422).json({
        message: "Aucune donnée exploitable n'a pu être extraite de cette page.",
      });
    }

    // Étape 2 : analyse par Gemini
    const prediction = await getPredictionFromGemini(scrapedData);

    console.log(`[index.js] Pronostic généré avec succès pour : ${url}`);

    // Étape 3 : renvoi du résultat structuré à Flutter
    return res.status(200).json(prediction);
  } catch (error) {
    console.error("[index.js] Erreur lors du traitement de la requête :", error.message);

    return res.status(500).json({
      message: "Une erreur est survenue lors de l'analyse du match.",
      details: error.message,
    });
  }
});

/**
 * Middleware générique de capture des routes inconnues.
 */
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée." });
});

app.listen(PORT, () => {
  console.log(`[index.js] Serveur démarré sur http://localhost:${PORT}`);
});