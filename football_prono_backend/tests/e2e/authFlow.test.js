import request from "supertest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import app from "../../app.js";
import db, { initDatabase, dbRun } from "../../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DB_PATH = path.resolve(__dirname, "../../database.test.sqlite");

describe("Auth Flow E2E Scenario", () => {
  beforeAll(async () => {
    await initDatabase();
  });

  afterAll((done) => {
    db.close((err) => {
      if (err) {
        console.error("Erreur fermeture E2E DB :", err.message);
      }
      if (fs.existsSync(TEST_DB_PATH)) {
        try {
          fs.unlinkSync(TEST_DB_PATH);
        } catch (unlinkErr) {
          console.warn("Impossible de supprimer la base E2E :", unlinkErr.message);
        }
      }
      done();
    });
  });

  test("Should execute complete register-login-profile flow successfully", async () => {
    const userCredentials = {
      email: "e2e_user@example.com",
      password: "secureE2EPassword123",
    };

    // 1. Accès anonyme bloqué (401)
    const anonymousProfileRes = await request(app).get("/api/auth/profile");
    expect(anonymousProfileRes.status).toBe(401);
    expect(anonymousProfileRes.body.message).toContain("Aucun token d'authentification fourni");

    // 2. Inscription réussie (201)
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(userCredentials);
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.message).toBe("Utilisateur créé avec succès.");
    expect(registerRes.body.token).toBeDefined();
    expect(registerRes.body.user.email).toBe(userCredentials.email);

    // 3. Double inscription échouée (409)
    const duplicateRegisterRes = await request(app)
      .post("/api/auth/register")
      .send(userCredentials);
    expect(duplicateRegisterRes.status).toBe(409);
    expect(duplicateRegisterRes.body.message).toBe("Cet email est déjà enregistré.");

    // 4. Connexion réussie (200)
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send(userCredentials);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.message).toBe("Connexion réussie.");
    const token = loginRes.body.token;
    expect(token).toBeDefined();

    // 5. Profil authentifié accessible (200)
    const profileRes = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.user.email).toBe(userCredentials.email);
    expect(profileRes.body.user.id).toBe(registerRes.body.user.id);
  });
});
