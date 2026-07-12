import dotenv from "dotenv";
import { scrapeMatchData } from "./services/scraperService.js";
import { cleanScrapedData, callAIModel } from "./services/aiService.js";
import fs from "fs";

dotenv.config();

const url = "https://www.365scores.com/fr/football/match/fifa-world-cup-5930/england-norway-2376-5054-5930#id=4760721";

async function run() {
  console.log("🚀 Début du test d'intégration de prédiction...");
  console.log(`🔗 URL : ${url}`);
  
  try {
    // 1. Scraping
    console.log("\n--- ÉTAPE 1 : Scraping ---");
    const rawData = await scrapeMatchData(url);
    console.log(`✅ Données scrapées reçues. Longueur : ${rawData.length} caractères.`);
    fs.writeFileSync("test_raw_scraped.txt", rawData, "utf-8");
    
    // 2. Nettoyage
    console.log("\n--- ÉTAPE 2 : Nettoyage NLP ---");
    const cleanedData = await cleanScrapedData(rawData);
    console.log(`✅ Données nettoyées reçues. Longueur : ${cleanedData.length} caractères.`);
    fs.writeFileSync("test_cleaned.txt", cleanedData, "utf-8");
    
    // Pourcentage de réduction
    const reduction = ((rawData.length - cleanedData.length) / rawData.length * 100).toFixed(1);
    console.log(`📉 Réduction de taille : -${reduction}%`);
    
    // 3. Modèle IA principal
    console.log("\n--- ÉTAPE 3 : Prédiction par l'IA principale ---");
    const predictionReport = await callAIModel(cleanedData);
    console.log("✅ Rapport de prédiction généré avec succès !");
    console.log(predictionReport);
    fs.writeFileSync("test_prediction_report.txt", predictionReport, "utf-8");
    
  } catch (error) {
    console.error("❌ Échec du test d'intégration :", error);
  }
}

run();
