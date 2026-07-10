# Donjon Infini

Dungeon-crawler RPG roguelike — exploration case par case d'un donjon labyrinthique
généré procéduralement, combats au tour par tour en ATB, économie basée sur l'or.

Document de référence : spécification de développement (GDD consolidé + révisions 2026).

## Lancer le jeu

Aucun build, aucune dépendance : ouvrir `index.html` dans un navigateur.

- **Seed** : champ en haut + bouton « Nouvel étage ». Laisser vide pour une seed
  aléatoire. Une même seed reproduit exactement le même étage (reproduction de bugs).
- **Déplacement** : flèches du clavier, ou clic sur une case accessible.

## Validation et simulations headless

```
node tools/validate-generation.js [nb_seeds] [nb_etages]
```

Vérifie toutes les contraintes de génération §3.1–§3.4 (comptes 70/30, blocs
injouables, connexité, labyrinthe, accès, pièges, quotas du pool, invariants
de respawn par marche aléatoire) et affiche des statistiques de distribution.

```
node tools/simulate-combat.js combats=1000 etage=1 race=orc aventuriers=1 monstres=2 seed=sim
```

Simulateur de combats sans UI (§0.5) : taux de victoire, activations par
combat, % de coups au but, critiques, dégâts moyens, PV restants. Tous les
paramètres sont optionnels (`race=aleatoire`, `monstres=auto` → tirage §7.6).

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
- [x] **M3 — Moteur de combat ATB** : 17 stats, formules révisées §5.3–5.5
  (toucher borné 25–95%, critiques plafonnés 50%, résistances), ATB §5.6 avec
  clamp de vitesse 2:1, attaque de base, ciblage par clic, journal persistant
  3 couleurs, mort/victoire/fin de run, interface combat §13.5–13.6, création
  d'aventurier par race (§6), monstres d'essai Offensif Physique scalés §7.4,
  simulateur headless `tools/simulate-combat.js`.
- [ ] M4 — Génération de monstres (7 orientations, raretés, hybrides, familles, IA)
- [ ] M5 → M11 …

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

## Décor de combat 1ère personne (décision Marc, juillet 2026 — remplace la refonte Pokémon)

Les personnages (aventurier/monstres) et l'interface de combat sont retirés :
le travail porte d'abord sur **l'arrière-plan**, qui servira de base ensuite.

- `js/scene-fp.js` — `svgDungeonRoom(seed)` : salle de donjon vue à la
  première personne, perspective à un point de fuite. Pierres taillées
  empilées en assises (appareillage décalé, arêtes éclairées, écornures,
  grain), mur du fond avec arche sombre, sol dallé convergent (fissures,
  éboulis avec ombres portées, mousse), plafond de dalles. Jeux d'ombres et
  de lumières : pénombre générale, deux torches murales (halo chaud,
  flaques de lumière au sol), rai froid tombant du plafond, lueur bleutée
  dans l'arche, coulures d'humidité, vignettage. 100% SVG généré par RNG
  seedé (`mix-blend-mode` screen/multiply pour la lumière).
- `decor.html` — visionneuse plein écran : seed + « R » pour des variations,
  « S » (ou le sélecteur) pour changer de thème.
- **Trois thèmes** (`FP_THEMES`, même géométrie et mêmes animations) :
  `sombre` — réaliste sombre (volumes par dégradés bombé/creux, lumière
  dramatique) ; `manga` — DA dessin/manga sépia assombrie d'après les
  références de Marc (trait encré, hachures, pointillisme, mousse en relief
  festonnée, sol pierre/terre avec trous, infiltrations de lumière entre les
  pierres) ; `aquarelle` — le plus réaliste, couleur aquarelle (lavis
  translucides par pierre, teintes variées gris bleuté/ocre/sauge, contours
  tremblés par filtre de déplacement, auréoles humides floues, granulation,
  coussins de mousse en lavis). Le jeu utilise `sombre` par défaut en
  attendant le choix de Marc.
- Dans le jeu : entrer sur une salle monstre affiche ce décor (seed dérivée
  de l'étage et de la salle → chaque salle a sa variation) ; **TEMPORAIRE :**
  cliquer le décor ressort et marque la salle vaincue, en attendant la
  réintégration des combats par-dessus. Le moteur de combat §5 et le
  simulateur headless restent intacts.

## Ancienne refonte Pokémon (remplacée)

L'interface de combat n'applique **plus** la structure en bulles du §13.5 du
GDD : Marc a demandé une composition **façon Pokémon simplifiée** (référence :
template de scène de combat Gen 4) :

- scène en diagonale : monstres sur leur plateforme en haut à droite,
  **aventurier vu de dos au premier plan** en bas à gauche (sprite SVG,
  liseré de cape à la couleur de la race) ;
- encart monstre (nom, famille · rareté, barre PV sans chiffres) en haut à
  gauche ; encart aventurier (PV chiffrés + barres MP/EN) en bas à droite —
  boîtes crème inclinées comme le template ;
- boîte de dialogue en bas : message à gauche, **menu 2×2 coloré** à droite
  (Attaque rouge / Objets orange / Compétences vert / Fuite bleu) ;
- ciblage en cliquant un monstre (flèche ▼), monstre d'essai : « Rat géant » ;
- barre ATB fine conservée au-dessus de la scène (lisibilité de l'ordre des
  tours) ; délais et déroulé du §13.6 conservés ; le journal (§13.5) reste
  enregistré en données mais l'affichage passe par la boîte de dialogue ;
- **décor détaillé vu de face** (références fournies par Marc : ruines de
  pierres claires et mousse) : mur en ruine au sommet lacunaire, arche sombre
  à claveaux, deux torches murales avec halo, mousse et fissures, sol pavé,
  crâne + os croisés, tas de pièces d'or, touffes d'herbe, éboulis. Le tout
  généré en SVG par un RNG à seed fixe (`svgBattleScene`) — déterministe,
  léger, sans assets externes.

Le reste du thème (plateau, ville, états de cases §13.2) reste conforme au GDD.

## Décisions prises en M3 (à valider par Marc)

1. **ATB en temps continu** : plutôt que la règle discrète « les autres
   avancent de (VIT/VIT acteur)×100 » (qui fait déborder plusieurs jauges à
   la fois sans règle de départage), les jauges avancent proportionnellement
   à la Vitesse effective jusqu'à ce que la première atteigne 100. Résultat
   identique dans le cas nominal, fréquences exactement proportionnelles aux
   VIT (clampées 2:1 en plafonnant la VIT effective à 2× celle du plus lent).
2. **Plancher de dégâts à 1** sur un coup qui touche (la spec ne définit pas
   l'arrondi ; constante `MIN_DAMAGE`).
3. **Monstres d'essai M3** : Communs, orientation Offensif Physique (§7.2),
   règle 70/30 et scaling §7.4 conformes ; le **pool de PV suit le même
   multiplicateur d'étage que les stats** (le §7.4 ne précise que les stats —
   à confirmer). Distribution §7.6 : partie entière de la moyenne + 1 avec
   probabilité fractionnaire (la « méthode du GDD d'origine » n'est pas dans
   le doc — à préciser pour M4).
4. **Niveau affiché « niv. 1 »** dans les bulles : placeholder en attendant la
   décision §14.13 (progression par niveaux ou purement économique).
5. **Cible des monstres** : aventurier vivant aléatoire (les scripts d'IA par
   orientation arrivent en M4).

### Premiers chiffres de balance (simulateur, étage 1, 1v1 vs Commun Off. Phys.)

| Race | Taux de victoire |
|---|---|
| Orc | ~100% |
| Humain | ~43% |
| Elfe | ~4% |
| Fée | ~0% |

Le 100 pts étalé de l'Humain et les PV fixes bas Elfe/Fée pèsent lourd contre
un profil physique concentré — chiffres à retravailler avec items/compétences
et les autres orientations (M4–M7). Le simulateur est là pour ça.
