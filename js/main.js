/**
 * DONJON INFINI — Point d'entrée (jalons M1–M2).
 * Saisie de seed + régénération pour la reproduction de bugs (§0.4).
 * Panneau debug (outil de validation, hors design) : types de salles,
 * pool de l'étage, avance rapide du temps pour observer le respawn.
 */
(function () {
  const boardEl = document.getElementById('board');
  const seedInput = document.getElementById('seed-input');
  const regenBtn = document.getElementById('regen-btn');
  const infoEtage = document.getElementById('info-etage');
  const infoTour = document.getElementById('info-tour');
  const infoExplored = document.getElementById('info-explored');
  const utiliserBtn = document.getElementById('utiliser-btn');
  const debugToggle = document.getElementById('debug-toggle');
  const debugPanel = document.getElementById('debug-panel');
  const debugPool = document.getElementById('debug-pool');
  const skipBtn = document.getElementById('skip-btn');

  let game = null;
  const ui = new BoardUI(boardEl, (idx) => {
    if (game.moveTo(idx)) refresh();
  });

  // Bouton « Utiliser » contextuel (§13.3)
  const UTILISER_LABELS = { monter: 'Monter', descendre: 'Descendre', entrer: 'Entrer' };

  function refresh() {
    ui.render(game);
    const floor = game.current();
    infoEtage.textContent = game.etage;
    infoTour.textContent = game.tour;
    infoExplored.textContent = `${floor.exploredCount()} / ${CONFIG.PLAYABLE_COUNT}`;

    const ctx = game.utiliserContext();
    utiliserBtn.textContent = ctx ? UTILISER_LABELS[ctx] : 'Utiliser';
    // « Entrer » (intérieur de la ville) arrive au jalon M5
    utiliserBtn.disabled = !ctx || ctx === 'entrer';
    utiliserBtn.title = ctx === 'entrer' ? 'Ville — jalon M5' : '';

    debugPanel.style.display = ui.debug ? 'flex' : 'none';
    if (ui.debug) {
      const p = floor.pool;
      debugPool.textContent = `Pool étage ${game.etage} — M:${p.monstre} V:${p.vide} T:${p.tresor}`;
    }
  }

  function newGame(seed) {
    game = new Game(seed, CONFIG);
    seedInput.value = game.seed;
    ui.build(CONFIG);
    refresh();
  }

  regenBtn.addEventListener('click', () => {
    newGame(seedInput.value.trim() || String(Date.now()));
  });
  seedInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') regenBtn.click();
  });

  utiliserBtn.addEventListener('click', () => {
    if (game.utiliser()) refresh();
  });

  debugToggle.addEventListener('change', () => {
    ui.debug = debugToggle.checked;
    refresh();
  });

  skipBtn.addEventListener('click', () => {
    game.advanceTours(50);
    refresh();
  });

  document.addEventListener('keydown', (e) => {
    const dirs = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const d = dirs[e.key];
    if (!d || document.activeElement === seedInput) return;
    e.preventDefault();
    if (game.moveDir(d[0], d[1])) refresh();
  });

  newGame(String(Date.now()));

  // Accès pour les tests automatisés (vérifications headless)
  window.__game = () => game;
  window.__refresh = refresh;
})();
