import request from "supertest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import app from "../../app.js";
import db, { initDatabase, dbRun } from "../../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DB_PATH = path.resolve(__dirname, "../../database.test.sqlite");

describe("Auth Routes Integration Tests", () => {
  beforeAll(async () => {
    await initDatabase();
  });

  afterEach(async () => {
    await dbRun("DELETE FROM users");
  });

  afterAll((done) => {
    db.close((err) => {
      if (err) {
        console.error("Erreur fermeture test DB :", err.message);
      }
      if (fs.existsSync(TEST_DB_PATH)) {
        try {
          fs.unlinkSync(TEST_DB_PATH);
        } catch (unlinkErr) {
          console.warn("Impossible de supprimer la base de test :", unlinkErr.message);
        }
      }
      done();
    });
  });

  describe("POST /api/auth/register", () => {
    test("should register a new user successfully", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "register@test.com",
          password: "password123",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Utilisateur créé avec succès.");
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("register@test.com");
    });

    test("should reject registration with invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "invalid-email",
          password: "password123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Erreur de validation des données.");
      expect(res.body.errors.email).toBeDefined();
    });

    test("should reject registration with password too short", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "valid@email.com",
          password: "123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Erreur de validation des données.");
      expect(res.body.errors.password).toBeDefined();
    });
  });

  describe("POST /api/auth/login", () => {
    test("should login existing user and return token", async () => {
      // Pré-création de l'utilisateur pour le test
      await request(app)
        .post("/api/auth/register")
        .send({
          email: "login@test.com",
          password: "password123",
        });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@test.com",
          password: "password123",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Connexion réussie.");
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("login@test.com");
    });

    test("should reject login with wrong password", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          email: "login@test.com",
          password: "password123",
        });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login@test.com",
          password: "wrongPassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Identifiants de connexion invalides.");
    });
  });

  describe("GET /api/auth/profile", () => {
    test("should return 401 for request without token", async () => {
      const res = await request(app).get("/api/auth/profile");
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Aucun token d'authentification fourni");
    });

    test("should return 200 and profile for valid token", async () => {
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          email: "profile@test.com",
          password: "password123",
        });

      const token = registerRes.body.token;

      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("profile@test.com");
    });
  });
});
