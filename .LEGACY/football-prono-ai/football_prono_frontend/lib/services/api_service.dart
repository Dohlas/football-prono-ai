import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/prediction.dart';

/// Service responsable de la communication HTTP avec le backend Node.js.
///
/// Le backend expose un endpoint POST `/api/analyser` qui reçoit
/// l'URL d'un match 365Scores et renvoie un pronostic structuré
/// (JSON généré par Gemini après scraping).
class ApiService {
  /// URL de base du backend.
  ///
  /// ⚠️ À adapter selon l'environnement :
  /// - Émulateur Android : utiliser "http://10.0.2.2:3000"
  /// - Simulateur iOS / Web / Desktop : "http://localhost:3000"
  /// - Appareil physique ou déploiement : l'URL publique du serveur
  ///   (ex : "https://mon-backend.up.railway.app")
  static const String baseUrl = "http://192.168.1.3:3000";

  /// Envoie l'URL du match au backend et retourne le pronostic parsé.
  ///
  /// Lève une [Exception] en cas d'erreur réseau, de timeout,
  /// ou de réponse invalide du serveur.
  Future<Prediction> getPrediction(String matchUrl) async {
    final Uri endpoint = Uri.parse("$baseUrl/api/analyser");

    try {
      final http.Response response = await http
          .post(
            endpoint,
            headers: {"Content-Type": "application/json"},
            body: jsonEncode({"url": matchUrl}),
          )
          .timeout(const Duration(seconds: 120));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        return Prediction.fromJson(data);
      }

      // Tente d'extraire un message d'erreur renvoyé par le backend.
      String message =
          "Le serveur a renvoyé une erreur (${response.statusCode}).";
      try {
        final Map<String, dynamic> errorBody = jsonDecode(response.body);
        if (errorBody['message'] != null) {
          message = errorBody['message'] as String;
        }
      } catch (_) {
        // Corps de réponse non JSON : on garde le message par défaut.
      }

      throw Exception(message);
    } on http.ClientException {
      throw Exception(
        "Impossible de contacter le serveur. Vérifiez qu'il est bien démarré et accessible.",
      );
    } on FormatException {
      throw Exception("Réponse du serveur invalide (format inattendu).");
    } catch (e) {
      // Relance l'erreur avec un message plus lisible si ce n'est pas déjà une Exception "propre".
      if (e is Exception) rethrow;
      throw Exception("Une erreur inattendue est survenue : $e");
    }
  }
}
