/**
 * RNG seedable (§0.4) — xmur3 (hash de seed) + mulberry32 (générateur).
 * Toute génération aléatoire du jeu passe par une instance de RNG,
 * pour reproduire les bugs et lancer des simulations de balance.
 */
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class RNG {
  constructor(seed) {
    this.seed = String(seed);
    this._next = mulberry32(xmur3(this.seed)());
  }

  /** Flottant uniforme dans [0, 1). */
  next() {
    return this._next();
  }

  /** Entier uniforme dans [min, max] inclus. */
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Élément aléatoire d'un tableau non vide. */
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Mélange Fisher-Yates en place, retourne le tableau. */
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

if (typeof module !== 'undefined') module.exports = { RNG };
