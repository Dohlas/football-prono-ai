import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/prediction.dart';

/// Écran affichant le pronostic renvoyé par le backend :
/// résultat 1X2, plus/moins 2.5 buts, BTTS, synthèse et niveau de confiance.
class ResultScreen extends StatelessWidget {
  final Prediction prediction;

  const ResultScreen({super.key, required this.prediction});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D1117),
        elevation: 0,
        title: Text(
          "Résultat de l'analyse",
          style: GoogleFonts.poppins(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _buildMatchHeader(),
            const SizedBox(height: 24),
            _buildSectionTitle("Résultat (1X2)"),
            const SizedBox(height: 12),
            _buildGaugeRow(
              label1: prediction.equipeDomicile,
              value1: prediction.resultat1x2.victoireDomicile,
              label2: "Nul",
              value2: prediction.resultat1x2.matchNul,
              label3: prediction.equipeExterieur,
              value3: prediction.resultat1x2.victoireExterieur,
            ),
            const SizedBox(height: 28),
            _buildSectionTitle("Plus / Moins de 2.5 buts"),
            const SizedBox(height: 12),
            _buildTwoWayBar(
              label1: "Plus de 2.5",
              value1: prediction.plusMoins25Buts.plusDe25,
              label2: "Moins de 2.5",
              value2: prediction.plusMoins25Buts.moinsDe25,
              color1: Colors.orangeAccent,
              color2: Colors.blueAccent,
            ),
            const SizedBox(height: 28),
            _buildSectionTitle("Les deux équipes marquent (BTTS)"),
            const SizedBox(height: 12),
            _buildTwoWayBar(
              label1: "Oui",
              value1: prediction.deuxEquipesMarquent.oui,
              label2: "Non",
              value2: prediction.deuxEquipesMarquent.non,
              color1: Colors.greenAccent.shade400,
              color2: Colors.redAccent,
            ),
            const SizedBox(height: 28),
            _buildSectionTitle("Scores exacts les plus probables"),
            const SizedBox(height: 12),
            _buildScoresExacts(),
            const SizedBox(height: 28),
            _buildSectionTitle("Corners estimés"),
            const SizedBox(height: 12),
            _buildCornersCard(),
            const SizedBox(height: 28),
            _buildSectionTitle("Buteurs probables"),
            const SizedBox(height: 12),
            _buildButeurs(),
            const SizedBox(height: 28),
            _buildSectionTitle("Cartons estimés"),
            const SizedBox(height: 12),
            _buildCartonsCard(),
            const SizedBox(height: 28),
            _buildSectionTitle("Pour limiter le risque"),
            const SizedBox(height: 12),
            _buildParisConseils(),
            const SizedBox(height: 28),
            _buildSectionTitle("Synthèse de l'analyse"),
            const SizedBox(height: 12),
            _buildSyntheseCard(),
            const SizedBox(height: 16),
            _buildConfianceBadge(),
          ],
        ),
      ),
    );
  }

  Widget _buildMatchHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Expanded(
            child: Text(
              prediction.equipeDomicile,
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          Text(
            "VS",
            style: GoogleFonts.poppins(color: Colors.white38, fontSize: 13),
          ),
          Expanded(
            child: Text(
              prediction.equipeExterieur,
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        color: Colors.white,
        fontSize: 15,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  /// Jauge à trois issues (ex : Victoire / Nul / Défaite).
  Widget _buildGaugeRow({
    required String label1,
    required double value1,
    required String label2,
    required double value2,
    required String label3,
    required double value3,
  }) {
    return Row(
      children: [
        _buildGaugeItem(label1, value1, Colors.greenAccent.shade400),
        const SizedBox(width: 10),
        _buildGaugeItem(label2, value2, Colors.amberAccent),
        const SizedBox(width: 10),
        _buildGaugeItem(label3, value3, Colors.redAccent),
      ],
    );
  }

  Widget _buildGaugeItem(String label, double value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF161B22),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            Text(
              "${value.toStringAsFixed(0)}%",
              style: GoogleFonts.poppins(
                color: color,
                fontSize: 22,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.poppins(color: Colors.white60, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  /// Barre horizontale à deux issues (ex : Oui/Non, Plus/Moins).
  Widget _buildTwoWayBar({
    required String label1,
    required double value1,
    required String label2,
    required double value2,
    required Color color1,
    required Color color2,
  }) {
    final double total = (value1 + value2) == 0 ? 1 : (value1 + value2);
    final double ratio1 = value1 / total;

    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: SizedBox(
            height: 16,
            child: Row(
              children: [
                Expanded(
                  flex: (ratio1 * 1000).round().clamp(1, 999),
                  child: Container(color: color1),
                ),
                Expanded(
                  flex: ((1 - ratio1) * 1000).round().clamp(1, 999),
                  child: Container(color: color2),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "$label1 · ${value1.toStringAsFixed(0)}%",
              style: GoogleFonts.poppins(
                color: color1,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              "$label2 · ${value2.toStringAsFixed(0)}%",
              style: GoogleFonts.poppins(
                color: color2,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Liste des scores exacts les plus probables, sous forme de puces.
  Widget _buildScoresExacts() {
    if (prediction.scoresExactsProbables.isEmpty) {
      return _buildEmptyNote("Aucun score exact n'a pu être estimé.");
    }

    return Row(
      children: prediction.scoresExactsProbables.map((s) {
        return Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 4),
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: const Color(0xFF161B22),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: [
                Text(
                  s.score,
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "${s.probabilite.toStringAsFixed(0)}%",
                  style: GoogleFonts.poppins(
                    color: Colors.greenAccent.shade400,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  /// Carte détaillant les corners estimés par équipe et par mi-temps.
  Widget _buildCornersCard() {
    final c = prediction.cornersEstimes;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          _buildCornersRow(
            "1ère mi-temps",
            c.domicile.premiereMiTemps,
            c.exterieur.premiereMiTemps,
          ),
          const Divider(color: Colors.white12, height: 24),
          _buildCornersRow(
            "2ème mi-temps",
            c.domicile.deuxiemeMiTemps,
            c.exterieur.deuxiemeMiTemps,
          ),
          const Divider(color: Colors.white12, height: 24),
          _buildCornersRow(
            "Total",
            c.domicile.total,
            c.exterieur.total,
            isTotal: true,
          ),
        ],
      ),
    );
  }

  Widget _buildCornersRow(
    String label,
    double domicile,
    double exterieur, {
    bool isTotal = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          domicile.toStringAsFixed(1),
          style: GoogleFonts.poppins(
            color: Colors.greenAccent.shade400,
            fontSize: isTotal ? 18 : 15,
            fontWeight: FontWeight.w700,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.poppins(color: Colors.white54, fontSize: 12),
        ),
        Text(
          exterieur.toStringAsFixed(1),
          style: GoogleFonts.poppins(
            color: Colors.redAccent,
            fontSize: isTotal ? 18 : 15,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  /// Liste des buteurs probables avec leur équipe et probabilité.
  Widget _buildButeurs() {
    if (prediction.buteursProbables.isEmpty) {
      return _buildEmptyNote(
        "Aucun buteur probable identifié à partir des données disponibles.",
      );
    }

    return Column(
      children: prediction.buteursProbables.map((b) {
        return Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF161B22),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.sports_soccer, color: Colors.white54, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      b.joueur,
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      b.equipe,
                      style: GoogleFonts.poppins(
                        color: Colors.white54,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                "${b.probabilite.toStringAsFixed(0)}%",
                style: GoogleFonts.poppins(
                  color: Colors.greenAccent.shade400,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  /// Carte détaillant les cartons estimés par équipe.
  Widget _buildCartonsCard() {
    final c = prediction.cartonsEstimes;
    return Row(
      children: [
        Expanded(
          child: _buildCartonsItem(
            prediction.equipeDomicile,
            c.domicile.jaunes,
            c.domicile.rouges,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildCartonsItem(
            prediction.equipeExterieur,
            c.exterieur.jaunes,
            c.exterieur.rouges,
          ),
        ),
      ],
    );
  }

  Widget _buildCartonsItem(String equipe, double jaunes, double rouges) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Text(
            equipe,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.poppins(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 14,
                height: 18,
                decoration: BoxDecoration(
                  color: Colors.amber,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                jaunes.toStringAsFixed(1),
                style: GoogleFonts.poppins(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 16),
              Container(
                width: 14,
                height: 18,
                decoration: BoxDecoration(
                  color: Colors.redAccent,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                rouges.toStringAsFixed(1),
                style: GoogleFonts.poppins(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Conseils pour limiter le risque : paris les plus sûrs et à éviter.
  Widget _buildParisConseils() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (prediction.parisLesPlusSurs.isNotEmpty) ...[
          Text(
            "✅ Paris les plus sûrs",
            style: GoogleFonts.poppins(
              color: Colors.greenAccent.shade400,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          ...prediction.parisLesPlusSurs.map(
            (p) => _buildConseilLine(p, Colors.greenAccent.shade400),
          ),
          const SizedBox(height: 16),
        ],
        if (prediction.parisAEviter.isNotEmpty) ...[
          Text(
            "⚠️ Paris à éviter",
            style: GoogleFonts.poppins(
              color: Colors.redAccent,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          ...prediction.parisAEviter.map(
            (p) => _buildConseilLine(p, Colors.redAccent),
          ),
        ],
        const SizedBox(height: 12),
        Text(
          "Ces indications reposent sur une estimation statistique et ne garantissent aucun résultat. Parie de façon responsable.",
          style: GoogleFonts.poppins(
            color: Colors.white38,
            fontSize: 11,
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    );
  }

  Widget _buildConseilLine(String text, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.circle, size: 6, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.poppins(
                color: Colors.white70,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyNote(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: GoogleFonts.poppins(
          color: Colors.white38,
          fontSize: 12,
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }

  Widget _buildSyntheseCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: Text(
        prediction.synthese.isNotEmpty
            ? prediction.synthese
            : "Aucune synthèse disponible pour ce match.",
        style: GoogleFonts.poppins(
          color: Colors.white70,
          fontSize: 13,
          height: 1.5,
        ),
      ),
    );
  }

  Widget _buildConfianceBadge() {
    final String niveau = prediction.niveauDeConfiance.toLowerCase();
    Color color;
    switch (niveau) {
      case "élevé":
      case "eleve":
        color = Colors.greenAccent.shade400;
        break;
      case "faible":
        color = Colors.redAccent;
        break;
      default:
        color = Colors.amberAccent;
    }

    return Row(
      children: [
        Icon(Icons.insights_rounded, color: color, size: 18),
        const SizedBox(width: 8),
        Text(
          "Niveau de confiance : ${prediction.niveauDeConfiance}",
          style: GoogleFonts.poppins(
            color: color,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
