import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Schéma de validation Zod pour le rapport de prédiction
export const predictionResponseSchema = z.object({
  equipe_domicile: z.string().default("Équipe Domicile"),
  equipe_exterieur: z.string().default("Équipe Extérieur"),
  synthese: z.string().default("Analyse non disponible."),
  resultat_1x2: z.object({
    victoire_domicile: z.coerce.number().default(34),
    match_nul: z.coerce.number().default(33),
    victoire_exterieur: z.coerce.number().default(33)
  }).default({
    victoire_domicile: 34,
    match_nul: 33,
    victoire_exterieur: 33
  }),
  plus_moins_2_5_buts: z.object({
    plus_de_2_5: z.coerce.number().default(50),
    moins_de_2_5: z.coerce.number().default(50)
  }).default({
    plus_de_2_5: 50,
    moins_de_2_5: 50
  }),
  les_deux_equipes_marquent: z.object({
    oui: z.coerce.number().default(50),
    non: z.coerce.number().default(50)
  }).default({
    oui: 50,
    non: 50
  }),
  scores_exacts_probables: z.array(
    z.object({
      score: z.string(),
      probabilite: z.coerce.number()
    })
  ).max(3).default([]),
  corners_estimes: z.object({
    domicile: z.object({
      premiere_mi_temps: z.coerce.number().default(2.5),
      deuxieme_mi_temps: z.coerce.number().default(2.5),
      total: z.coerce.number().default(5)
    }).default({
      premiere_mi_temps: 2.5,
      deuxieme_mi_temps: 2.5,
      total: 5
    }),
    exterieur: z.object({
      premiere_mi_temps: z.coerce.number().default(2),
      deuxieme_mi_temps: z.coerce.number().default(2),
      total: z.coerce.number().default(4)
    }).default({
      premiere_mi_temps: 2,
      deuxieme_mi_temps: 2,
      total: 4
    })
  }).default({
    domicile: { premiere_mi_temps: 2.5, deuxieme_mi_temps: 2.5, total: 5 },
    exterieur: { premiere_mi_temps: 2, deuxieme_mi_temps: 2, total: 4 }
  }),
  buteurs_probables: z.array(
    z.object({
      joueur: z.string(),
      equipe: z.string(),
      probabilite: z.coerce.number()
    })
  ).default([]),
  cartons_estimes: z.object({
    domicile: z.object({
      jaunes: z.coerce.number().default(1.5),
      rouges: z.coerce.number().default(0)
    }).default({
      jaunes: 1.5,
      rouges: 0
    }),
    exterieur: z.object({
      jaunes: z.coerce.number().default(2),
      rouges: z.coerce.number().default(0)
    }).default({
      jaunes: 2,
      rouges: 0
    })
  }).default({
    domicile: { jaunes: 1.5, rouges: 0 },
    exterieur: { jaunes: 2, rouges: 0 }
  }),
  paris_les_plus_surs: z.array(z.string()).default(["Double chance Domicile ou Nul"]),
  paris_a_eviter: z.array(z.string()).default(["Score exact"]),
  niveau_de_confiance: z.string()
    .transform(val => {
      const normalized = val.toLowerCase().trim();
      if (normalized === "low" || normalized === "faible") return "faible";
      if (normalized === "high" || normalized === "eleve") return "eleve";
      return "moyen";
    })
    .default("moyen")
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Registre des modèles par défaut et alternatifs par fournisseur d'IA
const PROVIDER_MODELS = {
  gemini: {
    default: process.env.GEMINI_MODEL || "gemini-3.5-flash",
    alternatives: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-1.5-pro"]
  },
  openai: {
    default: process.env.OPENAI_MODEL || "gpt-4o-mini",
    alternatives: ["gpt-4o", "gpt-3.5-turbo", "gpt-4-turbo"]
  },
  anthropic: {
    default: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
    alternatives: ["claude-3-5-sonnet-latest", "claude-3-opus-20240229", "claude-3-haiku-20240307"]
  }
};

// Cache mémoire pour le prompt système
let systemPromptCache = null;

// Cache mémoire pour le prompt de nettoyage
let cleanPromptCache = null;

/**
 * Charge le prompt système de manière asynchrone et le met en cache.
 */
export async function getSystemPrompt() {
  if (systemPromptCache) {
    return systemPromptCache;
  }
  
  const promptPath = path.resolve(__dirname, "../prompts/system_prompt.md");
  try {
    const data = await fs.readFile(promptPath, "utf-8");
    systemPromptCache = data.trim();
    return systemPromptCache;
  } catch (error) {
    console.error("[aiService.js] Erreur lors du chargement du prompt système :", error.message);
    throw new Error(`Impossible de charger le prompt système : ${error.message}`);
  }
}

/**
 * Charge le prompt de nettoyage de manière asynchrone et le met en cache.
 */
export async function getCleanPrompt() {
  if (cleanPromptCache) {
    return cleanPromptCache;
  }
  
  const promptPath = path.resolve(__dirname, "../prompts/clean_prompt.md");
  try {
    const data = await fs.readFile(promptPath, "utf-8");
    cleanPromptCache = data.trim();
    return cleanPromptCache;
  } catch (error) {
    console.error("[aiService.js] Erreur lors du chargement du prompt de nettoyage :", error.message);
    throw new Error(`Impossible de charger le prompt de nettoyage : ${error.message}`);
  }
}

/**
 * Nettoie les données textuelles du match à l'aide d'un modèle rapide et léger de Gemini.
 * 
 * @param {string} scrapedData - Les données brutes récupérées par le scraper
 * @returns {Promise<string>} Les données nettoyées
 */
export async function cleanScrapedData(scrapedData) {
  if (!scrapedData || !scrapedData.trim()) {
    return "";
  }

  if (process.env.NODE_ENV === "test") {
    return scrapedData;
  }

  const cleanPrompt = await getCleanPrompt();
  const systemInstruction = cleanPrompt;
  const userPrompt = `<raw_text>\n${scrapedData}\n</raw_text>`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Clé d'API GEMINI_API_KEY non configurée pour le nettoyage.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Modèles de nettoyage ordonnés (du plus rapide au plus stable)
  const cleanModels = [
    process.env.GEMINI_CLEAN_MODEL || "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-pro"
  ];

  let lastError = null;
  for (const modelId of cleanModels) {
    try {
      console.log(`[aiService.js] Nettoyage : Tentative avec ${modelId}`);
      const response = await ai.models.generateContent({
        model: modelId,
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.0,
        }
      });
      
      const cleanedText = response.text;
      const match = cleanedText.match(/<cleaned_text>([\s\S]*?)<\/cleaned_text>/);
      return match ? match[1].trim() : cleanedText.trim();
    } catch (err) {
      console.warn(`[aiService.js] ❌ Nettoyage : Échec avec le modèle ${modelId} : ${err.message}`);
      lastError = err;
    }
  }

  // Fallback ultime : si l'IA échoue complètement à nettoyer, on retourne le texte brut pour ne pas bloquer le flux
  console.error("[aiService.js] ⚠️ Le nettoyage IA a complètement échoué. Utilisation des données brutes en secours.", lastError ? lastError.message : "");
  return scrapedData;
}

/**
 * Dispatcher d'IA universel : envoie la requête vers le provider sélectionné.
 * Par défaut, utilise Google Gemini.
 * Gère le fallback automatique des modèles sur la même clé API en cas d'échec.
 * 
 * @param {string} scrapedData - Les données textuelles du match
 * @param {string} provider - Le provider ('gemini' | 'openai' | 'anthropic')
 * @returns {Promise<string>} La réponse brute du modèle (contenant le XML)
 */
export async function callAIModel(scrapedData, provider = "gemini") {
  if (process.env.NODE_ENV === "test") {
    return `
<prediction_report>
  <equipe_domicile>Paris SG</equipe_domicile>
  <equipe_exterieur>Lyon</equipe_exterieur>
  <synthese>PSG is statistical favorite with 60% possession.</synthese>
  <resultat_1x2>
    <victoire_domicile>62</victoire_domicile>
    <match_nul>20</match_nul>
    <victoire_exterieur>18</victoire_exterieur>
  </resultat_1x2>
  <plus_moins_2_5_buts>
    <plus_de_2_5>65</plus_de_2_5>
    <moins_de_2_5>35</moins_de_2_5>
  </plus_moins_2_5_buts>
  <les_deux_equipes_marquent>
    <oui>60</oui>
    <non>40</non>
  </les_deux_equipes_marquent>
  <scores_exacts_probables>
    <score_item>
      <score>2-1</score>
      <probabilite>18</probabilite>
    </score_item>
  </scores_exacts_probables>
  <corners_estimes>
    <domicile>
      <premiere_mi_temps>3</premiere_mi_temps>
      <deuxieme_mi_temps>3</deuxieme_mi_temps>
      <total>6</total>
    </domicile>
    <exterieur>
      <premiere_mi_temps>2</premiere_mi_temps>
      <deuxieme_mi_temps>2</deuxieme_mi_temps>
      <total>4</total>
    </exterieur>
  </corners_estimes>
  <buteurs_probables>
    <buteur_item>
      <joueur>Mbappe</joueur>
      <equipe>Paris SG</equipe>
      <probabilite>55</probabilite>
    </buteur_item>
  </buteurs_probables>
  <cartons_estimes>
    <domicile>
      <jaunes>1</jaunes>
      <rouges>0</rouges>
    </domicile>
    <exterieur>
      <jaunes>2</jaunes>
      <rouges>0</rouges>
    </exterieur>
  </cartons_estimes>
  <paris_les_plus_surs>
    <paris_item>PSG Win</paris_item>
  </paris_les_plus_surs>
  <paris_a_eviter>
    <paris_item>Lyon Clean Sheet</paris_item>
  </paris_a_eviter>
  <niveau_de_confiance>eleve</niveau_de_confiance>
</prediction_report>
    `;
  }

  const rawSystemPrompt = await getSystemPrompt();
  
  // Remplacement de la variable {scraped_data} par les données scraped de match
  const systemInstruction = rawSystemPrompt.replace(
    "{scraped_data}",
    scrapedData && scrapedData.trim() ? scrapedData.trim() : "No scraped data available."
  );
  
  // Construction du prompt utilisateur (déclencheur simple)
  const userPrompt = "Execute prediction report generation.";

  const selectedProvider = process.env.AI_PROVIDER || provider;
  
  console.log(`[aiService.js] Dispatcher IA — provider : ${selectedProvider}`);

  const config = PROVIDER_MODELS[selectedProvider.toLowerCase()];
  if (!config) {
    throw new Error(`Provider d'IA non supporté : ${selectedProvider}`);
  }

  // On construit la liste des modèles à tenter : le modèle configuré en premier, puis les alternatives uniques
  const modelsToTry = [config.default];
  for (const alt of config.alternatives) {
    if (alt !== config.default) {
      modelsToTry.push(alt);
    }
  }

  let lastError = null;

  for (const modelId of modelsToTry) {
    try {
      console.log(`[aiService.js] Tentative d'analyse avec le modèle : ${modelId} (${selectedProvider})`);
      if (selectedProvider === "gemini") {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("Clé d'API GEMINI_API_KEY non configurée.");
        }
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
          model: modelId,
          contents: userPrompt,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.1,
            // Seulement inclure thinkingConfig si le modèle est gemini-3.5-flash ou pro
            ...(modelId.includes("3.5") ? {
              thinkingConfig: {
                thinkingBudget: 20000,
                includeThoughts: false
              }
            } : {})
          }
        });

        return response.text;
      } 
      
      else if (selectedProvider === "openai") {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error("Clé d'API OPENAI_API_KEY non configurée pour le mode OpenAI.");
        }
        
        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey });
        
        const response = await openai.chat.completions.create({
          model: modelId,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1,
        });
        
        return response.choices[0].message.content;
      }
      
      else if (selectedProvider === "anthropic") {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          throw new Error("Clé d'API ANTHROPIC_API_KEY non configurée pour le mode Anthropic.");
        }
        
        const { default: Anthropic } = await import("@anthropic-ai/sdk");
        const anthropic = new Anthropic({ apiKey });
        
        const response = await anthropic.messages.create({
          model: modelId,
          max_tokens: 4000,
          system: systemInstruction,
          messages: [
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1,
        });
        
        return response.content[0].text;
      }
    } catch (err) {
      console.warn(`[aiService.js] ❌ Échec avec le modèle ${modelId} (${selectedProvider}) : ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`Tous les modèles pour le provider ${selectedProvider} ont échoué. Dernière erreur : ${lastError ? lastError.message : 'inconnue'}`);
}

/**
 * Parseur robuste à double niveau : extrait les données XML et gère le fallback.
 * 
 * @param {string} rawText - La réponse textuelle brute de l'IA
 * @returns {object} Le JSON structuré final conforme au schéma de l'application
 */
export function parseAIResponse(rawText) {
  if (!rawText) {
    return generateDefaultPrediction("Erreur : réponse vide reçue de l'IA.");
  }

  let result = null;

  // --- NIVEAU 1 : PARSING XML STRICT ---
  try {
    const xmlMatch = rawText.match(/<prediction_report>([\s\S]*?)<\/prediction_report>/);
    
    if (xmlMatch) {
      const xmlContent = xmlMatch[1];
      
      const homeTeam = extractTag(xmlContent, "equipe_domicile") || "Équipe Domicile";
      const awayTeam = extractTag(xmlContent, "equipe_exterieur") || "Équipe Extérieur";
      const synthesis = extractTag(xmlContent, "synthese") || "Analyse indisponible.";
      const confidence = extractTag(xmlContent, "niveau_de_confiance") || "moyen";

      // 1X2
      const homeProb = parseFloat(extractTag(xmlContent, "victoire_domicile")) || 34;
      const drawProb = parseFloat(extractTag(xmlContent, "match_nul")) || 33;
      const awayProb = parseFloat(extractTag(xmlContent, "victoire_exterieur")) || 33;

      // Over/Under 2.5
      const overProb = parseFloat(extractTag(xmlContent, "plus_de_2_5")) || 50;
      const underProb = parseFloat(extractTag(xmlContent, "moins_de_2_5")) || 50;

      // BTTS
      const bttsYes = parseFloat(extractTag(xmlContent, "oui")) || 50;
      const bttsNo = parseFloat(extractTag(xmlContent, "non")) || 50;

      // Scores exacts
      const scores = [];
      const scoreItems = xmlContent.match(/<score_item>([\s\S]*?)<\/score_item>/g) || [];
      for (const item of scoreItems) {
        const scoreVal = extractTag(item, "score");
        const probVal = parseFloat(extractTag(item, "probabilite"));
        if (scoreVal && !isNaN(probVal)) {
          scores.push({ score: scoreVal, probabilite: probVal });
        }
      }

      // Corners
      const cornersContent = extractTag(xmlContent, "corners_estimes") || xmlContent;
      const corners = {
        domicile: {
          premiere_mi_temps: parseFloat(extractNestedTag(cornersContent, "domicile", "premiere_mi_temps")) || 2.5,
          deuxieme_mi_temps: parseFloat(extractNestedTag(cornersContent, "domicile", "deuxieme_mi_temps")) || 2.5,
          total: parseFloat(extractNestedTag(cornersContent, "domicile", "total")) || 5
        },
        exterieur: {
          premiere_mi_temps: parseFloat(extractNestedTag(cornersContent, "exterieur", "premiere_mi_temps")) || 2,
          deuxieme_mi_temps: parseFloat(extractNestedTag(cornersContent, "exterieur", "deuxieme_mi_temps")) || 2,
          total: parseFloat(extractNestedTag(cornersContent, "exterieur", "total")) || 4
        }
      };

      // Buteurs
      const scorers = [];
      const buteurItems = xmlContent.match(/<buteur_item>([\s\S]*?)<\/buteur_item>/g) || [];
      for (const item of buteurItems) {
        const joueur = extractTag(item, "joueur");
        const equipe = extractTag(item, "equipe");
        const probabilite = parseFloat(extractTag(item, "probabilite"));
        if (joueur && equipe && !isNaN(probabilite)) {
          scorers.push({ joueur, equipe, probabilite });
        }
      }

      // Cartons
      const cartonsContent = extractTag(xmlContent, "cartons_estimes") || xmlContent;
      const cards = {
        domicile: {
          jaunes: parseFloat(extractNestedTag(cartonsContent, "domicile", "jaunes")) || 1.5,
          rouges: parseFloat(extractNestedTag(cartonsContent, "domicile", "rouges")) || 0
        },
        exterieur: {
          jaunes: parseFloat(extractNestedTag(cartonsContent, "exterieur", "jaunes")) || 2,
          rouges: parseFloat(extractNestedTag(cartonsContent, "exterieur", "rouges")) || 0
        }
      };

      // Paris
      const safeBets = [];
      const safeBetMatches = xmlContent.match(/<paris_les_plus_surs>([\s\S]*?)<\/paris_les_plus_surs>/);
      if (safeBetMatches) {
        const items = safeBetMatches[1].match(/<paris_item>([\s\S]*?)<\/paris_item>/g) || [];
        items.forEach(i => safeBets.push(cleanText(i.replace(/<\/?paris_item>/g, ""))));
      }

      const riskyBets = [];
      const riskyBetMatches = xmlContent.match(/<paris_a_eviter>([\s\S]*?)<\/paris_a_eviter>/);
      if (riskyBetMatches) {
        const items = riskyBetMatches[1].match(/<paris_item>([\s\S]*?)<\/paris_item>/g) || [];
        items.forEach(i => riskyBets.push(cleanText(i.replace(/<\/?paris_item>/g, ""))));
      }

      const parsedObject = {
        equipe_domicile: homeTeam,
        equipe_exterieur: awayTeam,
        synthese: synthesis,
        resultat_1x2: {
          victoire_domicile: homeProb,
          match_nul: drawProb,
          victoire_exterieur: awayProb
        },
        plus_moins_2_5_buts: {
          plus_de_2_5: overProb,
          moins_de_2_5: underProb
        },
        les_deux_equipes_marquent: {
          oui: bttsYes,
          non: bttsNo
        },
        scores_exacts_probables: scores.slice(0, 3),
        corners_estimes: corners,
        buteurs_probables: scorers,
        cartons_estimes: cards,
        paris_les_plus_surs: safeBets.length > 0 ? safeBets : ["Double chance Domicile ou Nul"],
        paris_a_eviter: riskyBets.length > 0 ? riskyBets : ["Score exact"],
        niveau_de_confiance: confidence
      };

      result = predictionResponseSchema.parse(parsedObject);
    }
  } catch (error) {
    console.warn("[aiService.js] Erreur de parsing XML strict ou de validation Zod :", error.message);
  }

  if (result) {
    return result;
  }

  // --- NIVEAU 2 : PARSING DE SECOURS (FALLBACK REGEX) ---
  console.warn("[aiService.js] Lancement du parseur de secours.");
  try {
    const fallbackObject = parseFallback(rawText);
    return predictionResponseSchema.parse(fallbackObject);
  } catch (error) {
    console.error("[aiService.js] Échec critique du parseur de secours Zod :", error.message);
    return generateDefaultPrediction(`Échec du parseur de secours : ${error.message}`);
  }
}

// Helpers d'extraction XML légers et tolérants
function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`));
  return match ? cleanText(match[1]) : "";
}

function extractNestedTag(xml, parentTag, childTag) {
  const parentMatch = xml.match(new RegExp(`<${parentTag}>([\\s\\S]*?)<\/${parentTag}>`));
  if (!parentMatch) return "";
  const parentContent = parentMatch[1];
  const childMatch = parentContent.match(new RegExp(`<${childTag}>([\\s\\S]*?)<\/${childTag}>`));
  return childMatch ? cleanText(childMatch[1]) : "";
}

function cleanText(text) {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

/**
 * Extraction par expressions régulières de secours (Fallback).
 */
function parseFallback(rawText) {
  const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  
  let homeTeam = "Équipe Domicile";
  let awayTeam = "Équipe Extérieur";
  let synthese = "Analyse générée par le parseur de secours.";
  let confidence = "moyen";

  // Tentative d'extraction des noms d'équipes
  for (const line of lines) {
    const vsMatch = line.match(/(.*)\s+vs\s+(.*)/i) || line.match(/(.*)\s+-\s+(.*)/);
    if (vsMatch) {
      homeTeam = vsMatch[1].trim();
      let away = vsMatch[2].trim();
      // Nettoie l'équipe de tout mot-clé de bruit et des points de fin de ligne
      away = away.replace(/(match|prediction|analysis|preview|rapport|prono|\.)/gi, "").trim();
      awayTeam = away;
      break;
    }
  }

  // Recherche de pourcentages 1X2
  let homeProb = 34, drawProb = 33, awayProb = 33;
  const percentages = [];
  rawText.replace(/(\d+)%/g, (m, p) => {
    percentages.push(parseInt(p));
  });

  if (percentages.length >= 3) {
    homeProb = percentages[0];
    drawProb = percentages[1];
    awayProb = percentages[2];
  }

  // Synthese
  const textLines = lines.filter(l => !l.includes("<") && l.length > 30);
  if (textLines.length > 0) {
    synthese = textLines.slice(0, 3).join(" ");
  }

  // Niveau de confiance
  if (rawText.toLowerCase().includes("eleve") || rawText.toLowerCase().includes("high")) {
    confidence = "eleve";
  } else if (rawText.toLowerCase().includes("faible") || rawText.toLowerCase().includes("low")) {
    confidence = "faible";
  }

  return {
    equipe_domicile: homeTeam,
    equipe_exterieur: awayTeam,
    synthese: synthese,
    resultat_1x2: {
      victoire_domicile: homeProb,
      match_nul: drawProb,
      victoire_exterieur: awayProb
    },
    plus_moins_2_5_buts: {
      plus_de_2_5: 50,
      moins_de_2_5: 50
    },
    les_deux_equipes_marquent: {
      oui: 50,
      non: 50
    },
    scores_exacts_probables: [
      { score: "1-1", probabilite: 15 },
      { score: "2-1", probabilite: 12 },
      { score: "1-2", probabilite: 10 }
    ],
    corners_estimes: {
      domicile: { premiere_mi_temps: 2.5, deuxieme_mi_temps: 2.5, total: 5 },
      exterieur: { premiere_mi_temps: 2, deuxieme_mi_temps: 2, total: 4 }
    },
    buteurs_probables: [],
    cartons_estimes: {
      domicile: { jaunes: 2, rouges: 0 },
      exterieur: { jaunes: 2, rouges: 0 }
    },
    paris_les_plus_surs: ["Double chance: Domicile ou Nul"],
    paris_a_eviter: ["Score exact"],
    niveau_de_confiance: confidence
  };
}

/**
 * Génère une prédiction par défaut cohérente en cas de plantage total.
 */
function generateDefaultPrediction(message) {
  return {
    equipe_domicile: "Équipe Domicile",
    equipe_exterieur: "Équipe Extérieur",
    synthese: `Alerte : Le traitement a basculé sur le mode par défaut. Détail : ${message}`,
    resultat_1x2: { victoire_domicile: 34, match_nul: 33, victoire_exterieur: 33 },
    plus_moins_2_5_buts: { plus_de_2_5: 50, moins_de_2_5: 50 },
    les_deux_equipes_marquent: { oui: 50, non: 50 },
    scores_exacts_probables: [{ score: "1-1", probabilite: 15 }],
    corners_estimes: {
      domicile: { premiere_mi_temps: 2.5, deuxieme_mi_temps: 2.5, total: 5 },
      exterieur: { premiere_mi_temps: 2, deuxieme_mi_temps: 2, total: 4 }
    },
    buteurs_probables: [],
    cartons_estimes: {
      domicile: { jaunes: 2, rouges: 0 },
      exterieur: { jaunes: 2, rouges: 0 }
    },
    paris_les_plus_surs: ["Double chance Domicile ou Nul"],
    paris_a_eviter: ["Score exact"],
    niveau_de_confiance: "faible"
  };
}
