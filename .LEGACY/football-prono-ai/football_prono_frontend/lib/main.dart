import 'package:flutter/material.dart';

import 'screens/home_screen.dart';

void main() {
  runApp(const FootballPronoApp());
}

/// Widget racine de l'application.
class FootballPronoApp extends StatelessWidget {
  const FootballPronoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Football Prono AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0D1117),
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.greenAccent,
          brightness: Brightness.dark,
        ),
      ),
      home: const HomeScreen(),
    );
  }
}
