/**
 * DONJON INFINI — Build d'un fichier HTML autonome (dist/donjon-infini.html).
 * Inline le CSS et les scripts de index.html en un seul fichier, pratique
 * pour tester le jeu sans serveur ni checkout (envoi direct à Marc).
 *
 * Usage : node tools/build-standalone.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

html = html.replace(
  /<link rel="stylesheet" href="([^"]+)" \/>/g,
  (_, href) => `<style>\n${fs.readFileSync(path.join(root, href), 'utf8')}</style>`
);
html = html.replace(
  /<script src="([^"]+)"><\/script>/g,
  (_, src) => `<script>\n${fs.readFileSync(path.join(root, src), 'utf8')}</script>`
);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'donjon-infini.html');
fs.writeFileSync(out, html);
console.log(`Écrit : ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} ko)`);
