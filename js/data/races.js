/**
 * DONJON INFINI — Données des races d'aventuriers (§6).
 * Les 17 statistiques (§5.1). Les stats absentes des fourchettes d'une race
 * restent à 0 à la création (§6.1).
 * Conversions : PV = pool + CON×5 | Mana = pool + MANA×3 | END = pool + END×3.
 */
const STAT_KEYS = [
  'force', 'dexterite', 'intelligence', 'sagesse', 'vitesse', 'esquive',
  'precPhys', 'precMag', 'precCritPhys', 'precCritMag',
  'resPhys', 'resMag', 'resCritPhys', 'resCritMag',
  'constitution', 'endurance', 'mana',
];

const STAT_LABELS = {
  force: 'Force', dexterite: 'Dextérité', intelligence: 'Intelligence',
  sagesse: 'Sagesse', vitesse: 'Vitesse', esquive: 'Esquive',
  precPhys: 'Préc. physique', precMag: 'Préc. magique',
  precCritPhys: 'Préc. crit. phys.', precCritMag: 'Préc. crit. mag.',
  resPhys: 'Rés. physique', resMag: 'Rés. magique',
  resCritPhys: 'Rés. crit. phys.', resCritMag: 'Rés. crit. mag.',
  constitution: 'Constitution', endurance: 'Endurance', mana: 'Mana',
};

const RACES = {
  humain: {
    label: 'Humain',
    pools: { pv: 50, mana: 20, endurance: 20 },
    ranges: {
      force: [4, 9], dexterite: [4, 9], intelligence: [4, 9], sagesse: [4, 9],
      vitesse: [4, 9], esquive: [4, 8], precPhys: [4, 8], precMag: [4, 8],
      precCritPhys: [4, 8], precCritMag: [4, 8], resPhys: [4, 8], resMag: [4, 8],
      resCritPhys: [3, 6], resCritMag: [3, 6],
      constitution: [4, 8], endurance: [4, 8], mana: [4, 8],
    },
  },
  orc: {
    label: 'Orc',
    pools: { pv: 60, mana: 10, endurance: 30 },
    ranges: {
      force: [12, 22], dexterite: [8, 15], vitesse: [6, 12],
      precPhys: [10, 18], precCritPhys: [8, 15],
      resPhys: [10, 18], resCritPhys: [8, 15],
      constitution: [12, 20], endurance: [10, 18],
    },
  },
  elfe: {
    label: 'Elfe',
    pools: { pv: 40, mana: 20, endurance: 25 },
    ranges: {
      dexterite: [12, 20], vitesse: [14, 22], esquive: [14, 22],
      precPhys: [10, 16], precMag: [8, 14],
      precCritPhys: [10, 16], precCritMag: [8, 14],
      endurance: [8, 12], mana: [8, 12],
    },
  },
  fee: {
    label: 'Fée',
    pools: { pv: 30, mana: 35, endurance: 15 },
    ranges: {
      intelligence: [14, 22], sagesse: [12, 20], vitesse: [8, 14],
      esquive: [8, 14], precMag: [12, 18], precCritMag: [10, 16],
      resMag: [8, 14], resCritMag: [6, 12], mana: [12, 18],
    },
  },
};

if (typeof module !== 'undefined') module.exports = { STAT_KEYS, STAT_LABELS, RACES };
