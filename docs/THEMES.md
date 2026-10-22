# Themes

Settings → Theme offers twelve themes. Each is a complete set of colour tokens, so every screen — Math and Physics,
all four layouts, the island, dialogs, the calculator, the scratchpad, graphs and the physics simulations — follows
the choice. Switching is live, saved on this device (`campfire-prep.ui.v1` → `theme`), and applied in `<head>`
before the first paint, so there is no flash on reload.

| Theme | Tone | Character |
|---|---|---|
| Light Glass | light | the original: bright frosted glass on cool blue |
| Dark Glass | dark | the original dark: deep navy glass |
| System | follows the OS | Light Glass by day, Dark Glass at night; follows live OS changes |
| Cinnamon | light | warm cream and spice browns |
| Blush | light | soft pinks with a raspberry accent |
| Galaxy | dark | space purple with nebula glows and a static star field |
| Arctic | light | icy whites and glacier blues |
| Beach | light | sand, sea-glass teal and coral |
| Halloween | dark | night purple with pumpkin orange (seasonal) |
| Christmas | dark | pine green with gold and cranberry (seasonal) |
| Graphite | dark | quiet neutral greys |
| Lime | light | fresh greens |

Seasonal themes are ordinary choices: **nothing switches theme by date**, and a seasonal theme never overrides
what you picked.

## How it works

- Light Glass, Dark Glass and System are defined in `css/glass.css` (unchanged apart from small contrast fixes:
  the light accent and both faint-text colours were darkened/lightened to meet WCAG AA).
- The nine new themes are generated: `tools/themes.js` holds one short palette per theme (background, surface,
  text, muted text, accent + text-on-accent, a secondary hue, the primary-action colour, good/mid/bad) and derives
  the full token set — surfaces, glass, borders, text levels, accent states, feedback colours and their
  text-on-colour, paper (question sheet, calculator display, scratchpad), graph colours, physics figure colours
  (`--fig-*`), shadows and rims. `node tools/themes.js` writes `css/themes.css` and prints a contrast report.
- `html[data-tone="light|dark"]` is set alongside `data-theme`, so the few tone-specific rules (dialog backdrop,
  island button, tour dimmer) follow every theme, including System.
- The theme picker previews each theme with its own palette (`--pv-*` per card): a mini page, a card with text and
  a button, and four swatches (accent, secondary, primary action, surface).
- The scratchpad's pencil is drawn in the theme's paper ink and redraws on theme change, so pencil notes stay
  readable on dark paper.

## Adding a theme

1. Add a palette to `THEMES` in `tools/themes.js` and run `node tools/themes.js`.
2. Add its id to `THEMES` and `THEME_TONE` in `js/app.js` and to the tone map in the `<head>` script of
   `index.html` (the unit test checks all three agree).
3. Add `theme.<id>` and `theme.<id>.d` in five languages to `js/i18n.js`.
4. Run `node --test tests/themes.test.js` (contrast) and `node tests/e2e/themes.js` (screens).

## Tests

- `tests/themes.test.js`: twelve themes; every generated theme defines every token Light Glass defines; WCAG
  contrast for body text (7:1), muted and faint text, links, button text, feedback text, text on success/error fills,
  graph axes and figure paths (4.5:1 for text, 3:1 for graphics); generated CSS is up to date; the app, the
  `<head>` script and the generator agree; names and descriptions in five languages; no date-based switching.
- `tests/e2e/themes.js` (55 checks): picker contents and previews; each theme applies live and is saved; reload
  and browser restart; unknown values fall back; System follows the OS live; no seasonal switch on Oct 31 / Dec 25;
  every theme across Home, Settings, Library, Practice, a Math test with the calculator open, Physics home, a Physics
  question and the Physics lab — rotating through all four layouts — with **measured** text contrast (every visible
  text node against the colour behind it) and no horizontal overflow; physics simulations use theme colours;
  phone-width picker; no animations started under reduced motion.

## Known limitations

- Difficulty colours (Simple blue, Normal blue, Challenging violet, Nightmare pink) and the campfire/puppy/goose
  illustrations keep their own colours in every theme — they identify levels and characters, not the theme.
- Text over gradients is not included in the automated contrast measurement (it can't be measured reliably);
  those spots were checked by eye in screenshots.
- Scratchpad blue and red pens keep fixed colours (they are the ink you chose).
