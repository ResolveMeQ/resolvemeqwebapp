#!/usr/bin/env node
/**
 * ResolveMeQ logo system (gear mark + lockups + social profile tiles).
 * Run: node scripts/generate-brand-logos.mjs && node scripts/export-brand-pngs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../public/brand');

const FONT =
  'DejaVu Sans, Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif';

const P = {
  color: {
    gear: '#2563EB',
    hub: '#0B1220',
    core: '#60A5FA',
    rail: '#60A5FA',
    word: '#0F172A',
  },
  onDark: {
    gear: '#60A5FA',
    hub: '#0B1220',
    core: '#93C5FD',
    rail: '#93C5FD',
    word: '#F8FAFC',
  },
  monoBlack: {
    gear: '#0F172A',
    hub: '#FFFFFF',
    core: '#0F172A',
    rail: '#0F172A',
    word: '#0F172A',
  },
  monoWhite: {
    gear: '#FFFFFF',
    hub: '#0B1220',
    core: '#FFFFFF',
    rail: '#FFFFFF',
    word: '#FFFFFF',
  },
};

/** Original split-gear mark (64×64) */
function gearMark(c) {
  return `
  <defs>
    <clipPath id="split">
      <rect width="64" height="27"/>
      <rect y="37" width="64" height="27"/>
    </clipPath>
  </defs>
  <g clip-path="url(#split)" fill="${c.gear}">
    <rect x="27" y="3" width="10" height="58" rx="2.5"/>
    <rect x="27" y="3" width="10" height="58" rx="2.5" transform="rotate(45 32 32)"/>
    <rect x="27" y="3" width="10" height="58" rx="2.5" transform="rotate(90 32 32)"/>
    <rect x="27" y="3" width="10" height="58" rx="2.5" transform="rotate(135 32 32)"/>
    <circle cx="32" cy="32" r="18"/>
  </g>
  <circle cx="32" cy="32" r="9.5" fill="${c.hub}"/>
  <circle cx="32" cy="32" r="4.5" fill="${c.core}"/>
  <rect x="6" y="28.5" width="52" height="2" rx="1" fill="${c.rail}"/>
  <rect x="6" y="33.5" width="52" height="2" rx="1" fill="${c.rail}"/>
`.trim();
}

function wordmark(c, { x = 76, y = 40, size = 26, anchor = null } = {}) {
  const a = anchor ? ` text-anchor="${anchor}"` : '';
  return `<text x="${x}" y="${y}"${a}
    fill="${c.word}"
    font-family="${FONT}"
    font-size="${size}"
    font-weight="700"
    letter-spacing="-0.035em">ResolveMeQ</text>`;
}

function svg(vb, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none" role="img" aria-label="ResolveMeQ">
${body}
</svg>
`;
}

function write(name, content) {
  fs.writeFileSync(path.join(OUT, name), content);
  console.log('wrote', name);
}

fs.mkdirSync(OUT, { recursive: true });

// --- Core mark / lockups / stacked / wordmark ---
for (const [key, file] of [
  ['color', 'logo-mark.svg'],
  ['onDark', 'logo-mark-on-dark.svg'],
  ['monoBlack', 'logo-mark-mono-black.svg'],
  ['monoWhite', 'logo-mark-mono-white.svg'],
]) {
  write(file, svg('0 0 64 64', gearMark(P[key])));
}

for (const [key, file] of [
  ['color', 'logo-lockup.svg'],
  ['onDark', 'logo-lockup-on-dark.svg'],
  ['monoBlack', 'logo-lockup-mono-black.svg'],
  ['monoWhite', 'logo-lockup-mono-white.svg'],
]) {
  const c = P[key];
  write(file, svg('0 0 248 64', `  ${gearMark(c)}\n  ${wordmark(c)}`));
}

for (const [key, file] of [
  ['color', 'logo-stacked.svg'],
  ['onDark', 'logo-stacked-on-dark.svg'],
  ['monoBlack', 'logo-stacked-mono-black.svg'],
  ['monoWhite', 'logo-stacked-mono-white.svg'],
]) {
  const c = P[key];
  write(
    file,
    svg(
      '0 0 180 120',
      `  <g transform="translate(58 4)">${gearMark(c)}</g>\n  ${wordmark(c, { x: 90, y: 102, size: 22, anchor: 'middle' })}`
    )
  );
}

for (const [key, file] of [
  ['color', 'logo-wordmark.svg'],
  ['onDark', 'logo-wordmark-on-dark.svg'],
  ['monoBlack', 'logo-wordmark-mono-black.svg'],
  ['monoWhite', 'logo-wordmark-mono-white.svg'],
]) {
  write(file, svg('0 0 190 36', `  ${wordmark(P[key], { x: 0, y: 27, size: 28 })}`));
}

// App icon = gear only (transparent outside)
write('logo-app-icon.svg', svg('0 0 64 64', gearMark(P.color)));

/**
 * Social profile tiles — square, solid plate, gear centered with ~18% padding
 * so LinkedIn/X/Facebook circular crops still look balanced.
 */
function socialProfile({ bg, gearTone, name }) {
  // 400×400 canvas; gear drawn in 64 space scaled to 260px (~65% of canvas)
  const scale = 260 / 64;
  const offset = (400 - 260) / 2;
  write(
    name,
    svg(
      '0 0 400 400',
      `  <rect width="400" height="400" fill="${bg}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
${gearMark(P[gearTone])}
  </g>`
    )
  );
}

socialProfile({ bg: '#0B1220', gearTone: 'onDark', name: 'logo-social-dark.svg' });
socialProfile({ bg: '#FFFFFF', gearTone: 'color', name: 'logo-social-light.svg' });
socialProfile({ bg: '#2563EB', gearTone: 'monoWhite', name: 'logo-social-brand.svg' });

// LinkedIn aliases (same as social-dark / wide banner lockup)
write(
  'logo-linkedin-profile.svg',
  fs.readFileSync(path.join(OUT, 'logo-social-dark.svg'), 'utf8')
);

write(
  'logo-linkedin-banner.svg',
  svg(
    '0 0 1200 300',
    `  <rect width="1200" height="300" fill="#0B1220"/>
  <g transform="translate(300 54) scale(3)">
${gearMark(P.onDark)}
  </g>
  ${wordmark(P.onDark, { x: 540, y: 168, size: 72 })}`
  )
);

fs.copyFileSync(path.join(OUT, 'logo-app-icon.svg'), path.join(__dirname, '../public/favicon.svg'));
console.log('wrote ../favicon.svg');
console.log('done — use logo-social-*.svg/png for LinkedIn/X profile photos');
