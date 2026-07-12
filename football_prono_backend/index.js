import app from "./app.js";
import { initDatabase } from "./config/database.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

// --- Initialisation de la Base de Données au démarrage ---
initDatabase()
  .then(() => {
    console.log("[index.js] Base de données SQLite opérationnelle.");
    
    // Écoute du serveur uniquement si la DB est initialisée avec succès
    app.listen(PORT, () => {
      console.log(`[index.js] Serveur démarré sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[index.js] Erreur critique d'initialisation de la DB :", err.message);
    process.exit(1);
  });