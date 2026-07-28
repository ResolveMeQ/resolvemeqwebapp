#!/usr/bin/env node
/**
 * Rasterize brand SVGs → PNG (transparent + solid white/dark plates).
 * Run: node scripts/export-brand-pngs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRAND = path.join(__dirname, '../public/brand');
const OUT = path.join(BRAND, 'png');
const FONT_DIRS = ['/usr/share/fonts/truetype/dejavu', '/usr/share/fonts/truetype', '/usr/share/fonts'];

const SIZES = {
  mark: [64, 128, 256, 512],
  lockup: [440, 880, 1320],
  stacked: [320, 640, 960],
  wordmark: [400, 800],
  'app-icon': [64, 128, 256, 512, 1024],
  social: [400, 800],
  'linkedin-profile': [400, 800],
  'linkedin-banner': [1200],
};

const PLATES = {
  transparent: 'rgba(0,0,0,0)',
  'on-white': '#FFFFFF',
  'on-dark': '#0B1220',
};

function kindFor(name) {
  if (name.startsWith('logo-social-')) return 'social';
  if (name.startsWith('logo-linkedin-profile')) return 'linkedin-profile';
  if (name.startsWith('logo-linkedin-banner')) return 'linkedin-banner';
  if (name.startsWith('logo-app-icon')) return 'app-icon';
  if (name.startsWith('logo-mark')) return 'mark';
  if (name.startsWith('logo-lockup')) return 'lockup';
  if (name.startsWith('logo-stacked')) return 'stacked';
  if (name.startsWith('logo-wordmark')) return 'wordmark';
  return null;
}

function renderPng(svgBuffer, width, background) {
  const resvg = new Resvg(svgBuffer, {
    fitTo: { mode: 'width', value: width },
    background,
    font: {
      fontFiles: ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'],
      fontDirs: FONT_DIRS,
      defaultFontFamily: 'DejaVu Sans',
      loadSystemFonts: true,
    },
  });
  return resvg.render().asPng();
}

for (const plate of Object.keys(PLATES)) {
  fs.mkdirSync(path.join(OUT, plate), { recursive: true });
}

const svgs = fs.readdirSync(BRAND).filter((f) => f.endsWith('.svg'));
let count = 0;

for (const file of svgs) {
  const kind = kindFor(file);
  if (!kind) continue;
  const widths = SIZES[kind];
  const svg = fs.readFileSync(path.join(BRAND, file));
  const base = file.replace(/\.svg$/, '');

  for (const width of widths) {
    for (const [plate, bg] of Object.entries(PLATES)) {
      if (
        (kind === 'app-icon' ||
          kind === 'social' ||
          kind === 'linkedin-profile' ||
          kind === 'linkedin-banner') &&
        plate !== 'transparent'
      ) {
        continue;
      }

      const png = renderPng(svg, width, bg);
      fs.writeFileSync(path.join(OUT, plate, `${base}-${width}.png`), png);
      count += 1;
    }
    console.log('wrote', base, width);
  }
}

const aliases = [
  ['on-white', 'logo-mark-512.png', 'logo-mark.png'],
  ['on-white', 'logo-lockup-880.png', 'logo-lockup.png'],
  ['on-white', 'logo-stacked-640.png', 'logo-stacked.png'],
  ['on-white', 'logo-wordmark-800.png', 'logo-wordmark.png'],
  ['on-white', 'logo-mark-mono-black-512.png', 'logo-mark-mono-black.png'],
  ['on-white', 'logo-lockup-mono-black-880.png', 'logo-lockup-mono-black.png'],
  ['on-white', 'logo-wordmark-mono-black-800.png', 'logo-wordmark-mono-black.png'],
  ['on-dark', 'logo-mark-on-dark-512.png', 'logo-mark-on-dark.png'],
  ['on-dark', 'logo-lockup-on-dark-880.png', 'logo-lockup-on-dark.png'],
  ['on-dark', 'logo-stacked-on-dark-640.png', 'logo-stacked-on-dark.png'],
  ['on-dark', 'logo-wordmark-on-dark-800.png', 'logo-wordmark-on-dark.png'],
  ['on-dark', 'logo-mark-mono-white-512.png', 'logo-mark-mono-white.png'],
  ['on-dark', 'logo-lockup-mono-white-880.png', 'logo-lockup-mono-white.png'],
  ['on-dark', 'logo-wordmark-mono-white-800.png', 'logo-wordmark-mono-white.png'],
  ['transparent', 'logo-app-icon-512.png', 'logo-app-icon.png'],
  ['transparent', 'logo-app-icon-1024.png', 'logo-app-icon-1024.png'],
  ['transparent', 'logo-social-dark-800.png', 'logo-social-dark.png'],
  ['transparent', 'logo-social-light-800.png', 'logo-social-light.png'],
  ['transparent', 'logo-social-brand-800.png', 'logo-social-brand.png'],
  ['transparent', 'logo-linkedin-profile-800.png', 'logo-linkedin-profile.png'],
  ['transparent', 'logo-linkedin-banner-1200.png', 'logo-linkedin-banner.png'],
];

for (const [plate, src, dest] of aliases) {
  const from = path.join(OUT, plate, src);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, path.join(OUT, dest));
    console.log('alias', dest);
  }
}

console.log(`done: ${count} PNGs → ${OUT}`);
