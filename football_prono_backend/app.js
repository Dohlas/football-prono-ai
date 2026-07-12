import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { register, login, getProfile } from "./controllers/authController.js";
import { analyzeMatch, getHistory, deleteHistoryItem } from "./controllers/predController.js";
import authMiddleware from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/**
 * Route de vérification rapide.
 */
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Football Prono AI backend opérationnel." });
});

// --- Routes d'Authentification (Publiques) ---
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);

// --- Route Profil Utilisateur (Privée - de test) ---
app.get("/api/auth/profile", authMiddleware, getProfile);

// --- Routes de Prédictions (Privées) ---
app.post("/api/predictions/analyser", authMiddleware, analyzeMatch);
app.get("/api/predictions/history", authMiddleware, getHistory);
app.delete("/api/predictions/history/:id", authMiddleware, deleteHistoryItem);

// Rétrocompatibilité de l'ancienne route
app.post("/api/analyser", authMiddleware, analyzeMatch);

/**
 * Middleware de capture des routes inconnues.
 */
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée." });
});

export default app;
