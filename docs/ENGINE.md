# Question engine and BC Pre-Calculus 11 curriculum

This note covers the curriculum and question-engine overhaul: what was wrong, what the engine does now, how
questions are chosen, how answers are checked, what the course covers, and the measured results. Every number
here comes from a script in this repo (`tools/engine-audit.js`, `tools/engine-measure.js`) or from the tests
(`tests/bank.test.js`, `tests/e2e/curriculum.js`); re-run them to reproduce.

## 1. Audit: why questions repeated and why difficulty drifted

Measured on the code as it stood before the overhaul (`node tools/engine-audit.js`, N = 200 draws per family × format × level).

**Repetition**

| Cause | Where | Evidence |
|---|---|---|
| No question history at all: every question came from an independent random seed | `QuadBank.practicePool`, `QuadBank.buildTest` | Nothing stored what you had seen, so a small family simply repeated |
| Small parameter spaces | e.g. `readgraph` (35–58 distinct of 200), `disc`, `maxmin`, `matchgraph` at Simple | Mean duplicate rate 0.172 across 125 quadratics family × format × level combinations |
| One or two sentence templates per word problem | `projectile` (1 template shape), `optimize` (2) | Same wording with new numbers every time |
| Hand-written quiz pools of 4–17 questions per concept outside quadratics | Library concept quizzes and Review | Only "the last quiz" was avoided, so the same few questions came back |

**Difficulty drift**

| Cause | Where |
|---|---|
| `practicePool` filled a Simple session with Normal questions when a concept had too few Simple ones — 13 of 15 quadratics concepts, up to 100 % for some (complete the square, quadratic formula, applications) — and could fall back to the family's first mode | `js/quad-bank.js` `practicePool` |
| The selected difficulty defaulted to Simple, then silently became Normal once any records existed | `selectedMode()` in `js/app.js` |
| Drill buttons for a level a concept didn't have fell back to Normal | `renderDrills()` |
| Legacy Nightmare tiers I/II were mapped to the new Nightmare (≈ the old tier III) | preference migration |

Before the overhaul, 10 sessions × 6 questions per quadratics concept and level served **463 of 2,700 questions at a
different level than the one chosen** (see §6).

## 2. What the engine is now

```
js/engine/answers.js   AnswerCheck: poly · mono · interval · approx · graph answer kinds (exact, never text equality)
js/engine/bank.js      Bank: family registry, validation, seeded rebuild by id, history, selection, catalogue stats
js/curriculum.js       Curriculum: BC Pre-Calc 11 map (units A–I → 69 subtopics), live coverage
js/gen/unit-*.js       54 new generator families, one file per unit group
js/course-content.js   9 new lessons for units E, G, H, I (rational expressions, inequalities, trigonometry, finance)
```

**Families.** Each family declares: `id`, `unit`, `sub` and `subs` (curriculum ids), `concepts` (library lessons),
`kinds` (mc / nr / wr), `modes` (simple / normal / challenge — only the levels it really has), `templates`
(named sentence/structure variants), `complexity` per level, `answer` format, `prereqs`, `tags`, and a
`gen(rnd, mode, kind, K)` that builds one instance from a seed. A hybrid approach is used: authored sentence
templates and worked-solution text, procedural parameters with constraints (integer roots where a question
promises them, non-degenerate triangles, distinct options, money rounded to cents, …).

**Three sources, one registry.**

| Source | Families | Notes |
|---|---|---|
| New generators (`js/gen/`) | 54 | 178 declared templates; units A–I |
| Quadratics families (`js/quad-bank.js`) adopted as adapters | 35 | Mapped to F.* subtopics; their ids/instances are unchanged, so old saved tests still rebuild |
| Hand-written banks (radicals-era MC/NR incl. Tim's questions) | 16 | One family per concept; each authored question is one instance (188 questions). Tim's credit is kept |
| **Total** | **105** | 404 family × format × level combinations |

**Validation on every build.** `Bank.make` rejects an instance (and `generate` re-seeds, up to 300 times) if:
any text contains `NaN`, `undefined`, `Infinity` or `[object`; an MC question has fewer than 4 options, duplicate
options, or two options with the same value; an NR key doesn't grade as right against itself; any written part's
key response (`Bank.keyResponse`) doesn't grade as right with the real checker. **An invalid question is never
returned**: if no valid instance exists, `generate` throws and selection moves to another family.

**Rebuild by id.** Ids are `cb-<version>-<family>-<kind>-<s|n|c>-<seed36>`; `Bank.byId` rebuilds exactly the same
question (the tests check this for every family), so saved sessions, history and the Mistake Notebook keep working.

## 3. Choosing questions (transparent algorithm)

`Bank.select({ subs | concept, mode, n, kinds, missed })`:

1. **Level is fixed.** Only families that declare the requested level are eligible. If a subtopic has none, the
   result is `unavailable` and the app says so — it never fills from another level. Streaks, mastery, accuracy
   and time spent never change the level; they only influence *which topics* are suggested elsewhere.
2. **Subtopic rotation.** Each slot goes to the subtopic used least in this session, then least seen historically.
   In mixed sessions (unit mix, whole course) every 4th slot goes to a subtopic you got wrong in the last 14 days.
3. **Family rotation.** Within a subtopic, the family used least in this session, then least used in your last 120 questions.
4. **Instance.** A fresh seed is drawn and rejected if its signature is in this session or in your last 600
   questions (exact repeat), and — softly — if the same family+template was already used this session.
   A soft rejection is accepted only if nothing better appears in 300 tries.
5. **Revisits are labelled.** If a small family is exhausted, other families are tried first; only then is an
   older question reused, flagged as a revisit, and the end screen says how many revisits there were.
6. **History** (`campfire-prep.qhist.v1`): the last 600 questions as `{signature, family|template, family,
   subtopic, level, time}`. A corrupt value is treated as empty; selection still works with storage off.

Used by: the **Whole course** tab (subtopic, unit mix, full-course review), Skills drills, Simple guided practice,
Concept Library quizzes, Review's fresh questions, and the Studio+ launcher.

## 4. Checking answers

| Kind | What the student types | How it's compared |
|---|---|---|
| `poly` | an expression in x, e.g. `(x+3)(x-2)` | Exactly, as a rational function (polynomial division, gcd). Form checks: `factored` (fully, over the integers, common factor out), `expanded`, `simplified` (one reduced fraction). Equivalent but wrong form → partial marks with the reason |
| `mono` | exponent-law expressions in several letters | Value at six random positive points; form checks: positive exponents, radical form, power form |
| `interval` | `(-∞, 3]`, `x ≤ 3`, `x < -2 or x > 3`, `∅`, all reals | Parsed to a union of intervals and compared as sets; endpoints-right-brackets-wrong and opposite-region get specific feedback |
| `approx` | a rounded decimal | Within half a unit in the last requested place; "close, check your rounding" for near misses; known wrong values (e.g. degrees vs radians) get named |
| `graph` | a parabola built on an empty grid | Vertex (1 mark), points on the target curve within the snap tolerance (1), shape/direction from the student's own least-squares fit and points on both sides of the axis (1). Any order of placing points |
| existing | numbers, points, sets, restrictions, equations in a form | `MathCheck` / `QuadCheck`, unchanged |

Text equality is never used to mark algebra.

**Graphing on an empty grid** (`Graph.builder`): tools *Vertex* and *Points*, click or keyboard (Enter places,
arrows move, Delete removes), the learner's axis of symmetry is drawn through *their* vertex, *Draw curve* draws
*their* curve (fitted to their points), never the answer. Nothing about the correct graph is shown until the
answer is submitted; afterwards the correct parabola is drawn under theirs.

**Quadratic form conversions** are covered as separate families: vertex → standard (`f_vertex_to_std`),
standard → vertex by completing the square (`cts`), standard ↔ factored (`f_std_factored`), plus reverse
graphing (`graphtoeq`, `eqfromgraph`, `fromroots`), tables (`table`, `mirror`, `readgraph`) and transformations
(`transform`, `predict`) as their own selectable subtopics.

## 5. Curriculum coverage

Source: [BC Curriculum — Pre-calculus 11](https://curriculum.gov.bc.ca/curriculum/mathematics/11/pre-calculus).
In the app: Practice → **Whole course**. Coverage there is computed live from the registry (`Curriculum.coverage()`),
not declared; it is shown separately from your own results, and both are separate from mastery.

**69 of 69 subtopics have questions; 61 have all three practice levels.** The 8 with fewer levels are shown in the
app as "Not every level" and their missing level is disabled (not substituted):

- C.applications (Normal only — authored questions)
- D.substitution, F.std_to_vertex, F.solve_formula, F.modelling, F.errors, G.context, H.ambiguous (Normal and Challenging)

| Unit | Subtopics | Families serving them |
|---|---|---|
| A Real number system | classify · rational/irrational · sets · ordering | a_classify, a_decimal, a_sets, a_order + authored |
| B Powers with rational exponents | laws · negative · rational · convert · order of operations | b_laws, b_negative, b_rational, b_convert, b_order_ops + authored |
| C Radicals | simplify · mixed/entire · order · add · multiply · rationalize · restrictions · equations · graphical · applications | c_* (8) + authored |
| D Polynomial factoring | GCF · x²+bx+c · ax²+bx+c · special products · substitution · strategy | d_* (6) + authored |
| E Rational expressions & equations | NPVs · simplify · multiply/divide · add/subtract · equations | e_* (5) |
| F Quadratic functions & equations | 21 subtopics: forms, all conversions, vertex, direction, domain/range, intercepts, max/min, transformations, empty-grid graphing, graph → equation, tables, comparing, solving by factoring / square roots / formula / graphing, discriminant, modelling, error-finding | f_* (8) + 27 quadratics families |
| G Inequalities | linear · interval notation · sign analysis · quadratic · context | g_* (5) |
| H Trigonometry | standard position · reference · coterminal · special angles · terminal arm · equations · sine law · cosine law · ambiguous case | h_* (9) |
| I Financial literacy | compound interest · investments · loans · buy vs lease | i_* (4) |

The full per-subtopic list with levels and families is printed by:
`node -e 'require("./tests/load.js"); console.table(Curriculum.coverage().map(c => ({id: c.id, levels: c.modes.join("/"), families: c.families.join(", ")})))'`

## 6. Measured results

`node tools/engine-measure.js` (N = 200):

| Measure | Before | After |
|---|---|---|
| Quadratics sessions, 10 × 6 per concept per level: exact repeats | 101 of 2,700 (3.7 %) | **0 of 2,520** |
| …questions served at a level other than the one chosen | **463** | **0** |
| Whole course, 30 Normal sessions × 10: exact repeats | — (no whole-course mode) | **0 of 300**, all 9 units touched |
| Families | 30 quadratics + hand-written pools | **105** (54 new generators, 35 quadratics, 16 authored) |

(2,520 < 2,700 because a level that a concept doesn't have is now reported unavailable instead of being filled with
another level's questions.)

Raw generator diversity (independent seeds, *no* history) for the 230 new family × format × level combinations:
median 159 distinct of 200 draws; mean duplicate share 0.30. The smallest spaces — where history and family
rotation matter most — are `h_equations` and `h_special` at Simple (6–9 distinct: there are only so many special
angles), `b_rational` Simple (18–19), and `c_restrict` / `c_graphical` (24). These are listed honestly as
limitations below.

Documented tests (`tests/bank.test.js`): 25 Normal whole-course sessions × 10 → 0 exact repeats, 0 in-session
repeats; 8 sessions × 6 on each of F.vertex_to_std, G.quadratic, I.compound and D.trinomials → 0 repeats each.

## 7. Tests

- `tests/bank.test.js` (12 tests): every generator family × format × level × 40 seeds (validity, level label,
  worked solution, hints, distinct MC options, key graded right, rebuild by id); equivalent-answer acceptance for
  poly/mono/interval/approx; every quadratic conversion key accepted and a perturbed answer rejected; graph grading
  (order independence, tolerance, mirrored vertex, one side only, wrong direction, off-curve points); difficulty
  consistency (30 sessions at each level, no off-level item); no substitution when a level is missing; topic
  filtering and mixed rotation; the duplicate measurements above; history persistence, cap and corrupt storage;
  coverage computed from the registry.
- `tests/concepts.test.js`: every library concept can produce at least 4 questions through `Bank.select`.
- `tests/e2e/curriculum.js` (24 checks): the Whole course screen, level persistence, disabled-not-substituted
  levels, a subtopic run answered through the real inputs, six more topics answered with typed keys (factoring,
  exponent laws, finance rounding, trigonometry, rational expressions, form conversion), the empty-grid graph
  builder (clicked like a learner), correct graph shown only after submitting, new lessons, phone width.

## 8. Limitations

- Several Simple-level families have small spaces (above). History prevents exact repeats until a space is
  exhausted, after which repeats are labelled as revisits.
- Lesson bodies for the new units are English; titles and summaries are translated.
- No teacher has reviewed the new questions or lessons yet (they're marked so).
- Error categories in diagnostics are only as specific as the checker can tell automatically, or as you label them
  in the Mistake Notebook ("Not sure yet" otherwise).
- Interval and graph answers are typed/clicked; there's no handwriting input.
