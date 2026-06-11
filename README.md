# Donjon Infini

Dungeon-crawler RPG roguelike — exploration case par case d'un donjon labyrinthique
généré procéduralement, combats au tour par tour en ATB, économie basée sur l'or.

Document de référence : spécification de développement (GDD consolidé + révisions 2026).

## Lancer le jeu

Aucun build, aucune dépendance : ouvrir `index.html` dans un navigateur.

- **Seed** : champ en haut + bouton « Nouvel étage ». Laisser vide pour une seed
  aléatoire. Une même seed reproduit exactement le même étage (reproduction de bugs).
- **Déplacement** : flèches du clavier, ou clic sur une case accessible.

## Validation headless

```
node tools/validate-generation.js [nombre_de_seeds]   # défaut : 1000
```

Vérifie sur N seeds toutes les contraintes de génération du §3.1 (comptes 70/30,
blocs injouables ≤ 5 et dispersés, connexité, labyrinthe = arbre couvrant de
degré 1–3) et affiche des statistiques de distribution.

## Architecture

| Fichier | Rôle |
|---|---|
| `js/config.js` | **Données** — toutes les constantes du jeu (data-driven, §0.3). Aucune valeur numérique de design dans la logique. |
| `js/rng.js` | RNG seedable (xmur3 + mulberry32, §0.4). Toute génération aléatoire passe par lui. |
| `js/generation.js` | Génération d'étage : cases injouables + labyrinthe parfait DFS (§3.1). Fonctions pures, utilisables en navigateur et en headless (node). |
| `js/state.js` | État de jeu : position, exploration, compteur de tours. |
| `js/ui.js`, `js/main.js`, `css/style.css` | Rendu du plateau (thème §13) et interactions. |
| `tools/validate-generation.js` | Validation headless de la génération. |

## Avancement des jalons (§2)

- [x] **M1 — Plateau & génération** : grille 10×10, 30 cases injouables (blocs 1–5
  dispersés, max 3 voisins injouables), labyrinthe parfait DFS à murs invisibles
  (degré 1–3), brouillard de guerre, déplacement, compteur de tours, seed.
- [ ] M2 — Étages & navigation
- [ ] M3 — Moteur de combat ATB
- [ ] M4 → M11 …

## Décisions prises en M1 (à valider par Marc)

1. **Stack** : HTML/JS vanilla sans framework ni build (recommandation §2 du doc,
   continuité du prototype). À confirmer (§14.1).
2. **Priorité d'affichage des états de case** : une salle reliée à la position
   courante est affichée « accessible » (`#6b6960`) même si elle a déjà été
   explorée — la lisibilité des murs invisibles prime. À confirmer.
3. **Apparition M1** : l'aventurier apparaît sur une salle jouable aléatoire
   (les cases d'accès orange/jaune et la ville arrivent en M2).
