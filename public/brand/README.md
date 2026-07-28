# ResolveMeQ brand assets

Prefer **SVG** for product UI. Use **PNG** for email, social, app stores, and partners.

## Social profile photos (LinkedIn / X / Facebook)

Use these **square** tiles — gear centered with padding so circular crops look right:

| File | Background | Best for |
|------|------------|----------|
| `png/logo-social-dark.png` | Dark slate | LinkedIn / X (recommended) |
| `png/logo-social-light.png` | White | Light themes |
| `png/logo-social-brand.png` | Cyan brand | Bold / brand fill |
| `png/logo-linkedin-banner.png` | Dark + lockup | LinkedIn cover / wide posts |

Also: `logo-social-*.svg` source files in this folder.

## SVG

See files in this folder (`logo-mark*.svg`, `logo-lockup*.svg`, …).

## PNG

Under [`png/`](./png/):

| Folder | Background | Use when |
|--------|------------|----------|
| `png/transparent/` | Transparent | Overlay on your own bg |
| `png/on-white/` | Solid `#FFFFFF` | Light slides, docs, LinkedIn light |
| `png/on-dark/` | Solid `#0B1220` | Dark slides, dark social, mono-white logos |

Root aliases in `png/` (easy defaults, **solid** so they open visibly):

- `logo-mark.png`, `logo-lockup.png`, `logo-stacked.png`, `logo-wordmark.png` → **on-white**
- `logo-*-on-dark.png`, `logo-*-mono-white.png` → **on-dark**
- `logo-app-icon.png` → app tile (already has dark fill)

Example paths:

- `/brand/png/on-white/logo-lockup-880.png`
- `/brand/png/on-dark/logo-lockup-on-dark-880.png`
- `/brand/png/transparent/logo-mark-512.png`

Regenerate:

```bash
node scripts/generate-brand-logos.mjs
node scripts/export-brand-pngs.mjs
```
