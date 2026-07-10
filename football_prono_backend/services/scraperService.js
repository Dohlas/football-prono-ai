import { chromium } from "playwright";

/**
 * Ouvre l'URL 365Scores fournie, attend le chargement complet du JS,
 * puis extrait le texte des différentes sections du match (aperçu,
 * statistiques, face-à-face, classement) en les labellisant séparément.
 * 
 * @param {string} matchUrl - URL complète d'un match 365Scores
 * @returns {Promise<string>} texte structuré en sections, nettoyé
 */
export async function scrapeMatchData(matchUrl) {
  if (!matchUrl || !matchUrl.includes("365scores.com")) {
    throw new Error("URL invalide : une URL 365Scores est attendue.");
  }

  if (process.env.NODE_ENV === "test") {
    return "Paris SG vs Lyon match data text. (Mocked for testing)";
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

    console.log(`[scraperService.js] Ouverture de la page : ${matchUrl}`);
    await page.goto(matchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {
      console.warn("[scraperService.js] networkidle non atteint, on continue quand même.");
    });
    await page.waitForTimeout(3000);

    // Détection d'une éventuelle page 404 applicative de 365Scores (ordre des équipes inversé)
    let pageText = await page.evaluate(() => document.body.innerText || "");
    if (pageText.includes("Oups!") || pageText.includes("ne trouvons pas la page")) {
      console.warn("[scraperService.js] Match non trouvé (404 applicatif 365Scores). Tentative de correction avec URL permutée...");
      const swappedUrl = swapTeamIdsInUrl(matchUrl);
      if (swappedUrl && swappedUrl !== matchUrl) {
        console.log(`[scraperService.js] Nouvelle navigation vers : ${swappedUrl}`);
        await page.goto(swappedUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(3000);
        pageText = await page.evaluate(() => document.body.innerText || "");
        if (pageText.includes("Oups!") || pageText.includes("ne trouvons pas la page")) {
          throw new Error("Match introuvable après permutation des identifiants.");
        }
      } else {
        throw new Error("Match introuvable et permutation impossible.");
      }
    }

    const sections = [];

    // --- Section 1 : Aperçu général (page par défaut) ---
    const overviewText = await page.evaluate(() => document.body.innerText || "");
    sections.push({ label: "APERÇU GÉNÉRAL (score, cotes, infos match)", text: overviewText });

    // --- Sections suivantes : onglets Stats / H2H / Classement ---
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
            break;
          }
        } catch {
          // Onglet non visible ou erreur de clic, on passe au suivant
        }
      }
    }

    await browser.close();

    return formatSections(sections);
  } catch (error) {
    if (browser) await browser.close();
    console.error("[scraperService.js] Erreur pendant le scraping :", error.message);
    throw new Error(`Échec du scraping de la page 365Scores : ${error.message}`);
  }
}

/**
 * Nettoie et assemble les sections en un texte structuré.
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

    if (cleaned === previousCleanedText || cleaned.length === 0) {
      continue;
    }
    previousCleanedText = cleaned;

    cleanedSections.push(`### ${section.label}\n${cleaned}`);
  }

  return cleanedSections.join("\n\n");
}

/**
 * Nettoie le texte brut extrait (supprime les lignes vides et dupliquées).
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

  const deduped = [];
  for (const line of lines) {
    if (deduped.length === 0 || deduped[deduped.length - 1] !== line) {
      deduped.push(line);
    }
  }

  return deduped.join("\n");
}

/**
 * Permute l'ordre des identifiants d'équipe et des noms d'équipe dans l'URL.
 * Exemple : .../belgium-spain-2373-5050-5930#id=... -> .../belgium-spain-5050-2373-5930#id=...
 * 
 * @param {string} matchUrl
 * @returns {string|null} URL permutée ou null si format invalide
 */
export function swapTeamIdsInUrl(matchUrl) {
  try {
    const urlObj = new URL(matchUrl);
    urlObj.hash = ""; // Supprime le hash pour éviter les conflits de routage côté client
    const pathname = urlObj.pathname;
    const parts = pathname.split("/");
    const lastPart = parts[parts.length - 1];

    const slugParts = lastPart.split("-");
    if (slugParts.length >= 3) {
      const compId = slugParts[slugParts.length - 1];
      const id2 = slugParts[slugParts.length - 2];
      const id1 = slugParts[slugParts.length - 3];

      if (!isNaN(compId) && !isNaN(id2) && !isNaN(id1)) {
        // Permutation des deux IDs d'équipe
        slugParts[slugParts.length - 2] = id1;
        slugParts[slugParts.length - 3] = id2;

        // Si le slug de nom a exactement deux parties, on les permute aussi
        const namePartsCount = slugParts.length - 3;
        if (namePartsCount === 2) {
          const tempName = slugParts[0];
          slugParts[0] = slugParts[1];
          slugParts[1] = tempName;
        }

        parts[parts.length - 1] = slugParts.join("-");
        urlObj.pathname = parts.join("/");
        return urlObj.toString();
      }
    }
  } catch (err) {
    console.error("[scraperService.js] Erreur lors de la permutation des identifiants :", err.message);
  }
  return null;
}
