/**
 * DONJON INFINI — Simulateur de combats headless (§0.5, jalon M3).
 * Simule N combats sans UI et sort des statistiques de balance :
 * taux de victoire, nombre d'activations, coups portés/esquivés, critiques,
 * PV restants. RNG seedable pour reproduire une campagne de simulation.
 *
 * Usage :
 *   node tools/simulate-combat.js [options]
 * Options (clé=valeur) :
 *   combats=1000     nombre de combats simulés
 *   etage=1          étage des monstres (scaling §7.4)
 *   race=aleatoire   humain | orc | elfe | fee | aleatoire
 *   aventuriers=1    taille du groupe d'aventuriers (1–4)
 *   monstres=auto    nombre de monstres forcé (1–4), sinon tirage §7.6
 *   seed=sim         seed de la campagne
 *
 * Exemples :
 *   node tools/simulate-combat.js combats=2000 etage=1 race=orc
 *   node tools/simulate-combat.js etage=10 aventuriers=4 monstres=4
 */
const { CONFIG } = require('../js/config.js');
const { RNG } = require('../js/rng.js');
const races = require('../js/data/races.js');
const formulas = require('../js/formulas.js');

// Modules navigateur (globals) : on expose leurs dépendances.
Object.assign(global, races, formulas, { RNG });
const { createAdventurer } = require('../js/adventurer.js');
const monsters = require('../js/monsters.js');
Object.assign(global, monsters);
const { CombatEngine } = require('../js/combat.js');

const args = {};
for (const a of process.argv.slice(2)) {
  const [k, v] = a.split('=');
  args[k] = v;
}
const N_COMBATS = parseInt(args.combats || '1000', 10);
const ETAGE = parseInt(args.etage || '1', 10);
const RACE = args.race && args.race !== 'aleatoire' ? args.race : null;
const N_ADV = Math.min(4, Math.max(1, parseInt(args.aventuriers || '1', 10)));
const N_MONSTRES = args.monstres && args.monstres !== 'auto' ? parseInt(args.monstres, 10) : null;
const SEED = args.seed || 'sim';

if (RACE && !races.RACES[RACE]) {
  console.error(`Race inconnue : ${RACE} (humain | orc | elfe | fee)`);
  process.exit(1);
}

function forcedGroup(rng, cfg, etage, count) {
  // Même scaling que generateMonsterGroup, mais avec un effectif imposé
  const mod = cfg.GROUP_STAT_MOD[count];
  const mult = formulas.floorMultiplier(etage, cfg);
  const rarity = cfg.MONSTER_RARITIES.commun;
  const totalPoints = Math.max(1, Math.round(rarity.points * mult * mod));
  const pvPool = Math.round(rarity.pvPool * mult * mod);
  const C = cfg.COMBAT;
  return Array.from({ length: count }, (_, i) => {
    const stats = monsters.rollMonsterStats(rng, cfg, totalPoints);
    const pvMax = pvPool + stats.constitution * C.PV_PER_CON;
    return {
      name: `Bête ${i + 1}`, side: 'monstres', famille: 'Bête',
      rarete: rarity.label, etage, stats, pvMax, pv: pvMax,
      manaMax: 0, mana: 0, endMax: 0, end: 0,
    };
  });
}

const agg = {
  victoires: 0,
  activations: 0,
  activationsVictoire: 0,
  attaques: { joueur: { total: 0, touche: 0, crit: 0, degats: 0 }, monstre: { total: 0, touche: 0, crit: 0, degats: 0 } },
  pvRestantsPct: 0,
  monstresParCombat: 0,
};

const t0 = Date.now();
for (let c = 0; c < N_COMBATS; c++) {
  const rng = new RNG(`${SEED}/combat/${c}`);
  const aventuriers = Array.from({ length: N_ADV }, (_, i) => {
    const a = createAdventurer(new RNG(`${SEED}/adv/${c}/${i}`), CONFIG, RACE);
    a.name = `Aventurier ${i + 1}`;
    return a;
  });
  const monstres = N_MONSTRES
    ? forcedGroup(rng, CONFIG, ETAGE, N_MONSTRES)
    : monsters.generateMonsterGroup(rng, CONFIG, ETAGE);
  agg.monstresParCombat += monstres.length;

  const engine = new CombatEngine(aventuriers, monstres, rng, CONFIG);
  let activations = 0;
  while (!engine.result() && activations < 5000) {
    const actor = engine.nextActor();
    const side = actor.side === 'monstres' ? 'monstre' : 'joueur';
    const targets = engine.living(side === 'monstre' ? engine.aventuriers : engine.monstres);
    const target = side === 'monstre' && targets.length > 1 ? rng.pick(targets) : targets[0];
    const ev = engine.basicAttack(actor, target);
    const s = agg.attaques[side];
    s.total++;
    if (ev.touche) {
      s.touche++;
      s.degats += ev.degats;
      if (ev.crit) s.crit++;
    }
    engine.endTurn(actor);
    activations++;
  }
  agg.activations += activations;
  if (engine.result() === 'victoire') {
    agg.victoires++;
    agg.activationsVictoire += activations;
    const pv = aventuriers.reduce((s, a) => s + a.pv, 0);
    const pvMax = aventuriers.reduce((s, a) => s + a.pvMax, 0);
    agg.pvRestantsPct += (pv / pvMax) * 100;
  }
}
const ms = Date.now() - t0;

const pct = (x, d = 1) => x.toFixed(d);
const v = agg.victoires;
console.log(`\n=== Simulation : ${N_COMBATS} combats — étage ${ETAGE} ===`);
console.log(
  `Groupe : ${N_ADV} aventurier(s) ${RACE || '(race aléatoire)'} vs ` +
    `${N_MONSTRES || `~${pct(agg.monstresParCombat / N_COMBATS, 2)} (§7.6)`} monstre(s) Commun Offensif Physique`
);
console.log(`Seed : ${SEED} — ${ms} ms (${pct(ms / N_COMBATS, 2)} ms/combat)\n`);
console.log(`Taux de victoire        : ${pct((v / N_COMBATS) * 100)}%`);
console.log(`Activations / combat    : ${pct(agg.activations / N_COMBATS)}`);
if (v) {
  console.log(`Activations / victoire  : ${pct(agg.activationsVictoire / v)}`);
  console.log(`PV restants (victoires) : ${pct(agg.pvRestantsPct / v)}%`);
}
for (const [side, s] of Object.entries(agg.attaques)) {
  if (!s.total) continue;
  console.log(
    `Attaques ${side === 'joueur' ? 'aventuriers' : 'monstres   '} : ` +
      `${s.total} — touche ${pct((s.touche / s.total) * 100)}% · ` +
      `crit ${pct(s.touche ? (s.crit / s.touche) * 100 : 0)}% · ` +
      `dégâts moyens ${pct(s.touche ? s.degats / s.touche : 0)}`
  );
}
