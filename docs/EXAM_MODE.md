# Exam-first test experience

DontLetThePuppyDie is a practice-test simulator. Teaching tools live outside the test; when a test is running, the
screen is the exam.

## One home, one test screen, two subjects

- **Home.** Precalculus and Physics use the same home screen (`#screen-home`): welcome, current topic, the four
  difficulty cards with a preview, Recent activity, Goals, Quick actions and Your stats, and the same Studio+
  workspace. Physics fills it with its own content (`js/physics/home.js`): projectile-motion greeting and topic,
  Physics test previews and options, Physics sessions, lesson goals and skill stats. The old separate Physics home
  (lesson path, embedded Projectile Explorer, tool cards) is gone; the Lab is still available as an optional
  destination ("Lab (optional)" in Quick actions and the island), never as a step before a test.
- **Tests.** Normal, Challenging and Nightmare in both subjects run in the same test screen (timer, pause, question
  navigator, flags, calculator, scratchpad, submit, results, review). Simple is guided practice in both.

## What an active test shows

| Shown | Hidden during the test |
|---|---|
| The question and its answer inputs | Subject switcher, island menu, Home/Practice/Lessons/Lab destinations |
| Question number and marks | The question's topic name (it names the method; shown in the review) |
| Timer, progress, Pause, Exit (asks before leaving) | Formulas picked for the current question (Math Studio panel is empty; Physics shows one general formula sheet, the same for every question) |
| Previous / Next, navigator, Flag, Submit | Help tours in Settings (they can't run during a test) |
| Calculator and scratchpad (Tools) | Hint button, unless hints were allowed for this test |
| The campfire minigame or Goose Mode — only if you turned them on | The AI tutor |

## Hints

Hints are **off by default** in every test (exam conditions). Test options has **Allow hints**: Normal then offers
hints on request, Challenging one per question; every hint used is noted in the review. Nightmare never has hints
(the switch is disabled). The choice is remembered.

## Difficulty

- **Math:** the unit-test blueprint is unchanged (34 marks: WR 19, NR 5, MC 10). Two multiple-choice questions now
  come from quadratic transformations, and on about half of the tests the 2-mark graphing written-response slot is a
  2-mark transformations question (marks unchanged).
- **Physics:** a mixed test follows a blueprint like a unit test: mostly calculation, ordered from more direct to
  more involved, with at most one or two reasoning questions. Before, tests were balanced over subtopics, so
  conceptual multiple choice was about one question in six. Measured over 30 tests per level: parts per question
  2.7 (Normal) → 3.2 (Challenging) → 3.1 (Nightmare, all multi-stage); unequal-height problems 26 % → 38 % → 67 %.
  Choosing a single topic still gives only that topic.

## Answer checking (audited, unchanged)

Math: exact algebra (polynomial equality, exact fractions and radicals; decimals must be rounded as asked, with a
partial mark for a rounding slip; "simplest form" and "vertex form" enforced where the question asks). Physics:
value within 1 % in any unit of the right kind; unit slips, sign errors, recognised wrong methods and rounding slips
are named and score 0. Significant figures are not marked.

## Quadratic transformations (Math)

Four subtopics in unit F, each with its own generator (`js/gen/unit-f-transform.js`) and a new lesson
(`quad.hscale`, Horizontal stretches and compressions):

| Subtopic | Questions |
|---|---|
| Vertical stretches, compressions and reflections | describe y = ax²; build from a description; map a point; find a from a point (Challenging) |
| Horizontal stretches and compressions | describe y = (bx)²; compare (bx)² with bx²; rewrite as ax² and map a point; build from a horizontal factor |
| Translations: reading h and k | vertex, axis, direction and size of the shifts; equation from translations; translate a given parabola |
| Combined transformations | order of transformations (convention stated); rewrite in vertex form (a·b²); build from a list; follow a point (x, y) → (x/b + h, a·y + k); compare two; graph on an empty grid (Challenging) |

Conventions: "stretch" for factors greater than 1, "compression" for factors less than 1 (so no option can be
correct under another wording convention); stretches, compressions and reflections first, then translations; no
distractor is ever a true equivalent (e.g. "vertical stretch by b²" is never offered as wrong for y = (bx)²).
Equations accept any equivalent form unless vertex form is asked for.

## Tests

- `tests/e2e/exam.js` (31 checks): shared home for Physics, test from the home without labs, no stray controls in
  active Math and Physics tests, topic hidden until review, formula panels, Settings help hidden, hints opt-in and
  never in Nightmare, Simple still guided, Lab still optional, transformations in Simple practice, the course map and
  the Math unit test (still 34 marks), Studio+ and phone.
- `tests/transform.test.js` (7 tests) and the blueprint test in `tests/physics.test.js`.
