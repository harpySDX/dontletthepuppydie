# Studio+ layout

A fourth **layout** (Settings → Layout: Balanced · Focus · Studio · **Studio+**). It is a layout only: it never
changes difficulty, and every other screen — tests above all — behaves exactly as in Balanced.

On Home it replaces the dashboard with a full-viewport workspace (the whole window height on desktop, panels scroll
inside themselves; two columns under 1280 px; one column on phones with no sideways scroll).

## Panels and where every number comes from

| Panel | Contents | Source |
|---|---|---|
| Top bar | Answers marked · accuracy (marks earned ÷ possible, all levels) · tests taken · day streak · reviews due · subtopics practised x/69; tools strip | `learningState().records`, test history, `streakInfo()`, `dueConcepts` + due Notebook mistakes, practice records' `sub` |
| Learning diagnostics | One bar per real session (last 12); weakest and strongest topics (≥ 3 marked answers), each weak topic with a Practise button; open mistakes by error category; topics not practised for 7+ days | `Learning.profile`, sessions grouped from records, Mistake Notebook categories (automatic or yours) |
| Quick practice | The four difficulties (the same saved choice as Home); start at that level; resume an unfinished test; weakest skill; review incorrect answers; practice tests (Normal/Challenging/Nightmare); topic → subtopic → Practise (or mix a unit, or the whole course) | Existing runners: `startMode`, `resumeTest`, `startDrill`, `runPractice` + `Bank.select` |
| Review queue & next steps | Notebook mistakes due for a retry; spaced reviews due (days overdue); top recommendations with their reason | `Learning.dueConcepts`, `L.dueMistakes`, `Learning.recommend` (its own reason text) |
| Curriculum overview | Units A–I: subtopics practised / total, subtopics with questions at the chosen level, your accuracy in that unit; a unit opens the Whole course screen on it | `Curriculum.coverage()`, practice records, concept profiles |
| Recent sessions | The last 10 tests and practice runs with score, level and date; a test opens its results | Test history, practice records grouped by run |

The criteria are written in the panels ("Practised = subtopics with at least one of your answers…", "Suggestions
change what to practise, never the difficulty"). With no data, each panel says so; no figure is estimated or sampled.

Buttons respect the fixed-level rule: if the chosen level doesn't exist for a topic, the button is disabled with an
explanation; Nightmare is test-only, so topic practice is disabled with a note when it is selected.

## Reused, not rebuilt

Mode carousel state, `startMode` / `startDrill` / `runPractice` / `resumeTest`, Review, the course screen, the
calculator and scratchpad (`Tools.open`), Settings (language picker focused for "Language"), the site tour, the
activity list styling, `Learning.*`, `Bank.select`, `Curriculum.coverage`.

## New tracking

Practice records now store `sub` (curriculum subtopic), `family` and `mode` (level) for each answer. Older records
without them still count everywhere else; they just don't appear in per-subtopic coverage.

## Tests

`tests/e2e/studioplus.js` (36 checks): four layouts in Settings; persistence across reload and a full browser
restart; honest empty state; every metric checked against stored records (answers, subtopics, tests, sessions,
per-unit counts, history); launcher level saved; topic launch at exactly the chosen level and subtopic; Nightmare
note; weakest-skill drill; Review; calculator; language picker and live re-render in French; unit → course screen;
viewport fill on desktop; test layout identical to Balanced and tutor hidden in the test; the tour shows the classic
dashboard and returns; switching back to Balanced; phone width.
