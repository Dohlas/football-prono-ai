import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db, { initDatabase, dbRun } from "../../config/database.js";
import { createUser, findUserByEmail, findUserById } from "../../models/userModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DB_PATH = path.resolve(__dirname, "../../database.test.sqlite");

describe("UserModel & SQLite Integration Tests", () => {
  beforeAll(async () => {
    // S'assure que la DB de test est initialisée
    await initDatabase();
  });

  afterEach(async () => {
    // Nettoie la table après chaque test
    await dbRun("DELETE FROM users");
  });

  afterAll((done) => {
    // Ferme proprement SQLite et supprime le fichier de test temporaire
    db.close((err) => {
      if (err) {
        console.error("Erreur fermeture test DB :", err.message);
      }
      // Supprime le fichier sqlite de test
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

  test("should create and find user successfully", async () => {
    const email = "integration@test.com";
    const passwordHash = "fake_hash_value";

    const newUser = await createUser(email, passwordHash);
    expect(newUser.id).toBeDefined();
    expect(newUser.email).toBe(email);

    // Recherche par email
    const foundByEmail = await findUserByEmail(email);
    expect(foundByEmail).toBeDefined();
    expect(foundByEmail.id).toBe(newUser.id);
    expect(foundByEmail.password_hash).toBe(passwordHash);

    // Recherche par ID
    const foundById = await findUserById(newUser.id);
    expect(foundById).toBeDefined();
    expect(foundById.email).toBe(email);
  });

  test("should throw error if email is already taken (unique constraint)", async () => {
    const email = "duplicate@test.com";
    await createUser(email, "hash1");

    await expect(createUser(email, "hash2")).rejects.toThrow("Cet email est déjà enregistré.");
  });

  test("should return null for non-existing user", async () => {
    const user = await findUserByEmail("non-existent@test.com");
    expect(user).toBeNull();

    const userById = await findUserById(9999);
    expect(userById).toBeNull();
  });
});
