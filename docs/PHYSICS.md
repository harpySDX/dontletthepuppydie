# Physics 11

Physics 11 is a second subject next to Pre-Calculus 11. It shares the app's settings (theme, language, layout,
accessibility, Goose Mode) but keeps its own learning data. This file describes what exists, how it is checked,
and — just as important — what does not exist yet.

The curriculum is mapped from the BC Physics 11 curriculum (https://curriculum.gov.bc.ca/curriculum/science/11/physics).
The build focuses on **projectile motion**, where the class currently is (diagonal launches).

## Switching subject

- The Dynamic Island has a subject switcher (Math ⇄ Physics), a menu of two radio items; Escape closes it.
- The choice is remembered (`campfire-prep.subject.v1`) and restored on the next visit.
- In Physics the island's Library and Study Room buttons become **Lessons** and **Lab**; Home, Practice and Progress
  open the Physics equivalents (Progress → the diagnostics tab).
- Switching while a practice run is open (Math or Physics) asks first; "Stay" keeps the run exactly as it was.
  A saved Math test stays saved — a note says so when you return to Math.
- A Math lesson link followed while in Physics switches to Math (it was a request for that lesson).

## Separate data

| What | Key | Notes |
|---|---|---|
| Physics answers (one record per checked part) | `campfire-prep.phys.practice.v1` | family, subtopics, level, skills, marks, error category (only when wrong), hints used |
| Physics preferences (open tabs, last lesson/tool, last subtopic) | `campfire-prep.phys.prefs.v1` | |
| Lab tool state | `campfire-prep.phys.tools.v1` | |
| Physics question history (no-repeat selection) | `campfire-prep.phys.qhist.v1` | Math keeps its own history key |

Nothing is migrated or deleted: Math keys are untouched, and Physics data only exists once you use Physics.
Diagnostics, review and dashboards read only Physics records — nothing is estimated or invented, and empty
states say so.

## Difficulty levels: the same workflows as Math

| Level | Physics workflow (same as Math) |
|---|---|
| Simple | guided practice in the Physics runner: step-by-step scaffold, hints, part-by-part instant feedback, worked solution. Not timed. |
| Normal | a **real test** in the shared test engine: timer, pause, navigator, flags, hints when asked, calculator and scratchpad, campfire / Goose rules, submit, marks, results and review |
| Challenging | the same test engine with Challenging-level questions and **one hint per question** |
| Nightmare | the same engine: linked multi-stage questions from the multi-step families (`ph_multistep`, `ph_mixed`, `ph_inverse`, `ph_angled_diff`, `ph_impact`, `ph_downward`, `ph_error`, `ph_velocity_at`, `ph_horizontal` at Nightmare level), labelled as stages, **no hints** |

The Physics home is now the shared home screen (see docs/EXAM_MODE.md): the difficulty cards and preview work
exactly as in Precalculus. The Practice destination's "Practise at your level" panel also follows the selected difficulty. For Simple it shows the guided-practice
start; for the three test levels it shows a test preview (length, time, hint policy), a topic selector, the number
of questions, **Start a … Physics test** and **Test options**. Test options opens the same Create-test dialog Math
uses (time limit, campfire minigame) with Physics fields for topic and length; group tests stay Math-only.

How it is wired (the smallest change that reuses the Math engine):

- `js/physics/test.js` (`PhysTest`) supplies what is physics-specific: building the test from the Bank
  (`subject: "physics"`, fixed level, chosen topic and count), rendering value + unit, choice and ordering parts,
  deciding when a part is answered, the review (your answer, key, diagnosed note, error type, worked solution),
  the Studio formula panel, and the per-skill results block.
- `js/app.js` runs the session exactly as for Math (`startTest({ subject: "physics", … })`); grading goes through
  `MathCheck.grade`, which already delegates physics kinds to `PhysCheck`.
- Topic selector, test options and generator agree: a topic is offered at a level only if a generator produces it
  there (`PhysTest.topics`), and the unit test builds a full test for every offered topic at every level.
- Results: Physics attempts are saved in `campfire-prep.phys.history.v1` (never in the Math history), and every
  graded part is added to the Physics records, so diagnostics, the review queue and Recent sessions update. Recent
  sessions list tests and reopen their results. An unfinished Physics test is offered for resume on the Physics
  home only.

Defaults: Normal 6 questions / 40 min, Challenging 6 / 50 min, Nightmare 4 / 50 min (each question has several
marked parts). Lengths: 4, 6, 8 or 10 (Nightmare 3–5); time 10–120 min.

## Practice

- **Difficulty** reuses the four levels (Simple, Normal, Challenging, Nightmare). A run is generated at the chosen
  level and never escalates. Families that don't exist at a level are labelled ("from Normal") instead of being
  silently swapped for another level.
- **Runner**: one question at a time, parts checked one by one, hints revealed one at a time, a worked solution
  after the last part, results by skill and by error category, and next steps (lesson / practice / tool).
  There is no AI tutor in the runner.
- **Diagnostics** (by skill and by error category) appear only after at least three answers on a skill; fewer is
  shown as "not enough evidence yet". Error categories are recorded only when the checker can tell what went
  wrong (a unit slip, a sign error, a recognised wrong formula, a rounding slip); other wrong answers are counted
  as unclassified rather than guessed.
- **Review queue**: a family you missed comes back (due after ~20 h) until you get it right twice; review always
  generates a **fresh equivalent question**, never the same numbers.
- **Course map**: every subtopic with its honest status (below), your evidence, and links to its lesson, tool and
  practice.

### Answer formats

| Format | How it is checked |
|---|---|
| Number + unit (`qty`) | value within 1 % (per-part tolerance), any unit of the right kind (m/s, km/h…); decimal comma, `1.2e3`, `1.2×10^3` accepted |
| Multiple choice (`pmc`) | exact option; wrong options can carry a diagnosed reason |
| Equation selection | multiple choice over equations, rendered with KaTeX |
| Vector components | two number + unit parts with sign conventions stated (up positive) |
| Graph / diagram interpretation | options are rendered graphs or diagrams |
| Ordering steps (`order`) | exact order; feedback names the first step out of place |
| Multi-part | each part is its own format, checked separately |
| Error analysis | pick the line with the first mistake in a worked solution, then give the correct value |
| Conceptual claim + reason | two linked choices (claim, then the reason) |
| Insufficient information / invalid assumption | choose what is missing or why the model doesn't apply |

There is **no free-text grading**: written reasoning is offered as structured choices so marks are never faked.

Feedback separates: wrong unit kind; right number in another unit (conversion slip); sign error (or "give the
magnitude" when a magnitude was asked); recognised wrong paths (e.g. used the equal-heights range formula on unequal
heights, took the early root, forgot the launch height, halved instead of doubled); rounding slips; and plain
wrong answers. Each recognised path stores an error category: conceptual, equation, algebra, sign, unit, numerical.

## Question families (generators)

All in `js/physics/gen-projectile.js` and `js/physics/gen-reasoning.js`, registered with the shared Bank as
`subject: "physics"`. Every instance is validated before it can be shown (`PhysCheck.validate`): text in all five
languages, distinct options, no "known wrong value" equal to the key, hints and a worked solution.

| Family | What it asks | Levels |
|---|---|---|
| `ph_components` | resolve a launch velocity into components (incl. km/h, below-horizontal) | all |
| `ph_vertical` | straight up/down: time to top, max height, velocity at landing, passing a height on the way down | all |
| `ph_horizontal` | horizontal launches: time, range, impact speed; inverse (minimum speed to clear a gap) | all |
| `ph_angled_same` | diagonal launches, equal heights: time, max height, range; inverse from range and time | all |
| `ph_angled_diff` | diagonal launches, different heights (cliff, hose, onto a roof) | all |
| `ph_downward` | launched below the horizontal | Normal+ |
| `ph_velocity_at` | components, speed, height and rising/falling at a time t | all |
| `ph_inverse` | find launch speed (or angle) from range/target; target-hitting at Nightmare | Normal+ |
| `ph_multistep` | chained multi-part problems | Normal+ |
| `ph_concepts` | conceptual claims and reasons (apex velocity, independence of axes, g everywhere…) | all |
| `ph_graphs` | pick the graph, read slope, read a table, interpret a diagram | all |
| `ph_impact` | impact velocity components, speed and direction | Normal+ |
| `ph_equations` | choose the right equation; order solution steps | all |
| `ph_error` | find and fix the error in a worked solution | Normal+ |
| `ph_insufficient` | insufficient information / invalid assumptions (air resistance, uneven ground…) | Normal+ |
| `ph_mixed` | mixed scenarios (wall, landing on a roof, two throws) | Normal+ |
| `ph_units` | conversions, significant figures, scientific notation | all |

The kinematics model (`js/physics/model.js`) is the single source of numbers for generators, worked examples,
the Explorer and the graphs. Keys are computed from the **displayed** (rounded) values, so the numbers in the
question are exactly the numbers the key uses.

## Lessons and formula reference

Eight lessons (`js/physics/content.js`): vectors, units, the projectile model, vertical, horizontal, angled,
different heights, graphs. Each has an intro, key ideas, a diagram, definitions and equations, a worked example
computed live from the model, common misconceptions, a quick check, practice links, a challenge and a summary with
prerequisites. The formula reference lists each equation with variables and units, when it applies (e.g. the range
formula is for **equal launch and landing heights only**), rearrangements, an example and common mistakes.

## Lab tools

- **Projectile Explorer** — sliders for speed, angle, launch height, landing height and g; play/pause/step/scrub;
  components shown along the path; ghost of the previous launch; "predict, then reveal" mode.
- **Motion Graph Lab** — x–t, y–t, vx–t, vy–t (or all four) from the same launch; scrub or click to inspect values,
  slope and area readouts, sketch a prediction and compare, values table.
- **Vector visualizer** — drag the tip or use sliders; components and their signs.

Tools unmount cleanly (timers and listeners removed) when you leave the Lab. In Studio+ the Physics home becomes a
workbench with a compact Explorer.

## Layouts, Goose Mode, languages, accessibility

- All four layouts render Physics; Studio+ is the physics workbench.
- Goose Mode works on Physics screens; its effects are visual only — tested to leave question text, numbers and
  grading unchanged, and to clean up after themselves.
- Interface text is in English, French, Spanish, German and Chinese. French, Spanish and German questions use a
  decimal comma (answers are accepted with either). Translations were written for this app and have not been reviewed
  by native-speaking teachers.
- Inputs have labels, choices are radio groups, figures have text alternatives, feedback is announced
  (`role="status"`), and nothing depends on colour alone.

## Curriculum coverage

Statuses are computed from the code (`PhysCurriculum.coverage()`), not typed by hand:

- **Implemented and tested** — generated questions at the listed levels, covered by `tests/physics.test.js`.
- **Implemented, requires validation** — a lesson or tool exists but there are no generated questions yet, or it
  needs review.
- **Planned** — in the curriculum, not built.
- **Supplementary** — outside core Physics 11 (shown separately, never counted as coverage).

Totals: 21 implemented and tested, 2 implemented requiring validation, 20 planned, 1 supplementary.

### PA — Vectors, measurement and units

| Subtopic | Status | Generators | Levels | Lesson / tool |
|---|---|---|---|---|
| Scalars and vectors | Implemented, requires validation | — | — | `phys.vectors`, tool: vector |
| Vector components (right-triangle trigonometry) | Implemented and tested | `ph_components` | all four | `phys.vectors`, tool: vector |
| Adding and subtracting vectors | Planned | — | — | — |
| SI units, conversions, significant figures, scientific notation | Implemented and tested | `ph_units` | all four | `phys.units` |
| Uncertainty and percent error | Planned | — | — | — |

### PB — Horizontal motion (1-D kinematics)

| Subtopic | Status | Generators | Levels | Lesson / tool |
|---|---|---|---|---|
| Uniform motion | Planned | — | — | — |
| Uniformly accelerated motion | Planned | — | — | — |
| Motion graphs: gradients and areas | Implemented, requires validation | — | — | `phys.graphs`, tool: graphs |

### PC — Projectile motion

| Subtopic | Status | Generators | Levels | Lesson / tool |
|---|---|---|---|---|
| The independent-axes model | Implemented and tested | `ph_components`, `ph_velocity_at`, `ph_concepts`, `ph_graphs`, `ph_equations` | all four | `phys.model`, tool: explorer |
| Conceptual reasoning: claim and reason | Implemented and tested | `ph_concepts` | all four | `phys.model` |
| Vertical launches (1-D) | Implemented and tested | `ph_vertical` | all four | `phys.vertical`, tool: graphs |
| Horizontal launches | Implemented and tested | `ph_horizontal` | all four | `phys.horizontal`, tool: explorer |
| Angled launches, same launch and landing height | Implemented and tested | `ph_angled_same` | all four | `phys.angled`, tool: explorer |
| Angled launches, different heights | Implemented and tested | `ph_angled_diff`, `ph_multistep`, `ph_error`, `ph_mixed` | all four | `phys.heights`, tool: explorer |
| Launched below the horizontal | Implemented and tested | `ph_downward` | Normal, Challenging, Nightmare | `phys.heights` |
| Time of flight | Implemented and tested | `ph_vertical`, `ph_horizontal`, `ph_angled_same`, `ph_angled_diff` | all four | `phys.angled` |
| Maximum height | Implemented and tested | `ph_vertical`, `ph_angled_same`, `ph_angled_diff`, `ph_multistep` | all four | `phys.vertical` |
| Horizontal range | Implemented and tested | `ph_horizontal`, `ph_angled_same`, `ph_angled_diff`, `ph_downward`, `ph_inverse`, `ph_multistep` | all four | `phys.angled` |
| Velocity components at a moment | Implemented and tested | `ph_velocity_at` | all four | `phys.model`, tool: graphs |
| Impact velocity and direction | Implemented and tested | `ph_horizontal`, `ph_downward`, `ph_multistep`, `ph_impact` | all four | `phys.heights` |
| Finding launch speed or angle | Implemented and tested | `ph_inverse`, `ph_mixed` | Normal, Challenging, Nightmare | `phys.angled` |
| Graphs, tables and diagrams | Implemented and tested | `ph_graphs` | all four | `phys.graphs`, tool: graphs |
| Choosing equations and planning a solution | Implemented and tested | `ph_equations` | all four | `phys.model` |
| Multi-step problems | Implemented and tested | `ph_multistep` | Normal, Challenging, Nightmare | `phys.heights` |
| Error analysis | Implemented and tested | `ph_error` | Normal, Challenging, Nightmare | `phys.heights` |
| Missing information and assumptions | Implemented and tested | `ph_insufficient` | Normal, Challenging, Nightmare | `phys.model` |
| Mixed problems: choose the approach | Implemented and tested | `ph_mixed` | Normal, Challenging, Nightmare | `phys.heights` |

### PD — Forces and Newton's laws

| Subtopic | Status | Generators | Levels | Lesson / tool |
|---|---|---|---|---|
| Contact forces: normal, spring, tension, friction | Planned | — | — | — |
| Mass, gravity and apparent weight | Planned | — | — | — |
| Newton's three laws and free-body diagrams | Planned | — | — | — |
| Forces in systems: inclines, angled forces, elevators | Planned | — | — | — |

### PE — Energy, work, power and machines

| Subtopic | Status | Generators | Levels | Lesson / tool |
|---|---|---|---|---|
| Work and the work–energy principle | Planned | — | — | — |
| Conservation of energy | Planned | — | — | — |
| Power and efficiency | Planned | — | — | — |
| Simple machines and mechanical advantage | Planned | — | — | — |

### PF — DC electricity

| Subtopic | Status | Generators | Levels | Lesson / tool |
|---|---|---|---|---|
| Current, voltage, resistance and Ohm's law | Planned | — | — | — |
| Series and parallel circuits, Kirchhoff's laws | Planned | — | — | — |
| Terminal voltage vs EMF, fuses, breakers, short circuits | Planned | — | — | — |

### PG — Thermal equilibrium

| Subtopic | Status | Generators | Levels | Lesson / tool |
|---|---|---|---|---|
| Specific heat capacity and calorimetry | Planned | — | — | — |

### PH — Waves and sound

| Subtopic | Status | Generators | Levels | Lesson / tool |
|---|---|---|---|---|
| Transverse and longitudinal waves | Planned | — | — | — |
| Wave properties: speed, frequency, wavelength, behaviours | Planned | — | — | — |
| Sound: pitch, loudness, speed, Doppler effect | Planned | — | — | — |
| Standing waves and resonance | Planned | — | — | — |

### PX — Supplementary (outside core Physics 11)

| Subtopic | Status | Generators | Levels | Lesson / tool |
|---|---|---|---|---|
| Momentum and impulse | Supplementary | — | — | — |

## Tests

- `tests/physics.test.js` (21 tests): kinematics model against closed-form results (horizontal, angled equal and
  unequal heights, up/down launches, apex, time of flight, range, components at t, impact, never-reaches, invalid
  input); units, parsing, significant figures, scientific notation; the checker (tolerance, unit kinds, unit slips,
  signs, magnitudes, named wrong paths, rounding, choices, ordering); every family × level over 60 seeds (valid,
  keys grade right, wrong paths never graded right, same id rebuilds); keys cross-checked against an independent
  calculation from the numbers shown (600+ values); fixed difficulty; variety; separate history; curriculum status
  claims; lessons and formulas; every offered test topic at every level builds a full, valid, on-topic test.
- `tests/e2e/phystests.js` (54 checks): the twelve acceptance checks for the difficulty workflows — Simple guided,
  Normal / Challenging / Nightmare real tests, options and topics, answering, grading, results, separate history and
  diagnostics, resume, Math unchanged, layouts and phone.
- `tests/e2e/physics.js` (67 checks): switcher and persistence, separate data, a full run answered through the real
  inputs, leaving an active run, all layouts, lab tools mount and clean up, Goose Mode compatibility, five languages
  (no raw keys, no overflow), phone width.

## Known limitations

- Lessons, questions and translations are not yet reviewed by a Physics teacher; treat explanations as drafts.
- Only projectile motion (and its prerequisites) is built. Units PB (1-D kinematics, beyond graphs), PD–PH
  (forces, energy, electricity, thermal, waves) are planned, not started.
- Physics tests have no group-test codes, Study Room or Mistake Notebook yet (those remain Math-only). The AI
  tutor's "Explain my mistake" is not offered on Physics reviews.
- Physics tests are made only of multi-part written questions (one "Written Response" section); there are no
  separate multiple-choice / numerical-response sections like the Math unit-test layout.
- Physics Nightmare is a set of independent multi-stage problems, not one connected scenario across the whole test.
- Air resistance is never modelled (questions say so); g is 9.81 m/s² unless the Explorer's g selector is changed.
- Figures inside questions use point decimals in every language.
