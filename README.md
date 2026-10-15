# 🔥 Campfire Prep — Pre-Calc 11

A 60-minute, **34-mark** Pre-Calculus 11 practice test, laid out like the radicals unit test, with a campfire buddy.

| Section | Marks | What's in it |
|---|---|---|
| **Written Response** | 19 | Q1 identify mixed/entire radicals & convert (4) · Q2 rationalize the denominator ×3 (5) · Q3 radical equation (2) · Q4 radical equation with extraneous roots (3) · Q5 word problem (5) |
| **Numerical Response** | 5 | type a single number |
| **Multiple Choice** | 10 | radicals, conjugates, factoring, number sets (natural → real), exponent laws, find-the-student's-mistake, multiple ways to simplify, perimeter/area/side length |

- **Create test** opens a setup screen with:
  - **Level:** *Classmate's test* (a fixed test a classmate wrote, a bit softer than the real one), *Normal* (unit-test level) or *Challenge* (much harder)
  - a **time slider** from 10 to 120 min (default 60)
  - **campfire mode**
  - **Puppy can lose:** a burn or freeze is game over for the campfire, but you can always keep going with the test
  - **Armadillo mode:** the clock drains 2×, 3× or 5× while the fire is neglected
  - **Group test**
- **Group tests (no server needed):** a 12-character code or invite link (`#g-CODE`) packs the level, time limit, a random seed and an optional shared start time.
  - Everyone who joins gets the identical test, and with a start time everyone's clock runs together.
  - Afterwards, each person copies a result code into the group scoreboard. It shows rankings, a question-by-question grid, and the questions nobody got full marks on.
- **Turn off campfire** mid-test, at any time, to focus on the math.
- **Flow:** title screen → a skippable guided tour on a sample test (first visit, or any time from *How to play*) → **Basecamp**, the home base between tests.
- **Basecamp:**
  - start or resume tests, and pick the buddy mode (Chill, Normal or No campfire)
  - stat tiles and a score-trend chart
  - **What to work on:** your weakest topics, each with a fix-it tip
  - **Where marks slip away:** marks lost to habits like unsimplified answers or kept extraneous roots, plus your slowest topic
  - full test history and mastery for every topic (recent tests count more)
- **Sticky top bar** with section progress, the timer, **Pause** and Quit.
- **Pause** (or `P`) freezes the clock and locks the screen. You can close the tab and resume later from Basecamp with the same time left. Quitting without pausing keeps the clock running, like a real exam.
- **Banks:** 29 written-response variants (about 6 per slot), 24 numerical-response questions and 98 multiple-choice questions. Each test draws a fresh set.
- **Marking like a teacher:** typed answers such as `3√2` or `(6+2√5)/7` are checked by `js/mathcheck.js`.
  - A right value that isn't in simplest form (unsimplified radical, unreduced fraction, uncombined like terms) loses a mark.
  - Leaving a radical in the denominator earns 0 on a rationalizing part.
  - Keeping an extraneous root loses a mark.
- **Campfire buddy:** the fire cools over time, and logs take a few seconds to catch. Too much fuel and the camp burns 🔥; too little and the puppy freezes 🧊. It has Chill, Normal and Off modes, and never affects the mark.
- **Scratchpad:** a floating notepad you write on with the mouse (left button), a pen or a finger. Drag it by its title bar, resize it from the corner, expand it, or minimize it to a pill (shortcut `N`). It has pencil, blue and red ink, three line widths, an eraser, undo (`Ctrl+Z`) and clear. Each question gets its own page, and your scratch work appears in the review next to the worked solution.
- **Results:** your mark by section and by topic, time used, average and per-question time, and review with your answers, the key, part marks, worked solutions and marking keys.
- **Saving:** history is kept in the browser. Each test is ranked by percentage, then by time, and the game tells you when you've set a new personal best. Tests in progress survive a refresh.

No build step and no dependencies to install. It's plain HTML, CSS and JavaScript. KaTeX, which renders the math, is included in `vendor/`.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Put it on GitHub

```bash
git remote add origin https://github.com/<your-username>/campfire-prep.git
git branch -M main
git push -u origin main
```

(This folder is already a git repo with one commit. If you made the repo empty on GitHub, the commands above are all you need.)

## Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. Framework preset: **Other**. Leave the build command and output directory **empty**.
3. Click **Deploy**. Every push to `main` redeploys automatically.

**GitHub Pages also works:** in the repo, go to Settings → Pages → Deploy from branch → `main` / root.

## Adding or editing questions

- `js/bank-mc.js` holds multiple choice. **The first choice is always the correct one** (choices are shuffled during the test).
- `js/bank-nr.js` holds numerical response: `answer` is a number.
- `js/bank-wr.js` holds written response. Use the `Q1(...)`–`Q4(...)` helpers, or copy a Q5 word problem.
  - Each part has an `answer` typed the way a student would (`"3+√5"`, `"(4-√6)/2"`) and a `form`:
    - `simplest`
    - `rationalized`
    - `entire`
    - `value` (accept any equal form)
  - Equation parts use `kind: "set"` with a list of solutions (`[]` means none).

Math in question text goes inside `\( ... \)`. Don't rename existing ids, because saved history refers to them. To change the test length or time limit, edit `SECTIONS` / `TEST_SECONDS` at the top of `js/app.js`.

## Files

```
index.html          page + campfire scene (inline SVG)
css/style.css       all styling
js/bank-mc.js       multiple-choice bank
js/bank-nr.js       numerical-response bank
js/bank-wr.js       written-response bank (Q1–Q5 variants, rubrics, worked solutions)
js/mathcheck.js     reads typed math and checks value + simplest form
js/campfire.js      heat simulation for the buddy
js/scratchpad.js    floating drawing pad (one page per question)
js/bank-classmate.js classmate's fixed practice test
js/bank-challenge.js Challenge-level banks
js/group.js         group codes, seeded shuffles, result codes
js/insights.js      Basecamp analysis: topic mastery, habits, trends
js/tour.js          guided-tour spotlight
js/app.js           flow, Basecamp, test, timer/pause, results, saving
vendor/katex/       math rendering (MIT license)
```
