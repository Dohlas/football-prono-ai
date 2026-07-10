import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_service.dart';
import '../../../models/prediction.dart';
import 'result_screen.dart';
/// Écran principal de l'application.
///
/// Permet à l'utilisateur de coller l'URL d'un match 365Scores,
/// puis de lancer l'analyse via le backend Node.js (scraping + Gemini).
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _urlController = TextEditingController();
  final ApiService _apiService = ApiService();

  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  /// Valide l'URL saisie et lance l'analyse auprès du backend.
  Future<void> _analyserMatch() async {
    final String url = _urlController.text.trim();

    setState(() {
      _errorMessage = null;
    });

    if (url.isEmpty) {
      setState(() => _errorMessage = "Veuillez coller une URL de match 365Scores.");
      return;
    }

    if (!url.contains("365scores.com")) {
      setState(() => _errorMessage = "L'URL doit provenir du site 365Scores.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final Prediction prediction = await _apiService.getPrediction(url);

      if (!mounted) return;

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ResultScreen(prediction: prediction),
        ),
      );
    } catch (e) {
      setState(() {
        _errorMessage = "Erreur lors de l'analyse : ${e.toString()}";
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.sports_soccer_rounded,
                  size: 72,
                  color: Colors.greenAccent.shade400,
                ),
                const SizedBox(height: 16),
                Text(
                  "Football Prono AI",
                  style: GoogleFonts.poppins(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  "Collez l'URL d'un match 365Scores pour obtenir\nune analyse basée sur l'IA",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 32),

                // Champ de saisie de l'URL
                TextField(
                  controller: _urlController,
                  style: GoogleFonts.poppins(color: Colors.white),
                  keyboardType: TextInputType.url,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _analyserMatch(),
                  decoration: InputDecoration(
                    hintText: "https://www.365scores.com/fr/football/match/...",
                    hintStyle: GoogleFonts.poppins(color: Colors.white38, fontSize: 13),
                    filled: true,
                    fillColor: const Color(0xFF161B22),
                    prefixIcon: const Icon(Icons.link_rounded, color: Colors.white54),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear, color: Colors.white38),
                      onPressed: () => _urlController.clear(),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding:
                        const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                  ),
                ),

                if (_errorMessage != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _errorMessage!,
                    style: GoogleFonts.poppins(color: Colors.redAccent, fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ],

                const SizedBox(height: 24),

                // Bouton d'analyse
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _analyserMatch,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.greenAccent.shade400,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.black,
                            ),
                          )
                        : Text(
                            "Analyser le match",
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                            ),
                          ),
                  ),
                ),

                if (_isLoading) ...[
                  const SizedBox(height: 16),
                  Text(
                    "Scraping en cours et analyse par l'IA...\nCela peut prendre quelques secondes.",
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(color: Colors.white54, fontSize: 12),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
