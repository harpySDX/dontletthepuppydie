# The Study Café

DontLetThePuppyDie opens inside a 3D study café: walnut floors, bookshelves, brass pendant lamps, a marble bar and
a window at dusk. The café is the atmosphere. Nothing in it is interactive: tests, practice and diagnostics are
where the value is, and they sit in translucent panels at the front.

> The café defines the atmosphere; the theme and accent you choose define the interface.

## Structure

```
Top bar: The Study Café · Better every day.   (Visit The Bar on Home; Home · Tests · Game · The Bar · Diagnostics
                                                on inner pages)  ☀ theme · ◯ settings
Home (where the app opens: no start screen, nothing game-like starts on its own)
├── Welcome back · "What would you like to focus on today?" · Small steps. Big results.
├── Subject cards   Precalculus | Physics: % of the course's topics practised (real coverage) · "Next up" →
├── Recommended Practice   the most useful topic from your own answers, with the reason → Start Practice
│                          (no evidence yet → a baseline test, or the Physics diagnostic)
└── Game · Tests · Diagnostics
Tests              subject → difficulty card → preview → Start / Test options
Game               optional play, both off by default: Campfire minigame (opens Test options with it on) · Goose Mode
The Bar            its own page (← Back to the café): topic practice, practice sets, lessons, formula sheet,
                   Study Room / Labs, Find a topic; tabs: The Bar · Skills · Whole course · Study Room (Pre-Calculus)
Diagnostics        Overview (stats, skills/concept mastery, goals, history) · Mistakes & review · Study plan (Pre-Calculus)
```

Home holds only what helps decide what to study. The Bar's contents and the detailed concept list are not on it
(mastery detail lives in Diagnostics), and Home and The Bar are never shown together. Home fits one screen down to
1280×720: shorter windows tighten the cards instead of scrolling.

The primary path from opening the app to a result: **Home → Tests (subject, level) → Start → test → results →
Diagnostics**, or **Home → Start Practice** for the recommended topic. The Bar and Game are secondary and never on
the way to a test.

### The test screen

During a test the top bar, the question, the answer inputs, the navigator and the controls share one centred column.
Its width is a single token (`--test-w`, per layout and with or without the minigame panels); the test grid is capped
at it and the test bar is sized to it, so they line up at every window size and when the navigator or test info opens.

## Difficulty means assessment difficulty

Every difficulty is a marked assessment, answered independently and graded at the end:

| Level | Pre-Calculus 11 | Physics 11 |
|---|---|---|
| Simple | 24 marks, 40 min: foundational families only, generated at Simple (friendlier values, shorter chains) | 6 questions, 30 min: one- and two-step problems at Simple |
| Normal | 34 marks, 60 min, the unit-test layout | 6 questions, 40 min |
| Challenging | 34 marks, harder variants, at most one hint (if allowed) | 6 questions, 50 min, harder families |
| Nightmare | five connected stages, no hints | 4 multi-stage questions, no hints |

Hints are off unless allowed in Test options, in every level. Guided, step-by-step practice (what Simple used to
be) lives in The Bar as the **Guided** button on every topic.

Group-test codes carry Normal, Challenging and Nightmare (the code's level field is two bits and changing it would
break existing codes), so Test options greys out "group test" for Simple.

## The backdrop (`js/cafe/scene.js`)

Settings → Café scene:

- **Photo** (default): a photograph of a sunlit café (`assets/cafe.jpg`, 1536×1024, ~270 KB) under a theme-tinted
  veil, with a soft shade behind the brand and the window side so the top bar reads cleanly. A very slow drift
  (70 s) runs only when reduced motion is off. A painted CSS room shows until the photo loads, and stays if it can't.
- **3D room**: the procedural three.js r149 room (`vendor/three/three.min.js`, MIT): sunlit arched windows, the bar,
  pendant lamps, your table. Loaded only when chosen, after the interface is usable. Reduced motion, Save-Data,
  low-memory devices and software WebGL get a still frame; without WebGL the painted room is used.
- **Plain**: no backdrop, just the theme.

The interface never depends on the backdrop. **During a test it is hidden and nothing is rendered**; the test screen
has the theme's plain background.

## Themes and accent colour

All existing themes are kept (Settings → Theme), plus **Study Café** (espresso and walnut surfaces, parchment text,
brass accent, sage secondary), which is the default for anyone who hasn't picked a theme. Themes still change every
panel, border, button, highlight, progress bar, selected state and the test screen.

- Panels over the room use the theme's own surface at ~80 % opacity with a backdrop blur
  (`--glass: color-mix(in srgb, var(--surface) 80%, transparent)`), so they are tinted by the theme, not by a fixed
  brown.
- A theme-tinted veil (`.cafe-veil`, mixed from `var(--bg)`) sits between the room and the interface: lighter for
  light themes, lighter still for Study Café. Headings and text placed directly on the room keep their contrast.
- **Settings → Accent colour**: *Theme's own*, Brass, Sage, Terracotta, Oxblood, Plum, Teal, Cobalt or Rose. The
  hue is adjusted for the current theme until it reaches 4.6:1 against the theme's surfaces; the text-on-accent
  colour is chosen for contrast. It drives buttons, links, focus rings, progress fills, selected states, tags and
  physics figure paths. It is saved in `campfire-prep.ui.v1` (`accent`, plus the derived tokens so `<head>` applies
  it before the first paint) and recomputed when the theme changes.
- Difficulty colours (Simple blue … Nightmare pink) stay as they are: they identify levels, not the theme.

## Typography

Display headings use **Cormorant Garamond** (an editorial serif); body text, numbers and dense UI stay in **Inter**. Both
come from Google Fonts, with Georgia / system fallbacks.

## Data

No storage key changed. Pre-Calculus and Physics keep separate histories, records and diagnostics. The theme
default only applies when no theme was ever saved; a saved theme is never replaced.

## Tests

- `tests/quad.test.js`: the Simple test is 24 marks, all Simple-level, no Normal-only families.
- `tests/physics.test.js`: Physics Simple tests build at Simple level with no more parts than Normal.
- `tests/e2e/cafe.js`: the café journey for both subjects (opens on Home with games off, photo backdrop, Home without
  Bar contents and without scrolling, Visit The Bar and back, the Game page, test bar and question share one centred
  column at 1100/1536/1920 px, test hides the café, Recommended practice from real data, baseline, The Bar categories
  and search, accent colour contrast across themes, persistence, phone width).
