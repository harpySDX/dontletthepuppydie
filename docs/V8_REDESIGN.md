# Campfire Prep v8: application redesign and connected learning systems

This is the engineering report for the "premium learning application + five learning systems" pass. For the v7 architecture (Concept Library, analyst, tutor, `api/tutor.js`), see `docs/LEARNING_PLATFORM.md`.

## 1. What already existed (audit)

**Architecture:**

- A static site: plain HTML/CSS/JS, no build step.
- One Vercel function, `api/tutor.js`.
- All personal data lives in the browser: `localStorage` keys `campfire-prep.*`, plus IndexedDB for files.
- There are **no accounts, no database and no server-side records**.

**Features:**

- Practice tests at three levels (Tim's Test, Normal, Challenge), with a timer, pause/resume and the scratchpad.
- The campfire game: Chill / Normal / Off, "Puppy can lose" and Armadillo mode.
- Group tests, using server-free codes and result codes.
- Basecamp insights.
- The Concept Library (16 concepts with stable IDs), concept quizzes and lesson feedback.
- My Learning: a deterministic evidence model, recommendations, a time-budget plan and exam date/units.
- Study-file analysis in the browser.
- The floating page-aware tutor, locked during tests.

**Missing or incomplete:**

- Spaced repetition. There was only a crude "review due after 7 days" status.
- A Mistake Notebook.
- A day-by-day exam plan.
- Study rooms.
- Delayed-retrieval and variety requirements for mastery.
- An evidence inspector.
- The application shell and visual system.

The baseline before changes: 21 unit tests, 58 + 13 browser checks, all passing.

## 2. What was added or changed, and what was left out

**Visual system and shell:**

- New grey-blue design tokens. Surfaces step up: `--bg` #161b23 → `--sunken` → `--surface` → `--elevated`.
- Text tokens: `--ink` #e7ecf2, `--muted` #a1adbc, `--faint`.
- A steel-blue accent, with orange (`--ember`) kept for primary actions.
- Spacing, type, radius and shadow tokens. Legacy token names map onto the new scale, so the existing game screens restyle without rewrites.
- **Glass** (translucent + `backdrop-filter`) is used only on floating chrome:
  - the top navigation bar
  - the Library sidebar
  - the tutor launcher tooltip, panel and lock notice

  Reading content and questions stay on opaque surfaces or "question paper". There is a solid fallback where `backdrop-filter` is unsupported, and reduced-motion is respected.
- **Shell:** a floating inset nav with four destinations (Basecamp, Library, Review with a due-count badge, My Learning). Tests keep their focused workspace: no nav, no tutor, no sidebars.
- **Typography:** Inter for UI (system fallback), Fraunces kept for page titles. Standardised buttons (primary / accent / secondary / ghost / quiet / link), pills, chips, callouts (idea / tip / warning / note), inputs, segmented controls, focus rings, and empty, error and disabled states.

**Concept Library:**

- Three columns: a collapsible glass sidebar with search and filters, the lesson at a ~760 px reading width, and a context panel.
- The seven-part lesson structure.
- Worked examples with numbered, separated steps.
- Mistakes shown as warning callouts.
- Prerequisite and related chips that show your status.
- A practice block, plus a mastery checklist with ✓ / not yet.
- The context panel shows your evidence, the review schedule, notebook mistakes, an "on this page" table of contents and one tutor entry point.
- No lesson content was removed or invented, and concept IDs are unchanged.

**My Learning:**

- A *Next up* hero: today's review first, otherwise the top recommendation, with the exam countdown beside it.
- Four status summary cards that filter the profile.
- Study plan tabs: **Today** (the time budget) and **Until the exam** (the adaptive plan).
- An exam & schedule card: date, units, minutes per day, study days, priorities.
- A sortable, filterable concept profile with priority stars, which opens the **evidence inspector** (a side sheet).

**Five learning systems (§4):** spaced repetition, the Mistake Notebook, adaptive exam prep, study rooms and mastery v2.

**Shared practice runner (`js/practice.js`):** one runner for concept quizzes, daily reviews, notebook retries and rooms. It supports MC, NR and individual written-response parts. Each question is recorded once per run.

**Deliberately left out:**

- **Accounts, cross-device sync and server-side storage.** These would need auth, a database and a privacy review for minors. The task forbade fake or partial security, so it stays client-side with no server records.
- **Real-time room features:** presence, a host advancing everyone's screen, live answer sharing and chat. These need a server. Rooms instead sync through a shared clock encoded in the code.
- **Charts.** Status pills, counts and a 7-day review strip communicate more honestly than charts for small data.
- **New lesson content.** Quality was preferred over quantity.

## 3. Changed files

| File | Change |
|---|---|
| `css/style.css` | token layer rewritten; the v7 block replaced by the v8 design system, shell, library, review, My Learning, rooms, tutor and sheet styles |
| `index.html` | nav with icons, a Review tab and badge; new Library markup (sidebar head, filter, context panel); **Review** screen; **Study room** screen; room dialog; evidence sheet; new scripts; Inter font; deploy self-check extended |
| `js/learning.js` | evidence records now carry `kind`, `part`, `response`, `verdict` and `note`; **mastery v2**; **spaced repetition**; **Mistake Notebook** engine; **exam planner**; recommendation inputs for priorities, mistakes and due reviews |
| `js/practice.js` | **new**: the shared runner |
| `js/library.js` | rewritten on the runner; seven-part lesson; context panel; filter and collapse; mastery checklist |
| `js/review.js` | **new**: Review screen (daily review, 7-day strip, Mistake Notebook) |
| `js/analyst.js` | rewritten: hero, summary cards, plan tabs, exam plan, settings, sortable profile, evidence inspector, study materials |
| `js/rooms.js` | **new**: study rooms |
| `js/group.js` | room codes and room result codes |
| `js/app.js` | `learningState()` builds the shared state (mastery, schedule, notebook, recommendations, abandoned-test rule); new keys; review/room routing; `#r-` links; join box accepts room codes; sheet helpers; WR helpers exposed |
| `js/tutor.js` | allowed on Review, and in rooms only when hints are on; the opt-in learning summary includes the schedule, notebook categories and exam scope; new suggestions |
| `tests/engine.test.js` | **new**: 10 tests |
| `tests/e2e/browser.js`, `tests/e2e/regressions.js` | rewritten and extended |
| `README.md`, `docs/V8_REDESIGN.md` | docs |

## 4. Data model and migrations

**There are no destructive migrations.** All existing keys are read as before. The only change to old data is additive: the practice log now also stores `kind`, `part`, `response`/`choice`, `note` and `source`. Older entries without those fields still count as evidence; they just show "(answer not saved)" style gaps in the notebook.

New or extended keys:

| Key | Holds |
|---|---|
| `campfire-prep.practice.v1` | every practice answer, from quiz, review or room; capped at 4,000 |
| `campfire-prep.notebook.v1` | only the student's own notebook edits: `{ key: { understood, cat, note } }`. The mistakes themselves are derived from the answer records, so nothing is stored twice. |
| `campfire-prep.exam.v1` | extended with `minutesPerDay`, `days` and `priorities` |
| `campfire-prep.room.v1` | the current room's local answers, so a refresh resumes |
| `campfire-prep.libcollapsed` | the sidebar preference |

Stable concept IDs are shared by the question banks (`conceptsFor`), lessons, mastery, schedule, notebook, exam plan, rooms (a bit mask over the concept list) and the tutor context.

## 5. How mastery, scheduling and recommendations work

All of this is deterministic code in `js/learning.js`. **No AI produces any number.**

**Evidence:**

- one record per answered MC/NR question or written-response part, from tests, quizzes, reviews and rooms
- Challenge-level records are kept separate
- blank answers from a test where more than half was left blank are ignored, so an abandoned test isn't read as "doesn't know it"

**Mastery v2 (statuses):**

- *Needs work*, *Early warning*, *Developing*, *Improving*
- **Strong, not yet proven**
- *Due for review*
- **Confident**
- *Not enough evidence*, *Not started*

**Confident** requires *all* of the following; meeting the accuracy bar without the last two gives "Strong, not yet proven", and the explanation says exactly what's missing:

- moderate evidence: at least 3 answers over 2 or more sessions
- at least 3 **different** questions
- about 85% overall and 80% recently
- at least one **delayed retrieval**: a session scoring 80% or more that came 2 or more days after the previous session on that concept

Challenge answers count toward variety ("harder questions right") but never toward accuracy. Accuracy is shown as marks (e.g. 7/9) rather than precise percentages.

**Spaced repetition:** a Leitner schedule replayed from the sessions each time, so new evidence reschedules automatically.

- Per session: a score of 80% or more moves up one step; 50–79% stays (at least step 1); under 50% goes back to step 0.
- The intervals are 1, 1, 3, 7, 14 and 30 days.
- Due date = the day of the last session + the interval.
- "Learning" means step ≤ 1; "Review" means step ≥ 2; concepts that were never practised are never scheduled.

**Mistake Notebook:**

- Wrong answers are grouped by question and part, so they're deduplicated.
- Later attempts of the same question are retries: right → the next revisit (1, 3, 7 days); wrong → back to the start. Three right in a row means **fixed**.
- **Error type** is detected only where the marker can tell:
  - unsimplified or unrationalized answers → *form*
  - extraneous roots → *didn't check*
  - inequality direction or a negated number → *sign*
  - blank → *blank*
  - otherwise *Not sure yet*

  The student can override any type.
- Blank answers from abandoned tests are excluded.

**Recommendations:** ranked by status, with bonuses for:

- recurring errors and lower accuracy
- a review being due
- student priorities
- open notebook mistakes
- "confusing" votes
- appearing in uploaded material (only for concepts not yet Confident)

A prerequisite-first rule applies. Each recommendation shows *why* and *how you'll know*.

**Adaptive exam plan:** recomputed from **today** on every view, so missed days and new results re-balance it. It uses only the student's study days before the exam, filled up to minutes per day:

1. reviews due by that day, plus notebook mistakes on day 1
2. a full practice test 1–2 days before the exam, if 45+ minutes are available
3. follow-up quizzes for weak concepts 2 days after they were studied
4. new work from the ranked recommendations

It also has these properties:

- **Scope:** "on your exam" only for units the student ticked. Concepts suggested by an uploaded file are marked "from your file", meaning inferred and unconfirmed. With no units chosen, it says the scope isn't set.
- **Overflow:** notes say what didn't fit.
- **No promises:** it promises no grade.

## 6. Study rooms (on the existing group-code system)

**The code:**

- A 16-character room code (version 3, with a checksum) packs: a concept bit mask, the question count, self-paced vs together, seconds per question, hints on or off, a seed, and the start minute.
- Everyone builds the identical question set and choice order from the code.
- The join box and `#r-…` links accept room codes; group-test codes are unchanged.

**Pacing:**

- **Together:** each question has a fixed window from the shared start time. Students answer within it; afterwards they "wait for the group". Missed windows show as unanswered and are **not** saved as evidence. Late joiners start at the current question.
- **Self-paced:** everyone works through the same set on their own.
- Refresh and rejoin restore your answers; nothing is double-counted (one record per question per room).

**Privacy and integrity:**

- No answers ever leave the device.
- The optional result code holds only a name and right/wrong/unanswered per question.
- The group summary dedupes codes by name, rejects codes from other rooms, and separates *your* result from the *group* view.
- With hints off, the tutor and hints are unavailable in the room.

**Limits:** no host controls beyond creating the room, no presence and no live push. These need a server.

## 7. Security and privacy

- **No new server endpoints and no new storage of student data on any server.** `api/tutor.js` is unchanged: same validation, origin check, access code, rate limit and context size cap.
- The tutor receives new context only when the student sends a message:
  - the question on screen in a review or room
  - the selected notebook mistake, which is the student's own answer, shown on screen
  - the opt-in learning summary, which now includes schedule and notebook counts
- Answers to unchecked questions are never sent.
- The tutor stays **hidden during every live test, a paused or saved unfinished test (locked), and the tour**. It is enforced from session state, not the URL.
- Rooms share nothing automatically. Result codes are opt-in and minimal.
- All model output and user text is escaped before rendering.
- Practice responses are capped at 200 characters, and the log at 4,000 entries.

## 8. Tests and build results (run 15 Oct 2026)

There is no build step and no linter configured; every JS file was syntax-checked by loading it in Node's `vm`.

| Suite | Result |
|---|---|
| `npm test`: 31 unit tests. These cover concepts (4), learning v1 (9), **engine v8 (10)** and the API with mocked AI (8). The v8 tests cover: one-sitting ≠ Confident; varied + delayed → Confident; repeated question ≠ variety; Challenge never lowers accuracy; SRS steps up and down; rescheduling on new evidence; notebook dedupe, categories, fixed after spaced retries, relapse; WR note categories; exam plan days, scope and follow-ups; room-code round trip and tamper rejection. | **31 / 31 pass** |
| `tests/e2e/browser.js`, Chromium with a mocked AI. Covers: the shell; empty states; library search, filter and collapse; the 7-part lesson; quiz on the runner; tutor context; notebook dedupe, edit, understood, search and retry; reviews becoming due after time passes, the badge, a full daily review and rescheduling; My Learning hero, cards, exam plan scope and minutes, priorities, sorting, filtering; the evidence inspector; documents; the AI analyst; test lock, pause, reload, resume and submit; explain-mistake; the tour; mobile at 390 px. | **69 / 69 pass** |
| `tests/e2e/regressions.js`. Covers: the unconfigured tutor; group test create, link and start; Armadillo; Puppy-can-lose game over and continue; discard from the lock notice; an expired session; **rooms**: identical set across two browsers, hints, refresh resume, result codes (dedupe and bad codes), group summary, evidence saved once; a **synced room with a fake clock**: countdown, start, move-on, unanswered not saved, waiting, results, no-hints room hides the tutor. | **34 / 34 pass** |
| No JavaScript errors in any run. Google Fonts being blocked by the sandbox is ignored. | ✓ |

## 9. Known limitations

- **Single device:** browser storage only, with no sync, teacher view or backup. Clearing site data erases progress.
- **Rooms** can't show who's online, and the host can't control the pace beyond the encoded clock. Room codes can only encode up to 16 concepts, which is exactly the current list. Adding concepts needs a new code version.
- **The exam plan** uses time estimates (5–15 minutes per activity). It schedules from today every time, so it doesn't keep a history of planned-versus-done sessions.
- **Error categories** are heuristic for MC/NR and only certain where the marker gave a reason; everything else is "Not sure yet" until the student sets it.
- **Not tested here:** the live AI (no key in the build environment, so all replies were mocked), Safari and Firefox, and real phones. The Inter font falls back to the system font if Google Fonts is blocked.

## 10. Environment variables and deployment

No change from v7:

- `ANTHROPIC_API_KEY` (required for the tutor)
- `TUTOR_ACCESS_CODE` (recommended)
- `TUTOR_MODEL` (optional)

Upload the whole folder, including the new `js/practice.js`, `js/review.js` and `js/rooms.js`. The deploy self-check banner names any missing file. Then redeploy.

## 11. Recommended manual QA checklist

1. Take Tim's Test as a diagnostic → Results → *Explain my mistake* → the tutor answers about that question.
2. Open **Review**:
   - the notebook lists the wrong answers
   - change an error type, then reload; it sticks
   - *Retry* one, then *Mark understood* on another
3. Library → a weak concept:
   - check that the side panel's evidence matches the profile
   - do the quiz and confirm the status and next review update
4. My Learning → set an exam date 1–2 weeks out, untick a unit, set 45 min and weekdays only:
   - the plan only uses weekdays before the exam
   - nothing comes from the unticked unit
5. The next day (or after 1+ days): Review shows **Today's review**, the nav badge shows a count, and finishing it reschedules.
6. Study room:
   - open one on a laptop and join on a phone with the link; the same questions appear
   - try *Together* with a 1-minute start
   - swap result codes and check the group summary
7. Start a test, pause, go to Basecamp: the tutor shows 🔒. Reload: it's still locked. Resume, submit: the tutor is back.
8. Phone check: nav, Library (the list folds away after choosing), Review cards, My Learning, and the tutor bottom sheet.
