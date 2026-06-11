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
 * Le bloc ne touche jamais un autre bloc (garantit blocs ≤ 5) et aucune de
 * ses cases ne dépasse UNPLAYABLE_MAX_NEIGHBORS voisins injouables.
 * Retourne la liste des cases du bloc, ou null si impossible ici.
 */
function tryGrowGroup(rng, cfg, unplayable, size) {
  const n = cfg.GRID_SIZE * cfg.GRID_SIZE;
  const isolatedFree = (c) =>
    !unplayable[c] && neighborsOf(c, cfg.GRID_SIZE).every((m) => !unplayable[m]);

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
function tryPlaceUnplayable(rng, cfg) {
  const n = cfg.GRID_SIZE * cfg.GRID_SIZE;
  const unplayable = new Array(n).fill(false);
  for (const size of drawGroupSizes(rng, cfg)) {
    let placed = false;
    for (let t = 0; t < cfg.GROUP_PLACEMENT_TRIES && !placed; t++) {
      const group = tryGrowGroup(rng, cfg, unplayable, size);
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

/**
 * Génère un étage complet : { unplayable: bool[100], passages: int[][100] }.
 * Retente tant qu'une contrainte n'est pas satisfaite (le rng avance, donc
 * chaque tentative diffère).
 */
function generateFloor(rng, cfg) {
  for (let attempt = 1; attempt <= cfg.GENERATION_MAX_ATTEMPTS; attempt++) {
    const unplayable = tryPlaceUnplayable(rng, cfg);
    if (!unplayable) continue;
    const passages = tryCarveMaze(rng, cfg, unplayable);
    if (!passages) continue;
    return { unplayable, passages };
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
    generateFloor,
  };
}
