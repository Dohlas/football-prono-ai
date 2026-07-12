import { getSystemPrompt, parseAIResponse, predictionResponseSchema } from "../../services/aiService.js";

describe("AIService Unit Tests", () => {
  describe("getSystemPrompt", () => {
    test("should load system prompt from file successfully", async () => {
      const prompt = await getSystemPrompt();
      expect(prompt).toBeDefined();
      expect(prompt.includes("senior quantitative sports analyst")).toBe(true);
      expect(prompt.includes("<prediction_report>")).toBe(true);
    });
  });

  describe("parseAIResponse - Level 1: Strict XML", () => {
    test("should successfully parse a valid XML prediction response", () => {
      const mockXml = `
<prediction_report>
  <equipe_domicile>Arsenal</equipe_domicile>
  <equipe_exterieur>Chelsea</equipe_exterieur>
  <synthese>Arsenal matches present high metrics. Total corners will rise.</synthese>
  <resultat_1x2>
    <victoire_domicile>60</victoire_domicile>
    <match_nul>25</match_nul>
    <victoire_exterieur>15</victoire_exterieur>
  </resultat_1x2>
  <plus_moins_2_5_buts>
    <plus_de_2_5>70</plus_de_2_5>
    <moins_de_2_5>30</moins_de_2_5>
  </plus_moins_2_5_buts>
  <les_deux_equipes_marquent>
    <oui>55</oui>
    <non>45</non>
  </les_deux_equipes_marquent>
  <scores_exacts_probables>
    <score_item>
      <score>2-1</score>
      <probabilite>18</probabilite>
    </score_item>
    <score_item>
      <score>2-0</score>
      <probabilite>15</probabilite>
    </score_item>
  </scores_exacts_probables>
  <corners_estimes>
    <domicile>
      <premiere_mi_temps>3</premiere_mi_temps>
      <deuxieme_mi_temps>4</deuxieme_mi_temps>
      <total>7</total>
    </domicile>
    <exterieur>
      <premiere_mi_temps>2</premiere_mi_temps>
      <deuxieme_mi_temps>2</deuxieme_mi_temps>
      <total>4</total>
    </exterieur>
  </corners_estimes>
  <buteurs_probables>
    <buteur_item>
      <joueur>Saka</joueur>
      <equipe>Arsenal</equipe>
      <probabilite>42</probabilite>
    </buteur_item>
  </buteurs_probables>
  <cartons_estimes>
    <domicile>
      <jaunes>1</jaunes>
      <rouges>0</rouges>
    </domicile>
    <exterieur>
      <jaunes>2</jaunes>
      <rouges>0</rouges>
    </exterieur>
  </cartons_estimes>
  <paris_les_plus_surs>
    <paris_item>Arsenal or Draw</paris_item>
    <paris_item>Over 1.5 Goals</paris_item>
  </paris_les_plus_surs>
  <paris_a_eviter>
    <paris_item>Chelsea Clean Sheet</paris_item>
  </paris_a_eviter>
  <niveau_de_confiance>eleve</niveau_de_confiance>
</prediction_report>
      `;

      const result = parseAIResponse(mockXml);
      
      expect(result).toBeDefined();
      expect(result.equipe_domicile).toBe("Arsenal");
      expect(result.equipe_exterieur).toBe("Chelsea");
      expect(result.synthese).toContain("Arsenal matches present high metrics");
      expect(result.resultat_1x2.victoire_domicile).toBe(60);
      expect(result.resultat_1x2.match_nul).toBe(25);
      expect(result.plus_moins_2_5_buts.plus_de_2_5).toBe(70);
      expect(result.les_deux_equipes_marquent.oui).toBe(55);
      expect(result.scores_exacts_probables.length).toBe(2);
      expect(result.scores_exacts_probables[0].score).toBe("2-1");
      expect(result.scores_exacts_probables[0].probabilite).toBe(18);
      expect(result.corners_estimes.domicile.total).toBe(7);
      expect(result.corners_estimes.exterieur.total).toBe(4);
      expect(result.buteurs_probables.length).toBe(1);
      expect(result.buteurs_probables[0].joueur).toBe("Saka");
      expect(result.cartons_estimes.domicile.jaunes).toBe(1);
      expect(result.cartons_estimes.exterieur.jaunes).toBe(2);
      expect(result.paris_les_plus_surs).toContain("Arsenal or Draw");
      expect(result.paris_a_eviter).toContain("Chelsea Clean Sheet");
      expect(result.niveau_de_confiance).toBe("eleve");
    });
  });

  describe("parseAIResponse - Level 2: Fallback Regex Parser", () => {
    test("should successfully decode predictions from raw text without XML tags", () => {
      const mockRawText = `
Arsenal vs Chelsea match prediction analysis.
The model calculates 55% home win, 25% draw, 20% away win.
Level of confidence is high.
      `;

      const result = parseAIResponse(mockRawText);

      expect(result).toBeDefined();
      expect(result.equipe_domicile).toBe("Arsenal");
      expect(result.equipe_exterieur).toBe("Chelsea");
      expect(result.resultat_1x2.victoire_domicile).toBe(55);
      expect(result.resultat_1x2.match_nul).toBe(25);
      expect(result.resultat_1x2.victoire_exterieur).toBe(20);
      expect(result.niveau_de_confiance).toBe("eleve");
      // S'assure que les valeurs de repli par défaut sont fournies
      expect(result.corners_estimes.domicile.total).toBe(5);
    });

    test("should return default prediction for completely empty input", () => {
      const result = parseAIResponse("");
      expect(result).toBeDefined();
      expect(result.equipe_domicile).toBe("Équipe Domicile");
      expect(result.niveau_de_confiance).toBe("faible");
    });
  });

  describe("parseAIResponse - Zod Coercion and Default Validation", () => {
    test("should coerce numerical string inputs to numbers", () => {
      const mockXml = `
<prediction_report>
  <equipe_domicile>Marseille</equipe_domicile>
  <equipe_exterieur>Nice</equipe_exterieur>
  <resultat_1x2>
    <victoire_domicile>45</victoire_domicile>
    <match_nul>30</match_nul>
    <victoire_exterieur>25</victoire_exterieur>
  </resultat_1x2>
  <niveau_de_confiance>high</niveau_de_confiance>
</prediction_report>
      `;

      const result = parseAIResponse(mockXml);
      expect(result).toBeDefined();
      expect(result.equipe_domicile).toBe("Marseille");
      // Vérifie que les types sont contraints en nombre par Zod
      expect(typeof result.resultat_1x2.victoire_domicile).toBe("number");
      expect(result.resultat_1x2.victoire_domicile).toBe(45);
      // Vérifie la transformation du niveau de confiance
      expect(result.niveau_de_confiance).toBe("eleve");
      // Vérifie l'application automatique des valeurs par défaut pour les sous-structures absentes
      expect(result.corners_estimes.domicile.total).toBe(5);
      expect(result.corners_estimes.exterieur.total).toBe(4);
      expect(result.buteurs_probables).toEqual([]);
    });

    test("should fall back to defaults using Zod parsing schema if object is empty", () => {
      const emptyObject = {};
      const parsed = predictionResponseSchema.parse(emptyObject);
      expect(parsed.equipe_domicile).toBe("Équipe Domicile");
      expect(parsed.resultat_1x2.victoire_domicile).toBe(34);
      expect(parsed.corners_estimes.domicile.total).toBe(5);
      expect(parsed.niveau_de_confiance).toBe("moyen");
    });
  });
});
