# Onboarding: site tour, test tutorial, campfire tutorial

All three run on one reusable engine, `js/tour.js` (`window.Tour`). Strings live in `js/i18n-tour.js` (5 languages);
state and step definitions in `js/onboarding.js`.

## The engine

`Tour.start(steps, { id, startId, onStep, onEnd, finishLabel, skipLabel })`. A step has i18n keys for title and
body, a `target` (selector, array of selectors highlighted as one union, or a function), optional `onEnter` /
`onExit`, `interactive` (the spotlight hole lets clicks through), `allowKeys`, `advanceWhen` (moves on when the
learner actually does the thing), `optional` (skipped automatically if the target never appears), `when()`, extra
`actions`, and custom button labels. Results: `completed`, `skipped` (closed on the first step), `exited`,
`replaced`, `handoff`.

Design: glass card + spotlight ring with a dimmed backdrop; the card positions itself beside the target and stays
on-screen (phone included); step counter and progress bar; Back / Next / Skip; **Esc** exits anywhere; ←/→ step;
focus is trapped in the card and returned afterwards; `prefers-reduced-motion` removes animation; the tutor is
hidden while a tour runs; changing language mid-tour re-renders the open card.

## 1. Site tour (15 steps; "Just the essentials" path is 6)

welcome → dashboard → recent activity → navigation island (opens it) → difficulty cards (try one) → preview without
starting → Concept Library → a lesson → Settings → language (switch it — the tour itself changes language) →
layout & theme → practice & tests (button to launch the test tutorial; the site tour resumes afterwards at the next
step) → Study Room → tools → done (replay from Settings → Help).

Offered automatically on the first visit to Home; never forced again once completed or skipped. If a deep link
reloads the page mid-tour, it resumes at the same step. In the Studio+ layout the tour temporarily shows the
classic dashboard it is describing, then gives the workspace back.

## 2. Test-taking tutorial (separate, no minigame)

A low-stakes sample test on the real test screen and real engine: question bar, reading a question, a graph,
answering (the step checks your answer live), a plot question, submitting a part, hints, the question navigator,
tools, progress, pause, done. **Nothing is recorded** — no history, no mastery evidence, no notebook entries
(demo sessions use mode "off" and are discarded).

## 3. Campfire minigame tutorial

Triggered the first time a test with the campfire is opened: *Start tutorial* or *Skip and play*. While it runs the
test clock and the fire's heat drain are held. Steps: goal, heat gauge, add a log (a real action — you add one, or
skip), then only the mechanics that are switched on for that test (wind, oxygen, kettle, vent, tent), random
events, how the puppy can be lost (Hardcore only), drain, turning it off, pause, Play. Replay from the campfire's
help button.

## State (`campfire-prep.onboarding.v1`)

`{ site, test, game: "completed" | "skipped", siteAt, testAt, gameAt, gameOpened, resume: { tour, step, variant } }`.
Independent per tutorial. The earlier `campfire-prep.toured.v1 = true` counts as the site tour completed. Saved on
this device like every other setting; clearing site data resets it.

## Replay entry points

Settings → Help (site tour, test tutorial), "How it works" on Home and in Studio+, "How tests work" in a difficulty
preview and above the test buttons, and the campfire's help button.

## Tests

`tests/e2e/onboarding.js` (59 checks): first visit, skip and remembered skip, replay, essentials path, Esc,
independent states, spotlight placement, keyboard navigation and focus, live language switch, deep-link resume,
test tutorial (live answer check, nothing recorded), test → site handoff, minigame first-open prompt, skip and play,
held clock, try-action, mechanic-specific steps, replay, phone viewport, reduced motion.
