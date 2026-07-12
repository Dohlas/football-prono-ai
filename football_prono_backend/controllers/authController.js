import { z } from "zod";
import { createUser, findUserByEmail } from "../models/userModel.js";
import { hashPassword, verifyPassword, generateToken } from "../services/authService.js";

// Schémas de validation avec Zod
const registerSchema = z.object({
  email: z.string().email("Format d'email invalide."),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères."),
});

const loginSchema = z.object({
  email: z.string().email("Format d'email invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

/**
 * Gère l'inscription d'un nouvel utilisateur.
 */
export async function register(req, res) {
  try {
    // Validation 1 : Vérification de la présence du corps de requête
    if (!req.body) {
      return res.status(400).json({ message: "Le corps de la requête est manquant." });
    }

    // Validation 2 : Validation stricte des données d'entrée via Zod
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Erreur de validation des données.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { email, password } = validation.data;

    // Hachage du mot de passe
    const passwordHash = await hashPassword(password);

    // Insertion en base de données
    const user = await createUser(email, passwordHash);

    // Génération du token d'accès
    const token = generateToken(user);

    console.log(`[authController.js] Nouvel utilisateur enregistré : ${email}`);

    return res.status(201).json({
      message: "Utilisateur créé avec succès.",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[authController.js] Erreur lors de l'inscription :", error.message);
    
    if (error.message.includes("déjà enregistré")) {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Une erreur interne est survenue lors de la création du compte.",
    });
  }
}

/**
 * Gère la connexion d'un utilisateur existant.
 */
export async function login(req, res) {
  try {
    // Validation 1 : Vérification de la présence du corps de requête
    if (!req.body) {
      return res.status(400).json({ message: "Le corps de la requête est manquant." });
    }

    // Validation 2 : Validation stricte des données d'entrée via Zod
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Erreur de validation des données.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { email, password } = validation.data;

    // Recherche de l'utilisateur
    const user = await findUserByEmail(email);
    if (!user) {
      // Message d'erreur générique pour des raisons de sécurité
      return res.status(401).json({ message: "Identifiants de connexion invalides." });
    }

    // Vérification du mot de passe
    const isPasswordCorrect = await verifyPassword(password, user.password_hash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Identifiants de connexion invalides." });
    }

    // Génération du token d'accès
    const token = generateToken(user);

    console.log(`[authController.js] Utilisateur connecté : ${email}`);

    return res.status(200).json({
      message: "Connexion réussie.",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[authController.js] Erreur lors de la connexion :", error.message);
    return res.status(500).json({
      message: "Une erreur interne est survenue lors de la tentative de connexion.",
    });
  }
}

/**
 * Retourne le profil de l'utilisateur connecté (route de test/vérification).
 */
export async function getProfile(req, res) {
  // L'utilisateur est déjà injecté par authMiddleware
  return res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
}
