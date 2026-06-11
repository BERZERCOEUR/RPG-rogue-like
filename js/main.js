/**
 * DONJON INFINI — Point d'entrée du jalon M1.
 * Saisie de seed + régénération pour la reproduction de bugs (§0.4).
 */
(function () {
  const boardEl = document.getElementById('board');
  const seedInput = document.getElementById('seed-input');
  const regenBtn = document.getElementById('regen-btn');
  const infoSeed = document.getElementById('info-seed');
  const infoTour = document.getElementById('info-tour');
  const infoExplored = document.getElementById('info-explored');

  let state = null;
  const ui = new BoardUI(boardEl, (idx) => {
    if (state.moveTo(idx)) refresh();
  });

  function refresh() {
    ui.render(state);
    infoSeed.textContent = state.seed;
    infoTour.textContent = state.tour;
    infoExplored.textContent = `${state.explored.size} / ${CONFIG.PLAYABLE_COUNT}`;
  }

  function newFloor(seed) {
    state = new GameState(seed, CONFIG);
    seedInput.value = state.seed;
    ui.build(CONFIG);
    refresh();
  }

  regenBtn.addEventListener('click', () => {
    const seed = seedInput.value.trim() || String(Date.now());
    newFloor(seed);
  });
  seedInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') regenBtn.click();
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
    if (state.moveDir(d[0], d[1])) refresh();
  });

  newFloor(String(Date.now()));
})();
