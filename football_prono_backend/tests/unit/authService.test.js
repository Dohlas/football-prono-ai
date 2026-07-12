import { hashPassword, verifyPassword, generateToken, verifyToken } from "../../services/authService.js";

describe("AuthService Unit Tests", () => {
  const plainPassword = "mySecretPassword123";

  describe("hashPassword", () => {
    test("should hash password successfully", async () => {
      const hash = await hashPassword(plainPassword);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(plainPassword);
      expect(hash.startsWith("$2b$")).toBe(true); // vérifie le préfixe bcrypt
    });

    test("should throw error if password is too short", async () => {
      await expect(hashPassword("12345")).rejects.toThrow("Le mot de passe doit contenir au moins 6 caractères.");
    });
  });

  describe("verifyPassword", () => {
    test("should return true for correct password", async () => {
      const hash = await hashPassword(plainPassword);
      const isMatch = await verifyPassword(plainPassword, hash);
      expect(isMatch).toBe(true);
    });

    test("should return false for incorrect password", async () => {
      const hash = await hashPassword(plainPassword);
      const isMatch = await verifyPassword("wrongPassword", hash);
      expect(isMatch).toBe(false);
    });
  });

  describe("JWT Token Management", () => {
    const mockUser = { id: 123, email: "john@doe.com" };

    test("should generate and verify JWT token successfully", () => {
      const token = generateToken(mockUser);
      expect(token).toBeDefined();

      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
    });

    test("should throw error for invalid token", () => {
      expect(() => verifyToken("invalid-token-string")).toThrow();
    });
  });
});
