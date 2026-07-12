import { chromium } from "playwright";
import fs from "fs";

const url = "https://www.365scores.com/fr/football/match/fifa-world-cup-5930/england-norway-2376-5054-5930#id=4760721";

async function main() {
  console.log("Démarrage du test d'investigation des onglets...");
  
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

    // Bloquer les publicités et traqueurs au niveau réseau
    await page.route("**/*", (route) => {
      const requestUrl = route.request().url();
      if (
        requestUrl.includes("googleads") ||
        requestUrl.includes("doubleclick") ||
        requestUrl.includes("adservice") ||
        requestUrl.includes("google-analytics") ||
        requestUrl.includes("googletagmanager") ||
        requestUrl.includes("amazon-adsystem") ||
        requestUrl.includes("adnxs") ||
        requestUrl.includes("adbutt") ||
        requestUrl.includes("vignette") ||
        requestUrl.includes("ads")
      ) {
        // console.log(`[BLOQUÉ] ${requestUrl}`);
        route.abort();
      } else {
        route.continue();
      }
    });

    console.log("Navigation vers la page...");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {
      console.warn("networkidle non atteint, on continue.");
    });
    await page.waitForTimeout(3000);

    // Capture d'écran sans pub
    await page.screenshot({ path: "screenshot_no_ads.png" });
    console.log("Capture d'écran sans pub enregistrée.");

    // Analysons le DOM pour trouver l'onglet "Tête à tête" ou "Statistiques" spécifique au match
    // Nous allons chercher les éléments contenant ces textes et examiner leurs attributs et parents.
    const elementsInfo = await page.evaluate(() => {
      // Trouver tous les éléments contenant du texte intéressant
      const targets = ["Tête à tête", "Statistiques", "Match", "Prédictions", "Alignements probables", "Forme"];
      const results = [];

      targets.forEach(text => {
        // Trouver tous les éléments contenant le texte exact ou partiel
        const xpath = `//*[contains(text(), '${text}')]`;
        const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        
        for (let i = 0; i < iterator.snapshotLength; i++) {
          const el = iterator.snapshotItem(i);
          if (el.offsetWidth > 0 && el.offsetHeight > 0) { // uniquement visible
            // Remonter les parents pour voir le conteneur cliquable
            let current = el;
            const parentChain = [];
            for (let depth = 0; depth < 4; depth++) {
              if (!current) break;
              parentChain.push({
                tagName: current.tagName,
                className: current.className,
                id: current.id,
                role: current.getAttribute("role"),
                cursor: window.getComputedStyle(current).cursor
              });
              current = current.parentElement;
            }

            results.push({
              searchedText: text,
              actualText: el.innerText ? el.innerText.trim() : "",
              tagName: el.tagName,
              className: el.className,
              parentChain: parentChain
            });
          }
        }
      });
      return results;
    });

    fs.writeFileSync("scraped_elements_dom.json", JSON.stringify(elementsInfo, null, 2), "utf-8");
    console.log(`Trouvé ${elementsInfo.length} occurrences de textes d'onglets. Sauvegardé dans scraped_elements_dom.json`);

    // Essayons de simuler le clic sur le bon onglet "Tête à tête" ou "Statistiques" du match
    // D'après la structure de 365Scores, les onglets du match sont typiquement dans un conteneur horizontal.
    // Voyons s'il y a des boutons ou éléments cliquables avec des classes contenant "tab" ou "button".
    
    // Essayons de cliquer sur l'onglet "Tête à tête" de match
    // Nous allons le cibler spécifiquement. Souvent, la classe contient "game-center-header" ou similaire.
    // Essayons de trouver l'élément contenant "Tête à tête" qui n'est pas le lien de ligue.
    const teteATeteElement = await page.evaluateHandle(() => {
      // Trouver l'élément qui contient "Tête à tête" et qui est au niveau du match (pas de la ligue)
      // Les onglets de match sont généralement dans une liste de navigation sous les scores.
      const el = Array.from(document.querySelectorAll("*"))
        .find(e => e.innerText && e.innerText.trim() === "Tête à tête" && e.className && e.className.includes("tab"));
      if (el) return el;
      
      // Fallback: chercher n'importe quel élément contenant "Tête à tête" qui est sous un conteneur d'onglets du match
      return Array.from(document.querySelectorAll("*"))
        .find(e => e.innerText && e.innerText.trim() === "Tête à tête" && window.getComputedStyle(e).cursor === "pointer");
    });

    if (teteATeteElement.asElement()) {
      console.log("Onglet 'Tête à tête' trouvé. Tentative de clic...");
      await teteATeteElement.asElement().click({ force: true });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: "screenshot_after_h2h_click.png" });
      const h2hText = await page.evaluate(() => document.body.innerText || "");
      fs.writeFileSync("scraped_h2h_text.txt", h2hText, "utf-8");
      console.log("Texte extrait après clic sur Tête à tête. Longueur :", h2hText.length);
    } else {
      console.log("Onglet 'Tête à tête' non trouvé spécifiquement par son style.");
    }

    await browser.close();
  } catch (error) {
    if (browser) await browser.close();
    console.error("Erreur :", error);
  }
}

main();
