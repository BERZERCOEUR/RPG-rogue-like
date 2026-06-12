/**
 * DONJON INFINI — Génération d'un étage (§3.1).
 *
 * 1. Placement de 30 cases injouables en blocs contigus de 1 à 5 cases,
 *    blocs séparés les uns des autres (dispersion), chaque case injouable
 *    ayant au maximum 3 voisins injouables directs, et les 70 cases jouables
 *    restant connexes (par adjacence de grille).
 * 2. Labyrinthe parfait par DFS backtracking sur les 70 salles : arbre
 *    couvrant (un unique chemin entre chaque paire de salles), chaque salle
 *    reliée à 1, 2 ou 3 salles adjacentes. Les murs sont invisibles.
 *
 * Toutes les fonctions sont pures (rng + cfg en paramètres) pour être
 * utilisables à l'identique dans le navigateur et en mode headless (node).
 */

/** Indices des 4 voisins directs (haut/bas/gauche/droite) dans la grille. */
function neighborsOf(idx, size) {
  const x = idx % size;
  const y = Math.floor(idx / size);
  const out = [];
  if (y > 0) out.push(idx - size);
  if (y < size - 1) out.push(idx + size);
  if (x > 0) out.push(idx - 1);
  if (x < size - 1) out.push(idx + 1);
  return out;
}

/** Les cases non injouables forment-elles un ensemble connexe ? */
function playableConnected(unplayable, size) {
  const n = size * size;
  let start = -1;
  let playableCount = 0;
  for (let i = 0; i < n; i++) {
    if (!unplayable[i]) {
      playableCount++;
      if (start === -1) start = i;
    }
  }
  if (start === -1) return false;
  const seen = new Array(n).fill(false);
  seen[start] = true;
  const queue = [start];
  let reached = 1;
  while (queue.length) {
    const cur = queue.pop();
    for (const nb of neighborsOf(cur, size)) {
      if (!unplayable[nb] && !seen[nb]) {
        seen[nb] = true;
        reached++;
        queue.push(nb);
      }
    }
  }
  return reached === playableCount;
}

/** Tire les tailles de blocs injouables (1–5) totalisant UNPLAYABLE_COUNT. */
function drawGroupSizes(rng, cfg) {
  const sizes = [];
  let remaining = cfg.UNPLAYABLE_COUNT;
  while (remaining > 0) {
    const s = Math.min(rng.int(cfg.UNPLAYABLE_GROUP_MIN, cfg.UNPLAYABLE_GROUP_MAX), remaining);
    sizes.push(s);
    remaining -= s;
  }
  return sizes;
}

/**
 * Fait croître un bloc contigu de `size` cases injouables.
 * Le bloc ne touche jamais un autre bloc (garantit blocs ≤ 5), aucune de
 * ses cases ne dépasse UNPLAYABLE_MAX_NEIGHBORS voisins injouables, et il
 * évite les cases de `forbidden` (cases devant rester jouables, ex. accès).
 * Retourne la liste des cases du bloc, ou null si impossible ici.
 */
function tryGrowGroup(rng, cfg, unplayable, size, forbidden) {
  const n = cfg.GRID_SIZE * cfg.GRID_SIZE;
  const isolatedFree = (c) =>
    !unplayable[c] &&
    !forbidden.has(c) &&
    neighborsOf(c, cfg.GRID_SIZE).every((m) => !unplayable[m]);

  const starts = [];
  for (let i = 0; i < n; i++) if (isolatedFree(i)) starts.push(i);
  if (!starts.length) return null;

  const group = new Set([rng.pick(starts)]);
  while (group.size < size) {
    const frontier = [];
    for (const g of group) {
      for (const c of neighborsOf(g, cfg.GRID_SIZE)) {
        if (unplayable[c] || group.has(c) || frontier.includes(c)) continue;
        if (!isolatedFree(c)) continue; // toucherait un autre bloc
        const inGroup = neighborsOf(c, cfg.GRID_SIZE).filter((m) => group.has(m));
        if (inGroup.length > cfg.UNPLAYABLE_MAX_NEIGHBORS) continue;
        // l'ajout de c augmente de 1 le compte de chacun de ses voisins du bloc
        const ok = inGroup.every(
          (m) =>
            neighborsOf(m, cfg.GRID_SIZE).filter((x) => group.has(x)).length <
            cfg.UNPLAYABLE_MAX_NEIGHBORS
        );
        if (ok) frontier.push(c);
      }
    }
    if (!frontier.length) return null;
    group.add(rng.pick(frontier));
  }
  return [...group];
}

/** Place tous les blocs injouables. Retourne le tableau bool[100], ou null. */
function tryPlaceUnplayable(rng, cfg, forbidden = new Set()) {
  const n = cfg.GRID_SIZE * cfg.GRID_SIZE;
  const unplayable = new Array(n).fill(false);
  for (const size of drawGroupSizes(rng, cfg)) {
    let placed = false;
    for (let t = 0; t < cfg.GROUP_PLACEMENT_TRIES && !placed; t++) {
      const group = tryGrowGroup(rng, cfg, unplayable, size, forbidden);
      if (!group) continue;
      for (const c of group) unplayable[c] = true;
      if (playableConnected(unplayable, cfg.GRID_SIZE)) {
        placed = true;
      } else {
        for (const c of group) unplayable[c] = false;
      }
    }
    if (!placed) return null;
  }
  return unplayable;
}

/**
 * Labyrinthe parfait par DFS backtracking sur les salles jouables.
 * Retourne passages[idx] = liste des salles adjacentes reliées, ou null si
 * la contrainte de degré max a laissé une salle inaccessible (rare → retry).
 */
function tryCarveMaze(rng, cfg, unplayable) {
  const n = cfg.GRID_SIZE * cfg.GRID_SIZE;
  const passages = Array.from({ length: n }, () => []);
  const playable = [];
  for (let i = 0; i < n; i++) if (!unplayable[i]) playable.push(i);

  const visited = new Set();
  const start = rng.pick(playable);
  visited.add(start);
  const stack = [start];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    if (passages[cur].length >= cfg.MAZE_MAX_DEGREE) {
      stack.pop();
      continue;
    }
    const candidates = neighborsOf(cur, cfg.GRID_SIZE).filter(
      (c) => !unplayable[c] && !visited.has(c)
    );
    if (!candidates.length) {
      stack.pop();
      continue;
    }
    const next = rng.pick(candidates);
    passages[cur].push(next);
    passages[next].push(cur);
    visited.add(next);
    stack.push(next);
  }
  return visited.size === playable.length ? passages : null;
}

/** Distances (en salles parcourues) depuis `from` le long des passages du labyrinthe. */
function mazeDistances(passages, from, n) {
  const dist = new Array(n).fill(Infinity);
  dist[from] = 0;
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift();
    for (const m of passages[cur]) {
      if (dist[m] === Infinity) {
        dist[m] = dist[cur] + 1;
        queue.push(m);
      }
    }
  }
  return dist;
}

/**
 * Place les salles fixes (§3.3) : accès jaune (imposé par l'étage précédent),
 * accès orange (à ≥ ACCESS_MIN_PATH salles parcourues, §3.1), ville (étages ×5)
 * et les 5 salles pièges. Retourne null si la contrainte de distance échoue.
 */
function tryPlaceFixedRooms(rng, cfg, unplayable, passages, entryCell, withVille) {
  const n = cfg.GRID_SIZE * cfg.GRID_SIZE;
  const playable = [];
  for (let i = 0; i < n; i++) if (!unplayable[i]) playable.push(i);

  const used = new Set();
  const jaune = entryCell;
  if (jaune !== null) used.add(jaune);

  let ville = null;
  if (withVille) {
    ville = rng.pick(playable.filter((c) => !used.has(c)));
    used.add(ville);
  }

  // Référence de distance : l'accès jaune, ou la ville à l'étage 0 (pas de jaune)
  const ref = jaune !== null ? jaune : ville;
  const dist = mazeDistances(passages, ref, n);
  const orangeChoices = playable.filter((c) => !used.has(c) && dist[c] >= cfg.ACCESS_MIN_PATH);
  if (!orangeChoices.length) return null;
  const orange = rng.pick(orangeChoices);
  used.add(orange);

  const pieges = rng
    .shuffle(playable.filter((c) => !used.has(c)))
    .slice(0, cfg.PIEGES_PER_FLOOR);
  return { jaune, orange, ville, pieges };
}

/**
 * Génère un étage complet :
 * { unplayable: bool[100], passages: int[][100], jaune, orange, ville, pieges }.
 * opts.entryCell : case jaune imposée (= position de l'orange de l'étage
 * précédent, §3.6), ou null pour l'étage 0. opts.withVille : étage ×5.
 * Retente tant qu'une contrainte n'est pas satisfaite (le rng avance, donc
 * chaque tentative diffère).
 */
function generateFloor(rng, cfg, opts = {}) {
  const entryCell = opts.entryCell ?? null;
  const withVille = !!opts.withVille;
  const forbidden = new Set(entryCell === null ? [] : [entryCell]);
  for (let attempt = 1; attempt <= cfg.GENERATION_MAX_ATTEMPTS; attempt++) {
    const unplayable = tryPlaceUnplayable(rng, cfg, forbidden);
    if (!unplayable) continue;
    const passages = tryCarveMaze(rng, cfg, unplayable);
    if (!passages) continue;
    const fixed = tryPlaceFixedRooms(rng, cfg, unplayable, passages, entryCell, withVille);
    if (!fixed) continue;
    return { unplayable, passages, ...fixed };
  }
  throw new Error(
    `Échec de génération d'étage après ${cfg.GENERATION_MAX_ATTEMPTS} tentatives (seed: ${rng.seed})`
  );
}

if (typeof module !== 'undefined') {
  module.exports = {
    neighborsOf,
    playableConnected,
    drawGroupSizes,
    tryGrowGroup,
    tryPlaceUnplayable,
    tryCarveMaze,
    mazeDistances,
    tryPlaceFixedRooms,
    generateFloor,
  };
}
