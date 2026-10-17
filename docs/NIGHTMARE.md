# Nightmare mode

> **Current version:** Nightmare is now a single mode on quadratic functions: a five-stage gauntlet built around one generated function (stages `nm1`–`nm5` in `js/quad-bank.js`), no hints, exact answers only, about as hard as the old tier III. It is chosen from the Home carousel like any other mode. See [`REDESIGN.md`](REDESIGN.md).
>
> The three radicals tiers described below are **retired**. Their generator (`js/nightmare.js`) stays so that saved tests and history from that release still rebuild and display (`nm-` ids, levels `nightmare1`–`nightmare3`).

## The retired radicals tiers

Nightmare is a parent level next to Tim's Test, Normal and Challenge. It has three tiers, and you have to pick one:

| Tier | Level key | What it adds |
|---|---|---|
| Nightmare I — Brutal | `nightmare1` | Dense exponent laws with negative and fractional exponents, big radicands, like radicals with variables, single and binomial rationalizing, radical equations |
| Nightmare II — Extreme | `nightmare2` | Rational and negative exponents that interlock, nested radicals → ∜, conjugates with coefficients, cube-root denominators, double-radical equations, error analysis |
| Nightmare III — Catastrophic | `nightmare3` | Everything above, chained: three-factor exponent products, numerators to simplify before an ugly conjugate, and boss questions where (a) and (b) feed (c) |

## Selection flow

1. **Create test → Level → Nightmare.** Three tier cards appear, each with a generated sample. None is selected.
2. **Start is disabled until you pick a tier.** Its label then names the tier ("Start Nightmare II"). If a submit is forced anyway, the dialog stays open with "Choose Nightmare I, II or III first."
3. Switching to another level clears the tier. Coming back to Nightmare shows no tier selected.
4. The chosen level (`nightmare2`, say) is stored in the test config and session. It survives pause, resume, reload and results.
5. While you work, the test bar shows a chip (☠ Nightmare II · Extreme). The results header reads "Nightmare II — Extreme test".
6. The Basecamp progress tab "Nightmare" shows your last tier. If you've never picked one, it opens Create test to ask.
7. Group tests are switched off for Nightmare, because group codes only encode the original levels. The Campfire Companion stays exactly as you set it; Nightmare never turns it on.

## Question types

Each Nightmare test has 5 written-response questions, 5 numerical-response questions and 10 multiple-choice questions. The WR questions are worth 4, 5, 2, 3 and 5 marks, matching the real test's shape.

| Template | Kind | What it asks |
|---|---|---|
| `exp` | MC / NR | Quotient of powers of monomials with rational and negative outer exponents (tier III: three factors). The NR version asks for k + m + n (+ p) of the integer form k·aᵐbⁿcᵖ. |
| `rad` | MC / NR | Like radicals with variables (√ or ∛), including a mixed `^{1/2}` term. The NR version asks for k. |
| `nest` | MC | Nested radicals with variables, rewritten as a single rational power of each variable |
| `rat` | MC | Rationalize a binomial denominator (with coefficients in tiers II and III) |
| `fatal` | MC | Find the Fatal Error: a four-line student solution with exactly one planted error, asking for the first wrong line |
| `rpow` | NR | Evaluate an exact product of rational powers, like (16/81)^(−3/4) |
| `w1` | WR, 4 marks | Radical gauntlet (a), and in tiers II and III the Nested Abyss with a ∜ answer (b) |
| `w2` | WR, 5 marks | Conjugate Chamber: monomial or cube-root denominator, a binomial conjugate, and a numerator that must be simplified first |
| `w3` | WR, 2 marks | Radical equation (double radical in tiers II and III) |
| `w4` | WR, 3 marks | Single-radical equation: candidates, then solutions, then extraneous roots |
| `w5` | WR, 5 marks | Boss question: P (exact rational powers), Q (radical sum), then PQ over a binomial, rationalized |

Every MC distractor comes from a named error model, such as adding exponents instead of multiplying, forgetting the coefficient, flipping the sign of a negative exponent, not halving under a root, or the wrong conjugate. Each distractor carries a "Likely slip" explanation. It appears in practice feedback and in the test review when that choice is picked.

All variable questions say "Assume all variables are positive."

## Generation and ids

Generated question ids look like `nm-<version>-<tier>-<kind>-<template>-<seed>`. The question is rebuilt deterministically from its id with `Nightmare.byId(id)`, so a saved test, its review and history all rebuild the same questions without storing them. The app's `BANKS` maps fall back to `byId` for `nm-` ids.

## Verification (inside the generator)

Nothing reaches the student unless it passes these checks. A failed check throws, and the generator re-seeds, with up to 400 tries per question.

- **Exact arithmetic.** Fractions, monomials with rational exponents, and sums of radicals are all handled exactly. `fpow` refuses any power that isn't exact.
- **Typed keys.** Every typed key must be graded **right** by the site's own checker (`MathCheck.grade`), in the required form ("simplest" or "rationalized"). Its value must also match an independently computed floating-point value.
- **Monomial keys.** Each one is compared with a direct evaluation at three positive sample points, using relative tolerance.
- **MC choices.** Choices must differ as text and in value at every sample point, and there must be exactly three distractors.
- **Radical equations.** These are built from chosen roots. Every candidate is checked in the original equation to classify it as a solution or extraneous.

## Verification (tests, from the outside)

`tests/nightmare.test.js` re-checks generated questions with `tests/texeval.js`, a small LaTeX evaluator that shares no code with the generator. It checks the following:

- **MC questions.** The displayed expression equals the keyed choice, and no distractor, at three points. For Find the Fatal Error, the keyed line is the first line that is actually false.
- **NR exponent laws.** The exponents are recovered from the expression by doubling each variable. The test checks that they and k are integers and that they sum to the key.
- **NR radicals and powers.** k times the stated form equals the expression, and the rational powers evaluate exactly to the key.
- **WR keys.** Every key is graded right by the checker and equals the printed expression. Equation solutions satisfy the original equation; candidates satisfy the squared one; extraneous roots fail the check. The worked solution's quadratic has the candidates as roots. Boss parts (a) and (b) match P and Q, and (c) equals PQ over the printed denominator.
- **Decimal answers.** A decimal answer to an exact question is not graded right.
- **Text hygiene.** No "+ −", "− −", stray "·", "1√", "undefined" or "NaN".
- **Test shape.** Each test has 5/5/10 questions, the WR marks are 4/5/2/3/5, ids are distinct and `byId` round-trips exactly.
- **Difficulty and speed.** Difficulty rises with the tier, and all three tiers build in well under 2 s.

Run it with more seeds: `NM_SEEDS=1000 node --test tests/nightmare.test.js` (default 60 per template per tier).

## Limitations

- The answer checker reads numbers and radicals but not variables. Variable answers are therefore MC, or NR with an integer read-off (k, or k + m + n). Only numeric answers are typed.
- Nightmare can't be a group test yet (group codes have no room for the tier).
- Nightmare results count as "hard" levels, like Challenge. They are kept in history and shown in results, but left out of accuracy-based mastery and the Mistake Notebook. That way, a brutal test doesn't sink your everyday mastery estimate.
- Tiers are calibrated by structure (number of factors, nesting, coefficient sizes), not yet by real student data.
