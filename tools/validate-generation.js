/**
 * DONJON INFINI — Validation headless de la génération d'étage (jalon M1).
 * Vérifie sur N seeds toutes les contraintes du §3.1 :
 *   - exactement 30 cases injouables / 70 jouables ;
 *   - blocs injouables contigus de taille 1 à 5 ;
 *   - chaque case injouable a au max 3 voisins injouables directs ;
 *   - les 70 cases jouables sont connexes (adjacence de grille) ;
 *   - le labyrinthe est un arbre couvrant (69 passages, connexe, symétrique,
 *     passages uniquement entre salles jouables adjacentes) ;
 *   - chaque salle est reliée à 1, 2 ou 3 salles adjacentes.
 *
 * Usage : node tools/validate-generation.js [nombre_de_seeds]
 */
const { CONFIG } = require('../js/config.js');
const { RNG } = require('../js/rng.js');
const { neighborsOf, generateFloor } = require('../js/generation.js');

const SEEDS = parseInt(process.argv[2] || '1000', 10);
const size = CONFIG.GRID_SIZE;
const n = size * size;

let failures = 0;
const degreeHist = { 1: 0, 2: 0, 3: 0 };
const blockSizeHist = {};

function fail(seed, msg) {
  failures++;
  console.error(`ÉCHEC seed "${seed}" : ${msg}`);
}

function checkFloor(seed, floor) {
  const { unplayable, passages } = floor;

  // Comptes
  const unplayableCount = unplayable.filter(Boolean).length;
  if (unplayableCount !== CONFIG.UNPLAYABLE_COUNT) {
    return fail(seed, `${unplayableCount} cases injouables au lieu de ${CONFIG.UNPLAYABLE_COUNT}`);
  }

  // Voisins injouables ≤ 3
  for (let i = 0; i < n; i++) {
    if (!unplayable[i]) continue;
    const bad = neighborsOf(i, size).filter((m) => unplayable[m]).length;
    if (bad > CONFIG.UNPLAYABLE_MAX_NEIGHBORS) {
      return fail(seed, `case injouable ${i} a ${bad} voisins injouables`);
    }
  }

  // Blocs contigus ≤ 5
  const seen = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    if (!unplayable[i] || seen[i]) continue;
    let blockSize = 0;
    const queue = [i];
    seen[i] = true;
    while (queue.length) {
      const cur = queue.pop();
      blockSize++;
      for (const m of neighborsOf(cur, size)) {
        if (unplayable[m] && !seen[m]) {
          seen[m] = true;
          queue.push(m);
        }
      }
    }
    blockSizeHist[blockSize] = (blockSizeHist[blockSize] || 0) + 1;
    if (blockSize > CONFIG.UNPLAYABLE_GROUP_MAX) {
      return fail(seed, `bloc injouable contigu de taille ${blockSize}`);
    }
  }

  // Connexité des jouables (grille) + arbre couvrant (labyrinthe)
  const playable = [];
  for (let i = 0; i < n; i++) if (!unplayable[i]) playable.push(i);

  let edges = 0;
  for (const i of playable) {
    const deg = passages[i].length;
    if (deg < 1 || deg > CONFIG.MAZE_MAX_DEGREE) {
      return fail(seed, `salle ${i} de degré ${deg}`);
    }
    degreeHist[deg]++;
    edges += deg;
    for (const j of passages[i]) {
      if (unplayable[j]) return fail(seed, `passage ${i}→${j} vers une case injouable`);
      if (!neighborsOf(i, size).includes(j)) return fail(seed, `passage ${i}→${j} non adjacent`);
      if (!passages[j].includes(i)) return fail(seed, `passage ${i}→${j} non symétrique`);
    }
  }
  edges /= 2;
  if (edges !== playable.length - 1) {
    return fail(seed, `${edges} passages au lieu de ${playable.length - 1} (pas un arbre)`);
  }

  // Connexité via les passages (arbre couvrant ⇒ chemin unique entre toutes salles)
  const reached = new Set([playable[0]]);
  const queue = [playable[0]];
  while (queue.length) {
    const cur = queue.pop();
    for (const m of passages[cur]) {
      if (!reached.has(m)) {
        reached.add(m);
        queue.push(m);
      }
    }
  }
  if (reached.size !== playable.length) {
    return fail(seed, `labyrinthe non connexe (${reached.size}/${playable.length})`);
  }
}

console.log(`Validation de la génération sur ${SEEDS} seeds…`);
const t0 = Date.now();
for (let s = 1; s <= SEEDS; s++) {
  const seed = `validate-${s}`;
  try {
    checkFloor(seed, generateFloor(new RNG(seed), CONFIG));
  } catch (e) {
    fail(seed, e.message);
  }
}
const ms = Date.now() - t0;

console.log(`\nTerminé en ${ms} ms (${(ms / SEEDS).toFixed(2)} ms/étage).`);
console.log(`Distribution des degrés de salles : ${JSON.stringify(degreeHist)}`);
console.log(`Distribution des tailles de blocs injouables : ${JSON.stringify(blockSizeHist)}`);
if (failures) {
  console.error(`\n${failures} échec(s).`);
  process.exit(1);
}
console.log('\nToutes les contraintes du §3.1 sont satisfaites.');
