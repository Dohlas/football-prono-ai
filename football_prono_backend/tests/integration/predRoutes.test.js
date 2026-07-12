import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";
import { initDatabase } from "../../config/database.js";
import { createUser } from "../../models/userModel.js";
import { generateToken } from "../../services/authService.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Prediction Routes Integration Tests (API)", () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Initialise la base SQLite de test
    await initDatabase();
    // Crée un utilisateur de test et génère son token
    const user = await createUser("routes_pred@example.com", "password123");
    userId = user.id;
    token = generateToken(user);
  });

  afterAll(async () => {
    // Supprime la base de données de test
    const dbPath = path.resolve(__dirname, "../../database.test.sqlite");
    try {
      await fs.unlink(dbPath);
    } catch {
      // Ignorer
    }
  });

  describe("POST /api/predictions/analyser", () => {
    test("should return 401 Unauthorized if token is missing", async () => {
      const res = await request(app)
        .post("/api/predictions/analyser")
        .send({ matchUrl: "https://365scores.com/fr/football/match/psg-ol" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Accès refusé. Aucun token d'authentification fourni.");
    });

    test("should return 400 Bad Request if matchUrl is missing", async () => {
      const res = await request(app)
        .post("/api/predictions/analyser")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Veuillez coller le lien d'un match 365Scores pour lancer l'analyse.");
    });

    test("should return 400 Bad Request if matchUrl is not a 365scores link", async () => {
      const res = await request(app)
        .post("/api/predictions/analyser")
        .set("Authorization", `Bearer ${token}`)
        .send({ matchUrl: "https://google.com" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Ce lien ne provient pas de 365Scores. Vérifiez l'adresse et réessayez.");
    });

    test("should perform full analysis pipeline and save report on success", async () => {
      const res = await request(app)
        .post("/api/predictions/analyser")
        .set("Authorization", `Bearer ${token}`)
        .send({ matchUrl: "https://www.365scores.com/fr/football/match/psg-ol" });

      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.user_id).toBe(userId);
      expect(res.body.equipe_domicile).toBe("Paris SG");
      expect(res.body.prediction_json.niveau_de_confiance).toBe("eleve");
      expect(res.body.prediction_json.resultat_1x2.victoire_domicile).toBe(62);
    });
  });

  describe("GET /api/predictions/history", () => {
    test("should return 401 if unauthorized", async () => {
      const res = await request(app).get("/api/predictions/history");
      expect(res.status).toBe(401);
    });

    test("should return prediction history array on success", async () => {
      const res = await request(app)
        .get("/api/predictions/history")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("DELETE /api/predictions/history/:id", () => {
    test("should return 401 if unauthorized", async () => {
      const res = await request(app).delete("/api/predictions/history/1");
      expect(res.status).toBe(401);
    });

    test("should successfully delete the history record", async () => {
      // Récupère l'historique d'abord pour trouver l'ID
      const historyRes = await request(app)
        .get("/api/predictions/history")
        .set("Authorization", `Bearer ${token}`);
      
      const targetId = historyRes.body[0].id;

      const deleteRes = await request(app)
        .delete(`/api/predictions/history/${targetId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toContain("Analyse supprimée.");

      // Vérifie qu'il a bien été effacé
      const updatedHistory = await request(app)
        .get("/api/predictions/history")
        .set("Authorization", `Bearer ${token}`);
      
      const found = updatedHistory.body.find(p => p.id === targetId);
      expect(found).toBeUndefined();
    });
  });
});
