/// Modèle de données représentant le pronostic renvoyé par le backend
/// (qui lui-même reçoit un JSON structuré généré par Gemini).
///
/// Correspond au `responseSchema` défini côté serveur dans `scraper.js`.
class Prediction {
  final String equipeDomicile;
  final String equipeExterieur;
  final String synthese;
  final ResultatUnXDeux resultat1x2;
  final PlusMoins25Buts plusMoins25Buts;
  final DeuxEquipesMarquent deuxEquipesMarquent;
  final List<ScoreExact> scoresExactsProbables;
  final CornersEstimes cornersEstimes;
  final List<Buteur> buteursProbables;
  final CartonsEstimes cartonsEstimes;
  final List<String> parisLesPlusSurs;
  final List<String> parisAEviter;
  final String niveauDeConfiance;

  Prediction({
    required this.equipeDomicile,
    required this.equipeExterieur,
    required this.synthese,
    required this.resultat1x2,
    required this.plusMoins25Buts,
    required this.deuxEquipesMarquent,
    required this.scoresExactsProbables,
    required this.cornersEstimes,
    required this.buteursProbables,
    required this.cartonsEstimes,
    required this.parisLesPlusSurs,
    required this.parisAEviter,
    required this.niveauDeConfiance,
  });

  /// Construit une instance de [Prediction] à partir du JSON renvoyé
  /// par l'endpoint `/api/analyser` du backend Node.js.
  factory Prediction.fromJson(Map<String, dynamic> json) {
    return Prediction(
      equipeDomicile: json['equipe_domicile'] as String? ?? 'Équipe A',
      equipeExterieur: json['equipe_exterieur'] as String? ?? 'Équipe B',
      synthese: json['synthese'] as String? ?? '',
      resultat1x2: ResultatUnXDeux.fromJson(
        json['resultat_1x2'] as Map<String, dynamic>? ?? {},
      ),
      plusMoins25Buts: PlusMoins25Buts.fromJson(
        json['plus_moins_2_5_buts'] as Map<String, dynamic>? ?? {},
      ),
      deuxEquipesMarquent: DeuxEquipesMarquent.fromJson(
        json['les_deux_equipes_marquent'] as Map<String, dynamic>? ?? {},
      ),
      scoresExactsProbables:
          (json['scores_exacts_probables'] as List<dynamic>? ?? [])
              .map((e) => ScoreExact.fromJson(e as Map<String, dynamic>))
              .toList(),
      cornersEstimes: CornersEstimes.fromJson(
        json['corners_estimes'] as Map<String, dynamic>? ?? {},
      ),
      buteursProbables: (json['buteurs_probables'] as List<dynamic>? ?? [])
          .map((e) => Buteur.fromJson(e as Map<String, dynamic>))
          .toList(),
      cartonsEstimes: CartonsEstimes.fromJson(
        json['cartons_estimes'] as Map<String, dynamic>? ?? {},
      ),
      parisLesPlusSurs: (json['paris_les_plus_surs'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(),
      parisAEviter: (json['paris_a_eviter'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(),
      niveauDeConfiance: json['niveau_de_confiance'] as String? ?? 'moyen',
    );
  }
}

/// Un score exact probable avec sa probabilité estimée (ex : "2-1" à 14%).
class ScoreExact {
  final String score;
  final double probabilite;

  ScoreExact({required this.score, required this.probabilite});

  factory ScoreExact.fromJson(Map<String, dynamic> json) {
    return ScoreExact(
      score: json['score'] as String? ?? '?-?',
      probabilite: (json['probabilite'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// Détail des corners estimés pour une équipe (par mi-temps + total).
class DetailCorners {
  final double premiereMiTemps;
  final double deuxiemeMiTemps;
  final double total;

  DetailCorners({
    required this.premiereMiTemps,
    required this.deuxiemeMiTemps,
    required this.total,
  });

  factory DetailCorners.fromJson(Map<String, dynamic> json) {
    return DetailCorners(
      premiereMiTemps: (json['premiere_mi_temps'] as num?)?.toDouble() ?? 0,
      deuxiemeMiTemps: (json['deuxieme_mi_temps'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// Corners estimés pour les deux équipes.
class CornersEstimes {
  final DetailCorners domicile;
  final DetailCorners exterieur;

  CornersEstimes({required this.domicile, required this.exterieur});

  factory CornersEstimes.fromJson(Map<String, dynamic> json) {
    return CornersEstimes(
      domicile: DetailCorners.fromJson(
        json['domicile'] as Map<String, dynamic>? ?? {},
      ),
      exterieur: DetailCorners.fromJson(
        json['exterieur'] as Map<String, dynamic>? ?? {},
      ),
    );
  }
}

/// Un buteur probable avec son équipe et sa probabilité estimée.
class Buteur {
  final String joueur;
  final String equipe;
  final double probabilite;

  Buteur({
    required this.joueur,
    required this.equipe,
    required this.probabilite,
  });

  factory Buteur.fromJson(Map<String, dynamic> json) {
    return Buteur(
      joueur: json['joueur'] as String? ?? '',
      equipe: json['equipe'] as String? ?? '',
      probabilite: (json['probabilite'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// Détail des cartons estimés pour une équipe.
class DetailCartons {
  final double jaunes;
  final double rouges;

  DetailCartons({required this.jaunes, required this.rouges});

  factory DetailCartons.fromJson(Map<String, dynamic> json) {
    return DetailCartons(
      jaunes: (json['jaunes'] as num?)?.toDouble() ?? 0,
      rouges: (json['rouges'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// Cartons estimés pour les deux équipes.
class CartonsEstimes {
  final DetailCartons domicile;
  final DetailCartons exterieur;

  CartonsEstimes({required this.domicile, required this.exterieur});

  factory CartonsEstimes.fromJson(Map<String, dynamic> json) {
    return CartonsEstimes(
      domicile: DetailCartons.fromJson(
        json['domicile'] as Map<String, dynamic>? ?? {},
      ),
      exterieur: DetailCartons.fromJson(
        json['exterieur'] as Map<String, dynamic>? ?? {},
      ),
    );
  }
}

/// Probabilités du résultat 1X2 (Victoire domicile / Nul / Victoire extérieur).
class ResultatUnXDeux {
  final double victoireDomicile;
  final double matchNul;
  final double victoireExterieur;

  ResultatUnXDeux({
    required this.victoireDomicile,
    required this.matchNul,
    required this.victoireExterieur,
  });

  factory ResultatUnXDeux.fromJson(Map<String, dynamic> json) {
    return ResultatUnXDeux(
      victoireDomicile: (json['victoire_domicile'] as num?)?.toDouble() ?? 0,
      matchNul: (json['match_nul'] as num?)?.toDouble() ?? 0,
      victoireExterieur: (json['victoire_exterieur'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// Probabilités Plus / Moins de 2.5 buts.
class PlusMoins25Buts {
  final double plusDe25;
  final double moinsDe25;

  PlusMoins25Buts({required this.plusDe25, required this.moinsDe25});

  factory PlusMoins25Buts.fromJson(Map<String, dynamic> json) {
    return PlusMoins25Buts(
      plusDe25: (json['plus_de_2_5'] as num?)?.toDouble() ?? 0,
      moinsDe25: (json['moins_de_2_5'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// Probabilités que les deux équipes marquent (BTTS).
class DeuxEquipesMarquent {
  final double oui;
  final double non;

  DeuxEquipesMarquent({required this.oui, required this.non});

  factory DeuxEquipesMarquent.fromJson(Map<String, dynamic> json) {
    return DeuxEquipesMarquent(
      oui: (json['oui'] as num?)?.toDouble() ?? 0,
      non: (json['non'] as num?)?.toDouble() ?? 0,
    );
  }
}
