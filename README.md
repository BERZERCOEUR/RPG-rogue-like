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
  (degré 1–3), brouillard de guerre, déplacement, compteur de tours, seed. ✔ validé
- [x] **M2 — Étages & navigation** : cases orange (montée) / jaune (descente) à
  coordonnée partagée, distance ≥ 5 salles entre accès, ville tous les 5 étages,
  répartition des salles §3.2 par pool à quota fixe, mémorisation des étages,
  tours globaux, respawn 100 tours (§3.4), bouton « Utiliser » contextuel (§13.3),
  marqueurs §13.2, panneau debug de validation (types, pool, +50 tours).
- [ ] M3 — Moteur de combat ATB
- [ ] M4 → M11 …

## Décisions prises en M1 (validé par Marc)

1. **Stack** : HTML/JS vanilla sans framework ni build (recommandation §2 du doc,
   continuité du prototype).
2. **Priorité d'affichage des états de case** : une salle reliée à la position
   courante est affichée « accessible » (`#6b6960`) même si elle a déjà été
   explorée — la lisibilité des murs invisibles prime.

## Décisions prises en M2 (à valider par Marc)

1. **Étage 0** : traité comme un étage ville (§3.2 colonne ×5) sans case jaune ;
   la salle libérée devient une vide → 29 monstres / 31 vides / 3 trésors / 5
   pièges / 1 orange / 1 ville. La distance min de 5 salles vers l'orange y est
   mesurée depuis la ville (pas de jaune). Cf. §14.21.
2. **Type des salles dynamiques tiré à la traversée** : une salle en brouillard
   n'a pas de type déterminé ; il est tiré dans le pool restant de l'étage quand
   le joueur y entre. Au respawn, la salle rend son type au pool — c'est ce qui
   permet le « peut changer de type » du §3.4 tout en gardant le quota exact.
3. **Monter/descendre un étage coûte 1 tour** (assimilé à un déplacement, §3.5).
4. **Pièges au respawn** : position et type conservés (§3.3), mais la salle
   repasse en brouillard (réarmement — effets au jalon M9).
5. **Layout d'étage indépendant du parcours** : l'étage N est généré depuis la
   seed dérivée `seed/etage/N/layout` — même carte quelle que soit la façon de
   jouer ; seuls les tirages dynamiques dépendent du parcours.
6. **Bouton « Entrer »** sur la ville : affiché mais inactif jusqu'au jalon M5.
