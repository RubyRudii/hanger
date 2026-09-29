# Icon + Splash source files

Hanger's logo is the **Runner** concept: a plastic model-kit runner
sprue forming an H. Non-builders read it as a stylized H; builders
see the frame with attachment gates and get the wink. Adopted
2026-09-28 from a set of six concepts explored in a claude.ai design
canvas.

**Source of truth:** `icon.svg` in this folder. Palette:

- Runner grey `#DDE3E8` — background
- Frame + gate marks `#2F3A45`
- Red H `#C62828`
- Highlights `#E35D5D`, shadows `#8E1B1B`, center dot `#7A1515`

The Runner grey is deliberately different from the app's internal dark
palette (`#0F0E0D`). The pattern — light-bg icon, dark-bg product — is
common (Twitter, Notion, Discord) and gives the icon a distinctive
identity on the home screen. `app.json`'s `splash.backgroundColor` and
`android.adaptiveIcon.backgroundColor` are both set to the Runner grey
so the icon → splash transition is seamless.

## Rendering the PNGs

The PNGs in `../` are generated from `icon.svg` by a PowerShell +
System.Drawing script (see the recent commit that shipped the Runner
logo for the exact script — search for `Draw-Runner`). Runs in a few
seconds on any Windows machine with PowerShell and requires no npm
install. Output sizes:

| Output PNG                   | Size          | Notes                                                                |
| ---------------------------- | ------------- | -------------------------------------------------------------------- |
| `../icon.png`                | 1024 × 1024   | iOS app icon — full runner design on grey bg                         |
| `../adaptive-icon.png`       | 1024 × 1024   | Android foreground — transparent, H inside center 66% safe zone      |
| `../splash-icon.png`         | 1280 × 1280   | Splash — transparent, runner + Bebas Neue wordmark centered          |
| `../favicon.png`             |   48 × 48     | Web favicon — simplified to just the red H (attachment marks vanish) |
| `../store/feature-graphic.png` | 1024 × 500  | Play Store card — runner in grey chip + Bebas Neue HANGER + tagline  |

## Notes for `notification-icon.png` (Android status bar)

Android will:
1. Strip every color from the source and treat it as a monochrome mask.
2. Tint that mask with the `color` set in `app.json` (currently red
   `#EF3B3B`).

So the source must be **pure white on a transparent background** with
**no gradients, no anti-aliased fine detail, no thin strokes**, or the
mask breaks. Keep shapes chunky — the effective status-bar render is
about 24 × 24 px. If you replace this file, follow the same rules or
Android will silently swap in a gray square.

## When you commission real art later

Drop replacement PNGs at the same paths, or replace `icon.svg` and
rerun the render script. Same names, same sizes.
