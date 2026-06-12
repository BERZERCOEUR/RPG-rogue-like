/**
 * DONJON INFINI — Validation headless de la génération et du respawn (M1+M2).
 *
 * Pour chaque seed :
 *  A. Contraintes §3.1 sur une chaîne d'étages 0..FLOORS :
 *     - 30 cases injouables / 70 jouables, blocs contigus ≤ 5,
 *       max 3 voisins injouables, jouables connexes ;
 *     - labyrinthe = arbre couvrant (69 passages, symétrique, adjacent,
 *       degré 1–3) ;
 *     - case jaune de l'étage N = case orange de l'étage N−1 (jouable) ;
 *     - distance labyrinthe entre accès ≥ 5 salles (réf. ville à l'étage 0) ;
 *     - 5 pièges sur cases jouables distinctes hors salles fixes ;
 *     - ville présente uniquement sur les étages ×5 ;
 *     - pool initial = nombre de salles dynamiques de l'étage (§3.2).
 *  B. Simulation de marche aléatoire (§3.4) : à chaque tour,
 *     types attribués + pool = quota constant ; le respawn rend bien des
 *     salles au brouillard ; aucun pool négatif ; salles fixes intactes.
 *
 * Usage : node tools/validate-generation.js [nb_seeds] [nb_etages]
 */
const { CONFIG } = require('../js/config.js');
const { RNG } = require('../js/rng.js');
const generation = require('../js/generation.js');
const { neighborsOf, mazeDistances } = generation;

// floor.js / game.js sont écrits pour le navigateur (globals) : on les expose.
global.RNG = RNG;
global.generateFloor = generation.generateFloor;
const { Floor, DYNAMIC_TYPES } = require('../js/floor.js');
global.Floor = Floor;
const { Game } = require('../js/game.js');

const SEEDS = parseInt(process.argv[2] || '300', 10);
const FLOORS = parseInt(process.argv[3] || '12', 10);
const size = CONFIG.GRID_SIZE;
const n = size * size;

let failures = 0;
const degreeHist = { 1: 0, 2: 0, 3: 0 };
const blockSizeHist = {};
const accessDistHist = {};
let respawnsObserved = 0;

function fail(seed, msg) {
  failures++;
  console.error(`ÉCHEC seed "${seed}" : ${msg}`);
}

function checkLayout(seed, floor, prevFloor) {
  const { unplayable, passages, jaune, orange, ville, pieges } = floor.layout;
  const tag = `étage ${floor.number}`;

  const unplayableCount = unplayable.filter(Boolean).length;
  if (unplayableCount !== CONFIG.UNPLAYABLE_COUNT) {
    return fail(seed, `${tag} : ${unplayableCount} cases injouables`);
  }

  for (let i = 0; i < n; i++) {
    if (!unplayable[i]) continue;
    const bad = neighborsOf(i, size).filter((m) => unplayable[m]).length;
    if (bad > CONFIG.UNPLAYABLE_MAX_NEIGHBORS) {
      return fail(seed, `${tag} : case injouable ${i} a ${bad} voisins injouables`);
    }
  }

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
      return fail(seed, `${tag} : bloc injouable de taille ${blockSize}`);
    }
  }

  const playable = [];
  for (let i = 0; i < n; i++) if (!unplayable[i]) playable.push(i);

  let edges = 0;
  for (const i of playable) {
    const deg = passages[i].length;
    if (deg < 1 || deg > CONFIG.MAZE_MAX_DEGREE) return fail(seed, `${tag} : salle ${i} de degré ${deg}`);
    degreeHist[deg]++;
    edges += deg;
    for (const j of passages[i]) {
      if (unplayable[j]) return fail(seed, `${tag} : passage ${i}→${j} vers case injouable`);
      if (!neighborsOf(i, size).includes(j)) return fail(seed, `${tag} : passage ${i}→${j} non adjacent`);
      if (!passages[j].includes(i)) return fail(seed, `${tag} : passage ${i}→${j} non symétrique`);
    }
  }
  if (edges / 2 !== playable.length - 1) {
    return fail(seed, `${tag} : ${edges / 2} passages au lieu de ${playable.length - 1}`);
  }

  // Salles fixes (§3.2/§3.3/§3.6)
  if (floor.number === 0) {
    if (jaune !== null) return fail(seed, `${tag} : case jaune présente à l'étage 0`);
  } else {
    if (jaune !== prevFloor.layout.orange) {
      return fail(seed, `${tag} : jaune (${jaune}) ≠ orange de l'étage précédent (${prevFloor.layout.orange})`);
    }
    if (unplayable[jaune]) return fail(seed, `${tag} : case jaune injouable`);
  }
  if (unplayable[orange]) return fail(seed, `${tag} : case orange injouable`);

  const expectVille = floor.number % CONFIG.VILLE_EVERY === 0;
  if (expectVille !== (ville !== null)) return fail(seed, `${tag} : ville ${ville !== null ? 'présente' : 'absente'}`);

  const ref = jaune !== null ? jaune : ville;
  const d = mazeDistances(passages, ref, n)[orange];
  accessDistHist[d] = (accessDistHist[d] || 0) + 1;
  if (d < CONFIG.ACCESS_MIN_PATH) return fail(seed, `${tag} : distance accès ${d} < ${CONFIG.ACCESS_MIN_PATH}`);

  const fixed = new Set([orange, jaune, ville].filter((c) => c !== null));
  if (pieges.length !== CONFIG.PIEGES_PER_FLOOR) return fail(seed, `${tag} : ${pieges.length} pièges`);
  if (new Set(pieges).size !== pieges.length) return fail(seed, `${tag} : pièges en double`);
  for (const p of pieges) {
    if (unplayable[p] || fixed.has(p)) return fail(seed, `${tag} : piège ${p} mal placé`);
  }

  // Pool initial = salles dynamiques (§3.2)
  const dynamicCount = playable.length - fixed.size - pieges.length;
  const poolSum = DYNAMIC_TYPES.reduce((s, t) => s + floor.pool[t], 0);
  if (poolSum !== dynamicCount) {
    return fail(seed, `${tag} : pool ${poolSum} ≠ salles dynamiques ${dynamicCount}`);
  }
}

/** Marche aléatoire + sauts de temps : invariants du respawn (§3.4). */
function simulateRespawn(seed, game, tours) {
  const walkRng = new RNG(`${seed}/marche`);
  const floor = game.current();
  const quota = { ...floor.pool };
  for (const t of DYNAMIC_TYPES) {
    quota[t] += floor.type.filter((x) => x === t).length;
  }
  let lastFog = floor.exploredCount();

  for (let step = 0; step < tours; step++) {
    if (walkRng.next() < 0.02) game.advanceTours(walkRng.int(20, 80)); // pause longue
    else game.moveTo(walkRng.pick(floor.layout.passages[game.pos]));

    for (const t of DYNAMIC_TYPES) {
      if (floor.pool[t] < 0) return fail(seed, `pool ${t} négatif au tour ${game.tour}`);
    }
    const assigned = {};
    for (const t of DYNAMIC_TYPES) assigned[t] = floor.type.filter((x) => x === t).length;
    for (const t of DYNAMIC_TYPES) {
      if (assigned[t] + floor.pool[t] !== quota[t]) {
        return fail(seed, `quota ${t} violé au tour ${game.tour} : ${assigned[t]}+${floor.pool[t]}≠${quota[t]}`);
      }
    }
    const explored = floor.exploredCount();
    if (explored < lastFog) respawnsObserved++;
    lastFog = explored;

    // Salles fixes intactes
    if (floor.type[floor.layout.orange] !== 'orange') return fail(seed, 'orange perdu');
    for (const p of floor.layout.pieges) {
      if (floor.type[p] !== 'piege') return fail(seed, `piège ${p} repositionné`);
    }
  }
}

console.log(`Validation : ${SEEDS} seeds × ${FLOORS} étages + simulation respawn…`);
const t0 = Date.now();
for (let s = 1; s <= SEEDS; s++) {
  const seed = `validate-${s}`;
  try {
    const game = new Game(seed, CONFIG);
    let prev = null;
    for (let f = 0; f < FLOORS; f++) {
      const floor = game.floor(f);
      checkLayout(seed, floor, prev);
      prev = floor;
    }
    simulateRespawn(seed, game, 600);
  } catch (e) {
    fail(seed, e.message);
  }
}
const ms = Date.now() - t0;

console.log(`\nTerminé en ${ms} ms (${(ms / (SEEDS * FLOORS)).toFixed(2)} ms/étage).`);
console.log(`Degrés des salles : ${JSON.stringify(degreeHist)}`);
console.log(`Tailles des blocs injouables : ${JSON.stringify(blockSizeHist)}`);
const dists = Object.keys(accessDistHist).map(Number).sort((a, b) => a - b);
console.log(`Distance entre accès : min ${dists[0]}, max ${dists[dists.length - 1]}`);
console.log(`Respawns observés pendant les marches aléatoires : ${respawnsObserved}`);
if (respawnsObserved === 0) fail('global', 'aucun respawn observé — §3.4 non vérifiable');
if (failures) {
  console.error(`\n${failures} échec(s).`);
  process.exit(1);
}
console.log('\nToutes les contraintes §3.1–§3.4 sont satisfaites.');
