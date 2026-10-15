# 🔥 Campfire Prep — Pre-Calc 11

A 60-minute, **34-mark** Pre-Calculus 11 practice test, laid out like the radicals unit test, with a campfire buddy.

| Section | Marks | What's in it |
|---|---|---|
| **Written Response** | 19 | Q1 identify mixed/entire radicals & convert (4) · Q2 rationalize the denominator ×3 (5) · Q3 radical equation (2) · Q4 radical equation with extraneous roots (3) · Q5 word problem (5) |
| **Numerical Response** | 5 | type a single number |
| **Multiple Choice** | 10 | radicals, conjugates, factoring, number sets (natural → real), exponent laws, find-the-student's-mistake, multiple ways to simplify, perimeter/area/side length |

- **Create test** opens a setup screen with:
  - **Level:** *Tim's Test* (a fixed practice test written by our classmate Tim, a bit softer than the real one), *Normal* (unit-test level) or *Challenge* (much harder)
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
- **Campfire minigame: one switch.** In *Create test*, **Campfire minigame** is off by default, which gives just you and the test. Turn it on and you get the **full campfire** (recommended): the puppy and fire, plus every mechanic and every random event:
  - **Vent:** lets extra heat out.
  - **Oxygen & bellows:** storms thin the air.
  - **Kettle:** use the valve, or the lid pops harmlessly.
  - **Wind & compass:** match the ventilation to the wind.
  - **Puppy & tent:** 10 hearts, and it rests in the tent.
  - **15 events:** peaceful, moderate and rare severe ones.

  *Customize* (folded away) lets you pick individual mechanics and events, set the fire pace, or add the extra-challenge switches (*Puppy can lose*, *Armadillo mode*). Those two stay off unless you choose them. *Back to full* restores the recommended set. Events are announced with small notices on the scene, never pause the test or cover a question, and wait while you're typing; only one disruptive event happens at a time. On phones the controls fold into a "Camp controls" row. Shortcuts: <kbd>V</kbd> vent, <kbd>O</kbd> bellows, <kbd>K</kbd> valve, <kbd>T</kbd> tent.
- **Scratchpad:** a floating notepad you write on with the mouse (left button), a pen or a finger. Drag it by its title bar, resize it from the corner, expand it, or minimize it to a pill (shortcut `N`). It has pencil, blue and red ink, three line widths, an eraser, undo (`Ctrl+Z`) and clear. Each question gets its own page, and your scratch work appears in the review next to the worked solution.
- **Results:** your mark by section and by topic, time used, average and per-question time, and review with your answers, the key, part marks, worked solutions and marking keys.
- **Saving:** history is kept in the browser. Each test is ranked by percentage, then by time, and the game tells you when you've set a new personal best. Tests in progress survive a refresh.

## The learning platform

Around the tests sits a study app with four places, reached from the floating bar at the top: **Basecamp**, **Library**, **Review** and **My Learning**. Everything works without an account, and your data stays in your browser.

- **Concept Library:** 16 lessons across number systems, exponents, radicals and factoring.
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
- **Study rooms** (Basecamp → *Open a study room*): an extension of group tests, still with no server.
  - Pick concepts and how many questions.
  - Choose **self-paced** or **together** (a shared start time, with a fixed number of seconds per question, so everyone is on the same question at once).
  - Turn hints and the tutor on or off.
  - Share the code or link; everyone gets the identical set.
  - At the end you can copy a result code holding only your name and which questions you got right. Paste friends' codes for a group summary and the concepts the group should review.
- **AI tutor** (the round ✦ button, bottom-right corner): a glass panel that knows which page you're on.
  - It explains, hints, guides, quizzes, and helps with a notebook mistake or a study file.
  - **It is completely unavailable while any test is running or paused, including during the tour.** If a paused test is waiting, the button shows a 🔒 with *Resume test* / *Discard test*.
  - Your learning records are only shared if you tick *Use my learning records*.

How it is built, the security and privacy model, and what's tested: [`docs/LEARNING_PLATFORM.md`](docs/LEARNING_PLATFORM.md) (v7) and [`docs/V8_REDESIGN.md`](docs/V8_REDESIGN.md) (this redesign).

No build step and no dependencies to install. It's plain HTML, CSS and JavaScript. KaTeX, which renders the math, is included in `vendor/`.

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
index.html          page + campfire scene (inline SVG)
css/style.css       all styling
js/bank-mc.js       multiple-choice bank
js/bank-nr.js       numerical-response bank
js/bank-wr.js       written-response bank (Q1–Q5 variants, rubrics, worked solutions)
js/mathcheck.js     reads typed math and checks value + simplest form
js/campfire.js      heat simulation for the buddy
js/companion.js     Campfire Companion: optional mechanics, event scheduler, compact controls
js/scratchpad.js    floating drawing pad (one page per question)
js/bank-classmate.js Tim's Test (fixed practice test, credited to Tim)
js/bank-challenge.js Challenge-level banks
js/group.js         group-test and study-room codes, seeded shuffles, result codes
js/insights.js      Basecamp analysis: topic mastery, habits, trends
js/tour.js          guided-tour spotlight
js/concepts.js      Concept Library content + question → concept tagging
js/learning.js      evidence, mastery, spaced repetition, Mistake Notebook, recommendations, exam plan, document matching (no AI)
js/docs.js          uploads: PDF/text extraction in the browser, IndexedDB storage
js/practice.js      shared question runner (concept quizzes, reviews, notebook retries, rooms)
js/library.js       Concept Library screen
js/review.js        Review screen: spaced repetition + Mistake Notebook
js/analyst.js       My Learning screen (next step, plans, exam plan, profile, study materials, evidence inspector)
js/rooms.js         study rooms (shared practice sets on room codes)
js/tutor.js         floating AI tutor (page-aware, hidden during tests)
js/app.js           flow, Basecamp, test, timer/pause, results, saving
api/tutor.js        Vercel function: validates, rate-limits, calls the Anthropic API
vendor/katex/       math rendering (MIT license)
vendor/pdfjs/       PDF text extraction (Apache-2.0 license)
tests/              unit tests (npm test) and browser tests (tests/e2e)
docs/               architecture and engineering notes
```

## Tests

```bash
npm test                     # 46 unit tests: concepts, mastery, spaced repetition, notebook, exam plan, room codes, campfire companion, API (AI mocked)
node tests/e2e/devserver.js  # local server with a MOCKED tutor on :8766
MOCK_OFF=1 PORT=8767 node tests/e2e/devserver.js   # same, with no key (for the "not connected" check)
npm run test:e2e             # 124 Playwright browser checks (needs Playwright + Chromium installed)
```
