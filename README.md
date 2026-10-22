# DontLetThePuppyDie — Pre-Calc 11

A study app for Pre-Calculus 11, now on **quadratic functions and graphing**. It has generated, exactly-checked practice at four difficulties, unit-test-style timed tests, a Concept Library with a formula reference, a floating calculator and scratchpad, and study rooms. The look is "liquid glass" (cool whites, icy blues, a little violet), with light, dark and system themes. Everything runs in the browser with no account; your data stays on your device.

What changed in this redesign, how it's built, and what's still unfinished: [`docs/REDESIGN.md`](docs/REDESIGN.md).
The question engine and the full BC Pre-Calculus 11 course map (with the audit and measured results): [`docs/ENGINE.md`](docs/ENGINE.md).
Onboarding (site tour, test tutorial, campfire tutorial): [`docs/ONBOARDING.md`](docs/ONBOARDING.md). The Studio+ layout: [`docs/STUDIO_PLUS.md`](docs/STUDIO_PLUS.md).
Goose Mode and the kettle/oxygen rebalance: [`docs/GOOSE_MODE.md`](docs/GOOSE_MODE.md).

## Getting around

- **The island** (top centre) is the main navigation. Select it to open **Home · Practice · Concepts · Study Room**. It closes with <kbd>Esc</kbd> or a click outside, arrow keys move between destinations, and during a test it turns into the test bar (mode, progress, timer, Pause, Exit).
- **The puppy button** (right of the island) opens **Settings**:
  - **Language:** English, Français, Español, Deutsch, 简体中文. This covers the interface; lesson and question text is still English (see the docs for the full list).
  - **Layout:** *Balanced*, *Focus* (one column; the question list becomes a popover), *Studio* (wider, with a side panel of test info and your concepts) or *Studio+* (Home becomes a full-screen workspace: diagnostics, quick launcher, curriculum overview, review queue, history and tools — all from your own records).
  - **Theme:** Light glass, Dark glass or System.

  - **Gameplay → Goose Mode** (Normal, Challenging, Nightmare): no puppy to keep alive — a goose instead, with random disruptive events every ~30 s and panels it steals (drag them back; *Reset layout* and *Turn off* are always on the Goose bar). Not a difficulty, and off on Simple.

  All of these are saved on this device and applied before the page draws. Reduced-motion settings are respected.

## Home

- A **difficulty carousel** with exactly four modes: **Simple**, **Normal**, **Challenging**, **Nightmare**. Selecting a card only *previews* it (what it's for, how hints work, an example question you can re-roll). Nothing starts until you press the start button.
  - **Simple:** guided practice, one skill at a time, step-by-step hints, instant feedback, untimed.
  - **Normal:** a 34-mark, 60-minute test laid out like the unit test (5 written response · 5 numerical response · 10 multiple choice). Step hints are available and noted in your review, never penalised.
  - **Challenging:** the same layout, harder (fractions, disguised forms, traps). One strategy hint per question.
  - **Nightmare:** one connected gauntlet of five stages about a single function. No hints, exact answers only. (This replaces the three radicals-era tiers.)
- Recent activity, goals, quick actions and your stats. **Every number on Home comes from your own saved work**; a first-time visitor sees empty states, not sample figures.

## Practice

- **Skills:** every quadratics concept with Simple / Normal / Challenging drills and a link to its lesson, plus the three full tests. A level a concept doesn't have is disabled, never swapped for another.
- **Whole course:** the BC Pre-Calculus 11 course as units A–I and 69 subtopics (real numbers, exponents, radicals, factoring, rational expressions, quadratics, inequalities, trigonometry, financial literacy). Pick a level once — questions stay at exactly that level — then practise a subtopic, mix a unit, or run a 20-question full-course review. Coverage is computed from the question bank and shown next to your own results.
- **Review:** spaced repetition and the Mistake Notebook.
- **Study plan:** next steps, plans, the exam planner and your study files.
- **Progress:** test stats and trend, what to work on, topic mastery and full test history (older radicals-unit attempts, including Tim's Test and the old Nightmare tiers, are still listed).

## Questions

- **105 question families** across the whole course (54 new generators, the 35 quadratics families, and the hand-written banks as 16 authored families), chosen with a history of your last 600 questions so the same question doesn't come back while there are new ones. See [`docs/ENGINE.md`](docs/ENGINE.md).
- The quadratics part: 30 families plus 5 Nightmare stages, each a generator with metadata (topic, concepts, prerequisites, formats, modes, complexity, tags). Every instance is built with exact fractions and checked before you see it: answer keys are re-graded, multiple-choice options are guaranteed distinct, and worked solutions are verified.
- Answer types include numbers, points `(3, -2)`, equations in a requested form (vertex, standard, factored or any), expressions checked exactly (factored, expanded, simplified rational expressions), exponent expressions, solution sets in interval notation or as inequalities, rounded decimals (trigonometry, finance), and **graphs you draw**: either a vertex + one point, or a whole parabola built on an **empty grid** (vertex, points on both sides, your own curve — the correct graph only appears after you submit).
- Feedback explains *why* (wrong sign of h, wrong form, decimal instead of exact value, …).

## Tools

- **Calculator** (tools button, bottom-left): scientific, with a safe parser (no `eval`): trig and inverse trig in degrees or radians, logs, roots, powers, factorial, π, e and Ans. Type on the keyboard or use the keypad. It can be dragged and resized, and remembers where you left it.
- **Scratchpad:** draw or type. Clear asks before wiping; notes are saved (per question inside a test, one general page elsewhere).

## Tests (timed)

- **Pause** (or `P`) freezes the clock; you can close the tab and resume later with the same time left. Tests in progress survive a reload.
- Results show marks by section and topic, time per question, hints used, and a full review with your answer next to the key, the worked solution and the marking key. Plotted answers are drawn next to the correct graph.
- **Create options** (from a mode's preview): time limit, group test, and the optional campfire minigame (off by default; it never affects the mark). See [`docs/CAMPFIRE_COMPANION.md`](docs/CAMPFIRE_COMPANION.md).
- **Group tests** still work with codes and invite links, with no server.

## The learning platform

Everything works without an account, and your data stays in your browser.

- **Concept Library:** 40 lessons: 15 on quadratic functions (with graphs, an interactive *a, h, k* explorer, notation tables and strategies), the 16 earlier lessons on number systems, exponents, radicals and factoring, and 9 new ones on rational expressions and equations, inequalities, trigonometry (angles, ratios, sine and cosine law) and financial literacy. A **formula reference** lists 15 quadratics formulas with what each symbol means, when to use it, its conditions, an example and related concepts.
  - Each lesson follows the same seven parts: overview with the big idea, key rules, worked examples step by step, common mistakes, connected concepts, practice, and a mastery check.
  - The side panel shows *your* evidence for that concept and when it's next due for review.
  - You can search, filter (Attention / Due / New) and collapse the sidebar.
  - Lessons are marked *"Written for Campfire Prep. Not yet reviewed by a teacher."*
- **Mastery you can inspect:** a concept is only **Confident** after all four of these:
  - at least 3 answers over 2 separate sessions
  - right on 3 different questions
  - about 85% overall and 80% recently
  - a good session at least 2 days after the previous one (proof it stuck)

  Strong-but-unproven concepts say so. Select any concept to see every answer behind its status. Challenge questions add variety but never lower your accuracy. Blank answers from abandoned tests don't count.
- **Review:**
  - **Spaced repetition:** concepts come back after 1 → 3 → 7 → 14 → 30 days. A score under 50% sends a concept back to tomorrow. A *Today's review* session mixes the mistakes that are due with one fresh question per due concept.
  - **Mistake Notebook:** every wrong answer, saved once per question, with what you wrote, the correct answer and the worked solution.
    - Each mistake gets an error type (detected from the marking when possible, otherwise "Not sure yet"). You can change it.
    - You can search and filter, retry a mistake, mark it understood, or practise a filtered set.
    - Three spaced right retries in a row mark a mistake **fixed**.
- **My Learning:**
  - a clear *Next up*, plus counts for Needs attention / In progress / Confident / Not enough evidence
  - a ranked plan for 10–90 minutes
  - an **exam plan**: give the exam date, the units on it, your minutes per day, your study days and starred priorities, and it lays out day-by-day sessions (reviews, weak concepts, follow-up quizzes, a final practice test). It re-plans from today whenever your results change or you miss a day. It never promises a grade, and only calls a topic "on your exam" if you said so.
  - a sortable concept profile
  - your study files
- **Study materials:** upload a PDF, `.txt` or `.md` (up to 10 MB / 80 pages).
  - The text is extracted *in your browser* and matched to the concepts, with page references.
  - Scanned PDFs are rejected with an explanation.
  - Delete removes everything.
- **Study Room** (from the island): an extension of group tests, still with no server. A room covers one subject (quadratics, or the earlier units); quadratics rooms generate the same questions for everyone from the room code.
  - Pick concepts and how many questions.
  - Choose **self-paced** or **together** (a shared start time, with a fixed number of seconds per question, so everyone is on the same question at once).
  - Turn hints and the tutor on or off.
  - Share the code or link; everyone gets the identical set.
  - At the end you can copy a result code holding only your name and which questions you got right. Paste friends' codes for a group summary and the concepts the group should review.
- **AI tutor** (the round ✦ button, bottom-right corner): a glass panel that knows which page you're on.
  - It explains, hints, guides, quizzes, and helps with a notebook mistake or a study file.
  - **It is completely unavailable while any test is running or paused, including during the tour.** If a paused test is waiting, the button shows a 🔒 with *Resume test* / *Discard test*.
  - Your learning records are only shared if you tick *Use my learning records*.

How it is built, the security and privacy model, and what's tested: [`docs/REDESIGN.md`](docs/REDESIGN.md) (this redesign), [`docs/LEARNING_PLATFORM.md`](docs/LEARNING_PLATFORM.md) and [`docs/V8_REDESIGN.md`](docs/V8_REDESIGN.md) (earlier versions).

No build step and no dependencies to install. It's plain HTML, CSS and JavaScript. KaTeX, which renders the math, is included in `vendor/`.

## Exam-first tests

When a test is running the screen is the exam: no menus, subject switcher, labs, topic names or method-revealing
formulas, and hints are off unless allowed in Test options (never in Nightmare). Precalculus and Physics share the
same home screen and test screen. See [docs/EXAM_MODE.md](docs/EXAM_MODE.md).

## Physics 11

A second subject, switched from the Dynamic Island (Math ⇄ Physics). Projectile motion is built in depth — 17
question families at four fixed difficulty levels, eight lessons, a formula reference, a Projectile Explorer, a
Motion Graph Lab and a vector visualizer — with its own diagnostics, review queue and course map. Difficulty works
as in Math: Simple is guided practice; Normal, Challenging and Nightmare are real timed Physics tests in the same test
engine (options, results, review). Settings are
shared; learning data is kept separate. Everything else in the BC Physics 11 curriculum is listed honestly as
planned. See [docs/PHYSICS.md](docs/PHYSICS.md).

## Themes

Twelve themes in Settings: Light Glass, Dark Glass, System, Cinnamon, Blush, Galaxy, Arctic, Beach, Halloween,
Christmas, Graphite and Lime. Seasonal themes are never switched on automatically. See [docs/THEMES.md](docs/THEMES.md).

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Put it on GitHub

The repo's top level must look like this. If `css`, `js` or `vendor` is missing, the site shows an unstyled page with a warning banner:

```
index.html   favicon.svg   README.md   package.json
api/         css/          js/         vendor/     docs/   tests/
```

**Option A, using the website (no git needed):**
1. Create a new, empty repository on GitHub.
2. Click **uploading an existing file**.
3. Open the unzipped `radical-campfire` folder and select everything inside it: all the **folders** (`api`, `css`, `js`, `vendor`, `docs`, `tests`) plus `index.html`, `favicon.svg`, `package.json` and `README.md`.
4. Drag them all into the upload box at once. Dragging the folders themselves keeps them as folders; picking files one by one flattens them.
5. Commit.

**Option B, using git:**

```bash
cd radical-campfire
git init && git add -A && git commit -m "Campfire Prep"
git remote add origin https://github.com/<your-username>/campfire-prep.git
git branch -M main
git push -u origin main
```

## Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. Framework preset: **Other**. Leave the build command and output directory **empty**.
3. Click **Deploy**. Every push to `main` redeploys automatically.

### Turn on the AI tutor (optional)

The tutor runs through one serverless function, `api/tutor.js`, which Vercel deploys automatically. In Vercel, go to **Project → Settings → Environment Variables** and add:

| Variable | Required | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Your Anthropic API key (console.anthropic.com). It stays on the server and is never sent to the browser. |
| `TUTOR_MODEL` | no | The model to use. Default: `claude-sonnet-5-5`; `claude-haiku-5-5` is cheaper. |
| `TUTOR_ACCESS_CODE` | no | If set, students type this code once before using the tutor. Strongly recommended for a public URL, since every message costs API credit. |

Redeploy after adding them. Without a key, everything else works and the tutor says plainly that it isn't connected.

**GitHub Pages also works** (in the repo, go to Settings → Pages → Deploy from branch → `main` / root), but Pages can't run `api/tutor.js`, so the tutor shows as unavailable there.

## Adding or editing questions

**Quadratics** questions are generators in `js/quad-bank.js`. Each family declares its metadata and a `gen(kind, mode, ctx)` that builds one instance from a seed with exact fractions (`QuadMath` in `js/quad-engine.js`); `checkWR`/`mc()` verify every instance. Ids are `qd-<version>-<family>-<kind>-<mode>-<seed>`, so a saved test can always rebuild the same question. Add a family, then run `npm test`: the suite generates every family × format × mode many times and checks keys, distinct choices, solution consistency and text hygiene. Lessons and formulas live in `js/quad-content.js`.

The older radicals banks below are still used by the library quizzes, reviews and history:

- `js/bank-mc.js` holds multiple choice. **The first choice is always the correct one** (choices are shuffled during the test).
- `js/bank-nr.js` holds numerical response: `answer` is a number.
- `js/bank-wr.js` holds written response. Use the `Q1(...)`–`Q4(...)` helpers, or copy a Q5 word problem.
  - Each part has an `answer` typed the way a student would (`"3+√5"`, `"(4-√6)/2"`) and a `form`:
    - `simplest`
    - `rationalized`
    - `entire`
    - `value` (accept any equal form)
  - Equation parts use `kind: "set"` with a list of solutions (`[]` means none).

Math in question text goes inside `\( ... \)`. Don't rename existing ids, because saved history refers to them. The default time limit is set in *Create test*; the section layout lives in `SECTIONS` at the top of `js/app.js`.

## Files

```
index.html          app shell: island, settings, screens, dialogs
css/style.css       base styling (earlier versions)
css/glass.css       the liquid-glass design system: tokens for light/dark/system, island, dashboard, tests, tools, physics
css/themes.css      nine more themes (generated by tools/themes.js — don't edit by hand)
tools/themes.js     theme palettes → full token sets, contrast report
js/i18n.js          interface translations (en, fr, es, de, zh) and translated checker notes
js/quad-engine.js   exact fractions, polynomials, vertex/standard/factored conversions, equation parser, answer checker
js/graph.js         SVG graphs, text descriptions for screen readers, and the click/drag/keyboard plotter
js/quad-bank.js     30 quadratics question families + 5 Nightmare stages, test builder, practice pools
js/quad-content.js  15 quadratics lessons (with translations of titles/summaries) and 15 formulas
js/calculator.js    safe scientific calculator (parser + floating panel)
js/tools.js         tools launcher and shared floating-panel behaviour
js/goose.js         Goose Mode: event manager, effects, goose theft, Goose-only drag and drop
js/i18n-goose.js    Goose Mode strings (5 languages)
js/bank-mc.js       multiple-choice bank
js/bank-nr.js       numerical-response bank
js/bank-wr.js       written-response bank (Q1–Q5 variants, rubrics, worked solutions)
js/mathcheck.js     reads typed math and checks value + simplest form
js/campfire.js      heat simulation for the buddy
js/companion.js     Campfire Companion: optional mechanics, event scheduler, compact controls
js/scratchpad.js    floating drawing pad (one page per question)
js/bank-classmate.js Tim's Test (retired as a mode; kept for history and library quizzes, credited to Tim)
js/bank-challenge.js Challenge-level banks
js/nightmare.js     retired radicals Nightmare tiers (kept so old saved tests and history still rebuild)
js/group.js         group-test and study-room codes, seeded shuffles, result codes
js/insights.js      Basecamp analysis: topic mastery, habits, trends
js/tour.js          reusable tour engine (spotlight, steps, keyboard, live language switching)
js/onboarding.js    site tour, test-taking tutorial, campfire tutorial, and their saved state
js/i18n-tour.js     onboarding strings (5 languages)
js/i18n-splus.js    Studio+ strings (5 languages)
js/engine/answers.js exact answer kinds: polynomial/rational, exponent, interval, rounded decimal, built graph
js/engine/bank.js   question registry, validation, rebuild by id, history-aware fixed-level selection
js/curriculum.js    BC Pre-Calc 11 map (units A–I, 69 subtopics) and live coverage
js/gen/unit-*.js    58 generator families for units A–I (unit-f-transform.js: quadratic transformations)
js/course-content.js lessons for rational expressions, inequalities, trigonometry and finance
js/concepts.js      Concept Library content + question → concept tagging
js/learning.js      evidence, mastery, spaced repetition, Mistake Notebook, recommendations, exam plan, document matching (no AI)
js/docs.js          uploads: PDF/text extraction in the browser, IndexedDB storage
js/practice.js      shared question runner (concept quizzes, reviews, notebook retries, rooms)
js/library.js       Concept Library screen
js/review.js        Review screen: spaced repetition + Mistake Notebook
js/analyst.js       My Learning screen (next step, plans, exam plan, profile, study materials, evidence inspector)
js/rooms.js         study rooms (shared practice sets on room codes)
js/tutor.js         floating AI tutor (page-aware, hidden during tests)
js/app.js           flow, Basecamp, test, timer/pause, results, saving, subject switching, themes
js/physics/model.js       projectile kinematics, units, number parsing, significant figures
js/physics/check.js       physics answer checker (value + unit, choices, ordering) and question validation
js/physics/gen-*.js       17 Physics 11 question families (projectile motion and reasoning)
js/physics/curriculum.js  BC Physics 11 map with computed statuses
js/physics/content.js     8 physics lessons, formula reference, live worked examples
js/physics/figures.js     SVG scenes, vectors, graphs and tables for questions
js/physics/tools.js       Projectile Explorer, Motion Graph Lab, vector visualizer
js/physics/home.js        Physics content for the shared home screen and Studio+
js/physics/test.js        what Physics supplies to the shared test engine (build, inputs, review, results)
js/i18n-phystest.js       Physics test strings (5 languages)
js/physics/ui.js          Physics screens: home/workbench, lessons, practice runner, diagnostics, review, lab
js/i18n-physics.js        Physics strings (5 languages)
api/tutor.js        Vercel function: validates, rate-limits, calls the Anthropic API
vendor/katex/       math rendering (MIT license)
vendor/pdfjs/       PDF text extraction (Apache-2.0 license)
tests/              unit tests (npm test) and browser tests (tests/e2e)
docs/               architecture and engineering notes
```

## Tests

```bash
node tools/themes.js         # regenerate css/themes.css from the palettes (prints a contrast report)
npm test                     # 141 unit tests (incl. Physics 11 model/checker/generators and theme contrast): every generator family × format × level, answer equivalence, fixed difficulty, duplicate measurements, history; quadratics engine/checker/families, concepts, formulas, calculator, translations, mastery, spaced repetition, notebook, exam plan, room codes, companion, API (AI mocked)
QD_SEEDS=300 node --test tests/quad.test.js        # stress every quadratics family with more seeds
NM_SEEDS=1000 node --test tests/nightmare.test.js   # stress the Nightmare templates with more seeds
node tests/e2e/devserver.js  # local server with a MOCKED tutor on :8766
MOCK_OFF=1 PORT=8767 node tests/e2e/devserver.js   # same, with no key (for the "not connected" check)
npm run test:e2e             # 591 Playwright browser checks in 11 suites: app, regressions, redesign, onboarding, curriculum, Studio+, Goose Mode, Physics, Physics tests, exam mode, themes (needs Playwright + Chromium installed)
node tools/engine-measure.js # repetition / level-drift measurements before vs after, coverage, raw generator diversity
```
