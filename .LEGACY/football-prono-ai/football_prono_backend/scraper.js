import { chromium } from "playwright";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn(
    "[scraper.js] ATTENTION : la variable d'environnement GEMINI_API_KEY n'est pas définie."
  );
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Ouvre l'URL 365Scores fournie, attend le chargement complet du JS,
 * puis extrait le texte des différentes sections du match (aperçu,
 * statistiques, face-à-face, classement) en les labellisant séparément,
 * afin que Gemini sache précisément d'où provient chaque information
 * et ne mélange pas des données de nature différente.
 *
 * NOTE : 365Scores étant une SPA dont les classes CSS changent
 * régulièrement, on privilégie ici une extraction par onglets/sections
 * visibles plutôt que des sélecteurs CSS figés. Le texte de chaque
 * section est capté juste après avoir cliqué sur son onglet, ce qui
 * donne un contexte plus propre que le texte brut de toute la page.
 *
 * @param {string} matchUrl - URL complète d'un match 365Scores
 * @returns {Promise<string>} texte structuré en sections, nettoyé
 */
export async function scrapeMatchData(matchUrl) {
  if (!matchUrl || !matchUrl.includes("365scores.com")) {
    throw new Error("URL invalide : une URL 365Scores est attendue.");
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      locale: "fr-FR",
      viewport: { width: 1366, height: 900 },
    });

    const page = await context.newPage();

    console.log(`[scraper.js] Ouverture de la page : ${matchUrl}`);
    await page.goto(matchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {
      console.warn("[scraper.js] networkidle non atteint, on continue quand même.");
    });
    await page.waitForTimeout(3000);

    const sections = [];

    // --- Section 1 : Aperçu général (page par défaut) ---
    // Contient généralement les noms d'équipes, le score, la date,
    // et parfois les cotes des bookmakers.
    const overviewText = await page.evaluate(() => document.body.innerText || "");
    sections.push({ label: "APERÇU GÉNÉRAL (score, cotes, infos match)", text: overviewText });

    // --- Sections suivantes : onglets Stats / H2H / Classement ---
    // On clique sur chaque onglet, on attend le re-rendu, puis on capture
    // uniquement le texte à ce moment précis, labellisé par son intitulé.
    const tabsToTry = [
      { search: ["Stats", "Statistiques"], label: "STATISTIQUES DU MATCH" },
      { search: ["H2H", "Face à face", "Face-à-face"], label: "HISTORIQUE FACE-À-FACE" },
      { search: ["Standings", "Classement"], label: "CLASSEMENT DE LA COMPÉTITION" },
      { search: ["Lineups", "Compositions"], label: "COMPOSITIONS D'ÉQUIPE" },
      { search: ["Form", "Forme"], label: "FORME RÉCENTE DES ÉQUIPES" },
    ];

    for (const tab of tabsToTry) {
      for (const label of tab.search) {
        try {
          const tabElement = page.getByText(label, { exact: false }).first();
          if (await tabElement.isVisible({ timeout: 1500 })) {
            await tabElement.click({ timeout: 1500 });
            await page.waitForTimeout(1200);

            const sectionText = await page.evaluate(() => document.body.innerText || "");
            sections.push({ label: tab.label, text: sectionText });
            break; // Onglet trouvé et capturé, on passe au suivant.
          }
        } catch {
          // Onglet non trouvé sous ce libellé : on essaie le libellé suivant.
        }
      }
    }

    await browser.close();

    return formatSections(sections);
  } catch (error) {
    if (browser) await browser.close();
    console.error("[scraper.js] Erreur pendant le scraping :", error.message);
    throw new Error(`Échec du scraping de la page 365Scores : ${error.message}`);
  }
}

/**
 * Nettoie et assemble les sections capturées en un texte structuré,
 * avec des en-têtes clairs pour que Gemini distingue l'origine de
 * chaque information (au lieu d'un unique bloc de texte indifférencié).
 *
 * Les sections consécutives quasi identiques (onglet qui n'a pas changé
 * le contenu visible) sont fusionnées pour éviter la redondance.
 *
 * @param {{label: string, text: string}[]} sections
 * @returns {string}
 */
function formatSections(sections) {
  const MAX_CHARS_PER_SECTION = 6000;
  const cleanedSections = [];
  let previousCleanedText = "";

  for (const section of sections) {
    const cleaned = cleanScrapedText(section.text).slice(0, MAX_CHARS_PER_SECTION);

    // Évite de dupliquer une section si son contenu est quasi identique
    // à la précédente (onglet qui n'a en réalité rien changé sur la page).
    if (cleaned === previousCleanedText || cleaned.length === 0) {
      continue;
    }
    previousCleanedText = cleaned;

    cleanedSections.push(`### ${section.label}\n${cleaned}`);
  }

  return cleanedSections.join("\n\n");
}

/**
 * Nettoie le texte brut extrait : suppression des lignes vides,
 * des doublons consécutifs et des espaces superflus, pour réduire
 * la taille du prompt envoyé à Gemini.
 *
 * @param {string} text
 * @returns {string}
 */
function cleanScrapedText(text) {
  if (!text) return "";

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Supprime les lignes strictement identiques à la précédente
  // (fréquent dans les widgets répétés des sites de scores en direct).
  const deduped = [];
  for (const line of lines) {
    if (deduped.length === 0 || deduped[deduped.length - 1] !== line) {
      deduped.push(line);
    }
  }

  return deduped.join("\n");
}

/**
 * Construit un prompt structuré à partir des données scrapées
 * et interroge Gemini pour obtenir un pronostic au format JSON.
 *
 * @param {string} scrapedData - texte nettoyé issu de scrapeMatchData()
 * @returns {Promise<object>} objet JSON contenant les probabilités
 */
export async function getPredictionFromGemini(scrapedData) {
  const prompt = buildPrompt(scrapedData);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      // Température basse : réduit la créativité/aléatoire du modèle
      // pour privilégier des estimations plus cohérentes et reproductibles,
      // adaptées à une analyse statistique plutôt qu'à un texte créatif.
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          equipe_domicile: { type: "string" },
          equipe_exterieur: { type: "string" },
          synthese: { type: "string" },

          resultat_1x2: {
            type: "object",
            properties: {
              victoire_domicile: { type: "number" },
              match_nul: { type: "number" },
              victoire_exterieur: { type: "number" },
            },
            required: ["victoire_domicile", "match_nul", "victoire_exterieur"],
          },

          plus_moins_2_5_buts: {
            type: "object",
            properties: {
              plus_de_2_5: { type: "number" },
              moins_de_2_5: { type: "number" },
            },
            required: ["plus_de_2_5", "moins_de_2_5"],
          },

          les_deux_equipes_marquent: {
            type: "object",
            properties: {
              oui: { type: "number" },
              non: { type: "number" },
            },
            required: ["oui", "non"],
          },

          // --- Scores exacts les plus probables (top 3) ---
          scores_exacts_probables: {
            type: "array",
            items: {
              type: "object",
              properties: {
                score: { type: "string" }, // ex: "2-1"
                probabilite: { type: "number" },
              },
              required: ["score", "probabilite"],
            },
          },

          // --- Corners estimés par équipe et par mi-temps ---
          corners_estimes: {
            type: "object",
            properties: {
              domicile: {
                type: "object",
                properties: {
                  premiere_mi_temps: { type: "number" },
                  deuxieme_mi_temps: { type: "number" },
                  total: { type: "number" },
                },
                required: ["premiere_mi_temps", "deuxieme_mi_temps", "total"],
              },
              exterieur: {
                type: "object",
                properties: {
                  premiere_mi_temps: { type: "number" },
                  deuxieme_mi_temps: { type: "number" },
                  total: { type: "number" },
                },
                required: ["premiere_mi_temps", "deuxieme_mi_temps", "total"],
              },
            },
            required: ["domicile", "exterieur"],
          },

          // --- Buteurs probables ---
          buteurs_probables: {
            type: "array",
            items: {
              type: "object",
              properties: {
                joueur: { type: "string" },
                equipe: { type: "string" },
                probabilite: { type: "number" },
              },
              required: ["joueur", "equipe", "probabilite"],
            },
          },

          // --- Cartons estimés par équipe ---
          cartons_estimes: {
            type: "object",
            properties: {
              domicile: {
                type: "object",
                properties: {
                  jaunes: { type: "number" },
                  rouges: { type: "number" },
                },
                required: ["jaunes", "rouges"],
              },
              exterieur: {
                type: "object",
                properties: {
                  jaunes: { type: "number" },
                  rouges: { type: "number" },
                },
                required: ["jaunes", "rouges"],
              },
            },
            required: ["domicile", "exterieur"],
          },

          // --- Conseils pour limiter le risque de perte ---
          paris_les_plus_surs: {
            type: "array",
            items: { type: "string" },
          },
          paris_a_eviter: {
            type: "array",
            items: { type: "string" },
          },

          niveau_de_confiance: { type: "string" },
        },
        required: [
          "equipe_domicile",
          "equipe_exterieur",
          "synthese",
          "resultat_1x2",
          "plus_moins_2_5_buts",
          "les_deux_equipes_marquent",
          "scores_exacts_probables",
          "corners_estimes",
          "buteurs_probables",
          "cartons_estimes",
          "paris_les_plus_surs",
          "paris_a_eviter",
          "niveau_de_confiance",
        ],
      },
    },
  });

  const jsonText = response.text;

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("[scraper.js] Réponse Gemini non parsable en JSON :", jsonText);
    throw new Error("La réponse de Gemini n'a pas pu être interprétée comme du JSON valide.");
  }
}

/**
 * Construit le prompt envoyé à Gemini à partir des données brutes scrapées.
 *
 * @param {string} scrapedData
 * @returns {string}
 */
function buildPrompt(scrapedData) {
  return `
Tu es un expert en analyse statistique de football et en pronostics sportifs.

Voici des données extraites automatiquement d'une page de match sur 365Scores.
Elles sont organisées en sections labellisées (### NOM DE LA SECTION) selon
leur origine sur la page : aperçu général, statistiques, face-à-face, classement,
compositions, forme récente. Certaines sections peuvent être absentes ou vides
si l'information n'était pas disponible sur la page — c'est normal, ne les invente pas.
Le texte de chaque section peut contenir du bruit résiduel (menus, publicités,
éléments d'interface) : ignore tout ce qui n'est pas une donnée factuelle sur le match.

--- DONNÉES STRUCTURÉES PAR SECTION ---
${scrapedData}
--- FIN DES DONNÉES ---

RÈGLE FONDAMENTALE — À respecter avant tout le reste :
Base CHAQUE estimation numérique en priorité sur les données réellement présentes
ci-dessus (statistiques, historique, classement, cotes). N'invente JAMAIS de
chiffre précis (nombre de corners, cartons, buteur, statistique de forme) qui ne
peut être déduit ni directement lu, ni raisonnablement inféré à partir des
données fournies. Si une section est absente, pauvre, ou ne contient pas
l'information demandée pour un point précis, utilise une estimation prudente
basée sur des moyennes générales du football (ex : environ 9-11 corners au total
dans un match équilibré, 3-4 cartons jaunes au total dans un match sans enjeu
disciplinaire particulier) — mais dans ce cas, EXPLICITEMENT abaisse le
"niveau_de_confiance" global à "faible", et évite les estimations trop
symétriques ou artificiellement rondes entre les deux équipes (elles doivent
varier légèrement comme dans un vrai match, sauf si les données montrent une
réelle égalité de niveau).

Analyse ces informations et produis un pronostic structuré et détaillé pour ce match, avec :

1. Les probabilités du résultat 1X2 (victoire domicile / nul / victoire extérieur), en pourcentage, dont la somme fait 100.
2. La probabilité de plus ou moins de 2.5 buts dans le match, en pourcentage, dont la somme fait 100.
3. La probabilité que les deux équipes marquent (BTTS), en pourcentage, dont la somme fait 100.
4. Les 3 scores exacts les plus probables, avec leur probabilité estimée en pourcentage. Ces scores doivent être cohérents avec les probabilités 1X2 données au point 1 (ex : si l'équipe extérieure est favorite à 45%, au moins un des 3 scores doit refléter sa victoire).
5. Une estimation du nombre de corners pour chaque équipe, séparément en 1ère et 2ème mi-temps, ainsi que le total par équipe — voir RÈGLE FONDAMENTALE ci-dessus si les données manquent.
6. Une liste de 2 à 4 buteurs probables, avec leur équipe et une probabilité estimée. Si aucun nom de joueur n'apparaît dans les données (notamment dans COMPOSITIONS D'ÉQUIPE), renvoie une liste VIDE plutôt que d'inventer des noms.
7. Une estimation du nombre de cartons jaunes et rouges probables pour chaque équipe — voir RÈGLE FONDAMENTALE ci-dessus si les données manquent.
8. Une liste de 2 à 3 "paris les plus sûrs" : les types de paris présentant statistiquement le risque le plus faible sur la base de ton analyse (ex : "Double chance : Équipe A ou Nul", "Moins de 4.5 buts"). Formule ces conseils de façon factuelle, sans garantir de gain.
9. Une liste de 1 à 2 "paris à éviter" : les paris les plus risqués ou incertains au vu des données disponibles (ex : score exact, buteur en 1ère période).
10. Une courte synthèse (3-4 phrases) expliquant les facteurs clés de ton analyse, en mentionnant explicitement si certaines sections de données étaient absentes ou limitées.
11. Un niveau de confiance global sur ton pronostic ("faible", "moyen" ou "élevé"), reflétant honnêtement la quantité et la qualité des données réellement disponibles dans les sections ci-dessus (pas seulement la quantité de texte total).

IMPORTANT :
- Réponds STRICTEMENT au format JSON demandé, sans texte additionnel.
`.trim();
}