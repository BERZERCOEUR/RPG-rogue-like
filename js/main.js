/**
 * DONJON INFINI — Point d'entrée (jalons M1–M3).
 * Saisie de seed + régénération pour la reproduction de bugs (§0.4).
 * Panneau debug (outil de validation, hors design) : types de salles,
 * pool de l'étage, avance rapide du temps pour observer le respawn.
 */
(function () {
  const boardEl = document.getElementById('board');
  const combatEl = document.getElementById('combat');
  const seedInput = document.getElementById('seed-input');
  const regenBtn = document.getElementById('regen-btn');
  const infoEtage = document.getElementById('info-etage');
  const infoTour = document.getElementById('info-tour');
  const infoExplored = document.getElementById('info-explored');
  const infoAdv = document.getElementById('info-adv');
  const utiliserBtn = document.getElementById('utiliser-btn');
  const debugToggle = document.getElementById('debug-toggle');
  const debugPanel = document.getElementById('debug-panel');
  const debugPool = document.getElementById('debug-pool');
  const skipBtn = document.getElementById('skip-btn');
  const gameoverEl = document.getElementById('gameover');

  let game = null;
  let inCombat = false;

  const ui = new BoardUI(boardEl, (idx) => {
    if (!inCombat && game.moveTo(idx)) afterMove();
  });

  const UTILISER_LABELS = { monter: 'Monter', descendre: 'Descendre', entrer: 'Entrer' };

  function refresh() {
    ui.render(game);
    const floor = game.current();
    infoEtage.textContent = game.etage;
    infoTour.textContent = game.tour;
    infoExplored.textContent = `${floor.exploredCount()} / ${CONFIG.PLAYABLE_COUNT}`;

    const a = game.aventurier;
    infoAdv.textContent = `${a.raceLabel} · PV ${a.pv}/${a.pvMax} · M ${a.mana}/${a.manaMax} · E ${a.end}/${a.endMax}`;

    const ctx = game.utiliserContext();
    utiliserBtn.textContent = ctx ? UTILISER_LABELS[ctx] : 'Utiliser';
    utiliserBtn.disabled = inCombat || game.over || !ctx || ctx === 'entrer';
    utiliserBtn.title = ctx === 'entrer' ? 'Ville — jalon M5' : '';

    gameoverEl.style.display = game.over ? 'block' : 'none';

    debugPanel.style.display = ui.debug ? 'flex' : 'none';
    if (ui.debug) {
      const p = floor.pool;
      debugPool.textContent = `Pool étage ${game.etage} — M:${p.monstre} V:${p.vide} T:${p.tresor}`;
    }
  }

  /**
   * Après chaque déplacement : une salle monstre affiche pour l'instant le
   * décor 1ère personne seul (les personnages et l'interface de combat
   * seront réintégrés par-dessus plus tard — décision Marc, juillet 2026).
   * TEMPORAIRE : cliquer le décor referme la salle et la marque vaincue.
   */
  function afterMove() {
    refresh();
    if (game.combatPending()) {
      inCombat = true;
      boardEl.style.display = 'none';
      combatEl.innerHTML = svgDungeonRoom(`${game.seed}/etage/${game.etage}/salle/${game.pos}`);
      combatEl.style.display = 'block';
    }
  }

  combatEl.addEventListener('click', () => {
    if (!inCombat) return;
    game.winCombat();
    inCombat = false;
    combatEl.style.display = 'none';
    boardEl.style.display = '';
    refresh();
  });

  function newGame(seed) {
    game = new Game(seed, CONFIG);
    seedInput.value = game.seed;
    ui.build(CONFIG);
    refresh();
  }

  regenBtn.addEventListener('click', () => {
    if (inCombat) return;
    newGame(seedInput.value.trim() || String(Date.now()));
  });
  seedInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') regenBtn.click();
  });

  utiliserBtn.addEventListener('click', () => {
    if (!inCombat && game.utiliser()) afterMove();
  });

  debugToggle.addEventListener('change', () => {
    ui.debug = debugToggle.checked;
    refresh();
  });

  skipBtn.addEventListener('click', () => {
    if (inCombat) return;
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
    if (!d || inCombat || document.activeElement === seedInput) return;
    e.preventDefault();
    if (game.moveDir(d[0], d[1])) afterMove();
  });

  newGame(String(Date.now()));

  // Accès pour les tests automatisés (vérifications headless)
  window.__game = () => game;
  window.__refresh = refresh;
  window.__inCombat = () => inCombat;
  window.__combatUI = () => combatUI;
})();
