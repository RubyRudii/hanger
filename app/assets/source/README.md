# Icon + Splash source files

Placeholder brand mark for Hanger: gold "H" on deep navy `#050918`, with subtle
gold corner brackets on the main icon.

## Convert SVG → PNG

Easiest path — go to **[svgtopng.com](https://svgtopng.com)** (no signup):

| Source file             | Output PNG                   | Size          |
| ----------------------- | ---------------------------- | ------------- |
| `icon.svg`              | `../icon.png`                | 1024 × 1024   |
| `adaptive-icon.svg`     | `../adaptive-icon.png`       | 1024 × 1024   |
| `splash-icon.svg`       | `../splash-icon.png`         | 1280 × 1280   |
| `favicon.svg`           | `../favicon.png`             | 48 × 48       |
| `notification-icon.svg` | `../notification-icon.png`   | 96 × 96       |

1. Upload the SVG.
2. Set the output width to the size in the table.
3. Download the PNG and **replace** the file in `assets/` (one level up).

## Alternative: Figma

1. Open Figma, `File → Import` the SVG.
2. Select the frame, `Export` (right sidebar) at `1×`.

## After you've replaced the PNGs

Nothing further to do in code — `app.json` already points at
`./assets/icon.png`, `./assets/adaptive-icon.png`, etc.

Splash `backgroundColor` is `#050918` (deep navy), matching the "H" bg.

## When you commission real art later

Just drop replacement PNGs at the same paths. Same names, same sizes.

## Notes for `notification-icon.png` (Android status bar)

Android will:
1. Strip every color from the source and treat it as a monochrome mask.
2. Tint that mask with the `color` set in `app.json` (currently gold
   `#C9A84C`).

So the source must be **pure white on a transparent background** with
**no gradients, no anti-aliased fine detail, no thin strokes**, or the
mask breaks. Keep shapes chunky — the effective status-bar render is
about 24 × 24 px. If you replace this file, follow the same rules or
Android will silently swap in a gray square.
