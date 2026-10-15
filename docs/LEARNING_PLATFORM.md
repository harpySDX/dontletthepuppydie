# Campfire Prep v7: learning platform engineering notes

This upgrade turns the practice-test game into a learning platform with three parts:

- a **Concept Library**
- a deterministic **learning analyst** (My Learning)
- a **page-aware floating AI tutor**

The tests, timer, pause, group tests and campfire game are kept intact.

## 1. Existing architecture (before this change)

- **A static site with no build step:** `index.html`, `css/style.css`, and plain-JS modules in `js/` (IIFEs on `window`). KaTeX is vendored.
- **No server and no accounts.** All state lives in `localStorage` under `campfire-prep.*`:
  - history (`history.v2`)
  - the in-progress session (`session.v2`)
  - prefs and the tour flag
- **Group tests are serverless:** a 12-character code packs a seed, the level and the start time, and results are exchanged as codes.
- **Marking** happens in `js/mathcheck.js`, which checks both the value and simplest form. Basecamp analysis lives in `js/insights.js`.
- **Hosting** is on Vercel as static files. GitHub Pages also works.

### The architectural decision

The site stays **static plus one serverless function**. Personal data (attempts, quiz answers, uploaded files) stays in the student's browser. The decision rests on four points:

- There are no accounts and no database.
- The server stores nothing about students.
- No client-side authorization is trusted, because the server holds no data that needs protecting per student.
- The only server secret, the API key, never leaves the function.

This was chosen over adding auth and a database for three reasons:

- it keeps the "upload to GitHub, import to Vercel" deployment the owner already uses
- it avoids collecting minors' data
- it needs no destructive migration: existing `localStorage` data is read as-is, and the new keys are additive

The cost is that progress doesn't sync across devices (see Limitations).

## 2. Features implemented

### Concept Library (`js/concepts.js`, `js/library.js`)

- **Content:** 4 units and 16 concepts with stable IDs (`radicals.rationalize`, …). Each concept has:
  - an explanation, the big idea, rules (KaTeX)
  - worked examples (collapsible)
  - common mistakes with fixes
  - prerequisites and related concepts, and difficulty
  - source and version metadata
- **Review status:** every lesson says *"Written for Campfire Prep. Not yet reviewed by a teacher."* (`reviewed: false`).
- **Tagging:** every bank question is tagged to concepts, per question and per written-response part (`conceptsFor(q, partKey)`). Unknown questions fall back to their topic.
- **Search** covers titles, summaries, keywords and notation (`x^-2`, `√`). Each concept in the nav shows a status dot.
- **Concept quiz:**
  - 5 questions drawn from the existing verified banks
  - feedback after each answer, with the verified explanation
  - avoids repeating the previous quiz
  - *Harder questions* uses Challenge items, topped up with normal ones if there aren't enough
  - answers are saved to `campfire-prep.practice.v1`
- **Feedback buttons** (*Helpful* / *Confusing*). A "confusing" vote raises the concept in the plan and offers *Ask the tutor to explain it differently*.
- **Links in:** deep links `#c-<conceptId>`. Every review item on the results screen links to its lessons.
- **Credit:** attribution to Tim's Test is shown wherever Tim's questions are used.

### Learning analyst (`js/learning.js`, `js/analyst.js`)

All numbers are computed deterministically. There is **no AI and no invented data**.

- **Evidence** comes from test attempts (per question and per written part) and concept-quiz answers. Challenge tests are excluded, so harder-than-the-test questions don't drag mastery down.
- **Per-concept profile:**
  - questions, marks, accuracy, sessions
  - earlier vs recent accuracy (the last 2 sessions)
  - recurring error: marks lost in 2 or more sessions
  - blanks, last practised
  - evidence level: none, low, moderate or strong
- **Statuses:** Needs work, Early warning, Developing, Improving, Due for review, Confident, Not enough evidence, Not attempted. *Confident* requires moderate or better evidence, meaning at least 2 sessions. Each status has a plain-language "why" built only from the computed numbers.
- **Recommendations:**
  - ranked by status, accuracy, recurring errors, "confusing" votes, and topics in uploaded material
  - prerequisites first
  - each comes with a time estimate and "how you'll know" (4/5 on a fresh quiz)
  - the study plan fits a 10, 30, 60 or 90-minute budget
  - optional exam date and unit scope
  - items can be marked done
- **Where it shows up:** My Learning shows onboarding when there is no data, and never shows fake numbers. Basecamp shows the top 3 recommendations and a *Next step* line.
- **Ask the AI analyst** sends the computed summary, with only the numbers shown on the page, to the tutor in `plan` mode. The model is told to use only those numbers.

### Study materials (`js/docs.js`)

- **Formats:** PDF, `.txt` or `.md`, up to 10 MB and 80 pages.
- **Extraction** happens **in the browser** with pdf.js 3.11.174 (vendored, `isEvalSupported: false`). Files are stored in IndexedDB, with an in-memory fallback.
- **Rejected with clear messages:**
  - unsupported types
  - empty files
  - password-protected and damaged PDFs
  - scanned PDFs with no text layer
- **Analysis** uses keyword and pattern matching against the 16 concepts. The results are:
  - *clearly covered*, *possibly covered* and *not found*, with page or section references and snippets
  - an explicit scope statement saying this is not a whole-curriculum check
  - the weak spots that aren't in the file
- **Effect on the plan:** only *clearly covered* concepts influence recommendations.
- **Ask the tutor about it** attaches the file. Each message sends only the 3 most relevant pages (at most 3,000 characters each).
- **Delete** removes the file, its extracted text, its analysis and its index entry, after a confirmation.

### Floating AI tutor (`js/tutor.js`, `api/tutor.js`)

- **The panel:**
  - opens from a small round ✦ button in the bottom-right corner on Basecamp, the Concept Library, My Learning and Results. The button pulses until it is first used.
  - stays open across navigation (`sessionStorage`)
  - can be dragged by its header on desktop, and is a bottom sheet on mobile
  - closes with `Esc`
- **Page awareness:**
  - each screen provides a **structured page context** (type, title, readable text), never raw HTML
  - the context is built **only when a message is sent**, so there are no AI calls on navigation
  - when the page changes mid-conversation, the model is told which page the earlier messages were about
- **Focus question:** for *Explain my mistake* (Results), the tutor gets:
  - the question text and choices
  - the student's answer and the marks
  - the verified answer, explanation, and the worked solution and marking key

  In a concept quiz, the verified answer is withheld until the student has checked their own answer.
- **Modes:** Explain, Hint, Guide me, Worked example, Quiz me, Challenge me, plus Study analyst (`plan`). There are suggested prompts per page.
- **Opt-in learning records:** *Use my learning records* is off by default. When it's off, only the current page is shared.
- **Rendering:** replies are escaped, then rendered with KaTeX and light markdown, so model output is never injected as HTML.
- **Status states:**
  - *ready*
  - *access code needed*: a prompt for the class code
  - *not connected*: no API key; the input is disabled with an honest message
  - *unreachable*: for example GitHub Pages or local file serving

  The rest of the site works in every state.
- **Unavailable during assessments:**
  - `assessmentState()` returns one of three states:
    - `"live"`: a test or the tour's sample test is on screen. The whole tutor is hidden.
    - `"paused"` / `"saved"`: an unfinished test is waiting in Basecamp, including after a reload. The button stays visible but grey, with a lock badge. The panel can't open, and `Tutor.open()` (for example *Ask the AI analyst*) sends nothing. Pressing it explains why and offers **Resume test** or **Discard test**.
    - `null`: no assessment, so the tutor is available. A saved test whose time has run out doesn't lock the tutor; it is marked when Basecamp renders.
  - the check re-runs every second and on every screen change
  - the nav is hidden during tests, and deep links can't leave a running test
  - the tutor comes back on the results screen

### Other changes

- **Tim's Test:** the classmate level is renamed everywhere, with the credit line "Questions and marking guide by Tim."
- **Main navigation:** Basecamp / Concept Library / My Learning.

## 3. Files changed

| File | Change |
|---|---|
| `index.html` | main nav; Library and My Learning screens; tutor shell; new scripts; Tim's Test labels |
| `css/style.css` | "v7" block: nav, status pills, library, quiz, My Learning, documents, tutor, mobile |
| `js/app.js` | new storage keys; `navigate()`; `learningState()`; `isAssessmentActive()`; `pageContext()`; Basecamp recommendations; review lesson and *Explain my mistake* buttons; `#c-` deep links; shared API for the new modules; Tim's Test label |
| `js/bank-classmate.js` | title "Tim's Test" and the credit line |
| `js/concepts.js` | **new**: concept content and tagging |
| `js/learning.js` | **new**: evidence, profile, status, recommendations, plan, document matching |
| `js/docs.js` | **new**: upload pipeline and IndexedDB |
| `js/library.js` | **new**: Concept Library UI and concept quizzes |
| `js/analyst.js` | **new**: My Learning UI |
| `js/tutor.js` | **new**: floating tutor |
| `api/tutor.js` | **new**: the Vercel serverless function |
| `vendor/pdfjs/` | **new**: pdf.js 3.11.174 and its license |
| `tests/*.test.js`, `tests/load.js` | **new**: unit tests |
| `tests/e2e/*` | **new**: Playwright browser tests and a dev server with a mocked AI |
| `package.json` | **new**: test scripts only, with no dependencies and no build |
| `README.md`, `docs/LEARNING_PLATFORM.md` | documentation |

## 4. Migrations and environment variables

**Migrations: none are destructive.** Existing keys (`history.v2`, `session.v2`, `prefs.v1`, `toured.v1`) are read unchanged. These new keys are added:

| Key | Holds |
|---|---|
| `practice.v1` | concept-quiz answers |
| `feedback.v1` | lesson votes |
| `done.v1` | plan items marked done |
| `exam.v1` | exam date and scope |
| `docindex.v1` | covered concepts per document |
| `lastquiz.v1` | the last quiz, to avoid repeats |
| `tutor.v1` | the conversation |
| `tutorprefs.v1` | tutor mode, the learning-records switch, the access code |

Uploaded files go in the IndexedDB database `campfire-prep-docs`.

**Environment variables** (Vercel, server-side only):

| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | for the tutor | Never sent to the client. Without it, `GET /api/tutor` returns `configured: false`. |
| `TUTOR_MODEL` | no | Default `claude-sonnet-5-5` |
| `TUTOR_ACCESS_CODE` | no, but recommended | Students send it in the `x-tutor-code` header. It is compared with `crypto.timingSafeEqual`. |

## 5. AI provider and models

- **Provider:** the Anthropic Messages API (`POST https://api.anthropic.com/v1/messages`, `anthropic-version: 2023-06-01`), called with `fetch` from Node 18+. No SDK dependency.
- **Model:** `claude-sonnet-5-5` by default, configurable with `TUTOR_MODEL` (for example `claude-haiku-5-5` for lower cost).
- **Request limits:** `max_tokens` is 1,200 and the timeout is 30 s. Only the last 16 messages are sent.
- **The AI is used only for tutoring conversation** and for interpreting the computed learning summary. Statuses, percentages, recommendations and document coverage are all computed in code.

## 6. Security and privacy

- **Secrets:**
  - the API key exists only in the server environment
  - logs record the HTTP status or error name only, never the key or the request body
  - responses are sent with `Cache-Control: no-store`
- **Abuse controls:**
  - same-origin check on POST
  - optional class access code
  - a per-IP rate limit (30 requests per 10 minutes, best-effort per instance)
  - strict validation: known mode; 1 to 30 messages; at most 4,000 characters per message; alternating roles ending with the student; context at most 30,000 characters
  - replies capped at 12,000 characters
- **Prompt-injection handling:**
  - page text, the focus question, learning records and document excerpts are placed in delimited data blocks
  - the system prompt states that these blocks are data, never instructions
  - any of those tag names found inside the data are neutralized
  - documents are treated as untrusted. In the browser test, an "Ignore previous instructions…" line inside an uploaded file stays inside the `<document>` block
- **Honesty rules in the system prompt:**
  - verified-answer fields are authoritative
  - AI-written practice questions are labelled *"AI-generated practice, not verified"*
  - the model must never invent statistics and may use only the numbers in `<learning_records>`
  - no final answers on unanswered quiz questions
  - refuse if an assessment is active (a second line of defense; the client already hides the tutor)
- **Privacy:**
  - attempts, quiz answers, files and conversations stay in the browser
  - the server stores nothing
  - learning records are shared only per message and only when the student turns them on
  - only relevant excerpts of a file are sent, and only when the student attaches it
  - no student data is visible to other students: group scoreboards still use result codes the student chooses to share
- **Rendering safety:** all model output is HTML-escaped before math and markdown rendering.
- **Source material:** Tim's Test stays credited. No source documents are bundled or redistributed beyond the existing question bank. Uploaded files are never sent anywhere except the excerpts the student asks about.

## 7. Tests run (actual results, 15 Oct 2026)

| Suite | Command | Result |
|---|---|---|
| Unit tests: concepts (4), learning engine (9), API function with a mocked provider (8) | `npm test` | **21 / 21 pass** |
| Browser end-to-end (Chromium via Playwright, real `api/tutor.js` with a mocked provider) | `node tests/e2e/browser.js` | **58 / 58 pass** |
| Browser regressions, the unconfigured tutor, and the lock notice | `node tests/e2e/regressions.js` | **13 / 13 pass** |
| Answer-key checks for the existing banks (scratch scripts, not in the repo) | — | All keys check out. One "candidates mismatch" flag on `cm-wr4` is a false positive in the checker: that question has no extraneous-root part. |

What the browser suites cover, mapped to acceptance workflows A–H:

- **A:** Library → lesson (KaTeX, examples, mistakes, attribution) → search → 5-question quiz with feedback → saved practice records → *Confusing* vote → tutor opens with the lesson as context → mocked reply renders math. The request contains the lesson in `<page_context>`, no raw HTML, and no learning records while the switch is off.
- **B:** after a test, the review shows lesson links and *Explain my mistake*. The request carries `<focus_question>` with verified fields.
- **C:** My Learning with no data (onboarding, no percentages) and with data (evidence from the quiz). *Ask the AI analyst* sends `<learning_records>` in `plan` mode.
- **D:** unsupported `.docx` is rejected. A `.txt` and a generated 2-page PDF are uploaded, extracted and analysed (covered concepts with page or section references). *Ask the tutor about it* sends only `<document>` excerpts. Delete removes the file and its index entry.
- **E and F:** the quiz result changes the plan and Basecamp's *Next step* (the Early warning concept ranks first).
- **G:**
  - starting a test
  - pause, *pause to Basecamp*, reload and resume
  - submit and the results screen
  - creating a group test: a lobby code, the invite link opening the lobby in a second browser, the group test starting
  - Armadillo and "Puppy can lose" settings saved on the session
  - the timer ticking
- **H:** the tutor is hidden on the title screen, during an active test, while paused, and during the tour.
  - On Basecamp with a paused test (also after a reload), the round button shows locked. It, *Ask the AI analyst* and a programmatic `Tutor.open()` show the lock notice and never open the panel or send a request.
  - *Resume test* and *Discard test* in the notice work, and discarding unlocks and opens the tutor.
  - An expired saved test doesn't lock it.
  - The launcher is a 56 px circle in the bottom-right corner. The tutor returns on Results and after the tour. Its context updates on navigation. With no API key, an honest "not connected" message appears and the input is disabled. There are no server-side stores to check: the server has no storage.
- **Mobile (390 px):** no horizontal scroll on Basecamp, Library or My Learning, and the tutor bottom sheet fits the screen.
- **No JavaScript errors** in any run. Google Fonts being blocked by the test sandbox is ignored.

### Bugs found and fixed by these tests

1. **The main nav didn't work.** The new `go(where)` function collided with the test's existing `go(questionIndex)`, so the nav called the wrong one. Renamed it to `navigate()`.
2. **Quiz links could bypass the running-test guard.** `data-quiz` links now check for a running test first.
3. **The unconfigured tutor still invited typing.** The input, send button and suggestions are now disabled with a clear placeholder.
4. **Tutor mode for mistakes.** *Explain my mistake* used *Guide me* mode; it now uses *Explain*.
5. **A gap in "Simplifying radicals" detection.** It missed notation like `sqrt(72)`; the pattern was widened.
6. **Tiny files showed "0 KB".** They now show bytes.
7. **(After user feedback) The tutor seemed to be missing.** A leftover paused test made the tutor disappear from every page with no explanation, and *Ask the AI analyst* did nothing. The button is now always visible on the study pages. While a test is unfinished it shows a lock and explains how to resume or discard the test. It was also redesigned as a round button in the corner.

### Not tested

- **No call was made to the real Anthropic API.** No key was available in the build environment, so every AI response in testing was mocked. Validation, the prompt, error mapping and the client path are tested; the live answer quality is not.
- **"Puppy can lose" game over** was not driven to an actual burn or freeze in the browser. That code was not changed in this release.
- Real phones and Safari or Firefox were not tested. Only Chromium was.
- Large (80-page) or unusual PDFs were not tested.

## 8. Limitations

- **No cross-device sync and no teacher view.** Clearing browser data erases progress. This follows from having no accounts.
- **The rate limit is in memory per serverless instance.** It is a speed bump, not a guarantee. Use `TUTOR_ACCESS_CODE` and an API spending limit.
- **The lessons are unreviewed.** All 16 were written for this app and are marked as not yet reviewed by a teacher.
- **Document analysis is keyword and pattern based.** It can miss a topic taught without its usual vocabulary, and it says so on screen. Scanned PDFs are not supported; there is no OCR.
- **Tutor replies are not verified.** Only the fields marked verified come from the answer key. The model is instructed to label its own practice questions as unverified, but it can still make mistakes.
- **Concept statuses need data.** With few attempts, most concepts honestly show *Not enough evidence*.
- **The test-exclusion rule is enforced in the browser.** A determined student could open another tab, or any other AI. The server also refuses when the context says an assessment is active, but this is a study tool, not exam proctoring.

## 9. Manual setup

1. Upload the whole folder to GitHub, including `api/`, `vendor/`, `docs/` and `tests/` (see the README).
2. Import the repo to Vercel with the **Other** framework preset and an empty build command and output directory.
3. To turn on the tutor, add `ANTHROPIC_API_KEY`, and preferably `TUTOR_ACCESS_CODE`, under Vercel Project → Settings → Environment Variables. Then redeploy.
4. Set a monthly spending limit in the Anthropic Console.
5. Optionally set `TUTOR_MODEL=claude-haiku-5-5` to lower costs.

## 10. Recommended next step

Deploy with a real key and an access code, then do a short live pilot with a few students:

- check the tutor's answers against the answer key in each mode, especially *Explain my mistake* and *Quiz me*
- have a teacher review the 16 lessons and set `reviewed: true` on the ones they approve

After that, the most valuable addition would be optional cross-device sync (an account and a database) with a teacher dashboard, which would need a privacy review first.
