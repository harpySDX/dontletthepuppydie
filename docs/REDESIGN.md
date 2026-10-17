# DontLetThePuppyDie — redesign and quadratics expansion

> Later work builds on this: the curriculum-wide question engine ([ENGINE.md](ENGINE.md)), onboarding ([ONBOARDING.md](ONBOARDING.md)) and the Studio+ layout ([STUDIO_PLUS.md](STUDIO_PLUS.md)). Counts below describe the redesign at the time.

This document covers the redesign brief: the liquid-glass interface, the move from radicals to quadratic functions and graphing, the tools, and what is still incomplete. Earlier architecture notes are in `LEARNING_PLATFORM.md` and `V8_REDESIGN.md`.

## What changed

### Name and subject
- The app is **DontLetThePuppyDie** (the earlier "Campfire Prep" name is gone from the interface; storage keys keep the `campfire-prep.` prefix so nobody's data moves).
- The class has moved on to **quadratic functions**. Tests, Home, Practice drills and study rooms now use quadratics questions. Radicals, exponents, number systems and factoring stay in the Concept Library, reviews and the Mistake Notebook.
- **Tim's Test is retired as a mode.** His questions still back the radicals library quizzes and old history, with his credit kept.
- **Nightmare is one mode** (no tiers), roughly as hard as the old tier III: a five-stage gauntlet on one function.

### Interface
- **Liquid glass** design system in `css/glass.css`: colour tokens for light and dark (and *System*, which follows the device), translucent panels with a soft rim, restrained violet accent. The puppy is kept small (the settings button and a paw mark).
- **Dynamic island** navigation: collapsed it shows the brand and the current place; expanded it shows Home · Practice · Concepts · Study Room. Keyboard: Enter/Space opens, arrows move, Home/End jump, Escape closes and returns focus; outside clicks close it; when collapsed the nav is `visibility: hidden` so it's skipped by pointer and screen readers. During a test the island becomes the test bar.
- **Settings popover** (puppy button): language, layout, theme. Saved in `campfire-prep.ui.v1` and applied by a small inline script in `<head>` before first paint, so there's no flash of the wrong theme.
- **Layouts are real layouts**, not themes: *Focus* turns the test into one column with the question list in a popover; *Studio* widens the page and adds a test-info side panel and a concepts panel on Home.
- **Popovers share one behaviour**: Escape closes the one you're in and focus goes back to what opened it; outside click closes; floating panels (calculator, scratchpad) come to the front when touched and stay inside the window.
- **Home**: difficulty carousel (exactly four modes) with a preview that never starts anything, an example question you can re-roll, current-topic progress, recent activity, goals, quick actions and stats rings. All figures are computed from saved work; first use shows empty states.
- **Practice** hub with tabs: Skills, Review, Study plan, Progress.
- **Study Room** is a first-class destination. Its landing page says plainly that it works on codes, not servers: questions and order are shared, answers stay on each device, comparison is by pasting result codes, and there's no live chat or shared drawing.

### Tests
- Normal / Challenging: 5 written response (19 marks), 5 numerical response, 10 multiple choice = 34 marks. Each written-response slot draws from a fixed set of families (read a graph · complete the square · sketch it *or* write the equation from the graph · solve/zeros · an applied max/min problem).
- Nightmare: 5 stages, all on one generated function.
- **Hints by mode**: Simple and Normal give every step; Challenging gives one; Nightmare none. Hints are counted per question and shown in the review; they never cost marks.
- Saved tests rebuild their questions from deterministic ids, so pause/reload restores the same question and your typed and plotted answers.

### Tools
- **Calculator** (`js/calculator.js`): recursive-descent parser, no `eval`/`Function`. Implicit multiplication, right-associative `^`, unary minus below `^`, `!`, `%`, sin/cos/tan and inverses, ln/log, √, ∛, `root(x, n)`, π, e, Ans. Degrees or radians. Errors are named (syntax, bracket, domain, divide by zero, too big) instead of showing NaN/Infinity. Keyboard input, Enter to evaluate, history you can click to reuse, drag/resize, position and angle mode remembered.
- **Scratchpad**: Draw or Type. Typed notes are saved with the page (per question in a test, a general page elsewhere). Clear asks for confirmation only when there's something to lose; Undo restores cleared text.

### Localisation
`js/i18n.js` holds 223 interface strings in English, French, Spanish, German and Simplified Chinese: the island, settings, Home, mode descriptions, Practice tabs and drills, the test bar and question chrome, section names, hints, tools, calculator errors, scratchpad, library chrome, Study Room landing, results header, and the checker's most common feedback notes. Lesson *titles and summaries* for the 15 quadratics concepts are translated too. Numbers and dates follow the chosen language.

## Content expansion

| | Before (radicals unit) | After |
|---|---|---|
| Hand-written test questions | 224 (98 MC, 24 NR, 31 WR, 51 Challenge, 20 Tim's Test) | kept for library quizzes, reviews and history |
| Generated question families | Nightmare: 3 tiers of radicals templates | **35** quadratics families (30 practice + 5 Nightmare stages) |
| Family × format | — | **49** (MC / NR / WR) |
| Family × format × mode | — | **~125** authored templates |
| Runtime variations | — | effectively unlimited; each instance comes from a seed (`qd-…-<seed>`) and is verified before use |
| Concepts in the library | 16 | **31** (15 quadratics added) |
| Formula reference | none | **15** formulas |

Authored templates and runtime variations are counted separately on purpose: 125 templates is the honest size of what was written; the number of distinct instances is a property of the seeds, not extra authoring.

Families cover: identifying quadratics, coefficients, direction, width, vertex form, axis, vertex from standard form, completing the square, max/min, combined features, matching graphs, graph → equation, transformations, predicting from a change, reading graphs, sketching (plotted answers), equation from a graph, tables and second differences, y-intercepts, zeros from factored form, solving, zeros from vertex form, number of roots, the discriminant, projectile motion, comparing parabolas, finding the error in a worked solution, building from roots, mirror points and optimisation.

## Validation

- `tests/quad.test.js` generates every family × format × mode across many seeds (25 by default, `QD_SEEDS` to raise) and checks: the key grades as correct; MC options are distinct; equalities in solutions and hints are consistent; no `1x`, `+ -`, `--` or similar text glitches; ids rebuild the identical question. Independent re-derivations check vertices, completed squares, max/min, intercepts, zeros and root counts, graphs, and the applied problems.
- Lesson content: every TeX string renders with KaTeX, every link resolves, prerequisites have no cycles, every concept has at least two examples and two mistakes, translations exist for all five languages.
- `tests/tools.test.js`: calculator precedence, functions, angle modes and error codes; every translation key has five non-empty strings, and every `data-i18n` key in the page exists.
- Browser suites (`tests/e2e/`): `browser.js` (learning platform, 76 checks), `regressions.js` (group tests, rooms, campfire, Nightmare, legacy history, 71 checks) and `redesign.js` (settings, layouts, carousel, hints by mode, plotter, calculator, scratchpad, Study Room, migration, phone width, 43 checks).

## Saved data and migration

Nothing is deleted or rewritten on load.
- Old history (radicals tests, Tim's Test, Nightmare I–III) still displays with its original level name, marked as retired. Attempts without a `subject` are treated as radicals.
- A saved preference for a retired level opens setup on a current level.
- Old `nm-` question ids and the hand-written bank ids still resolve, so old reviews and Mistake Notebook entries open.
- New keys: `campfire-prep.ui.v1` (language/layout/theme), `campfire-prep.calc.v1` (calculator), `campfire-prep.pad.global.v1` (scratchpad outside tests).

## What is incomplete

- **Not translated:** lesson bodies (explanations, examples, mistakes, strategies), question and solution text, hint text, the Study plan / analyst screen, Review and Mistake Notebook text, the setup and room dialogs, most of the results breakdown, the tour, and the AI tutor's replies. With a non-English language selected, Settings says that lesson and question text is still in English. Translations were written by the model, not checked by native speakers.
- **Study Room** has no backend. Real-time features (seeing others' progress, chat, shared scratchpad) would need a server with rooms, presence and message relay (e.g. WebSockets), accounts or at least signed room tokens, moderation for chat, and a privacy review for student data.
- **Lessons** are not reviewed by a teacher (each says so).
- The **old radicals hand-written banks** are no longer used in tests; they weren't converted into generators.
- The campfire minigame and companion still use their original warm visuals inside the test when switched on.
- Graph accessibility: every graph has a text description, and the plotter works with the keyboard, but it hasn't been tested with a real screen reader.
