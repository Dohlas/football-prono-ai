import { initDatabase, dbRun } from "../../config/database.js";
import { createUser } from "../../models/userModel.js";
import {
  createPrediction,
  getPredictionById,
  getPredictionsByUserId,
  deletePrediction
} from "../../models/predModel.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Prediction Model Integration Tests (SQLite)", () => {
  let user;

  beforeAll(async () => {
    // Initialise la base de données SQLite temporaire
    await initDatabase();
    // Crée un utilisateur de test
    user = await createUser("pred_test@example.com", "password123");
  });

  afterAll(async () => {
    // Supprime la base de données de test
    const dbPath = path.resolve(__dirname, "../../database.test.sqlite");
    try {
      await fs.unlink(dbPath);
    } catch {
      // Ignorer si déjà supprimé
    }
  });

  test("should successfully insert and retrieve a prediction report", async () => {
    const mockJson = {
      equipe_domicile: "PSG",
      equipe_exterieur: "Marseille",
      niveau_de_confiance: "eleve",
      resultat_1x2: { victoire_domicile: 65, match_nul: 20, victoire_exterieur: 15 }
    };

    const pred = await createPrediction(
      user.id,
      "https://365scores.com/fr/football/match/psg-marseille",
      "PSG",
      "Marseille",
      mockJson
    );

    expect(pred).toBeDefined();
    expect(pred.id).toBeDefined();
    expect(pred.equipe_domicile).toBe("PSG");
    expect(pred.prediction_json).toEqual(mockJson);

    // Récupération par ID
    const retrieved = await getPredictionById(pred.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved.equipe_domicile).toBe("PSG");
    expect(retrieved.prediction_json.niveau_de_confiance).toBe("eleve");
  });

  test("should retrieve all predictions of a specific user", async () => {
    const mockJson = { test: true };
    await createPrediction(
      user.id,
      "https://365scores.com/fr/football/match/test",
      "Team A",
      "Team B",
      mockJson
    );

    const history = await getPredictionsByUserId(user.id);
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].match_url).toBe("https://365scores.com/fr/football/match/test");
  });

  test("should successfully delete a prediction from user history", async () => {
    const mockJson = { test: true };
    const pred = await createPrediction(
      user.id,
      "https://365scores.com/fr/football/match/to-delete",
      "Delete A",
      "Delete B",
      mockJson
    );

    const deleteSuccess = await deletePrediction(pred.id, user.id);
    expect(deleteSuccess).toBe(true);

    const retrieved = await getPredictionById(pred.id);
    expect(retrieved).toBeNull();
  });

  test("should return false when deleting a non-existent prediction or with incorrect userId", async () => {
    const deleteSuccess = await deletePrediction(99999, user.id);
    expect(deleteSuccess).toBe(false);
  });
});
