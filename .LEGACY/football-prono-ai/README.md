# ⚽ Football Prono AI

Application full-stack de pronostics football combinant **scraping en temps réel** et **intelligence artificielle générative** pour analyser un match et produire des prédictions statistiques détaillées.

## 🎯 Fonctionnement

1. L'utilisateur colle l'URL d'un match [365Scores](https://www.365scores.com) dans l'application Flutter.
2. Le backend Node.js utilise **Playwright** pour ouvrir la page en arrière-plan et extraire les données pertinentes (forme des équipes, face-à-face, classement, cotes, statistiques).
3. Ces données sont envoyées à l'**API Gemini** (Google) via un prompt structuré.
4. Gemini analyse les informations et renvoie un pronostic complet au format JSON strict.
5. L'application Flutter affiche le résultat avec des jauges, pourcentages et graphiques.

## 📊 Analyse fournie

- Résultat 1X2 (victoire domicile / nul / victoire extérieur)
- Plus / moins de 2.5 buts
- Les deux équipes marquent (BTTS)
- Top 3 des scores exacts les plus probables
- Estimation des corners par équipe et par mi-temps
- Buteurs probables
- Estimation des cartons jaunes/rouges par équipe
- Conseils pour limiter le risque : paris les plus sûrs vs. à éviter
- Synthèse et niveau de confiance global

⚠️ *Ces prédictions sont des estimations statistiques générées par IA à partir de données publiques. Elles ne garantissent aucun résultat.*

## 🛠️ Stack technique

**Backend**
- Node.js + Express (API REST)
- Playwright (scraping headless)
- `@google/genai` (API Gemini)

**Frontend**
- Flutter (mobile & web)
- `http` (communication avec le backend)
- `google_fonts` (UI)

## 📁 Structure du projet

```
football_prono_ai/
├── football_prono_backend/
│   ├── index.js          # Serveur Express (API REST)
│   ├── scraper.js         # Scraping Playwright + appel Gemini
│   └── package.json
└── football_prono_frontend/
    └── lib/
        ├── main.dart
        ├── models/
        │   └── prediction.dart
        ├── services/
        │   └── api_service.dart
        └── screens/
            ├── home_screen.dart
            └── result_screen.dart
```

## 🚀 Installation

### Backend

```bash
cd football_prono_backend
npm install
```

Crée un fichier `.env` à la racine du dossier backend :
```
GEMINI_API_KEY=ta_clé_api_gemini
PORT=3000
```

Clé gratuite disponible sur [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

Lance le serveur :
```bash
npm start
```

### Frontend

```bash
cd football_prono_frontend
flutter pub get
```

Adapte l'URL du backend dans `lib/services/api_service.dart` selon ton environnement (émulateur, appareil physique, web).

Lance l'application :
```bash
flutter run
```

## 📸 Aperçu

*(Ajoute ici une ou deux captures d'écran de l'application)*

## 👤 Auteur

**Silué Doh Lassinan (Dohlas)**
Étudiant en MIAGE à l'IUA (Institut Universitaire d'Abidjan)
[GitHub](https://github.com/Dohlas)