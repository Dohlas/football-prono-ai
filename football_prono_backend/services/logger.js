import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.resolve(__dirname, "../logs");

/**
 * Service de journalisation des erreurs au format DD_MM_YYYY.log.
 */
export async function logError(message, error = null) {
  try {
    // S'assurer que le dossier logs existe
    await fs.mkdir(LOGS_DIR, { recursive: true });

    // Obtenir la date actuelle au format DD_MM_YYYY
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const logFileName = `${day}_${month}_${year}.log`;
    const logFilePath = path.join(LOGS_DIR, logFileName);

    // Formater l'entrée de log
    const timestamp = now.toISOString();
    let logEntry = `[${timestamp}] [ERROR] ${message}\n`;
    if (error) {
      logEntry += `Stack: ${error.stack || error.message || error}\n`;
    }
    logEntry += `--------------------------------------------------\n`;

    // Écrire dans le fichier (en ajoutant à la fin)
    await fs.appendFile(logFilePath, logEntry, "utf-8");
  } catch (err) {
    // En cas d'échec de l'écriture du log, on fallback sur la console standard
    console.error("[logger.js] Erreur critique lors de l'écriture du fichier journal :", err.message);
  }
}
